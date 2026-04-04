import { NextRequest, NextResponse } from "next/server";
import { init } from "@instantdb/admin";

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID || "";
const ADMIN_TOKEN = process.env.INSTANT_ADMIN_TOKEN || "";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const db = init({ appId: APP_ID, adminToken: ADMIN_TOKEN });

    // Fetch all timeline events for the user
    const result = await db.query({
      timelineEvents: {
        $: { where: { userId } },
      },
    });

    const events = (result.timelineEvents as any[]) ?? [];

    // Sort by date descending
    const sortedEvents = events.sort((a, b) => b.date - a.date);

    // Group by month
    const grouped: Record<string, { label: string; events: any[] }> = {};

    sortedEvents.forEach((event) => {
      const date = new Date(event.date);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const label = date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

      if (!grouped[monthKey]) {
        grouped[monthKey] = { label, events: [] };
      }
      grouped[monthKey].events.push(event);
    });

    return NextResponse.json({
      events: sortedEvents,
      grouped: Object.values(grouped),
    });
  } catch (err) {
    console.error("/api/timeline error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
