import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { init } from "@instantdb/admin";

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID || "";
const ADMIN_TOKEN = process.env.INSTANT_ADMIN_TOKEN || "";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const db = init({ appId: APP_ID, adminToken: ADMIN_TOKEN });

    // Check if email is already registered
    const existing = await db.query({ userProfiles: { $: { where: { email } } } });
    const profiles = (existing.userProfiles as any[]) ?? [];
    if (profiles.length > 0) {
      return NextResponse.json({ error: "An account with this email already exists. Please sign in." }, { status: 409 });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user profile record
    const { id } = await import("@instantdb/admin");
    const profileId = id();
    await db.transact([
      db.tx.userProfiles[profileId].update({
        email,
        name,
        passwordHash,
        createdAt: Date.now(),
      }),
    ]);

    // Send magic code OTP for email verification
    await db.auth.sendMagicCode(email);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("/api/auth/register error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
