export type InspectionFee = {
  total: number;
  base: number;
  vat: number;
};

export type VehicleFee = {
  vehicleType: string;
  initialInspection: InspectionFee;
  reInspection: InspectionFee;
};

const standardInitial = { total: 115, base: 100, vat: 15 };
const standardRecheck = { total: 37.95, base: 33, vat: 4.95 };
const mediumInitial = { total: 162.15, base: 141, vat: 21.15 };
const mediumRecheck = { total: 54.05, base: 47, vat: 7.05 };
const heavyInitial = { total: 235.75, base: 205, vat: 30.75 };
const heavyRecheck = { total: 78.2, base: 68, vat: 10.2 };

export const inspectionTypes = [
  { value: "initial", label: "خدمة الفحص الدوري" },
  { value: "re", label: "خدمة إعادة الفحص" },
] as const;

export const vehicleFees: VehicleFee[] = [
  { vehicleType: "سيارة خاصة", initialInspection: standardInitial, reInspection: standardRecheck },
  { vehicleType: "سيارات الأجرة", initialInspection: standardInitial, reInspection: standardRecheck },
  { vehicleType: "سيارات التأجير", initialInspection: standardInitial, reInspection: standardRecheck },
  { vehicleType: "مركبة نقل خفيفة خاصة", initialInspection: standardInitial, reInspection: standardRecheck },
  { vehicleType: "مركبة نقل خفيفة", initialInspection: standardInitial, reInspection: standardRecheck },
  { vehicleType: "الدراجات ثنائية العجلات", initialInspection: { total: 51.75, base: 45, vat: 6.75 }, reInspection: { total: 17.25, base: 15, vat: 2.25 } },
  { vehicleType: "دراجة ثلاثية او رباعية العجلات", initialInspection: { total: 57.5, base: 50, vat: 7.5 }, reInspection: { total: 19.55, base: 17, vat: 2.55 } },
  { vehicleType: "حافلة خفيفة", initialInspection: standardInitial, reInspection: standardRecheck },
  { vehicleType: "حافلة متوسطة", initialInspection: mediumInitial, reInspection: mediumRecheck },
  { vehicleType: "حافلة كبيرة", initialInspection: heavyInitial, reInspection: heavyRecheck },
  { vehicleType: "نقل متوسط", initialInspection: mediumInitial, reInspection: mediumRecheck },
  { vehicleType: "نقل ثقيل", initialInspection: heavyInitial, reInspection: heavyRecheck },
  { vehicleType: "مقطورة خفيفة خاصة", initialInspection: standardInitial, reInspection: standardRecheck },
  { vehicleType: "نصف مقطورة خفيفة خاصة", initialInspection: standardInitial, reInspection: standardRecheck },
  { vehicleType: "نصف مقطورة خفيفة", initialInspection: standardInitial, reInspection: standardRecheck },
  { vehicleType: "نصف مقطورة ثقيلة", initialInspection: { total: 211.6, base: 184, vat: 27.6 }, reInspection: { total: 70.15, base: 61, vat: 9.15 } },
  { vehicleType: "مقطورة خفيفة", initialInspection: standardInitial, reInspection: standardRecheck },
  { vehicleType: "مقطورة ثقيلة", initialInspection: { total: 211.6, base: 184, vat: 27.6 }, reInspection: { total: 70.15, base: 61, vat: 9.15 } },
  { vehicleType: "مركبات أشغال عامة", initialInspection: heavyInitial, reInspection: heavyRecheck },
];

export const inspectionRegions = [
  { name: "منطقة نجران", stations: ["نجران"] },
  { name: "منطقة الجوف", stations: ["الجوف", "القريات"] },
  { name: "المنطقة الشرقية", stations: ["الهفوف", "الخفجي", "الجبيل", "الدمام", "حفر الباطن"] },
  { name: "منطقة تبوك", stations: ["تبوك"] },
  { name: "منطقة القصيم", stations: ["الراس", "القصيم"] },
  { name: "منطقة حائل", stations: ["حائل"] },
  { name: "منطقة عسير", stations: ["بيشة", "ابها", "محايل عسير"] },
  { name: "منطقة مكة المكرمة", stations: ["جدة الشمال", "جدة عسفان", "مكة المكرمة", "الطائف", "جدة الجنوب", "الخرمة"] },
  { name: "منطقة المدينة المنورة", stations: ["المدينة المنورة", "ينبع"] },
  { name: "منطقة الباحة", stations: ["الباحة"] },
  { name: "منطقة الرياض", stations: ["الرياض حي المونسية", "وادى الدواسر", "الخرج", "جنوب شرق الرياض مخرج سبعة عشر", "الرياض حي الشفا طريق ديراب", "المجمعة", "القويعية", "الرياض حي القيروان"] },
  { name: "منطقة جازان", stations: ["جيزان"] },
  { name: "منطقة الحدود الشمالية", stations: ["عرعر"] },
] as const;

export const timeSlots = [
  "07:00 ص",
  "08:00 ص",
  "09:00 ص",
  "10:00 ص",
  "11:00 ص",
  "12:00 م",
  "01:00 م",
  "02:00 م",
  "03:00 م",
  "04:00 م",
  "05:00 م",
  "06:00 م",
  "07:00 م",
  "08:00 م",
  "09:00 م",
  "10:00 م",
] as const;

export function getInspectionStations(regionName?: string) {
  if (!regionName) return [];
  return inspectionRegions.find(region => region.name === regionName)?.stations ?? [];
}

export function getInspectionFee(
  vehicleType: string,
  inspectionType: string,
): InspectionFee | null {
  const vehicle = vehicleFees.find(item => item.vehicleType === vehicleType);
  if (!vehicle) return null;
  if (inspectionType === "initial") return vehicle.initialInspection;
  if (inspectionType === "re") return vehicle.reInspection;
  return null;
}

export function isValidSaudiId(value: string) {
  const id = value.replace(/\D/g, "");
  if (!/^[12]\d{9}$/.test(id)) return false;
  const checksum = id.split("").reduce((sum, digit, index) => {
    const number = Number(digit);
    if (index % 2 !== 0) return sum + number;
    const doubled = number * 2;
    return sum + (doubled > 9 ? doubled - 9 : doubled);
  }, 0);
  return checksum % 10 === 0;
}

export function isValidPhone(value: string) {
  return /^05\d{8}$/.test(value.replace(/\D/g, ""));
}
