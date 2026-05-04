import { NextRequest, NextResponse } from "next/server";

const KIMI_API_KEY = process.env.KIMI_API_KEY;

export async function POST(req: NextRequest) {
  let fallbackDocs: any[] = [];

  try {
    const { documents } = await req.json();
    
    if (documents && Array.isArray(documents)) {
      fallbackDocs = documents;
    }

    if (!documents || !Array.isArray(documents) || documents.length < 2) {
      return NextResponse.json({
        title: "Merge Not Possible",
        insight: "Please provide at least 2 documents to merge. The fusion process requires multiple sources to synthesize new knowledge.",
        connections: [],
        applications: ["Select multiple documents before merging"],
        innovation: "Try again with multiple sources."
      });
    }

    // Tag + combine content
    const combinedContent = documents
      .map((doc: { title: string; content: string }, i: number) => `--- SOURCE ${i + 1}: ${doc.title} ---\n${doc.content.slice(0, 1500)}`)
      .join("\n\n");

    const systemPrompt = `You are an expert Knowledge Synthesizer. Your role is to fuse multiple pieces of information and produce brand new, emergent knowledge.

You MUST return a valid JSON object and nothing else, with this exact schema:
{
  "title": "A creative title for the merged knowledge topic",
  "insight": "A rich, synthesized paragraph that weaves together all sources into a unified insight. If merging all documents is difficult, provide a partial merge or summarize each document separately.",
  "connections": ["Concept A → Concept B", "Source 1 idea → Source 2 idea"],
  "applications": ["Real-world application 1", "Real-world application 2", "Real-world application 3"],
  "innovation": "A creative startup/product idea using these combined concepts"
}

Rules:
1. Merge the selected documents and generate a clear and meaningful combined summary.
2. Do not return any failure message. Always produce a useful output, even if the information is limited.
3. If merging all documents is difficult, provide a partial merge or summarize each document separately.
4. Keep the response simple, structured, and easy to understand.
5. Limit connections to 3-5, applications to 3-5.
6. Return raw JSON only — no markdown, no code blocks.`;

    const userPrompt = `Fuse the following knowledge sources into a single powerful insight:\n\n${combinedContent}`;

    const models = [
      { id: "meta/llama-3.1-8b-instruct", baseURL: "https://integrate.api.nvidia.com/v1/chat/completions", params: {} },
      { id: "meta/llama-3.1-405b-instruct", baseURL: "https://integrate.api.nvidia.com/v1/chat/completions", params: {} },
      { id: "nvidia/llama-3.1-nemotron-70b-instruct", baseURL: "https://integrate.api.nvidia.com/v1/chat/completions", params: {} }
    ];

    let rawOutput = null;

    for (const model of models) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);
      try {
        const res = await fetch(model.baseURL, {
          method: "POST",
          signal: controller.signal,
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${KIMI_API_KEY}`,
            "Accept": "application/json",
          },
          body: JSON.stringify({
            model: model.id,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            temperature: 0.5,
            max_tokens: 2000,
            ...model.params
          }),
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            rawOutput = content.replace(/```json|```/g, "").trim();
            break;
          }
        }
      } catch (err) {
        clearTimeout(timeoutId);
        console.warn(`Model ${model.id} failed for merge-knowledge.`);
      }
    }

    if (!rawOutput) {
      // Fallback: Provide a partial merge or summarize each document separately
      return NextResponse.json({
        title: "Partial Document Synthesis",
        insight: "AI fusion is currently unavailable. Here is a structured summary of your selected documents:\n\n" + documents.map((d: any) => `**${d.title}**: ${d.content.slice(0, 250)}...`).join("\n\n"),
        connections: documents.map((d: any) => d.title),
        applications: ["Review documents individually for deeper context"],
        innovation: "Manual review of these individual summaries is required."
      });
    }

    try {
      const result = JSON.parse(rawOutput);
      return NextResponse.json(result);
    } catch (e) {
      console.error("AI returned invalid JSON:", rawOutput);
      // Fallback for malformed JSON
      return NextResponse.json({
        title: "Partial Document Synthesis",
        insight: rawOutput.slice(0, 500) + "...\n\n(Note: The AI response was not formatted correctly)",
        connections: documents.map((d: any) => d.title),
        applications: ["Review documents individually"],
        innovation: "Manual review required"
      });
    }

  } catch (error: any) {
    console.error("Merge knowledge API error:", error);
    
    // Provide a graceful fallback even in case of an unexpected error
    const insightText = fallbackDocs.length > 0 
      ? "An unexpected error occurred during processing. Here is a basic overview of your documents:\n\n" + fallbackDocs.map((d: any) => `**${d.title}**: ${d.content?.slice(0, 250) || "No content"}...`).join("\n\n")
      : "An unexpected error occurred while attempting to merge documents.";

    return NextResponse.json({
      title: "Partial Document Synthesis",
      insight: insightText,
      connections: fallbackDocs.map((d: any) => d.title).filter(Boolean),
      applications: ["Review documents individually"],
      innovation: "Please try again later."
    });
  }
}
