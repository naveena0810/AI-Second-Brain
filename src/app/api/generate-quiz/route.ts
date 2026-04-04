import { NextRequest, NextResponse } from "next/server";

const KIMI_API_KEY = process.env.KIMI_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const { content, difficulty = "medium", count = 5 } = await req.json();

    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "No content provided for quiz generation." }, { status: 400 });
    }

    const systemPrompt = `You are an expert educator. Your task is to generate a high-quality quiz from the provided content to help the user master the material.

You MUST return a valid JSON object with the following schema:
{
  "quiz": [
    {
      "question": "The question text",
      "type": "mcq",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "Option B",
      "explanation": "Why this is correct"
    },
    {
      "question": "A short answer question",
      "type": "short",
      "answer": "The key concept or phrase needed",
      "explanation": "What the user should have understood"
    }
  ]
}

Rules:
1. Generate exactly ${count} questions.
2. Mix multiple-choice (mcq) and short-answer (short) types.
3. For 'mcq', provide 4 plausible options and specify the 'answer' exactly matching one option.
4. For 'short', the answer should be concise but meaningful.
5. Difficulty level: ${difficulty}.
6. Content should be strictly based on the provided material.
7. Return raw JSON only — no markdown, no code blocks.`;

    const userPrompt = `Generate a ${difficulty} difficulty quiz based on this content:\n\n${content.slice(0, 4000)}`;

    const models = [
      { id: "moonshot-v1-auto", baseURL: "https://api.moonshot.cn/v1/chat/completions", params: { chat_template_kwargs: { thinking: false } } },
      { id: "meta/llama-3.1-405b-instruct", baseURL: "https://integrate.api.nvidia.com/v1/chat/completions", params: {} },
      { id: "nvidia/llama-3.1-nemotron-70b-instruct", baseURL: "https://integrate.api.nvidia.com/v1/chat/completions", params: {} }
    ];

    let rawOutput = null;

    for (const model of models) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
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
            temperature: 0.7,
            max_tokens: 2048,
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
        } else {
          const errText = await res.text();
          console.error(`Model ${model.id} returned status ${res.status}:`, errText);
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        console.warn(`Model ${model.id} failed for generate-quiz: ${err.message}`);
      }
    }

    if (!rawOutput) {
      return NextResponse.json({ error: "All models failed to generate the quiz." }, { status: 500 });
    }

    try {
      const result = JSON.parse(rawOutput);
      return NextResponse.json(result);
    } catch (e) {
      console.error("AI returned invalid JSON for quiz:", rawOutput);
      return NextResponse.json({ error: "AI returned malformed JSON." }, { status: 500 });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
