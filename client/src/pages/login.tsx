import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginWithEmail } from "@/lib/firebase";
import { Lock, Mail } from "lucide-react";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);

    try {
      await loginWithEmail(email, password);
      setLocation("/dashboard");
    } catch (err: any) {
      const msg = String(err?.message || "").toLowerCase();
      if (err?.code === "auth/invalid-credential" || msg.includes("invalid")) {
        setError("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      } else if (msg.includes("email not confirmed")) {
        setError("البريد الإلكتروني لم يتم تأكيده");
      } else {
        setError("حدث خطأ، يرجى المحاولة مرة أخرى");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fffdf9_0%,#f7f1ec_55%,#ebddd0_100%)] flex items-center justify-center p-4 sm:p-8" dir="rtl">
      <div className="w-full animate-fade-in" style={{ maxWidth: "32rem" }}>
        <div className="bg-white/95 border border-[#ead8ce] rounded-3xl p-6 sm:p-9 shadow-[0_20px_60px_rgba(90,54,39,0.14)] backdrop-blur" style={{ boxSizing: "border-box" }}>
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#3a0f1d] rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-[0_10px_24px_rgba(58,15,29,0.22)]">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#3a0f1d]">تسجيل الدخول</h1>
            <p className="text-[#76645b] mt-2 text-sm">لوحة تحكم الدرعية</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[#4a352c] font-semibold">البريد الإلكتروني</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8696a0]" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value.slice(0, 120))}
                  maxLength={120}
                  className="bg-[#fffdf9] border-[#ead8ce] text-[#33221d] pr-10 placeholder:text-[#a28d83] focus:border-[#a85734]"
                  placeholder="admin@example.com"
                  required
                  data-testid="input-login-email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[#4a352c] font-semibold">كلمة المرور</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8696a0]" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value.slice(0, 128))}
                  maxLength={128}
                  className="bg-[#fffdf9] border-[#ead8ce] text-[#33221d] pr-10 placeholder:text-[#a28d83] focus:border-[#a85734]"
                  placeholder="••••••••"
                  required
                  data-testid="input-login-password"
                />
              </div>
            </div>

            {error && (
              <p className="text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-center" data-testid="error-login">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#a85734] hover:bg-[#874027] text-white py-6 rounded-xl shadow-[0_10px_24px_rgba(168,87,52,0.22)]"
              data-testid="button-login-submit"
            >
              {loading ? "جاري تسجيل الدخول..." : "دخول"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
