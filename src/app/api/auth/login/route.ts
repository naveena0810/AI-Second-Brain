import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { init } from "@instantdb/admin";

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID || "";
const ADMIN_TOKEN = process.env.INSTANT_ADMIN_TOKEN || "";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const db = init({ appId: APP_ID, adminToken: ADMIN_TOKEN });

    // Find user profile by email
    const result = await db.query({ userProfiles: { $: { where: { email } } } });
    const profiles = (result.userProfiles as any[]) ?? [];

    if (profiles.length === 0) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const profile = profiles[0];

    // Compare password hash
    const passwordMatch = await bcrypt.compare(password, profile.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // Create a long-lived token so the client can sign in directly without OTP
    const token = await db.auth.createToken(email);

    return NextResponse.json({ success: true, token, name: profile.name });
  } catch (err: any) {
    console.error("/api/auth/login error:", err);
    return NextResponse.json(
      { error: err?.message ?? "Login failed. Please try again." },
      { status: 500 }
    );
  }
}
