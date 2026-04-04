import { NextRequest, NextResponse } from "next/server";

const KIMI_API_KEY = process.env.KIMI_API_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const { month, events } = await req.json();

    if (!month || !events || !Array.isArray(events)) {
      return NextResponse.json({ error: "Missing month or events" }, { status: 400 });
    }

    // Summarize the events for the AI
    const eventSummary = events
      .map((e: any) => `- ${e.type === "query" ? "Asked" : e.type === "document" ? "Uploaded" : "Noted"}: ${e.title}`)
      .join("\n");

    const systemPrompt = `You are a helpful learning assistant. 
Summarize the user's learning journey for the month of ${month} based on their activity (documents uploaded, notes taken, and questions asked).
Keep it encouraging and insightful (1-2 sentences).`;

    const userPrompt = `Month: ${month}\nActivities:\n${eventSummary}\n\nProvide a short, premium summary of this learning journey.`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const res = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${KIMI_API_KEY}`,
        "Accept": "application/json",
      },
      body: JSON.stringify({
        model: "moonshotai/kimi-k2.5",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text();
      console.warn("AI API error (timeline):", errText);
      throw new Error("AI API failed");
    }

    const data = await res.json();
    const summary = data.choices?.[0]?.message?.content ?? "Keep exploring and growing your knowledge!";

    return NextResponse.json({ summary });
  } catch (err) {
    console.error("/api/timeline-summary error:", err);
    return NextResponse.json({ summary: "Continue your learning journey and explore more concepts!" });
  }
}
