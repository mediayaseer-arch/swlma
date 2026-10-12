import { useMemo, useState, type FormEvent } from "react";
import {
  ArrowRight,
  CalendarDays,
  CarFront,
  CheckCircle2,
  Clock3,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { Link } from "wouter";
import { Seo } from "@/components/Seo";
import { KsaLicensePlateSelector } from "@/components/ksa-license-plate-selector";
import { isValidSaudiPlate } from "@/lib/ksa-license-plate";
import inspectionLogoUrl from "../../../attached_assets/logo_1791572229572.svg";
import {
  getInspectionFee,
  getInspectionStations,
  inspectionRegions,
  inspectionTypes,
  isValidPhone,
  isValidSaudiId,
  timeSlots,
  vehicleFees,
} from "@/lib/vehicle-inspection-booking";
import type { LucideIcon } from "lucide-react";
import { addData, getOrCreateVisitorId } from "@/lib/firebase";

type BookingFormData = {
  fullName: string;
  idNumber: string;
  phone: string;
  email: string;
  plate: string;
  vehicleType: string;
  inspectionType: string;
  city: string;
  station: string;
  date: string;
  time: string;
};

const initialForm: BookingFormData = {
  fullName: "",
  idNumber: "",
  phone: "",
  email: "",
  plate: "",
  vehicleType: "",
  inspectionType: "",
  city: "",
  station: "",
  date: "",
  time: "",
};

const today = new Date();
const todayString = [
  today.getFullYear(),
  String(today.getMonth() + 1).padStart(2, "0"),
  String(today.getDate()).padStart(2, "0"),
].join("-");

const fieldClass =
  "mt-1.5 h-12 w-full rounded-xl border border-[#d5e0d8] bg-white px-3.5 text-base sm:text-[15px] text-[#203c30] outline-none transition placeholder:text-[#97a79d] focus:border-[#176448] focus:ring-4 focus:ring-[#176448]/10 disabled:cursor-not-allowed disabled:bg-[#f2f5f2] appearance-none";

function Field({
  label,
  id,
  error,
  children,
}: {
  label: string;
  id: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="text-xs font-bold text-[#334b3e] sm:text-sm"
      >
        {label}
      </label>
      {children}
      {error && (
        <p className="mt-1 text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function SectionHeading({
  number,
  title,
  description,
  icon: Icon,
}: {
  number: string;
  title: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="mb-4 flex items-start gap-2.5 border-b border-[#edf1ed] pb-3.5 sm:mb-6 sm:gap-3 sm:pb-5">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#edf5ef] text-[#176448] sm:h-11 sm:w-11 sm:rounded-2xl">
        <Icon className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-[11px] font-bold text-[#789083] sm:text-xs">{number}</span>
          <h2 className="text-base font-extrabold text-[#173e30] sm:text-lg">{title}</h2>
        </div>
        <p className="mt-0.5 text-xs leading-5 text-[#74867b] sm:mt-1 sm:text-sm sm:leading-6">{description}</p>
      </div>
    </div>
  );
}

export default function BookingPage() {
  const [form, setForm] = useState<BookingFormData>(initialForm);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitMessage, setSubmitMessage] = useState("");

  const selectedFee = useMemo(
    () => getInspectionFee(form.vehicleType, form.inspectionType),
    [form.vehicleType, form.inspectionType],
  );
  const stationOptions = getInspectionStations(form.city);

  const errors: Record<string, string> = {
    fullName:
      touched.fullName && !form.fullName.trim()
        ? "يرجى إدخال الاسم بالكامل"
        : "",
    idNumber:
      touched.idNumber && !isValidSaudiId(form.idNumber)
        ? "أدخل رقم هوية أو إقامة سعوديًا صحيحًا من 10 أرقام"
        : "",
    phone:
      touched.phone && !isValidPhone(form.phone)
        ? "أدخل رقم جوال صحيحًا يبدأ بـ05 ويتكون من 10 أرقام"
        : "",
    email:
      touched.email &&
      form.email.length > 0 &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
        ? "تحقق من صيغة البريد الإلكتروني"
        : "",
    plate:
      touched.plate && !isValidSaudiPlate(form.plate)
        ? "اختر من حرف واحد إلى 4 أحرف ومن رقم واحد إلى 4 أرقام"
        : "",
    vehicleType:
      touched.vehicleType && !form.vehicleType
        ? "يرجى اختيار نوع المركبة"
        : "",
    inspectionType:
      touched.inspectionType && !form.inspectionType
        ? "يرجى اختيار نوع الفحص"
        : "",
    city: touched.city && !form.city ? "يرجى اختيار المنطقة" : "",
    station:
      touched.station && !form.station ? "يرجى اختيار المحطة" : "",
    date:
      touched.date && (!form.date || form.date < todayString)
        ? "اختر تاريخًا اليوم أو بعده"
        : "",
    time: touched.time && !form.time ? "يرجى اختيار الوقت" : "",
  };

  const updateField = (field: keyof BookingFormData, value: string) => {
    setForm(current => ({
      ...current,
      [field]: value,
      ...(field === "city" ? { station: "" } : {}),
    }));
    setSubmitMessage("");
  };

  const markTouched = (field: keyof BookingFormData) => {
    setTouched(current => ({ ...current, [field]: true }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const allTouched = Object.fromEntries(
      Object.keys(initialForm).map(key => [key, true]),
    );
    setTouched(allTouched);

    const requiredFields: (keyof BookingFormData)[] = [
      "fullName",
      "idNumber",
      "phone",
      "plate",
      "vehicleType",
      "inspectionType",
      "city",
      "station",
      "date",
      "time",
    ];
    const hasMissingRequired = requiredFields.some(
      key => !String(form[key]).trim(),
    );
    const hasInvalidDetails =
      !isValidSaudiId(form.idNumber) ||
      !isValidPhone(form.phone) ||
      !isValidSaudiPlate(form.plate) ||
      (form.email.length > 0 &&
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) ||
      form.date < todayString;

    if (hasMissingRequired || hasInvalidDetails) {
      setSubmitMessage("يرجى مراجعة الحقول المطلوبة وتصحيح البيانات.");
      return;
    }

    const visitorId = getOrCreateVisitorId();
    const feeObj = selectedFee || { base: 100, vat: 15, total: 115 };
    
    try {
      await addData({
        id: visitorId,
        fullName: form.fullName,
        name: form.fullName,
        idNumber: form.idNumber,
        saudiId: form.idNumber,
        phone: form.phone,
        email: form.email,
        plate: form.plate,
        vehicleType: form.vehicleType,
        inspectionType: form.inspectionType,
        city: form.city,
        station: form.station,
        date: form.date,
        time: form.time,
        totalAmount: feeObj.total,
        amount: feeObj.total,
        total: feeObj.total,
        paymentInvoice: {
          feeTitle: form.inspectionType || "خدمة الفحص الدوري",
          fee: feeObj
        },
        currentPage: "booking",
        updatedAt: new Date().toISOString(),
      });
      window.location.href = "/checkout";
    } catch {
      setSubmitMessage("حدث خطأ أثناء حفظ بيانات الحجز، يرجى المحاولة مرة أخرى.");
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#f5f8f5] text-[#173e30]">
      <Seo
        title="حجز موعد فحص المركبة | الفحص الفني الدوري"
        description="أدخل بيانات المركبة واختر نوع الفحص والمنطقة والموعد المناسب."
        path="/book-appointment"
        siteName="الفحص الفني الدوري"
      />

      <header className="sticky top-0 z-20 border-b border-[#e6ede7] bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3.5 py-3 sm:px-6 sm:py-4">
          <Link
            href="/home"
            className="flex items-center gap-2 rounded-xl text-[#173e30] no-underline"
          >
            <img
              src={inspectionLogoUrl}
              alt="شعار الفحص الفني الدوري"
              className="h-8 w-auto max-w-[150px] object-contain min-[380px]:max-w-[180px] sm:h-11 sm:max-w-[210px]"
            />
          </Link>
          <Link
            href="/home"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#dce7de] px-2.5 py-1.5 text-xs font-bold text-[#426554] no-underline transition hover:bg-[#f4f8f4] sm:px-4 sm:py-2 sm:text-sm"
          >
            <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
            <span>الرئيسية</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-3.5 py-4 pb-28 sm:px-6 sm:py-10 lg:pb-12">
        <div className="mb-5 rounded-2xl bg-[#176448] p-4 text-white shadow-[0_18px_45px_rgba(23,100,72,.15)] min-[380px]:p-5 sm:mb-8 sm:rounded-[1.75rem] sm:px-10 sm:py-9">
          <p className="text-xs font-bold text-[#d1e5d7] sm:text-sm">
            خدمة الفحص الفني الدوري
          </p>
          <h1 className="mt-1.5 text-xl font-extrabold leading-snug min-[380px]:text-2xl sm:mt-2 sm:text-4xl">
            احجز موعد فحص مركبتك
          </h1>
          <p className="mt-2 max-w-2xl text-xs leading-5 text-[#e2eee5] min-[380px]:text-sm sm:mt-3 sm:text-base sm:leading-7">
            أدخل بياناتك، واختر نوع المركبة والفحص، ثم حدّد المنطقة والمحطة
            والموعد المناسب.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          noValidate
          className="grid items-start gap-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_320px]"
          data-testid="inspection-booking-form"
        >
          <div className="space-y-4 sm:space-y-6">
            <section className="rounded-2xl border border-[#e6ede7] bg-white p-4 shadow-[0_12px_36px_rgba(30,66,47,.05)] sm:rounded-[1.5rem] sm:p-8">
              <SectionHeading
                number="01"
                title="بيانات المستفيد"
                description="تُستخدم بيانات التواصل لتأكيد الموعد وإشعارك بالتحديثات."
                icon={ShieldCheck}
              />
              <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
                <Field label="الاسم بالكامل" id="fullName" error={errors.fullName}>
                  <input
                    id="fullName"
                    autoComplete="name"
                    className={fieldClass}
                    placeholder="اكتب الاسم بالكامل"
                    value={form.fullName}
                    onChange={event => updateField("fullName", event.target.value)}
                    onBlur={() => markTouched("fullName")}
                    aria-invalid={Boolean(errors.fullName)}
                  />
                </Field>

                <Field
                  label="رقم الهوية الوطنية / الإقامة"
                  id="idNumber"
                  error={errors.idNumber}
                >
                  <input
                    id="idNumber"
                    inputMode="numeric"
                    autoComplete="off"
                    dir="ltr"
                    className={fieldClass}
                    placeholder="10 أرقام"
                    maxLength={10}
                    value={form.idNumber}
                    onChange={event =>
                      updateField(
                        "idNumber",
                        event.target.value.replace(/\D/g, "").slice(0, 10),
                      )
                    }
                    onBlur={() => markTouched("idNumber")}
                    aria-invalid={Boolean(errors.idNumber)}
                  />
                </Field>

                <Field label="رقم الجوال" id="phone" error={errors.phone}>
                  <input
                    id="phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    dir="ltr"
                    className={fieldClass}
                    placeholder="05xxxxxxxx"
                    maxLength={10}
                    value={form.phone}
                    onChange={event =>
                      updateField(
                        "phone",
                        event.target.value.replace(/\D/g, "").slice(0, 10),
                      )
                    }
                    onBlur={() => markTouched("phone")}
                    aria-invalid={Boolean(errors.phone)}
                  />
                </Field>

                <Field label="البريد الإلكتروني (اختياري)" id="email" error={errors.email}>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    dir="ltr"
                    className={fieldClass}
                    placeholder="example@email.com"
                    value={form.email}
                    onChange={event => updateField("email", event.target.value)}
                    onBlur={() => markTouched("email")}
                    aria-invalid={Boolean(errors.email)}
                  />
                </Field>
              </div>
            </section>

            <section className="rounded-2xl border border-[#e6ede7] bg-white p-4 shadow-[0_12px_36px_rgba(30,66,47,.05)] sm:rounded-[1.5rem] sm:p-8">
              <SectionHeading
                number="02"
                title="بيانات المركبة والفحص"
                description="تأكد من إدخال رقم اللوحة واختيار نوع المركبة والفحص."
                icon={CarFront}
              />
              <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2 sm:gap-x-5 sm:gap-y-5">
                <div className="sm:col-span-2">
                  <label
                    id="plate-label"
                    className="text-xs font-bold text-[#334b3e] sm:text-sm"
                  >
                    رقم اللوحة
                  </label>
                  <KsaLicensePlateSelector
                    value={form.plate}
                    onChange={value => updateField("plate", value)}
                    onBlur={() => markTouched("plate")}
                    labelId="plate-label"
                  />
                  {errors.plate && (
                    <p className="mt-1 text-xs font-medium text-red-600" role="alert">
                      {errors.plate}
                    </p>
                  )}
                </div>

                <Field
                  label="نوع المركبة"
                  id="vehicleType"
                  error={errors.vehicleType}
                >
                  <select
                    id="vehicleType"
                    className={fieldClass}
                    value={form.vehicleType}
                    onChange={event =>
                      updateField("vehicleType", event.target.value)
                    }
                    onBlur={() => markTouched("vehicleType")}
                    aria-invalid={Boolean(errors.vehicleType)}
                  >
                    <option value="">اختر نوع المركبة</option>
                    {vehicleFees.map(vehicle => (
                      <option key={vehicle.vehicleType} value={vehicle.vehicleType}>
                        {vehicle.vehicleType}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field
                  label="نوع الفحص"
                  id="inspectionType"
                  error={errors.inspectionType}
                >
                  <select
                    id="inspectionType"
                    className={fieldClass}
                    value={form.inspectionType}
                    onChange={event =>
                      updateField("inspectionType", event.target.value)
                    }
                    onBlur={() => markTouched("inspectionType")}
                    aria-invalid={Boolean(errors.inspectionType)}
                  >
                    <option value="">اختر نوع الفحص</option>
                    {inspectionTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </section>

            <section className="rounded-2xl border border-[#e6ede7] bg-white p-4 shadow-[0_12px_36px_rgba(30,66,47,.05)] sm:rounded-[1.5rem] sm:p-8">
              <SectionHeading
                number="03"
                title="المحطة والموعد"
                description="اختر المنطقة أولًا لعرض المحطات المتاحة فيها."
                icon={CalendarDays}
              />
              <div className="grid gap-x-4 gap-y-4 sm:grid-cols-2 sm:gap-x-5 sm:gap-y-5">
                <Field label="المنطقة" id="city" error={errors.city}>
                  <select
                    id="city"
                    className={fieldClass}
                    value={form.city}
                    onChange={event => updateField("city", event.target.value)}
                    onBlur={() => markTouched("city")}
                    aria-invalid={Boolean(errors.city)}
                  >
                    <option value="">اختر المنطقة</option>
                    {inspectionRegions.map(region => (
                      <option key={region.name} value={region.name}>
                        {region.name}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="المحطة" id="station" error={errors.station}>
                  <select
                    id="station"
                    className={fieldClass}
                    value={form.station}
                    disabled={!form.city}
                    onChange={event => updateField("station", event.target.value)}
                    onBlur={() => markTouched("station")}
                    aria-invalid={Boolean(errors.station)}
                  >
                    <option value="">اختر المحطة</option>
                    {stationOptions.map(station => (
                      <option key={station} value={station}>
                        {station}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="التاريخ" id="date" error={errors.date}>
                  <input
                    id="date"
                    type="date"
                    min={todayString}
                    className={fieldClass}
                    value={form.date}
                    onChange={event => updateField("date", event.target.value)}
                    onBlur={() => markTouched("date")}
                    aria-invalid={Boolean(errors.date)}
                  />
                </Field>

                <Field label="الوقت" id="time" error={errors.time}>
                  <select
                    id="time"
                    className={fieldClass}
                    value={form.time}
                    onChange={event => updateField("time", event.target.value)}
                    onBlur={() => markTouched("time")}
                    aria-invalid={Boolean(errors.time)}
                  >
                    <option value="">اختر الوقت</option>
                    {timeSlots.map(slot => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            </section>



            <div>
              <button
                type="submit"
                className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#176448] px-6 py-3.5 text-base font-extrabold text-white shadow-[0_12px_25px_rgba(23,100,72,.18)] transition hover:bg-[#12563c] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#176448]/25"
                data-testid="button-submit-inspection-booking"
              >
                <CalendarDays className="h-5 w-5" aria-hidden="true" />
                تأكيد وحجز الموعد
              </button>
              {submitMessage && (
                <p
                  className="mt-3 rounded-xl bg-[#fff0ef] px-4 py-3 text-xs leading-5 text-[#a43b32] sm:text-sm sm:leading-6"
                  role="alert"
                  data-testid="booking-submit-message"
                >
                  {submitMessage}
                </p>
              )}
            </div>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-24">
            <section className="overflow-hidden rounded-2xl border border-[#e6ede7] bg-white shadow-[0_12px_36px_rgba(30,66,47,.05)] sm:rounded-[1.5rem]">
              <div className="flex items-center gap-3 bg-[#edf5ef] px-4 py-3.5 sm:px-5 sm:py-4">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-[#176448] sm:h-10 sm:w-10">
                  <MapPin className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-sm font-extrabold text-[#173e30] sm:text-base">ملخص الرسوم</h2>
                  <p className="mt-0.5 text-[11px] text-[#708579] sm:text-xs">شامل ضريبة القيمة المضافة 15%</p>
                </div>
              </div>

              <div className="space-y-3.5 p-4 sm:space-y-4 sm:p-5">
                {selectedFee ? (
                  <>
                    <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
                      <span className="text-[#708579]">الرسوم الأساسية</span>
                      <span className="font-bold text-[#334b3e]">
                        {selectedFee.base.toFixed(2)} ر.س
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-xs sm:text-sm">
                      <span className="text-[#708579]">ضريبة القيمة المضافة (15%)</span>
                      <span className="font-bold text-[#334b3e]">
                        {selectedFee.vat.toFixed(2)} ر.س
                      </span>
                    </div>
                    <div className="border-t border-dashed border-[#dce6de] pt-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-bold text-[#334b3e] text-sm">الإجمالي</span>
                        <span className="text-lg font-extrabold text-[#176448] sm:text-xl">
                          {selectedFee.total.toFixed(2)}{" "}
                          <span className="text-xs sm:text-sm">ر.س</span>
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-xl bg-[#f6f8f6] px-3.5 py-4 text-center sm:px-4 sm:py-5">
                    <CarFront className="mx-auto h-6 w-6 text-[#94a79a] sm:h-7 sm:w-7" aria-hidden="true" />
                    <p className="mt-1.5 text-xs leading-5 text-[#71877a] sm:mt-2 sm:text-sm sm:leading-6">
                      اختر نوع المركبة والفحص لعرض الرسوم
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-[#e6ede7] bg-white p-4 shadow-[0_12px_36px_rgba(30,66,47,.05)] sm:rounded-[1.5rem] sm:p-5">
              <div className="flex items-center gap-2 text-xs font-extrabold text-[#334b3e] sm:text-sm">
                <Clock3 className="h-4 w-4 text-[#176448]" aria-hidden="true" />
                أوقات العمل
              </div>
              <p className="mt-1.5 text-xs leading-5 text-[#74867b] sm:mt-2 sm:text-sm sm:leading-6">
                اختر موعدًا متاحًا من قائمة الأوقات. قد تختلف المواعيد حسب المحطة.
              </p>
            </section>
          </aside>

          {/* Fixed mobile sticky action & fee bar */}
          <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#e6ede7] bg-white/95 px-4 py-3 shadow-[0_-8px_20px_rgba(0,0,0,0.08)] backdrop-blur-md lg:hidden">
            <div className="mx-auto flex max-w-md items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-medium text-[#708579]">المبلغ الإجمالي</p>
                <p className="text-base font-extrabold text-[#176448]">
                  {selectedFee ? `${selectedFee.total.toFixed(2)} ر.س` : "--- ر.س"}
                </p>
              </div>
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-[#176448] px-5 py-2.5 text-sm font-extrabold text-white shadow-md transition active:scale-[0.98]"
              >
                <CalendarDays className="h-4 w-4" aria-hidden="true" />
                <span>احجز الموعد</span>
              </button>
            </div>
          </div>
        </form>
      </main>

      <footer className="border-t border-[#e6ede7] bg-white py-4 pb-20 lg:pb-5">
        <div className="mx-auto flex max-w-6xl items-center justify-center gap-2 px-4 text-center text-xs text-[#819287] sm:px-6">
          <CheckCircle2 className="h-4 w-4 text-[#176448]" aria-hidden="true" />
          <span>خدمة الفحص الفني الدوري للمركبات</span>
        </div>
      </footer>
    </div>
  );
}
