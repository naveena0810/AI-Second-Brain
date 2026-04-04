import { NextRequest, NextResponse } from "next/server";

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID;
const ADMIN_TOKEN = process.env.INSTANT_ADMIN_TOKEN;
const KIMI_API_KEY = process.env.KIMI_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const { userId, activities } = await req.json();
    
    if (!userId || !activities) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (activities.length === 0) {
      return NextResponse.json({ notifications: [] });
    }

    const activityContext = activities.slice(0, 30).map((a: any) => `- Topic: ${a.topic} (Accessed: ${new Date(a.lastAccessed).toLocaleDateString()})`).join("\n");

    const systemPrompt = `You are a highly intelligent, proactive Learning Assistant.
Analyze the user's recent activity logs and generate exactly 2-3 smart notifications to guide their learning journey.

Focus on:
1. Identifying knowledge gaps or suggesting logically related next topics.
2. Reminding the user to revise older topics if they haven't touched them recently.
3. Motivation and streaks (e.g. praising consistent learning).

Format the output strictly as a JSON array of objects matching this schema:
[
  {
    "message": "A short, actionable, friendly reminder or suggestion",
    "type": "missed_topic" | "revision" | "suggestion" | "streak" | "motivation",
    "priority": "high" | "medium" | "low"
  }
]
No markdown wrapping, just the JSON string.`;

    const userPrompt = `User's Recent Activity:\n${activityContext}\n\nGenerate the smart notifications JSON array now.`;

    const models = [
      { id: "moonshot-v1-auto", baseURL: "https://api.moonshot.cn/v1/chat/completions", params: { chat_template_kwargs: { thinking: false } } },
      { id: "meta/llama-3.1-405b-instruct", baseURL: "https://integrate.api.nvidia.com/v1/chat/completions", params: {} },
      { id: "nvidia/llama-3.1-nemotron-70b-instruct", baseURL: "https://integrate.api.nvidia.com/v1/chat/completions", params: {} }
    ];

    let generatedJson = null;

    for (const modelInfo of models) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);
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
            temperature: 0.7,
            max_tokens: 1000,
            ...modelInfo.params
          }),
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            generatedJson = content.replace(/```json|```/g, "").trim();
            break; // Success
          }
        }
      } catch (err) {
        clearTimeout(timeoutId);
        console.warn(`Model ${modelInfo.id} failed for notifications.`);
      }
    }

    if (!generatedJson) {
      return NextResponse.json({ error: "All AI models failed to generate insights." }, { status: 500 });
    }

    // Parse the generated notifications
    let parsedNotifications = [];
    try {
      parsedNotifications = JSON.parse(generatedJson);
    } catch (e) {
      return NextResponse.json({ error: "AI returned invalid JSON" }, { status: 500 });
    }

    // Save notifications to InstantDB using Admin API
    const mutations = parsedNotifications.map((notif: any) => ({
      id: crypto.randomUUID(),
      userId,
      message: notif.message,
      type: notif.type,
      priority: notif.priority,
      isRead: false,
      createdAt: Date.now()
    }));

    if (mutations.length > 0) {
      await fetch(`https://api.instantdb.com/admin/transact`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${ADMIN_TOKEN}`,
          "app-id": APP_ID!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          steps: mutations.map((m: any) => ([
            "update", "notifications", m.id, m
          ]))
        })
      });
    }

    return NextResponse.json({ notifications: mutations });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
