import { NextRequest, NextResponse } from "next/server";

const KIMI_API_KEY = process.env.KIMI_API_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Missing text content" }, { status: 400 });
    }

    const systemPrompt = `You are a knowledge graph generator.
Extract key concepts and relationships from the given content.
Identify the core topic and branch out into sub-topics and related concepts.

Return output STRICTLY in JSON format with exactly two arrays: "nodes" and "edges".
- "nodes" must be an array of objects with "id" (a short, unique string without spaces) and "label" (a human-readable name, max 3 words).
- "edges" must be an array of objects with "source" (node id), "target" (node id), and "label" (a short relationship description like "includes", "uses", "part of").

Example Output:
{
  "nodes": [
    { "id": "AI", "label": "Artificial Intelligence" },
    { "id": "ML", "label": "Machine Learning" }
  ],
  "edges": [
    { "source": "AI", "target": "ML", "label": "includes" }
  ]
}

DO NOT include any markdown formatting, backticks, or text outside the JSON object. The response must be parsable by JSON.parse().`;

    const userPrompt = `Content:
${text}

Generate a concept map with nodes and relationships.`;

    const models = [
      { name: "moonshotai/kimi-k2.5", url: "https://integrate.api.nvidia.com/v1/chat/completions" },
      { name: "meta/llama-3.1-405b-instruct", url: "https://integrate.api.nvidia.com/v1/chat/completions" },
      { name: "nvidia/llama-3.1-nemotron-70b-instruct", url: "https://integrate.api.nvidia.com/v1/chat/completions" }
    ];

    let finalGraph: any = null;
    let lastError = "";

    for (const model of models) {
      try {
        console.log(`Concept Map: Trying model ${model.name}...`);
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 60000); // 1 minute timeout

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
            max_tokens: 2048,
            temperature: 0.1, // Low temperature for consistent JSON
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
          let content = data.choices[0].message.content.trim();
          
          if (content.startsWith("```json")) {
            content = content.replace(/```json/g, "").replace(/```/g, "").trim();
          } else if (content.startsWith("```")) {
            content = content.replace(/```/g, "").trim();
          }

          finalGraph = JSON.parse(content);
          
          if (!finalGraph.nodes || !finalGraph.edges) {
             throw new Error("Invalid JSON structure returned");
          }
          
          console.log(`Concept Map: Success with ${model.name}`);
          break;
        } else {
          throw new Error(`Empty response from ${model.name}`);
        }
      } catch (err: any) {
        lastError = err.message;
        console.warn(`Concept Map: Model ${model.name} failed:`, lastError);
      }
    }

    if (!finalGraph) {
      return NextResponse.json({ error: `Graph generation failed across all models. Last error: ${lastError}` }, { status: 500 });
    }

    return NextResponse.json(finalGraph);

  } catch (err: any) {
    console.error("Concept Map API Error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
