import { useEffect, useState } from "react";
import { isValidSaudiPlate } from "@/lib/ksa-license-plate";

const officialLetters = [
  { arabic: "أ", latin: "A" },
  { arabic: "ب", latin: "B" },
  { arabic: "ح", latin: "J" },
  { arabic: "د", latin: "D" },
  { arabic: "ر", latin: "R" },
  { arabic: "س", latin: "S" },
  { arabic: "ص", latin: "X" },
  { arabic: "ط", latin: "T" },
  { arabic: "ع", latin: "E" },
  { arabic: "ق", latin: "G" },
  { arabic: "ك", latin: "K" },
  { arabic: "ل", latin: "L" },
  { arabic: "م", latin: "Z" },
  { arabic: "ن", latin: "N" },
  { arabic: "هـ", latin: "H" },
  { arabic: "و", latin: "U" },
  { arabic: "ى", latin: "V" },
];

const arabicIndicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
const selectClass =
  "min-w-0 flex-1 h-11 rounded-lg border border-[#cbd8ce] bg-white px-0.5 sm:px-2 py-1 text-center text-base sm:text-sm font-bold text-[#173e30] outline-none transition focus:border-[#176448] focus:ring-2 focus:ring-[#176448]/15 appearance-none";

function parsePlate(value: string) {
  const clean = value.toUpperCase().replace(/\s+/g, "");
  const parsedLetters = clean.replace(/[^A-Z]/g, "").slice(0, 4);
  const parsedDigits = clean.replace(/[^0-9]/g, "").slice(0, 4);
  return {
    letters: Array.from({ length: 4 }, (_, index) => parsedLetters[index] ?? ""),
    digits: Array.from({ length: 4 }, (_, index) => parsedDigits[index] ?? ""),
  };
}

