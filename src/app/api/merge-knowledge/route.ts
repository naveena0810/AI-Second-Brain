import { NextRequest, NextResponse } from "next/server";

const KIMI_API_KEY = process.env.KIMI_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const { documents } = await req.json();

    if (!documents || !Array.isArray(documents) || documents.length < 2) {
      return NextResponse.json({ error: "Please provide at least 2 documents to merge." }, { status: 400 });
    }

    // Tag + combine content
    const combinedContent = documents
      .map((doc: { title: string; content: string }, i: number) => `--- SOURCE ${i + 1}: ${doc.title} ---\n${doc.content.slice(0, 1500)}`)
      .join("\n\n");

    const systemPrompt = `You are an expert Knowledge Synthesizer. Your role is to fuse multiple pieces of information and produce brand new, emergent knowledge — NOT just a summary.

You MUST return a valid JSON object and nothing else, with this exact schema:
{
  "title": "A creative title for the merged knowledge topic",
  "insight": "A rich, synthesized paragraph that weaves together all sources into a unified insight",
  "connections": ["Concept A → Concept B", "Source 1 idea → Source 2 idea"],
  "applications": ["Real-world application 1", "Real-world application 2", "Real-world application 3"],
  "innovation": "A creative startup/product idea using these combined concepts"
}

Rules:
- Do NOT just summarize each document separately.
- Find non-obvious relationships between concepts.
- Be analytical, visionary, and sharp.
- Limit connections to 3-5, applications to 3-5.
- Return raw JSON only — no markdown, no code blocks.`;

    const userPrompt = `Fuse the following knowledge sources into a single powerful insight:\n\n${combinedContent}`;

    const models = [
      { id: "moonshot-v1-auto", baseURL: "https://api.moonshot.cn/v1/chat/completions", params: { chat_template_kwargs: { thinking: false } } },
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
      return NextResponse.json({ error: "All models failed to generate a merge." }, { status: 500 });
    }

    try {
      const result = JSON.parse(rawOutput);
      return NextResponse.json(result);
    } catch (e) {
      console.error("AI returned invalid JSON:", rawOutput);
      return NextResponse.json({ error: "AI returned malformed JSON." }, { status: 500 });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
