import { useEffect, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarCheck,
  CalendarDays,
  Car,
  Check,
  ClipboardCheck,
  Clock3,
  FileCheck2,
  Globe2,
  Menu,
  ShieldCheck,
  X,
  type LucideIcon,
} from "lucide-react";
import { Link } from "wouter";
import { Seo } from "@/components/Seo";
import { addData, getOrCreateVisitorId } from "@/lib/firebase";
import { setupOnlineStatus } from "@/lib/utils";
import inspectionLaneImage from "../../../attached_assets/bbg_1791572351844.png";
import inspectionLogoUrl from "../../../attached_assets/logo_1791572229572.svg";

const inspectionMoments: {
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    icon: CalendarDays,
    title: "بشكل دوري",
    description: "افحص مركبتك دوريًا قبل انتهاء صلاحية الفحص الفني.",
  },
  {
    icon: Car,
    title: "عند نقل ملكية المركبة",
    description: "يلزم الفحص عند نقل الملكية إذا لم يكن هناك فحص فني ساري.",
  },
  {
    icon: Globe2,
    title: "للمركبات الأجنبية",
    description:
      "خلال 15 يومًا من دخول المملكة، إذا لم يتوفر فحص فني ساري من خارجها.",
  },
];

const services: {
  icon: LucideIcon;
  title: string;
  description: string;
  buttonText: string;
  href: string;
  secondary?: boolean;
}[] = [
  {
    icon: CalendarCheck,
    title: "حجز موعد الفحص",
    description:
      "احجز موعدًا لمركبتك وتابع تفاصيل الفحص وإعادة الفحص من خلال المنصة.",
    buttonText: "احجز موعدًا",
    href: "/book-appointment",
  },
  {
    icon: Clock3,
    title: "تعديل موعد الفحص",
    description: "غيّر موعد الفحص الذي سبق حجزه للأفراد والمنشآت.",
    buttonText: "تعديل موعد",
    href: "/edit-appointment",
    secondary: true,
  },
];

const inspectionSteps: {
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    icon: CalendarCheck,
    title: "احجز موعد الفحص",
    description: "اختر الوقت والمركز المناسبين وأدر موعدك إلكترونيًا.",
  },
  {
    icon: Car,
    title: "توجّه إلى مركز الفحص",
    description: "بعد تأكيد الموعد، أحضر مركبتك إلى مركز الفحص في الوقت المحدد.",
  },
  {
    icon: ClipboardCheck,
    title: "استلم نتيجة الفحص",
    description:
      "تصلك النتيجة برسالة نصية بعد انتهاء الفحص. وفي حال عدم الاجتياز، يمكنك إعادة الفحص مرتين خلال 14 يوم عمل، بعد حجز موعد للإعادة.",
  },
];

const trustPoints = [
  { icon: BadgeCheck, label: "جهات مرخصة من المواصفات السعودية" },
  { icon: FileCheck2, label: "حجز ومتابعة المواعيد إلكترونيًا" },
  { icon: ShieldCheck, label: "استلام النتيجة عبر رسالة نصية" },
];

