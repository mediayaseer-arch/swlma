import { AlertCircle, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <main
      dir="rtl"
      className="page-not-found min-h-screen w-full bg-[#F7F1EC] px-4 py-10 text-[#3B2720] sm:px-6 sm:py-16"
    >
      <div className="mx-auto flex min-h-[70vh] max-w-3xl items-center justify-center">
        <section className="relative w-full overflow-hidden rounded-[2rem] border border-[#C98A68]/30 bg-white/80 p-7 text-center shadow-[0_24px_70px_rgba(74,21,37,0.12)] backdrop-blur sm:p-12">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-2 bg-gradient-to-l from-[#4A1525] via-[#A85734] to-[#C9A96E]" />
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-[#C9A96E]/60 bg-[#FFF7F0] text-[#A85734] shadow-inner">
            <AlertCircle className="h-10 w-10" aria-hidden="true" />
          </div>
          <h1 className="text-3xl font-bold text-[#4A1525] sm:text-5xl">الصفحة غير موجودة</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-8 text-[#76645B] sm:text-base">
            عذراً، لم نتمكن من العثور على الصفحة التي تبحث عنها. يمكنك العودة إلى
            الصفحة الرئيسية ومتابعة الاستكشاف.
          </p>
          <a
            href="/home"
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-[#A85734] to-[#874027] px-6 py-3 font-bold text-white shadow-[0_12px_28px_rgba(168,87,52,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(168,87,52,0.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A96E] focus-visible:ring-offset-2"
          >
            العودة للرئيسية
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </section>
      </div>
    </main>
  );
}
