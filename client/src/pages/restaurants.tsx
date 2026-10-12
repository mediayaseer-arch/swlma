import { useState } from "react";
import { Link } from "wouter";
import { RESTAURANTS } from "@/lib/restaurant-data";
import type { Restaurant } from "@/lib/restaurant-data";
import { Seo, defaultSeoImage } from "@/components/Seo";

const BUJAIRI_LOGO =
  "https://s3.ticketmx.com/bujairi/images/bujairi-ar.svg";

function RestaurantNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav
      className="bg-[#F7F1EC] relative"
      data-testid="nav-restaurant"
    >
      {/* Top Navigation */}
      <div className="flex items-center justify-center py-6 px-4 relative">
        <Link
          href="/home"
          className="hidden lg:block absolute right-8 text-[#A85734] text-sm font-medium transition-colors duration-200 hover:text-[#C98A68]"
          data-testid="link-contact"
        >
          اتصل بنا
        </Link>

        <a href="#" className="block">
          <img
            src={BUJAIRI_LOGO}
            alt="Bujairi Logo"
            className="w-[124px] lg:w-[239px]"
            data-testid="img-bujairi-logo"
          />
        </a>

        <Link
          href="/home"
          className="hidden lg:block absolute left-8 text-[#A85734] text-sm font-medium transition-colors duration-200 hover:text-[#C98A68]"
          data-testid="link-english"
        >
          English
        </Link>

        {/* Mobile Menu Button */}
        <button
          type="button"
          className="absolute left-4 top-1/2 -translate-y-1/2 lg:hidden w-10 h-10 rounded-full flex items-center justify-center transition-colors hover:bg-[#A85734]/10"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? "إغلاق القائمة" : "فتح القائمة"}
          data-testid="button-menu-toggle"
        >
          <svg
            className="w-6 h-6"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#A85734"
            strokeWidth="2"
            strokeLinecap="round"
          >
            {menuOpen ? (
              <>
                <line x1="6" y1="6" x2="18" y2="18" />
                <line x1="6" y1="18" x2="18" y2="6" />
              </>
            ) : (
              <>
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </>
            )}
          </svg>
        </button>
      </div>

      <div className="h-px bg-[#C98A68]/60 w-full" />

      {/* Mobile Menu */}
      {menuOpen && (
        <div
          className="lg:hidden px-5 py-5 space-y-1 bg-[#F7F1EC] border-b border-[#C98A68]/40 shadow-sm"
          data-testid="nav-mobile-menu"
        >
          <Link
            href="/home"
            onClick={() => setMenuOpen(false)}
            className="block text-[#A85734] text-sm font-medium px-3 py-3 rounded-xl transition-colors hover:bg-[#A85734]/10"
            data-testid="link-home"
          >
            الرئيسية
          </Link>

          <a
            href="#"
            onClick={() => setMenuOpen(false)}
            className="block text-[#A85734] text-sm font-medium px-3 py-3 rounded-xl transition-colors hover:bg-[#A85734]/10"
            data-testid="link-booking"
          >
            خيارات الحجز
          </a>

          <Link
            href="/restaurants"
            onClick={() => setMenuOpen(false)}
            className="block text-white bg-[#A85734] text-sm font-medium px-3 py-3 rounded-xl shadow-sm"
            data-testid="link-restaurants-active"
          >
            المطاعم
          </Link>

          <a
            href="#"
            onClick={() => setMenuOpen(false)}
            className="block text-[#A85734] text-sm font-medium px-3 py-3 rounded-xl transition-colors hover:bg-[#A85734]/10"
            data-testid="link-new-account"
          >
            حساب جديد
          </a>

          <a
            href="#"
            onClick={() => setMenuOpen(false)}
            className="block text-[#A85734] text-sm font-medium px-3 py-3 rounded-xl transition-colors hover:bg-[#A85734]/10"
            data-testid="link-login"
          >
            تسجيل دخول
          </a>

          <a
            href="#"
            onClick={() => setMenuOpen(false)}
            className="block text-[#A85734] text-sm font-medium px-3 py-3 rounded-xl transition-colors hover:bg-[#A85734]/10"
            data-testid="link-contact-mobile"
          >
            اتصل بنا
          </a>

          <a
            href="#"
            onClick={() => setMenuOpen(false)}
            className="block text-[#A85734] text-sm font-medium px-3 py-3 rounded-xl transition-colors hover:bg-[#A85734]/10 font-sans"
            data-testid="link-english-mobile"
          >
            English
          </a>
        </div>
      )}

      {/* Desktop Navigation */}
      <div className="hidden lg:block">
        <div className="flex justify-center items-center gap-12 py-4">
          <Link
            href="/home"
            className="text-[#A85734] text-sm font-medium transition-colors duration-200 hover:text-[#C98A68]"
          >
            الرئيسية
          </Link>

          <a
            href="#"
            className="text-[#A85734] text-sm font-medium transition-colors duration-200 hover:text-[#C98A68]"
          >
            خيارات الحجز
          </a>

          <Link
            href="/restaurants"
            className="relative text-[#A85734] text-sm font-bold"
          >
            المطاعم

            <span className="absolute -bottom-4 right-0 left-0 mx-auto w-full h-[2px] bg-[#A85734] rounded-full" />
          </Link>

          <a
            href="#"
            className="text-[#A85734] text-sm font-medium transition-colors duration-200 hover:text-[#C98A68]"
          >
            حساب جديد
          </a>

          <a
            href="#"
            className="text-[#A85734] text-sm font-medium transition-colors duration-200 hover:text-[#C98A68]"
          >
            تسجيل دخول
          </a>
        </div>
      </div>

      <div className="h-px bg-[#C98A68]/60 w-full" />
    </nav>
  );
}