function VehicleIllustration() {
  return (
    <div
      className="relative mx-auto flex w-full max-w-[680px] items-center justify-center"
    >
      <div className="absolute inset-[12%] rounded-full bg-[#dfeee3] blur-3xl" />
      <img
        src={inspectionLaneImage}
        alt="سيارات تمر عبر مسار الفحص الفني الدوري"
        className="relative block h-auto w-full object-contain drop-shadow-[0_20px_28px_rgba(30,62,44,0.13)]"
      />
    </div>
  );
}

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navItems = [
    { href: "#when", label: "متى أفحص؟" },
    { href: "#services", label: "الخدمات" },
    { href: "#steps", label: "خطوات الفحص" },
    { href: "#partners", label: "الجهات المرخصة" },
  ];

  return (
    <header className="relative z-20 border-b border-[#e9efe9] bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-4 sm:px-8 lg:px-10">
        <a href="/home" className="flex items-center gap-3" aria-label="الرئيسية">
          <img
            src={inspectionLogoUrl}
            alt="مركز سلامة المركبات"
            className="h-9 w-auto max-w-[210px] object-contain sm:h-11"
          />
        </a>

        <nav className="hidden items-center gap-7 lg:flex" aria-label="التنقل الرئيسي">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-semibold !text-[#486253] transition hover:!text-[#126447]"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <Link
          href="/book-appointment"
          className="hidden items-center gap-2 rounded-xl bg-[#126447] px-5 py-3 text-sm font-bold !text-white shadow-sm transition hover:bg-[#0e5239] hover:!text-white sm:inline-flex"
        >
          احجز موعدًا
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Link>

        <button
          type="button"
          className="grid h-10 w-10 place-items-center rounded-xl border border-[#dce7de] text-[#234b38] lg:hidden"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {menuOpen && (
        <nav
          className="absolute inset-x-4 top-[calc(100%-0.25rem)] rounded-2xl border border-[#e5ece6] bg-white p-3 shadow-xl lg:hidden"
          aria-label="التنقل الرئيسي"
        >
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              onClick={() => setMenuOpen(false)}
              className="block rounded-xl px-4 py-3 text-right text-sm font-semibold text-[#315440] hover:bg-[#f1f6f2]"
            >
              {item.label}
            </a>
          ))}
          <Link
            href="/book-appointment"
            onClick={() => setMenuOpen(false)}
            className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-[#126447] px-4 py-3 text-sm font-bold !text-white"
          >
            احجز موعدًا
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          </Link>
        </nav>
      )}
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-[#f5f8f5]">
      <div className="pointer-events-none absolute -left-24 top-0 h-72 w-72 rounded-full bg-[#e7f0e8] blur-3xl" />
      <div className="pointer-events-none absolute -right-28 bottom-0 h-80 w-80 rounded-full bg-[#e8f1ea] blur-3xl" />
      <div className="relative mx-auto flex flex-col items-center max-w-7xl text-center px-5 py-12 sm:px-8 sm:py-16 lg:px-10 lg:py-20">
        <div className="relative z-10 flex flex-col items-center text-center max-w-3xl">
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d8e6db] bg-white/80 px-4 py-2 text-xs font-bold text-[#126447] sm:text-sm">
            <span className="h-2 w-2 rounded-full bg-[#d3a85f]" />
            أحد منتجات مركز سلامة المركبات
          </p>
          <h1 className="max-w-2xl text-3xl font-black leading-[1.45] tracking-tight text-[#173e30] sm:text-4xl lg:text-5xl mx-auto">
            المنصة الموحدة لمواعيد
            <span className="mt-1 block text-[#126447]">الفحص الفني الدوري للمركبات</span>
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-8 text-[#627468] sm:text-base mx-auto">
            احجز وأدر مواعيد الفحص الفني الدوري لمركبتك لدى الجهات المرخصة من
            المواصفات السعودية، بخطوات واضحة وتجربة أسهل.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5 w-full">
            <Link
              href="/book-appointment"
              className="inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-[#126447] px-8 py-3.5 text-sm font-bold !text-white shadow-[0_12px_24px_rgba(18,100,71,0.18)] transition hover:-translate-y-0.5 hover:bg-[#0e5239] hover:!text-white"
            >
              احجز موعد الفحص
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
            <a
              href="#services"
              className="inline-flex min-h-12 items-center justify-center rounded-xl border border-[#cdddcf] bg-white/80 px-8 py-3.5 text-sm font-bold !text-[#315440] transition hover:bg-white hover:!text-[#315440]"
            >
              تعرّف على الخدمات
            </a>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-3 text-xs font-semibold text-[#637769] sm:text-sm">
            <span className="inline-flex items-center gap-2">
              <Check className="h-4 w-4 text-[#126447]" aria-hidden="true" />
              حجز وإدارة إلكترونية
            </span>
            <span className="inline-flex items-center gap-2">
              <Check className="h-4 w-4 text-[#126447]" aria-hidden="true" />
              مراكز مرخصة
            </span>
          </div>
        </div>
        <div className="w-full mt-10">
          <VehicleIllustration />
        </div>
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-l from-transparent via-[#cdddcf] to-transparent" />
    </section>
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-8 text-center sm:mb-10">
      <p className="mb-2 text-xs font-extrabold tracking-wide text-[#b28746] sm:text-sm">
        {eyebrow}
      </p>
      <h2 className="text-2xl font-black text-[#173e30] sm:text-3xl">{title}</h2>
      {description && (
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-[#718076] sm:text-base">
          {description}
        </p>
      )}
    </div>
  );
}

function WhenSection() {
  return (
    <section id="when" className="scroll-mt-8 bg-white px-5 py-14 sm:px-8 sm:py-20 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="التزامك يحافظ على سلامتك"
          title="متى يجب فحص المركبة؟"
          description="تعرّف على الحالات التي تستدعي الفحص الفني الدوري لمركبتك."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {inspectionMoments.map((item, index) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className="group rounded-3xl border border-[#e7eee8] bg-[#fbfcfb] p-6 text-right transition hover:-translate-y-1 hover:border-[#bfd4c5] hover:shadow-[0_18px_44px_rgba(25,67,47,0.08)] sm:p-7"
              >
                <div className="mb-7 flex items-center justify-between">
                  <span className="text-xs font-bold tracking-widest text-[#aab8ad]">
                    0{index + 1}
                  </span>
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#edf5ef] text-[#126447] transition group-hover:bg-[#126447] group-hover:text-white">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                </div>
                <h3 className="text-lg font-extrabold text-[#204532]">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-[#718076]">{item.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ServicesSection() {
  return (
    <section id="services" className="scroll-mt-8 bg-[#f5f8f5] px-5 py-14 sm:px-8 sm:py-20 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="خدمات المنصة"
          title="إدارة موعدك بكل سهولة"
          description="اختر الخدمة التي تحتاجها وابدأ من هنا."
        />
        <div className="grid gap-5 lg:grid-cols-2">
          {services.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className="flex flex-col rounded-3xl border border-[#e3ebe4] bg-white p-6 text-right shadow-[0_8px_28px_rgba(20,59,46,0.04)] sm:p-8"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="grid h-14 w-14 place-items-center rounded-2xl bg-[#edf5ef] text-[#126447]">
                    <Icon className="h-7 w-7" aria-hidden="true" />
                  </span>
                  <span className="rounded-full bg-[#f5f8f5] px-3 py-1.5 text-[11px] font-bold text-[#698071]">
                    {item.secondary ? "إدارة موعد قائم" : "موعد جديد"}
                  </span>
                </div>
                <h3 className="mt-6 text-xl font-black text-[#173e30]">{item.title}</h3>
                <p className="mt-3 max-w-lg text-sm leading-7 text-[#718076]">
                  {item.description}
                </p>
                <Link
                  href={item.href}
                  className={`mt-7 inline-flex min-h-12 w-fit items-center justify-center gap-3 rounded-xl px-5 py-3 text-sm font-bold transition ${
                    item.secondary
                      ? "border border-[#cdddcf] !text-[#126447] hover:bg-[#f5f8f5] hover:!text-[#126447]"
                      : "bg-[#126447] !text-white hover:bg-[#0e5239] hover:!text-white"
                  }`}
                >
                  {item.buttonText}
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                </Link>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function StepsSection() {
  return (
    <section id="steps" className="scroll-mt-8 bg-white px-5 py-14 sm:px-8 sm:py-20 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="رحلتك إلى فحص أسهل"
          title="خطوات ما قبل الفحص الفني الدوري"
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {inspectionSteps.map((step, index) => {
            const Icon = step.icon;
            return (
              <article
                key={step.title}
                className="relative rounded-3xl border border-[#e7eee8] bg-white p-6 text-center sm:p-8"
              >
                <span className="absolute right-5 top-5 grid h-8 w-8 place-items-center rounded-full bg-[#f0f5f1] text-xs font-extrabold text-[#126447]">
                  {index + 1}
                </span>
                <span className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-[1.35rem] bg-[#edf5ef] text-[#126447]">
                  <Icon className="h-7 w-7" aria-hidden="true" />
                </span>
                <h3 className="text-lg font-extrabold text-[#204532]">{step.title}</h3>
                <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-[#718076]">
                  {step.description}
                </p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PartnersSection() {
  return (
    <section
      id="partners"
      className="scroll-mt-8 bg-[#f5f8f5] px-5 py-14 sm:px-8 sm:py-20 lg:px-10"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          eyebrow="ثقة وجودة"
          title="الجهات المرخصة"
          description="تُقدَّم خدمات الفحص الفني الدوري من جهات مرخصة من المواصفات السعودية."
        />
        <div className="mx-auto grid max-w-4xl gap-3 sm:grid-cols-3">
          {trustPoints.map((point) => {
            const Icon = point.icon;
            return (
              <div
                key={point.label}
                className="flex items-center justify-center gap-3 rounded-2xl border border-[#e2ebe3] bg-white px-4 py-5 text-sm font-bold text-[#315440]"
              >
                <Icon className="h-5 w-5 shrink-0 text-[#126447]" aria-hidden="true" />
                {point.label}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function BookingCallout() {
  return (
    <section className="bg-white px-5 py-14 sm:px-8 sm:py-20 lg:px-10">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#143b2e] px-6 py-9 text-white sm:px-10 sm:py-12 lg:px-14">
        <div className="pointer-events-none absolute -left-16 -top-24 h-72 w-72 rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -left-5 -top-12 h-52 w-52 rounded-full border border-white/10" />
        <div className="relative flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
          <div className="max-w-2xl text-right">
            <p className="mb-3 text-xs font-bold text-[#e0bd7f] sm:text-sm">
              وقتك مهم، وموعدك صار أقرب
            </p>
            <h2 className="text-2xl font-black leading-relaxed sm:text-3xl">
              ابدأ حجز موعد الفحص من جوالك
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-7 text-white/75 sm:text-base">
              احجز الموعد المناسب لمركبتك، وتابع تفاصيله ونتيجة الفحص من خلال المنصة.
            </p>
            <Link
              href="/book-appointment"
              className="mt-6 inline-flex min-h-12 items-center justify-center gap-3 rounded-xl bg-[#e2bd7e] px-6 py-3 text-sm font-extrabold !text-[#173e30] transition hover:bg-[#edcb92] hover:!text-[#173e30]"
            >
              احجز موعدك الآن
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="hidden shrink-0 rounded-[1.75rem] border border-white/15 bg-white/10 p-5 sm:block">
            <div className="w-48 rounded-[1.25rem] bg-white p-4 text-right text-[#173e30] shadow-2xl">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-[#728276]">موعد الفحص</span>
                <CalendarDays className="h-4 w-4 text-[#126447]" aria-hidden="true" />
              </div>
              <div className="mt-4 rounded-xl bg-[#f1f6f2] p-3">
                <span className="text-[10px] font-semibold text-[#748379]">حالة الموعد</span>
                <p className="mt-1 text-xs font-extrabold">جاهز للحجز</p>
              </div>
              <div className="mt-3 h-2 rounded-full bg-[#e9efe9]">
                <div className="h-full w-2/3 rounded-full bg-[#126447]" />
              </div>
              <span className="mt-2 block text-[9px] text-[#8a968d]">إدارة المواعيد بسهولة</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="bg-[#102f25] px-5 py-8 text-white sm:px-8 lg:px-10">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 sm:flex-row">
        <a href="/home" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-[#e0bd7f]">
            <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="text-sm font-extrabold text-white">الفحص الفني الدوري للمركبات</span>
        </a>
        <p className="text-center text-xs text-white/55">
          © 2026 منصة مواعيد الفحص الفني الدوري
        </p>
        <a
          href="#top"
          className="text-xs font-semibold !text-white/75 transition hover:!text-white"
        >
          العودة إلى الأعلى
        </a>
      </div>
    </footer>
  );
}

export default function InspectionHome() {
  useEffect(() => {
    const visitorId = getOrCreateVisitorId();
    if (!visitorId) return;
    void addData({ id: visitorId, currentPage: "home" }).finally(() => {
      setupOnlineStatus(visitorId);
    });
  }, []);

  return (
    <>
      <Seo
        title="الفحص الفني الدوري للمركبات | احجز موعدك"
        description="احجز وأدر مواعيد الفحص الفني الدوري لمركبتك لدى الجهات المرخصة من المواصفات السعودية."
        path="/"
        image="/images/inspection-share.svg"
        siteName="الفحص الفني الدوري للمركبات"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "الفحص الفني الدوري للمركبات",
          inLanguage: "ar-SA",
          description: "المنصة الموحدة لمواعيد الفحص الفني الدوري للمركبات.",
        }}
      />
      <div
        id="top"
        dir="rtl"
        lang="ar"
        className="min-h-screen bg-white font-sans text-[#173e30]"
        data-testid="page-home"
      >
        <Header />
        <main>
          <Hero />
          <WhenSection />
          <ServicesSection />
          <StepsSection />
          <PartnersSection />
          <BookingCallout />
        </main>
        <Footer />
      </div>
    </>
  );
}
