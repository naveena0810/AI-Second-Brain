"use client";

import { useState, useRef, useEffect } from "react";
import { db } from "@/lib/instant";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

type AuthTab = "signin" | "signup";
type AuthView = "form" | "otp"; // otp only used in signup

export default function AuthPage() {
  const router = useRouter();
  const [tab, setTab] = useState<AuthTab>("signin");
  const [view, setView] = useState<AuthView>("form");

  // Form fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // OTP state (sign up only)
  const [otp, setOtp] = useState<string[]>(Array(6).fill(""));
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { isLoading, user } = db.useAuth();
  useEffect(() => {
    if (!isLoading && user) router.replace("/");
  }, [isLoading, user, router]);

  // Countdown (only during otp view)
  useEffect(() => {
    if (view !== "otp") return;
    setCanResend(false);
    setCountdown(60);
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(interval); setCanResend(true); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [view]);

  const resetForm = () => {
    setError("");
    setOtp(Array(6).fill(""));
    setView("form");
  };

  const handleTabChange = (t: AuthTab) => {
    setTab(t);
    resetForm();
  };

  // --- SIGN IN (password only, no OTP) ---
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      // Directly sign in using the token returned from server
      await db.auth.signInWithToken(data.token);
      router.replace("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- SIGN UP (with OTP verification) ---
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      setView("otp");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- RESEND OTP ---
  const resendOtp = async () => {
    setError("");
    setLoading(true);
    try {
      await db.auth.sendMagicCode({ email });
      setCanResend(false);
      setCountdown(60);
    } catch {
      setError("Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  // OTP input handlers
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };
  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };
  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) { setOtp(pasted.split("")); otpRefs.current[5]?.focus(); }
    e.preventDefault();
  };

  // --- VERIFY OTP (sign up only) ---
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { setError("Please enter all 6 digits."); return; }
    setError("");
    setLoading(true);
    try {
      await db.auth.signInWithMagicCode({ email, code });
      router.replace("/");
    } catch {
      setError("Invalid OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg-primary)" }}>
      <div className="w-8 h-8 rounded-full border-2 border-[var(--accent-primary)] border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8" style={{ background: "var(--bg-primary)" }}>
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: "radial-gradient(circle at 20% 20%, rgba(124,144,130,0.09) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(202,167,125,0.09) 0%, transparent 50%)"
      }} />

      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="auth-card-width w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4" style={{ background: "var(--accent-primary)" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2V9M9 21H5a2 2 0 0 1-2-2V9m0 0h18" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold" style={{ color: "var(--text-primary)" }}>AI Second Brain</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>Your personal knowledge system</p>
        </div>

        <div className="rounded-3xl shadow-[0_8px_40px_var(--shadow)] overflow-hidden" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <AnimatePresence mode="wait">

            {/* OTP VIEW — sign up only */}
            {view === "otp" ? (
              <motion.div key="otp" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="p-8">
                <button onClick={resetForm} className="flex items-center gap-1.5 text-sm mb-6 hover:opacity-70 transition-opacity" style={{ color: "var(--text-secondary)" }}>
                  ← Back
                </button>
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-3" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border)" }}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2"><path d="M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z" /></svg>
                  </div>
                  <h2 className="text-lg font-semibold mb-1" style={{ color: "var(--text-primary)" }}>Verify your email</h2>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Enter the 6-digit code sent to <strong>{email}</strong></p>
                </div>
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                    {otp.map((digit, i) => (
                      <input key={i} ref={el => { otpRefs.current[i] = el; }}
                        type="text" inputMode="numeric" maxLength={1} value={digit}
                        onChange={e => handleOtpChange(i, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(i, e)}
                        className="w-11 h-12 text-center text-lg font-semibold rounded-xl outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/40 transition-all"
                        style={{ background: "var(--bg-primary)", border: "1.5px solid " + (digit ? "var(--accent-primary)" : "var(--border)"), color: "var(--text-primary)" }}
                      />
                    ))}
                  </div>
                  {error && <p className="text-sm text-center text-red-500">{error}</p>}
                  <button type="submit" disabled={loading} className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50" style={{ background: "var(--accent-primary)" }}>
                    {loading ? "Verifying…" : "Verify & Create Account"}
                  </button>
                  <div className="text-center">
                    {canResend
                      ? <button type="button" onClick={resendOtp} disabled={loading} className="text-sm font-medium hover:opacity-70 transition-opacity" style={{ color: "var(--accent-primary)" }}>Resend code</button>
                      : <p className="text-sm" style={{ color: "var(--text-secondary)" }}>Resend in {countdown}s</p>}
                  </div>
                </form>
              </motion.div>
            ) : (
              /* FORM VIEW */
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* Tabs */}
                <div className="flex border-b" style={{ borderColor: "var(--border)" }}>
                  {(["signin", "signup"] as AuthTab[]).map(t => (
                    <button key={t} onClick={() => handleTabChange(t)}
                      className="flex-1 py-4 text-sm font-semibold transition-colors relative"
                      style={{ color: tab === t ? "var(--accent-primary)" : "var(--text-secondary)" }}>
                      {t === "signin" ? "Sign In" : "Sign Up"}
                      {tab === t && <motion.div layoutId="tab-bar" className="absolute bottom-0 left-0 right-0 h-0.5" style={{ background: "var(--accent-primary)" }} />}
                    </button>
                  ))}
                </div>

                <div className="p-8">
                  <AnimatePresence mode="wait">
                    {/* SIGN IN — password only */}
                    {tab === "signin" && (
                      <motion.form key="signin" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} onSubmit={handleSignIn} className="space-y-4">
                        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>Welcome back! Enter your email and password to sign in.</p>
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-secondary)" }}>Email</label>
                          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                            className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30 transition-all"
                            style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-secondary)" }}>Password</label>
                          <div className="relative">
                            <input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password"
                              className="w-full px-4 py-3 pr-14 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30 transition-all"
                              style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs opacity-50 hover:opacity-80 transition-opacity" style={{ color: "var(--text-secondary)" }}>
                              {showPassword ? "Hide" : "Show"}
                            </button>
                          </div>
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                        <button type="submit" disabled={loading} className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50" style={{ background: "var(--accent-primary)" }}>
                          {loading ? "Signing in…" : "Sign In →"}
                        </button>
                        <p className="text-center text-sm" style={{ color: "var(--text-secondary)" }}>
                          No account?{" "}
                          <button type="button" onClick={() => handleTabChange("signup")} className="font-medium hover:opacity-70" style={{ color: "var(--accent-primary)" }}>Sign Up</button>
                        </p>
                      </motion.form>
                    )}

                    {/* SIGN UP — with OTP */}
                    {tab === "signup" && (
                      <motion.form key="signup" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} onSubmit={handleSignUp} className="space-y-4">
                        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>Create your account. We'll verify your email with a one-time code.</p>
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-secondary)" }}>Full Name</label>
                          <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Your name"
                            className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30 transition-all"
                            style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-secondary)" }}>Email</label>
                          <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                            className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30 transition-all"
                            style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-secondary)" }}>Password <span className="text-[10px] normal-case font-normal">(min. 8 chars)</span></label>
                          <div className="relative">
                            <input type={showPassword ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Create a password"
                              className="w-full px-4 py-3 pr-14 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30 transition-all"
                              style={{ background: "var(--bg-primary)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-xs opacity-50 hover:opacity-80 transition-opacity" style={{ color: "var(--text-secondary)" }}>
                              {showPassword ? "Hide" : "Show"}
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: "var(--text-secondary)" }}>Confirm Password</label>
                          <input type={showPassword ? "text" : "password"} required value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat password"
                            className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/30 transition-all"
                            style={{ background: "var(--bg-primary)", border: "1px solid " + (confirmPassword && password !== confirmPassword ? "rgb(239 68 68)" : "var(--border)"), color: "var(--text-primary)" }} />
                          {confirmPassword && password !== confirmPassword && <p className="text-xs text-red-500 mt-1">Passwords do not match</p>}
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                        <button type="submit" disabled={loading || (!!confirmPassword && password !== confirmPassword)} className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50" style={{ background: "var(--accent-primary)" }}>
                          {loading ? "Creating account…" : "Create Account & Verify Email →"}
                        </button>
                        <p className="text-center text-sm" style={{ color: "var(--text-secondary)" }}>
                          Have an account?{" "}
                          <button type="button" onClick={() => handleTabChange("signin")} className="font-medium hover:opacity-70" style={{ color: "var(--accent-primary)" }}>Sign In</button>
                        </p>
                      </motion.form>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
