import { NextRequest, NextResponse } from "next/server";

const KIMI_API_KEY = process.env.KIMI_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();

    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "No voice transcript provided." }, { status: 400 });
    }

    const systemPrompt = `You are an intelligent note organizer. Your task is to intelligently parse messy spoken transcripts and convert them into perfectly structured, highly readable notes.

You MUST return a valid JSON object with the following schema:
{
  "title": "A short, descriptive title for the note",
  "summary": "A concise, well-written paragraph summarizing the entire transcript.",
  "keyPoints": ["Bullet point 1", "Bullet point 2", "etc - extract the most important facts/ideas"],
  "concepts": ["Concept 1", "Concept 2", "Extract 2-5 core concepts or keywords"]
}

Rules:
1. Ignore "ums", "ahs", and repetitive stuttering common in speech.
2. Fix any obvious grammatical or speech-to-text transcription errors.
3. Keep the output clean, concise, and professional.
4. Return raw JSON only — no markdown, no code blocks.`;

    const userPrompt = `Speech Transcript:\n\n${text}\n\nConvert this into a structured note.`;

    const models = [
      { id: "meta/llama-3.1-8b-instruct", baseURL: "https://integrate.api.nvidia.com/v1/chat/completions", params: {} },
      { id: "meta/llama-3.1-405b-instruct", baseURL: "https://integrate.api.nvidia.com/v1/chat/completions", params: {} },
      { id: "nvidia/llama-3.1-nemotron-70b-instruct", baseURL: "https://integrate.api.nvidia.com/v1/chat/completions", params: {} }
    ];

    let rawOutput = null;

    for (const model of models) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s
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
            temperature: 0.3, // Lower temperature for more structured, factual extraction
            max_tokens: 1500,
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
          console.error(`Model ${model.id} returned status ${res.status}:`, await res.text());
        }
      } catch (err: any) {
        clearTimeout(timeoutId);
        console.warn(`Model ${model.id} failed for voice-note: ${err.message}`);
      }
    }

    if (!rawOutput) {
      return NextResponse.json({ error: "All AI models failed to process the transcript." }, { status: 500 });
    }

    try {
      const result = JSON.parse(rawOutput);
      return NextResponse.json(result);
    } catch (e) {
      console.error("AI returned invalid JSON for voice note:", rawOutput);
      return NextResponse.json({ error: "AI returned malformed JSON." }, { status: 500 });
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
