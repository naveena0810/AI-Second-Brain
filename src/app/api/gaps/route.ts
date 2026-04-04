import { NextRequest, NextResponse } from "next/server";
import { init } from "@instantdb/admin";

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID || "";
const ADMIN_TOKEN = process.env.INSTANT_ADMIN_TOKEN || "";
const KIMI_API_KEY = process.env.KIMI_API_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    if (!APP_ID || !ADMIN_TOKEN || !KIMI_API_KEY) {
      return NextResponse.json({ error: "Server misconfiguration: Missing environment variables" }, { status: 500 });
    }

    // Initialize InstantDB admin client
    const db = init({ appId: APP_ID, adminToken: ADMIN_TOKEN });

    // Fetch all user content
    const result = await db.query({
      knowledgeDocuments: { $: { where: { userId } } },
      notes: { $: { where: { userId } } },
      queries: { $: { where: { userId } } },
    });

    const docsText = (result.knowledgeDocuments ?? []).map((d: any) => d.textContent).join("\n");
    const notesText = (result.notes ?? []).map((n: any) => `${n.title}: ${n.content}`).join("\n");
    const queriesText = (result.queries ?? []).map((q: any) => `Q: ${q.question}\nA: ${q.answer}`).join("\n");

    const combinedContent = `${docsText}\n${notesText}\n${queriesText}`.slice(0, 15000); // Limit to 15k chars for prompt

    if (combinedContent.length < 50) {
      return NextResponse.json({
        knownTopics: ["Base Knowledge"],
        missingTopics: ["Need more data"],
        suggestions: ["Upload more documents or write some notes to get insights!"]
      });
    }

    const systemPrompt = `You are an intelligent learning mentor.
Analyze the user's provided knowledge content and:
1. Extract 5-8 "Known Topics" they are familiar with.
2. Identify 3-5 "Missing Topics" - logical next steps or gaps in their knowledge based on the current content.
3. Generate 3 "Learning Suggestions" with actionable advice.

Return the response in the following JSON format:
{
  "knownTopics": ["...", "..."],
  "missingTopics": ["...", "..."],
  "suggestions": ["...", "..."]
}
Strictly return only JSON.`;

    const userPrompt = `User Knowledge Content:\n${combinedContent}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

    const kimiRes = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
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
        max_tokens: 2000,
        temperature: 0.4,
        response_format: { type: "json_object" }
      }),
    });

    clearTimeout(timeout);

    if (!kimiRes.ok) {
      const errText = await kimiRes.text();
      console.error("AI Gaps API error:", errText);
      throw new Error("AI analysis failed");
    }

    const kimiData = await kimiRes.json();
    const resultString = kimiData.choices?.[0]?.message?.content;

    try {
      const parsedRes = JSON.parse(resultString);
      return NextResponse.json(parsedRes);
    } catch (parseErr) {
      console.error("Failed to parse AI gaps response:", resultString);
      return NextResponse.json({ error: "Failed to parse AI output" }, { status: 500 });
    }

  } catch (err: any) {
    console.error("/api/gaps error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