export function KsaLicensePlateSelector({
  value,
  onChange,
  onBlur,
  labelId,
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  labelId: string;
}) {
  const [letters, setLetters] = useState<string[]>(["", "", "", ""]);
  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);

  useEffect(() => {
    if (!value || letters.join("") + digits.join("") === value) return;
    const parsed = parsePlate(value);
    setLetters(parsed.letters);
    setDigits(parsed.digits);
  }, [value]);

  const updatePlate = (nextLetters: string[], nextDigits: string[]) => {
    setLetters(nextLetters);
    setDigits(nextDigits);
    onChange(
      nextLetters.filter(Boolean).join("") + nextDigits.filter(Boolean).join(""),
    );
  };

  const selectedLetterData = letters.map(
    letter => officialLetters.find(item => item.latin === letter) ?? null,
  );

  return (
    <div className="mt-2 space-y-4" role="group" aria-labelledby={labelId}>
      <div
        className="relative mx-auto flex aspect-[520/150] w-full max-w-[560px] items-stretch overflow-hidden rounded-xl border-[2px] sm:border-[3px] border-[#26352d] bg-gradient-to-b from-slate-50 via-white to-slate-200 p-0.5 sm:p-1 shadow-[inset_0_2px_4px_rgba(255,255,255,.8),inset_0_-2px_4px_rgba(0,0,0,.18),0_8px_18px_rgba(20,40,28,.14)]"
        aria-label="معاينة لوحة المركبة"
        dir="ltr"
      >
        <div className="pointer-events-none absolute inset-0.5 sm:inset-1 z-10 rounded-lg bg-gradient-to-br from-white/35 via-transparent to-slate-400/10" />
        <div className="flex min-w-0 flex-1 items-stretch overflow-hidden rounded-lg border sm:border-2 border-[#17231c] bg-white">
          <div className="flex min-w-0 flex-1 flex-col justify-around px-1 py-0.5 sm:px-4 sm:py-1">
            <div
              className="flex justify-center gap-0.5 text-base font-black text-zinc-950 min-[380px]:text-lg sm:gap-3 sm:text-2xl"
              dir="rtl"
              aria-label="الأرقام العربية"
            >
              {digits.map((digit, index) => (
                <span key={`arabic-${index}`}>
                  {digit ? arabicIndicDigits[Number(digit)] : "·"}
                </span>
              ))}
            </div>
            <div className="flex justify-center gap-0.5 font-mono text-sm font-black text-zinc-950 min-[380px]:text-base sm:gap-3 sm:text-xl">
              {digits.map((digit, index) => (
                <span key={`latin-${index}`}>{digit || "·"}</span>
              ))}
            </div>
          </div>

          <div className="my-0.5 sm:my-1 w-[2px] sm:w-[3px] shrink-0 rounded-full bg-zinc-950" />

          <div className="flex min-w-0 flex-1 flex-col justify-around px-1 py-0.5 sm:px-4 sm:py-1">
            <div
              className="flex justify-center gap-0.5 text-base font-black text-zinc-950 min-[380px]:text-lg sm:gap-3 sm:text-2xl"
              dir="rtl"
              aria-label="الأحرف العربية"
            >
              {selectedLetterData.map((item, index) => (
                <span key={`arabic-letter-${index}`}>{item?.arabic ?? "·"}</span>
              ))}
            </div>
            <div className="flex justify-center gap-0.5 font-mono text-sm font-black text-zinc-950 min-[380px]:text-base sm:gap-3 sm:text-xl">
              {letters.map((letter, index) => (
                <span key={`latin-letter-${index}`}>{letter || "·"}</span>
              ))}
            </div>
          </div>

          <div className="my-0.5 sm:my-1 w-[2px] sm:w-[3px] shrink-0 rounded-full bg-zinc-950" />

          <div className="flex w-[42px] min-[380px]:w-[50px] shrink-0 flex-col items-center justify-center bg-white px-0.5 text-center text-zinc-950 sm:w-[76px] sm:px-1">
            <svg
              viewBox="0 0 100 100"
              className="h-4 w-4 min-[380px]:h-5 min-[380px]:w-5 sm:h-8 sm:w-8"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M50 8 C46 16 38 22 25 24 C34 26 42 27 48 34 C43 28 35 27 22 29 C32 33 40 37 45 44 C41 40 33 40 22 43 C33 47 43 49 47 54 C46 51 45 46 45 42 L55 42 C55 46 54 51 53 54 C57 49 67 47 78 43 C67 40 59 40 55 44 C60 37 68 33 78 29 C65 27 57 28 52 34 C58 27 66 26 75 24 C62 22 54 16 50 8 Z" />
              <path d="M47 42 L53 42 L52 58 C52 61 53 64 54 66 L46 66 C47 64 48 61 48 58 Z" />
              <path d="M18 78 C25 76 34 76 43 78 L53 81 C63 84 74 89 82 93 C78 90 70 82 60 76 C52 71 42 68 32 68 C27 68 22 69 18 71 Z" />
              <path d="M82 78 C75 76 66 76 57 78 L47 81 C37 84 26 89 18 93 C22 90 30 82 40 76 C48 71 58 68 68 68 C73 68 78 69 82 71 Z" />
            </svg>
            <span className="text-[7px] min-[380px]:text-[8px] font-black tracking-wider sm:text-[11px] sm:tracking-[.15em]">
              K S A
            </span>
            <span className="text-[7px] font-bold sm:text-[10px]">السعودية</span>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
        <div>
          <p className="mb-1.5 text-xs font-bold text-[#52695c]">الأحرف</p>
          <div className="flex gap-1.5 sm:gap-2">
            {Array.from({ length: 4 }, (_, index) => (
              <select
                key={`letter-${index}`}
                className={selectClass}
                value={letters[index] ?? ""}
                aria-label={`الحرف ${index + 1} من رقم اللوحة`}
                onBlur={onBlur}
                onChange={event => {
                  const next = [...letters];
                  next[index] = event.target.value;
                  updatePlate(next, digits);
                }}
              >
                <option value="">—</option>
                {officialLetters.map(item => (
                  <option key={item.latin} value={item.latin}>
                    {item.arabic} ({item.latin})
                  </option>
                ))}
              </select>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-1.5 text-xs font-bold text-[#52695c]">الأرقام</p>
          <div className="flex gap-1.5 sm:gap-2">
            {Array.from({ length: 4 }, (_, index) => (
              <select
                key={`digit-${index}`}
                className={selectClass}
                value={digits[index] ?? ""}
                aria-label={`الرقم ${index + 1} من رقم اللوحة`}
                onBlur={onBlur}
                onChange={event => {
                  const next = [...digits];
                  next[index] = event.target.value;
                  updatePlate(letters, next);
                }}
              >
                <option value="">—</option>
                {arabicIndicDigits.map((arabicDigit, digit) => (
                  <option key={digit} value={String(digit)}>
                    {digit} ({arabicDigit})
                  </option>
                ))}
              </select>
            ))}
          </div>
        </div>
      </div>
      <p className="text-xs leading-5 text-[#74867b]">
        اختر من حرف واحد إلى 4 أحرف، ومن رقم واحد إلى 4 أرقام كما تظهر في
        استمارة المركبة.
      </p>
    </div>
  );
}
