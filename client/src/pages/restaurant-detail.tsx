import { Link, useParams } from "wouter";
import {
  ArrowRight,
  Clock,
  MapPin,
  DollarSign,
  UtensilsCrossed,
  CalendarDays,
} from "lucide-react";
import { getRestaurantById } from "@/lib/restaurant-data";
import { Seo, defaultSeoImage } from "@/components/Seo";

export default function RestaurantDetail() {
  const params = useParams<{ id: string }>();
  const restaurant = getRestaurantById(Number(params.id));

  if (!restaurant) {
    return (
      <div
        className="min-h-screen bg-[#F7F1EC] flex items-center justify-center px-4"
        dir="rtl"
      >
        <div className="text-center bg-white border border-[#EAD8CE] rounded-3xl p-8 shadow-[0_15px_40px_rgba(90,54,39,0.10)] max-w-sm w-full">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[#A85734]/10 flex items-center justify-center">
            <UtensilsCrossed className="w-6 h-6 text-[#A85734]" />
          </div>

          <h2 className="text-[#A85734] text-2xl font-bold mb-3">
            المطعم غير موجود
          </h2>

          <p className="text-[#76645B] text-sm mb-5">
            لم نتمكن من العثور على المطعم المطلوب.
          </p>

          <Link
            href="/restaurants"
            className="inline-flex items-center justify-center gap-2 bg-[#A85734] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#874027] transition-colors"
            data-testid="link-back-restaurants"
          >
            <ArrowRight className="w-4 h-4" />
            العودة للمطاعم
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Seo
        title={`${restaurant.name} | ${restaurant.nameEn} | Diriyah Restaurant`}
        description={`${restaurant.description} تعرّف على الموقع وساعات العمل وخيارات الحجز الرسمية. Discover ${restaurant.nameEn} in Diriyah, including location, opening hours, and official booking options.`}
        path={`/restaurant/${restaurant.id}`}
        image={restaurant.bgImage || restaurant.logo || defaultSeoImage}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Restaurant",
          name: restaurant.name,
          alternateName: restaurant.nameEn,
          description: restaurant.description,
          image: [restaurant.bgImage, restaurant.logo].filter(Boolean),
          servesCuisine: restaurant.cuisine,
          priceRange: restaurant.priceRange,
          address: {
            "@type": "PostalAddress",
            addressLocality: restaurant.location,
            addressCountry: "SA",
          },
          openingHours: restaurant.hours,
          url: restaurant.bookingUrl || restaurant.officialUrl,
        }}
      />
      <div className="min-h-screen bg-[#F7F1EC]" dir="rtl">
      {/* =========================
          HERO
      ========================== */}
      <div className="relative h-[300px] sm:h-[360px] md:h-[440px] lg:h-[500px] overflow-hidden">
        <img
          src={restaurant.bgImage}
          alt={restaurant.nameEn}
          className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.02]"
          data-testid="img-restaurant-hero"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

        {/* Warm color overlay */}
        <div className="absolute inset-0 bg-[#A85734]/10 pointer-events-none" />

        {/* Back Button */}
        <div className="absolute top-4 sm:top-6 right-4 sm:right-6 z-10">
          <Link
            href="/restaurants"
            className="
              flex
              items-center
              gap-2
              bg-white/15
              backdrop-blur-xl
              border
              border-white/20
              !text-white
              hover:!text-white
              px-4
              py-2.5
              rounded-full
              text-sm
              font-medium
              shadow-lg
              transition-all
              duration-300
              hover:bg-white
              hover:text-[#A85734]
            "
            data-testid="link-back"
          >
            <ArrowRight className="w-4 h-4" />
            العودة
          </Link>
        </div>

        {/* Restaurant Identity */}
        <div className="absolute bottom-6 sm:bottom-8 right-4 left-4 sm:right-8 sm:left-8">
          <div className="max-w-4xl mx-auto flex items-end gap-4 sm:gap-5">
            <div className="shrink-0 bg-white p-1.5 rounded-2xl shadow-2xl">
              <img
                src={restaurant.logo}
                alt={restaurant.nameEn}
                className="
                  w-[82px]
                  h-[82px]
                  sm:w-[100px]
                  sm:h-[100px]
                  object-cover
                  rounded-xl
                "
                data-testid="img-restaurant-logo"
              />
            </div>

            <div className="flex-1 min-w-0 pb-1">
              {restaurant.cuisine && (
                <span className="inline-flex mb-2 bg-[#A85734] text-white text-[10px] sm:text-xs px-3 py-1 rounded-full shadow-md">
                  {restaurant.cuisine}
                </span>
              )}

              <h1
                className="text-white text-2xl sm:text-3xl md:text-4xl font-bold drop-shadow-lg leading-tight"
                data-testid="text-restaurant-name"
              >
                {restaurant.name}
              </h1>

              <p
                className="text-white/75 text-xs sm:text-sm mt-1.5 font-sans"
                data-testid="text-restaurant-name-en"
              >
                {restaurant.nameEn}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* =========================
          CONTENT
      ========================== */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-7 sm:py-10">
        <div className="space-y-5">
          {/* About */}
          <section
            className="
              bg-white
              rounded-2xl
              sm:rounded-3xl
              border
              border-[#EAD8CE]
              p-5
              sm:p-7
              shadow-[0_8px_30px_rgba(90,54,39,0.07)]
            "
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-1 h-7 bg-[#A85734] rounded-full" />

              <h2
                className="text-[#A85734] font-bold text-lg sm:text-xl"
                data-testid="text-about-heading"
              >
                عن المطعم
              </h2>
            </div>

            <p
              className="text-[#76645B] text-sm sm:text-[15px] leading-7"
              data-testid="text-restaurant-description"
            >
              {restaurant.description}
            </p>
          </section>

          {/* Information */}
          <section
            className="
              bg-white
              rounded-2xl
              sm:rounded-3xl
              border
              border-[#EAD8CE]
              p-5
              sm:p-7
              shadow-[0_8px_30px_rgba(90,54,39,0.07)]
            "
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-1 h-7 bg-[#A85734] rounded-full" />

              <h2
                className="text-[#A85734] font-bold text-lg sm:text-xl"
                data-testid="text-info-heading"
              >
                معلومات المطعم
              </h2>
            </div>

            <div className="space-y-1">
              {/* Hours */}
              <div className="flex items-center gap-4 py-3">
                <div className="w-11 h-11 bg-[#FFF1E9] rounded-xl flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-[#A85734]" />
                </div>

                <div className="min-w-0">
                  <p className="text-[#A85734] text-sm font-bold mb-1">
                    ساعات العمل
                  </p>

                  <p
                    className="text-[#76645B] text-xs sm:text-sm"
                    data-testid="text-hours"
                  >
                    {restaurant.hours}
                  </p>
                </div>
              </div>

              <div className="h-px bg-[#F2E7E0]" />

              {/* Price */}
              <div className="flex items-center gap-4 py-3">
                <div className="w-11 h-11 bg-[#FFF1E9] rounded-xl flex items-center justify-center shrink-0">
                  <DollarSign className="w-5 h-5 text-[#A85734]" />
                </div>

                <div className="min-w-0">
                  <p className="text-[#A85734] text-sm font-bold mb-1">
                    متوسط الأسعار
                  </p>

                  <p
                    className="text-[#76645B] text-xs sm:text-sm"
                    data-testid="text-price-range"
                  >
                    {restaurant.priceRange}
                  </p>
                </div>
              </div>

              <div className="h-px bg-[#F2E7E0]" />

              {/* Location */}
              <div className="flex items-center gap-4 py-3">
                <div className="w-11 h-11 bg-[#FFF1E9] rounded-xl flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-[#A85734]" />
                </div>

                <div className="min-w-0">
                  <p className="text-[#A85734] text-sm font-bold mb-1">
                    الموقع
                  </p>

                  <p
                    className="text-[#76645B] text-xs sm:text-sm"
                    data-testid="text-location"
                  >
                    {restaurant.location}
                  </p>
                </div>
              </div>

              {restaurant.cuisine && (
                <>
                  <div className="h-px bg-[#F2E7E0]" />

                  {/* Cuisine */}
                  <div className="flex items-center gap-4 py-3">
                    <div className="w-11 h-11 bg-[#FFF1E9] rounded-xl flex items-center justify-center shrink-0">
                      <UtensilsCrossed className="w-5 h-5 text-[#A85734]" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-[#A85734] text-sm font-bold mb-1">
                        نوع المطبخ
                      </p>

                      <p
                        className="text-[#76645B] text-xs sm:text-sm"
                        data-testid="text-cuisine-type"
                      >
                        {restaurant.cuisine}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* =========================
              ACTIONS
          ========================== */}
          <div className="pt-2 space-y-3">
            <Link
              href={`/reserve/${restaurant.id}`}
              className="
                flex
                items-center
                justify-center
                gap-2
                w-full
                bg-gradient-to-l
                from-[#A85734]
                to-[#91472D]
                !text-white
                hover:!text-white
                text-center
                py-4
                rounded-2xl
                font-bold
                text-base
                shadow-[0_10px_25px_rgba(168,87,52,0.25)]
                transition-all
                duration-300
                hover:from-[#B86642]
                hover:to-[#874027]
                hover:-translate-y-0.5
                hover:shadow-[0_14px_32px_rgba(168,87,52,0.32)]
                active:translate-y-0
              "
              data-testid="button-reserve"
            >
              <CalendarDays className="w-5 h-5" />
              احجز طاولة
            </Link>

            <Link
              href="/restaurants"
              className="
                flex
                items-center
                justify-center
                gap-2
                w-full
                border
                border-[#A85734]/50
                text-[#A85734]
                text-center
                py-3.5
                rounded-2xl
                font-medium
                text-sm
                bg-transparent
                transition-all
                duration-300
                hover:bg-[#A85734]/5
                hover:border-[#A85734]
              "
              data-testid="button-back-restaurants"
            >
              <ArrowRight className="w-4 h-4" />
              العودة لقائمة المطاعم
            </Link>
          </div>
        </div>
      </main>

      {/* =========================
          FOOTER
      ========================== */}
      <footer className="bg-[#F2E7E0] border-t border-[#C98A68]/30 mt-5">
        <div
          className="
            flex
            flex-col
            md:flex-row
            md:justify-between
            md:items-center
            items-start
            px-6
            py-7
            max-w-7xl
            mx-auto
            gap-4
          "
        >
          <span className="text-[#76645B] text-xs sm:text-sm">
            Copyright 2024 DGCL. All Rights Reserved
          </span>

          <a
            href="tel:00966920021727"
            className="flex items-center gap-3 text-[#A85734] text-sm font-medium hover:text-[#874027] transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-[#A85734]/10 flex items-center justify-center">
              <img
                src="/images/restaurants/phone.svg"
                alt="phone"
                className="w-4 h-4"
              />
            </div>

            <span style={{ direction: "ltr" } as any}>
              +966 92 0021 727
            </span>
          </a>
        </div>
      </footer>
      </div>
    </>
  );
}