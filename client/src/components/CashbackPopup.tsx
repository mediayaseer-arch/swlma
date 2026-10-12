import { X } from "lucide-react";

const CASHBACK_IMAGE = "https://i.ibb.co/JRcLm9ph/caashback-40-new-png.png";

export function CashbackPopup({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-label="عرض كاش باك 40%"
      data-testid="cashback-popup"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div className="relative rounded-3xl max-w-md w-full shadow-2xl animate-scale-in overflow-hidden bg-[#0a1438]">
        <button
          onClick={onClose}
          className="absolute top-3 left-3 z-10 text-white hover:text-white transition-colors w-9 h-9 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center cursor-pointer"
          data-testid="button-close-popup"
          aria-label="إغلاق العرض"
        >
          <X className="w-5 h-5" />
        </button>

        <img
          src={CASHBACK_IMAGE}
          alt="عرض كاش باك 40%"
          className="w-full h-auto block"
          data-testid="img-cashback-popup"
        />

        <div className="p-4 bg-[#0a1438]">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-white text-[#4a1525] font-bold shadow-lg hover:bg-white/90 cursor-pointer"
            data-testid="button-continue-popup"
          >
            متابعة الدفع
          </button>
        </div>
      </div>
    </div>
  );
}
