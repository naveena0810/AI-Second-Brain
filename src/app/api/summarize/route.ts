import { NextRequest, NextResponse } from "next/server";
const KIMI_API_KEY = process.env.KIMI_API_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const { text, length = 'medium' } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Missing text to summarize" }, { status: 400 });
    }

    if (!KIMI_API_KEY) {
      return NextResponse.json({ error: "Server misconfiguration: Missing KIMI_API_KEY" }, { status: 500 });
    }

    // Define length constraints
    const lengthMap = {
      short: "Provide a very brief 1-2 sentence overview.",
      medium: "Provide a concise 1-paragraph summary.",
      detailed: "Provide a detailed multi-paragraph summary."
    };

    const systemPrompt = `You are an expert knowledge summarizer.
Your task is to analyze the provided content and generate:
1. A concise summary (${lengthMap[length as keyof typeof lengthMap]})
2. 3-5 key bullet points as "Key Takeaways"
3. 3-6 important "Concepts/Tags" (single words or short phrases) that represent the core topics. 
   IMPORTANT: Even if the text is short, identify at least 3 distinct concepts.

Return the response in the following JSON format:
{
  "summary": "...",
  "keyPoints": ["...", "..."],
  "concepts": ["...", "..."]
}
Strictly return only the JSON. No other text.`;

    const userPrompt = `Content to summarize:
${text.slice(0, 10000)} // Basic limit for simple implementation`;

    // Call AI API with Fallback mechanism
    const models = [
      { id: "moonshotai/kimi-k2.5", params: { chat_template_kwargs: { thinking: false } } },
      { id: "meta/llama-3.1-405b-instruct", params: {} },
      { id: "nvidia/llama-3.1-nemotron-70b-instruct", params: {} }
    ];

    let lastError = "";
    for (const modelInfo of models) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s per attempt

      try {
        const kimiRes = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
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
            max_tokens: 2000,
            temperature: 0.3,
            response_format: { type: "json_object" },
            ...modelInfo.params
          }),
        });

        clearTimeout(timeoutId);

        if (kimiRes.ok) {
          const kimiData = await kimiRes.json();
          const resultString = kimiData.choices?.[0]?.message?.content;
          if (resultString) {
            try {
              const parsedRes = JSON.parse(resultString);
              return NextResponse.json(parsedRes);
            } catch (pErr) {
              console.warn("Parse error for model", modelInfo.id, resultString);
              lastError = "Invalid JSON output";
            }
          }
        } else {
          lastError = `Status ${kimiRes.status}`;
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        lastError = err.message || "Timeout";
      }
    }

    return NextResponse.json({ error: `AI summarization failed after retries: ${lastError}` }, { status: 500 });

  } catch (err: any) {
    console.error("/api/summarize error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