function HeroBanner() {
  return (
    <div
      className="relative overflow-hidden"
      dir="rtl"
      data-testid="section-hero-banner"
    >
      <img
        src="/987e8ebff86625a6eb1880e853d69bc6684e07a0.jpg"
        alt="الدرعية"
        className="w-full h-[210px] sm:h-[280px] md:h-[380px] lg:h-[440px] object-cover object-center"
        data-testid="img-hero-banner"
      />

      {/* Subtle overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/15 via-transparent to-transparent pointer-events-none" />
    </div>
  );
}

function RestaurantCard({
  restaurant,
}: {
  restaurant: Restaurant;
}) {
  return (
    <Link href={`/restaurant/${restaurant.id}`}>
      <div
        className="
          group
          restaurant-card
          bg-white
          rounded-2xl
          overflow-hidden
          border
          border-[#EAD8CE]
          shadow-[0_6px_22px_rgba(90,54,39,0.08)]
          cursor-pointer
          transition-all
          duration-300
          hover:-translate-y-1
          hover:shadow-[0_14px_35px_rgba(90,54,39,0.15)]
          hover:border-[#C98A68]/70
        "
        data-testid={`card-restaurant-${restaurant.id}`}
      >
        {/* Restaurant Background Image */}
        <div className="restaurant-card-bg relative overflow-hidden">
          <img
            src={restaurant.bgImage}
            alt={restaurant.nameEn}
            className="
              w-full
              h-[120px]
              sm:h-[145px]
              md:h-[165px]
              lg:h-[180px]
              object-cover
              object-center
              transition-transform
              duration-500
              group-hover:scale-[1.04]
            "
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Restaurant Details */}
        <div className="flex items-end p-3 sm:p-4 gap-3 min-h-[90px]">
          {/* Logo */}
          <div className="restaurant-card-logo -mt-10 sm:-mt-12 shrink-0 relative z-10">
            <div className="bg-white p-1 rounded-xl shadow-md">
              <img
                src={restaurant.logo}
                alt={restaurant.nameEn}
                className="
                  w-[66px]
                  h-[66px]
                  sm:w-[78px]
                  sm:h-[78px]
                  object-cover
                  rounded-lg
                "
              />
            </div>
          </div>

          {/* Name */}
          <div className="flex flex-col items-start pb-1 min-w-0 flex-1">
            <div
              className="
                text-[#A85734]
                text-sm
                sm:text-base
                font-bold
                leading-tight
                truncate
                w-full
                transition-colors
                group-hover:text-[#874027]
              "
              data-testid={`text-name-${restaurant.id}`}
            >
              {restaurant.name}
            </div>

            {restaurant.cuisine && (
              <div
                className="text-[#76645B] text-xs sm:text-sm mt-1 truncate w-full"
                data-testid={`text-cuisine-${restaurant.id}`}
              >
                {restaurant.cuisine}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function RestaurantsSection() {
  return (
    <section
      className="bg-[#F7F1EC] py-8 md:py-12"
      data-testid="section-restaurants"
    >
      <div className="px-4 sm:px-6 max-w-7xl mx-auto">
        {/* Heading */}
        <div className="flex items-center gap-3 mb-6 md:mb-8">
          <div className="w-1 h-7 bg-[#A85734] rounded-full" />

          <h2
            className="text-[#A85734] text-xl sm:text-2xl font-bold"
            data-testid="text-restaurants-heading"
          >
            مطاعم البجيري
          </h2>
        </div>

        {/* Restaurants Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5 lg:gap-6">
          {RESTAURANTS.map((restaurant) => (
            <RestaurantCard
              key={restaurant.id}
              restaurant={restaurant}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer
      className="bg-[#F2E7E0] border-t border-[#C98A68]/30"
      data-testid="section-footer"
    >
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
        <span
          className="text-[#76645B] text-xs sm:text-sm"
          data-testid="text-copyright"
        >
          Copyright 2024 DGCL. All Rights Reserved
        </span>

        <a
          href="tel:00966920021727"
          className="flex items-center gap-3 text-[#A85734] text-sm font-medium transition-colors hover:text-[#874027]"
          data-testid="link-phone"
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
  );
}

export default function Restaurants() {
  return (
    <>
      <Seo
        title="مطاعم ومقاهي الدرعية | Diriyah Restaurants & Cafés | دليل الحجز"
        description="تصفح المطاعم والمقاهي في الدرعية ومطل البجيري، وتعرّف على المواقع وساعات العمل وخيارات الحجز الرسمية. Explore Diriyah and Bujairi View restaurants, cafés, locations, opening hours, and official booking options."
        path="/restaurants"
        image={defaultSeoImage}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "مطاعم ومقاهي الدرعية",
          numberOfItems: RESTAURANTS.length,
          itemListElement: RESTAURANTS.map((restaurant, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: restaurant.name,
            url: `/restaurant/${restaurant.id}`,
          })),
        }}
      />
      <div className="min-h-screen bg-[#F7F1EC]" dir="rtl">
      <RestaurantNav />

      <HeroBanner />

      <RestaurantsSection />

      <Footer />
      </div>
    </>
  );
}