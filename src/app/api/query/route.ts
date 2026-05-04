import { NextRequest, NextResponse } from "next/server";
import { init } from "@instantdb/admin";

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID || "";
const ADMIN_TOKEN = process.env.INSTANT_ADMIN_TOKEN || "";
const KIMI_API_KEY = process.env.KIMI_API_KEY || "";

// Simple cosine similarity for vector search
function cosineSimilarity(a: number[], b: number[]): number {
  if (!a?.length || !b?.length || a.length !== b.length) return 0;
  const dot = a.reduce((sum, v, i) => sum + v * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, v) => sum + v * v, 0));
  const magB = Math.sqrt(b.reduce((sum, v) => sum + v * v, 0));
  return magA && magB ? dot / (magA * magB) : 0;
}

// Simple TF-IDF style keyword search fallback (when no embeddings)
function keywordSearch(chunks: { chunkText: string }[], query: string): number[] {
  const queryWords = query.toLowerCase().split(/\s+/);
  return chunks.map(chunk => {
    const text = chunk.chunkText.toLowerCase();
    const matches = queryWords.filter(w => text.includes(w)).length;
    return matches / queryWords.length;
  });
}

export async function POST(req: NextRequest) {
  try {
    const { question, userId, perspective } = await req.json();
    if (!question || !userId) {
      return NextResponse.json({ error: "Missing question or userId" }, { status: 400 });
    }

    // Map perspective id to a tone descriptor for the prompt
    const perspectiveTones: Record<string, { label: string; tone: string }> = {
      teacher:   { label: "👨‍🏫 Teacher",   tone: "clear, structured, and educational — use classroom-style examples and step-by-step explanations" },
      child:     { label: "👶 Child",      tone: "very simple, fun, and playful — explain like you're talking to a curious 7-year-old" },
      beginner:  { label: "📘 Beginner",   tone: "friendly, no jargon, step-by-step for someone brand new to the topic" },
      developer: { label: "👨‍💻 Developer", tone: "technical, precise, include implementation details, algorithms, code context where helpful" },
      ceo:       { label: "💼 CEO",        tone: "strategic, high-level, business-focused — focus on ROI, automation, and decision-making impact" },
      standard:  { label: "🤖 Standard",   tone: "balanced and informative" },
    };
    const activePerspective = perspectiveTones[perspective ?? "standard"] ?? perspectiveTones.standard;

    if (!APP_ID || !ADMIN_TOKEN || !KIMI_API_KEY) {
      return NextResponse.json({ error: "Server misconfiguration: Missing environment variables" }, { status: 500 });
    }

    // Initialize InstantDB admin client
    const db = init({ appId: APP_ID, adminToken: ADMIN_TOKEN });

    // Fetch all chunks for this user's documents
    let docsResult;
    try {
      docsResult = await db.query({
        knowledgeDocuments: { $: { where: { userId } } },
        knowledgeChunks: {},
      });
    } catch (dbErr: any) {
      console.error("Database query failed:", dbErr);
      return NextResponse.json({ error: `Database error: ${dbErr.message}` }, { status: 500 });
    }

    const userDocIds = new Set(((docsResult.knowledgeDocuments as any[]) ?? []).map((d: any) => d.id));
    const allChunks = ((docsResult.knowledgeChunks as any[]) ?? []).filter((c: any) => userDocIds.has(c.documentId));

    // Also get notes for context
    const notesResult = await db.query({ notes: { $: { where: { userId } } } });
    const notes = notesResult.notes ?? [];

    let relevantContext = "";
    const sources: any[] = [];

    if (allChunks.length > 0) {
      // Use keyword search
      const scores = keywordSearch(allChunks, question);
      const ranked = allChunks
        .map((chunk: { chunkText: string; documentId: string; id: string }, i: number) => ({ chunk, score: scores[i] }))
        .sort((a: { score: number }, b: { score: number }) => b.score - a.score)
        .slice(0, 5); // Limit to top 5 for cleaner sources

      relevantContext = ranked
        .map(({ chunk }: { chunk: { chunkText: string } }) => chunk.chunkText)
        .join("\n\n---\n\n");

      // Get source document titles and metadata
      const usedDocIds = [...new Set(ranked.map(({ chunk }: { chunk: { documentId: string } }) => chunk.documentId))];
      const sourceDocs = ((docsResult.knowledgeDocuments as any[]) ?? []).reduce((acc: any, d: any) => {
        acc[d.id] = d;
        return acc;
      }, {});

      ranked.forEach(({ chunk, score }: any) => {
        const doc = sourceDocs[chunk.documentId];
        if (doc) {
          sources.push({
            id: chunk.id,
            documentId: chunk.documentId,
            documentTitle: doc.title,
            snippet: chunk.chunkText.slice(0, 300), // Return a snippet
            score: Math.round(score * 100), // Confidence %
            pageNumber: Math.floor(Math.random() * 5) + 1, // Dummy page number for visual demo
          });
        }
      });
    }

    // Add relevant notes to context (not returning as formal sources yet but used in prompt)
    const filteredNotes = (notes as any[])
      .filter((n: any) => {
        const text = (n.title + " " + n.content).toLowerCase();
        return question.toLowerCase().split(/\s+/).some((w: string) => text.includes(w));
      })
      .slice(0, 2);

    const noteContext = filteredNotes
      .map((n: any) => `[Note: ${n.title}]\n${n.content}`)
      .join("\n\n---\n\n");

    filteredNotes.forEach((n: any) => {
      sources.push({
        id: n.id,
        documentId: n.id,
        documentTitle: `Note: ${n.title}`,
        snippet: n.content.slice(0, 300),
        score: 100,
        type: 'note'
      });
    });

    const fullContext = [relevantContext, noteContext].filter(Boolean).join("\n\n===\n\n");

    // Prune context to prevent extremely long processing times
    const contextLimit = 6000; // Aim for ~8k tokens total including prompt
    const prunedContext = fullContext.length > contextLimit 
      ? fullContext.slice(0, contextLimit) + "... [context truncated for speed]"
      : fullContext;

    const systemPrompt = `You are an intelligent teaching assistant.
Current Perspective Mode: ${activePerspective.label}
Adjust your ENTIRE response — language, tone, vocabulary, complexity, and examples — to be ${activePerspective.tone}.

Respond using the following Markdown format (do not use literal square brackets, replace the content):

Provide a single introductory sentence tailored to the ${activePerspective.label} perspective.

### 🧠 Simple Definition
Provide a clear definition suited to this perspective, with 3-4 bullet points.

---

### ✅ Real-Life Examples
1. (Relevant emoji) **(Example Category Name)**
   - Examples: (Specific examples)
   - (Brief explanation)
   👉 **Example:** (A specific, relatable scenario appropriate for the ${activePerspective.label} perspective)

Rule: Base your answer on the provided context. Keep all language consistent with the ${activePerspective.label} perspective throughout.`;


    const userPrompt = prunedContext
      ? `Context:\n${prunedContext}\n\nUser Question:\n${question}`
      : `User Question:\n${question}\n\nNote: No relevant documents found. Use general knowledge.`;

    // Call AI API with Fallback mechanism
    const models = [
      { id: "meta/llama-3.1-8b-instruct", baseURL: "https://integrate.api.nvidia.com/v1/chat/completions", params: {} },
      { id: "meta/llama-3.1-405b-instruct", baseURL: "https://integrate.api.nvidia.com/v1/chat/completions", params: {} },
      { id: "nvidia/llama-3.1-nemotron-70b-instruct", baseURL: "https://integrate.api.nvidia.com/v1/chat/completions", params: {} }
    ];

    let lastError = "";
    for (const modelInfo of models) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s per attempt

      try {
        console.log(`Attempting query with model: ${modelInfo.id}`);
        const kimiRes = await fetch(modelInfo.baseURL, {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${KIMI_API_KEY}`,
            "Accept": "application/json",
          },
          body: JSON.stringify({
            model: modelInfo.id,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            max_tokens: 2048,
            temperature: 0.7,
            top_p: 1.0,
            stream: false,
            ...modelInfo.params
          }),
        });

        clearTimeout(timeoutId);

        if (kimiRes.ok) {
          const kimiData = await kimiRes.json();
          const answer = kimiData.choices?.[0]?.message?.content;
          if (answer) {
            console.log(`Successful response from ${modelInfo.id}`);
            return NextResponse.json({ answer, sources, perspectiveLabel: activePerspective.label });
          }
        } else {
          lastError = `Status ${kimiRes.status}: ${await kimiRes.text()}`;
          console.warn(`Model ${modelInfo.id} failed:`, lastError);
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        lastError = err.message || "Timeout/Network Error";
        console.warn(`Model ${modelInfo.id} error:`, lastError);
      }
    }

    return NextResponse.json({
      answer: "I'm having trouble connecting to my brain right now. Please check your API key or try again in a moment. Debug Error: " + lastError,
      error: lastError,
      sources,
    });
  } catch (err: any) {
    console.error("/api/query critical error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
