import { NextRequest, NextResponse } from "next/server";

const KIMI_API_KEY = process.env.KIMI_API_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const { question, answer } = await req.json();

    if (!question || !answer) {
      return NextResponse.json({ error: "Missing question or answer" }, { status: 400 });
    }

    const systemPrompt = `You are an expert teacher and educational consultant. 
Your goal is to transform a basic AI answer into a comprehensive, multi-level "Deep Dive" learning experience.

Structure your response using these exact sections:
1. 🎯 **Deep Definition**: A clear, sophisticated overview.
2. 🧠 **Key Concepts**: 3-5 foundational pillars Explained simply.
3. 🌍 **Real-World Examples**: How this works in everyday life.
4. 🚀 **Practical Applications**: Where it is used in industries.
5. 🪜 **Step-by-Step Breakdown**: A logical flow of how it functions.

Keep the tone professional, encouraging, and highly structured with markdown. Use bolding and lists for readability.`;

    const userPrompt = `Question: "${question}"
Basic Answer: "${answer}"

Please expand this into a Deep Dive Mode explanation.`;

    const models = [
      { id: "meta/llama-3.1-8b-instruct", baseURL: "https://integrate.api.nvidia.com/v1/chat/completions", params: {} },
      { id: "meta/llama-3.1-405b-instruct", baseURL: "https://integrate.api.nvidia.com/v1/chat/completions", params: {} },
      { id: "nvidia/llama-3.1-nemotron-70b-instruct", baseURL: "https://integrate.api.nvidia.com/v1/chat/completions", params: {} }
    ];

    let finalDeepDive = "";
    let lastError = "";

    for (const model of models) {
      try {
        console.log(`Deep Dive: Trying model ${model.name}...`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 1 minute timeout for deep dive

        const response = await fetch(model.url, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${KIMI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: model.name,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            max_tokens: 4096,
            temperature: 0.7,
            top_p: 1.0,
            stream: false,
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API Error (${model.name}): ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        if (data.choices && data.choices[0]?.message?.content) {
          finalDeepDive = data.choices[0].message.content;
          console.log(`Deep Dive: Success with ${model.name}`);
          break;
        } else {
          throw new Error(`Empty response from ${model.name}`);
        }
      } catch (err: any) {
        lastError = err.message;
        console.warn(`Deep Dive: Model ${model.name} failed:`, lastError);
        // Continue to next model
      }
    }

    if (!finalDeepDive) {
      return NextResponse.json({ error: `Deep Dive generation failed across all models. Last error: ${lastError}` }, { status: 500 });
    }

    return NextResponse.json({ deepDive: finalDeepDive });

  } catch (err: any) {
    console.error("Deep Dive API Error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
