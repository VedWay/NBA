import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import GoogleSignInButton from "../components/GoogleSignInButton";
import { GraduationCap, BookOpen, Lock } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.literal("faculty"),
  designation: z.string().optional(),
  department: z.string().optional(),
  phone: z.string().optional(),
});

const INPUT = "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#9d2235] focus:ring-2 focus:ring-[#9d2235]/20";
const LABEL = "block text-xs font-bold uppercase tracking-wider text-slate-500";
const ERR   = "mt-1 text-xs font-semibold text-rose-600";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, registerAccount, loginWithGoogle } = useAuth();

  const [tab, setTab] = useState("student"); // "student" | "faculty"
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [googleLoading, setGoogleLoading] = useState(false);
  const [studentError, setStudentError] = useState("");
  const [studentGoogleLoading, setStudentGoogleLoading] = useState(false);

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const signupForm = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "faculty",
      designation: "Assistant Professor",
      department: "Computer Engineering and IT",
      phone: "+91 0000000000",
    },
  });

  const onLogin = async (values) => {
    try {
      const payload = await login(values.email, values.password);
      if (payload.role === "admin") navigate("/admin");
      else if (payload.role === "faculty") navigate("/dashboard");
      else navigate("/faculty");
    } catch (error) {
      loginForm.setError("root", { message: error.message || "Login failed" });
    }
  };

  const onSignup = async (values) => {
    try {
      await registerAccount({ ...values, role: "faculty" });
      navigate("/dashboard");
    } catch (error) {
      signupForm.setError("root", { message: error.message || "Signup failed" });
    }
  };

  const handleGoogleSignIn = async (googleData) => {
    if (googleData.error) {
      loginForm.setError("root", { message: googleData.error });
      return;
    }
    setGoogleLoading(true);
    try {
      const payload = await loginWithGoogle(googleData);
      if (payload.role === "admin") navigate("/admin");
      else if (payload.role === "faculty") navigate("/dashboard");
      else navigate("/faculty");
    } catch (error) {
      loginForm.setError("root", { message: error.message || "Google sign-in failed" });
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleStudentGoogleSignIn = async (googleData) => {
    if (googleData.error) {
      setStudentError(googleData.error);
      return;
    }
    setStudentGoogleLoading(true);
    setStudentError("");
    try {
      const payload = await loginWithGoogle(googleData, { loginAsStudent: true });
      if (payload.role === "student") navigate("/student-desk");
      else navigate("/students");
    } catch (error) {
      setStudentError(error.message || "Only @it.vjti.ac.in or @vjti.ac.in emails are allowed.");
    } finally {
      setStudentGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-50">
      {/* Hero strip */}
      <div className="bg-gradient-to-br from-[#7f1022] via-[#9d2235] to-[#6b0e1e] px-4 py-12 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white/80">
          <Lock className="h-3 w-3" /> Secure Portal
        </div>
        <h1 className="font-display text-3xl font-bold text-white md:text-4xl">VJTI NBA Portal</h1>
        <p className="mt-2 text-sm text-white/70">Sign in to access your dashboard</p>
      </div>

      <div className="mx-auto max-w-xl px-4 py-10 md:px-0">
        {/* Tab switcher */}
        <div className="flex gap-1 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
          <button
            type="button"
            onClick={() => setTab("student")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition ${
              tab === "student" ? "bg-[#9d2235] text-white shadow" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <GraduationCap className="h-4 w-4" /> Student
          </button>
          <button
            type="button"
            onClick={() => setTab("faculty")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition ${
              tab === "faculty" ? "bg-[#9d2235] text-white shadow" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <BookOpen className="h-4 w-4" /> Faculty
          </button>
        </div>

        {/* Panel */}
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">

          {/* ── STUDENT ── */}
          {tab === "student" && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#9d2235]">Student Access</p>
              <h2 className="mt-1 font-display text-2xl font-bold text-slate-800">Sign in with Google</h2>
              <p className="mt-1 text-sm text-slate-500">Use your VJTI Google account — no password needed.</p>

              <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-800">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>Only <strong>@it.vjti.ac.in</strong> and <strong>@vjti.ac.in</strong> emails are permitted.</span>
              </div>

              {studentError && (
                <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                  {studentError}
                </p>
              )}

              <div className="mt-6">
                <GoogleSignInButton onSignIn={handleStudentGoogleSignIn} disabled={studentGoogleLoading} />
              </div>
              <p className="mt-4 text-xs text-slate-400">
                After signing in you'll be redirected to the Student Desk to submit and manage achievements.
              </p>
            </div>
          )}

          {/* ── FACULTY ── */}
          {tab === "faculty" && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#9d2235]">Faculty Access</p>
              <h2 className="mt-1 font-display text-2xl font-bold text-slate-800">Faculty Portal</h2>
              <p className="mt-1 text-sm text-slate-500">Sign in or create a new faculty account.</p>

              {/* Sign In / Register tabs */}
              <div className="mt-5 flex gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1">
                {[["login", "Sign In"], ["signup", "Register"]].map(([m, label]) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => { setMode(m); loginForm.clearErrors(); }}
                    className={`flex-1 rounded-lg py-2 text-sm font-bold transition ${
                      mode === m ? "bg-white shadow-sm text-[#9d2235]" : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Login form */}
              {mode === "login" && (
                <form className="mt-5 space-y-4" onSubmit={loginForm.handleSubmit(onLogin)}>
                  <div>
                    <label className={LABEL}>Email</label>
                    <input className={INPUT} {...loginForm.register("email")} placeholder="you@vjti.ac.in" />
                    {loginForm.formState.errors.email && <p className={ERR}>{loginForm.formState.errors.email.message}</p>}
                  </div>
                  <div>
                    <label className={LABEL}>Password</label>
                    <input type="password" className={INPUT} {...loginForm.register("password")} placeholder="••••••••" />
                    {loginForm.formState.errors.password && <p className={ERR}>{loginForm.formState.errors.password.message}</p>}
                  </div>
                  {loginForm.formState.errors.root && (
                    <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700">
                      {loginForm.formState.errors.root.message}
                    </p>
                  )}
                  <button
                    disabled={loginForm.formState.isSubmitting}
                    className="w-full rounded-xl bg-[#9d2235] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#b51a34] disabled:opacity-60"
                  >
                    {loginForm.formState.isSubmitting ? "Signing in…" : "Sign In"}
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-slate-200" />
                    <span className="text-xs text-slate-400">or</span>
                    <div className="h-px flex-1 bg-slate-200" />
                  </div>
                  <GoogleSignInButton onSignIn={handleGoogleSignIn} disabled={googleLoading} />
                </form>
              )}

              {/* Register form */}
              {mode === "signup" && (
                <form className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={signupForm.handleSubmit(onSignup)}>
                  <div className="md:col-span-2">
                    <label className={LABEL}>Full Name</label>
                    <input className={INPUT} {...signupForm.register("name")} placeholder="Dr. Jane Doe" />
                  </div>
                  <div>
                    <label className={LABEL}>Email</label>
                    <input className={INPUT} {...signupForm.register("email")} placeholder="jane@vjti.ac.in" />
                  </div>
                  <div>
                    <label className={LABEL}>Password</label>
                    <input type="password" className={INPUT} {...signupForm.register("password")} placeholder="••••••••" />
                  </div>
                  <div>
                    <label className={LABEL}>Department</label>
                    <input className={INPUT} {...signupForm.register("department")} />
                  </div>
                  <div>
                    <label className={LABEL}>Designation</label>
                    <input className={INPUT} {...signupForm.register("designation")} />
                  </div>
                  <div className="md:col-span-2">
                    <label className={LABEL}>Phone</label>
                    <input className={INPUT} {...signupForm.register("phone")} />
                  </div>
                  {signupForm.formState.errors.root && (
                    <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 md:col-span-2">
                      {signupForm.formState.errors.root.message}
                    </p>
                  )}
                  <button
                    disabled={signupForm.formState.isSubmitting}
                    className="md:col-span-2 w-full rounded-xl bg-[#9d2235] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#b51a34] disabled:opacity-60"
                  >
                    {signupForm.formState.isSubmitting ? "Creating account…" : "Create Account"}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          <Link to="/" className="text-[#9d2235] hover:underline">← Back to Home</Link>
          {" · "}
          <Link to="/faculty" className="text-[#9d2235] hover:underline">Faculty Directory</Link>
        </p>
      </div>
    </div>
  );
}
