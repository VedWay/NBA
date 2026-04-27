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

const INPUT = "mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition focus:border-[#9d2235] focus:ring-2 focus:ring-[#9d2235]/30";
const LABEL = "block text-xs font-bold uppercase tracking-wider text-slate-400";
const ERR   = "mt-1 text-xs font-semibold text-rose-400";

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
    <div className="flex min-h-[calc(100vh-5rem)] items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm">

        {/* Icon + heading */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#9d2235]/20 ring-1 ring-[#9d2235]/40">
            <ShieldCheck className="h-7 w-7 text-[#9d2235]" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white">Admin Portal</h1>
          <p className="mt-1 text-sm text-slate-400">Restricted access — administrators only</p>
        </div>

        {/* Form card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
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
              <div className="flex items-start gap-2 rounded-lg border border-rose-800 bg-rose-950/60 px-3 py-2.5">
                <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
                <p className="text-sm font-semibold text-rose-400">{form.formState.errors.root.message}</p>
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

        <p className="mt-6 text-center text-xs text-slate-600">
          <Link to="/login" className="text-slate-400 hover:text-white transition">
            ← Back to main login
          </Link>
        </p>
      </div>
    </div>
  );
}
