import { NextRequest, NextResponse } from "next/server";

const KIMI_API_KEY = process.env.KIMI_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const { topic, userExplanation } = await req.json();

    if (!topic || !userExplanation) {
      return NextResponse.json({ error: "Missing topic or userExplanation" }, { status: 400 });
    }

    const systemPrompt = `You are an expert teacher. Evaluate the user's personal explanation of a concept to support active learning.

Provide your evaluation exactly as a JSON object with this schema:
{
  "correct": ["List of ideas they got right (short bullet points)"],
  "missing": ["List of important ideas they missed (short bullet points)"],
  "incorrect": ["List of incorrect statements they made, if any (short bullet points)"],
  "improved": "A fully polished, correct, and friendly explanation of the concept based on their attempt."
}

Rules:
1. Be constructive and encouraging in the "improved" explanation.
2. If nothing is incorrect, return an empty array for "incorrect".
3. Provide ONLY the raw JSON string without markdown wrapping like \`\`\`json.`;

    const userPrompt = `Topic:\n${topic}\n\nUser Explanation:\n${userExplanation}\n\nEvaluate and improve this explanation.`;

    const models = [
      { id: "moonshot-v1-auto", baseURL: "https://api.moonshot.cn/v1/chat/completions", params: { chat_template_kwargs: { thinking: false } } },
      { id: "meta/llama-3.1-405b-instruct", baseURL: "https://integrate.api.nvidia.com/v1/chat/completions", params: {} },
      { id: "nvidia/llama-3.1-nemotron-70b-instruct", baseURL: "https://integrate.api.nvidia.com/v1/chat/completions", params: {} }
    ];

    let generatedJson = null;

    for (const modelInfo of models) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s
      try {
        const res = await fetch(modelInfo.baseURL, {
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
              { role: "user", content: userPrompt }
            ],
            temperature: 0.3, // Lower temperature for structured JSON evaluation
            max_tokens: 1500,
            ...modelInfo.params
          }),
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            generatedJson = content.replace(/```json|```/g, "").trim();
            break; // Valid response retrieved
          }
        } else {
          console.warn(`Model ${modelInfo.id} returned status ${res.status}`);
        }
      } catch (err) {
        clearTimeout(timeoutId);
        console.warn(`Model ${modelInfo.id} failed for evaluate-thinking.`);
      }
    }

    if (!generatedJson) {
      return NextResponse.json({ error: "All AI models failed to evaluate the thinking." }, { status: 500 });
    }

    try {
      const parsedResult = JSON.parse(generatedJson);
      return NextResponse.json(parsedResult);
    } catch (e) {
      console.error("AI returned invalid JSON:", generatedJson);
      return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 500 });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
