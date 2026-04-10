import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const signupSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["faculty", "admin"]),
  designation: z.string().optional(),
  department: z.string().optional(),
  phone: z.string().optional(),
});

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, registerAccount } = useAuth();
  const [mode, setMode] = useState("login");

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
      admin_signup_code: "",
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
      const payload = await registerAccount(values);
      if (payload.role === "admin") navigate("/admin");
      else navigate("/dashboard");
    } catch (error) {
      signupForm.setError("root", { message: error.message || "Signup failed" });
    }
  };

  return (
    <section className="relative overflow-hidden px-4 py-14 md:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(255,201,77,0.35),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(56,189,248,0.28),transparent_38%),radial-gradient(circle_at_50%_80%,rgba(255,255,255,0.45),transparent_45%)]" />
      <div className="smooth-fade glass-card mx-auto max-w-2xl rounded-2xl border border-white/40 p-8 shadow-[0_20px_60px_rgba(15,23,42,0.16)] backdrop-blur-xl">
        <p className="inline-flex rounded-full border border-amber-500/40 bg-amber-200/60 px-4 py-1 text-xs uppercase tracking-[0.2em] text-slate-800">
          Start Here
        </p>
        <h1 className="mt-3 text-4xl font-black text-slate-900">Login or Create Account</h1>
        <p className="mt-2 text-sm text-slate-700">
          Select role, sign in, or create a new admin/faculty account. You can also continue as guest.
        </p>

        <div className="mt-6 flex gap-2 rounded-xl border border-slate-300/50 bg-white/40 p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              mode === "login" ? "bg-amber-400 text-slate-900" : "text-slate-700 hover:bg-white/70"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition ${
              mode === "signup" ? "bg-amber-400 text-slate-900" : "text-slate-700 hover:bg-white/70"
            }`}
          >
            Create Account
          </button>
        </div>

        {mode === "login" ? (
          <form className="mt-6 space-y-4" onSubmit={loginForm.handleSubmit(onLogin)}>
            <label className="block text-sm font-semibold text-slate-800">
              Email
              <input className="mt-1 w-full rounded-lg border border-slate-300 bg-white/80 px-3 py-2" {...loginForm.register("email")} />
              {loginForm.formState.errors.email && <span className="text-xs text-rose-700">{loginForm.formState.errors.email.message}</span>}
            </label>
            <label className="block text-sm font-semibold text-slate-800">
              Password
              <input type="password" className="mt-1 w-full rounded-lg border border-slate-300 bg-white/80 px-3 py-2" {...loginForm.register("password")} />
              {loginForm.formState.errors.password && <span className="text-xs text-rose-700">{loginForm.formState.errors.password.message}</span>}
            </label>
            {loginForm.formState.errors.root && <p className="text-sm text-rose-700">{loginForm.formState.errors.root.message}</p>}
            <button
              disabled={loginForm.formState.isSubmitting}
              className="w-full rounded-lg bg-amber-400 px-4 py-2 font-semibold text-slate-900 transition hover:bg-amber-300"
            >
              {loginForm.formState.isSubmitting ? "Signing in..." : "Sign In"}
            </button>
          </form>
        ) : (
          <form className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2" onSubmit={signupForm.handleSubmit(onSignup)}>
            <label className="text-sm font-semibold text-slate-800 md:col-span-2">
              Full Name
              <input className="mt-1 w-full rounded-lg border border-slate-300 bg-white/80 px-3 py-2" {...signupForm.register("name")} />
            </label>
            <label className="text-sm font-semibold text-slate-800">
              Email
              <input className="mt-1 w-full rounded-lg border border-slate-300 bg-white/80 px-3 py-2" {...signupForm.register("email")} />
            </label>
            <label className="text-sm font-semibold text-slate-800">
              Password
              <input type="password" className="mt-1 w-full rounded-lg border border-slate-300 bg-white/80 px-3 py-2" {...signupForm.register("password")} />
            </label>
            <label className="text-sm font-semibold text-slate-800">
              Account Type
              <select className="mt-1 w-full rounded-lg border border-slate-300 bg-white/80 px-3 py-2" {...signupForm.register("role")}>
                <option value="faculty">Faculty</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <label className="text-sm font-semibold text-slate-800">
              Department
              <input className="mt-1 w-full rounded-lg border border-slate-300 bg-white/80 px-3 py-2" {...signupForm.register("department")} />
            </label>
            <label className="text-sm font-semibold text-slate-800">
              Designation
              <input className="mt-1 w-full rounded-lg border border-slate-300 bg-white/80 px-3 py-2" {...signupForm.register("designation")} />
            </label>
            <label className="text-sm font-semibold text-slate-800">
              Phone
              <input className="mt-1 w-full rounded-lg border border-slate-300 bg-white/80 px-3 py-2" {...signupForm.register("phone")} />
            </label>
            {signupForm.watch("role") === "admin" && (
              <label className="text-sm font-semibold text-slate-800 md:col-span-2">
                Admin Signup Code
                <input
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white/80 px-3 py-2"
                  {...signupForm.register("admin_signup_code")}
                />
                <span className="mt-1 block text-xs font-normal text-slate-600">
                  Must match ADMIN_SIGNUP_CODE configured in backend/.env.
                </span>
              </label>
            )}
            {signupForm.formState.errors.root && <p className="text-sm text-rose-700 md:col-span-2">{signupForm.formState.errors.root.message}</p>}
            <button
              disabled={signupForm.formState.isSubmitting}
              className="md:col-span-2 w-full rounded-lg bg-slate-900 px-4 py-2 font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800"
            >
              {signupForm.formState.isSubmitting ? "Creating account..." : "Create Account"}
            </button>
          </form>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <Link to="/faculty" className="rounded-lg border border-slate-500/40 bg-white/60 px-4 py-2 text-sm font-semibold text-slate-800 hover:-translate-y-0.5 hover:bg-white">
            View Faculties as Viewer
          </Link>
          <Link to="/" className="rounded-lg border border-slate-300 bg-white/50 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white">
            Go to Landing Page
          </Link>
        </div>
      </div>
    </section>
  );
}
