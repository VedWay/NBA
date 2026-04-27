import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ShieldCheck, Lock } from "lucide-react";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const INPUT = "mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-[#9d2235] focus:ring-2 focus:ring-[#9d2235]/20";
const LABEL = "block text-xs font-bold uppercase tracking-wider text-slate-500";
const ERR   = "mt-1 text-xs font-semibold text-rose-600";

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values) => {
    try {
      const payload = await login(values.email, values.password);
      if (payload.role === "admin") {
        navigate("/admin");
      } else {
        form.setError("root", { message: "This account does not have admin privileges." });
      }
    } catch (error) {
      form.setError("root", { message: error.message || "Login failed" });
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-slate-50">
      <div className="bg-gradient-to-br from-[#7f1022] via-[#9d2235] to-[#6b0e1e] px-4 py-12 text-center">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-widest text-white/80">
          <ShieldCheck className="h-3 w-3" /> Admin Access
        </div>
        <h1 className="font-display text-3xl font-bold text-white md:text-4xl">Admin Portal</h1>
        <p className="mt-2 text-sm text-white/70">Sign in with administrator credentials</p>
      </div>

      <div className="mx-auto w-full max-w-xl px-4 py-10 md:px-0">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#9d2235]/10 ring-1 ring-[#9d2235]/20">
              <ShieldCheck className="h-6 w-6 text-[#9d2235]" />
            </div>
            <h2 className="font-display text-2xl font-bold text-slate-800">Administrator Login</h2>
            <p className="mt-1 text-sm text-slate-500">Only authorized admin accounts are allowed</p>
          </div>

          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div>
              <label className={LABEL}>Email</label>
              <input className={INPUT} {...form.register("email")} placeholder="admin@vjti.ac.in" />
              {form.formState.errors.email && <p className={ERR}>{form.formState.errors.email.message}</p>}
            </div>
            <div>
              <label className={LABEL}>Password</label>
              <input type="password" className={INPUT} {...form.register("password")} placeholder="••••••••" />
              {form.formState.errors.password && <p className={ERR}>{form.formState.errors.password.message}</p>}
            </div>

            {form.formState.errors.root && (
              <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-500" />
                <p className="text-sm font-semibold text-rose-700">{form.formState.errors.root.message}</p>
              </div>
            )}

            <button
              disabled={form.formState.isSubmitting}
              className="w-full rounded-xl bg-[#9d2235] px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#b51a34] disabled:opacity-60"
            >
              {form.formState.isSubmitting ? "Signing in…" : "Sign In as Admin"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          <Link to="/login" className="text-[#9d2235] hover:underline transition">
            ← Back to main login
          </Link>
        </p>
      </div>
    </div>
  );
}
