# Visual Audit

The route screenshots show a site-wide styling failure rather than isolated page issues. The visitor pages render with very small typography, weak hierarchy, default blue underlined links, excessive whitespace, and inconsistent image/card sizing. Registration, booking, and checkout are dominated by the oversized Season artwork instead of presenting the task content. The restaurants page has an uneven two-column layout with mismatched card heights, logos, and text alignment. The login and dashboard views use a dark teal/green palette that conflicts with the Diriyah ivory/bronze visual language, and labels/inputs have insufficient contrast and spacing. The 404 route also lacks branded layout treatment.

Recommended direction: preserve the existing Arabic-first RTL content and real photography, but establish shared ivory, bronze, charcoal, and muted sand tokens; use a consistent content container and page header; style buttons, links, form controls, and cards as a single hospitality system; constrain campaign artwork to a controlled masthead; and add responsive breakpoints for cards, forms, navigation, and dashboard panels.

## 2026-08-20 follow-up QA

The desktop and mobile preview captures confirm that the homepage, restaurant listing, and login now use the warm ivory, bronze, maroon, and gold heritage-luxury palette. The login form was given an explicit responsive max-width after utility sizing appeared unreliable in the preview. The dashboard shell was aligned to the same palette at the header and search surface. The bare `/reserve` path currently resolves to the existing 404 state, so route-specific screenshots must distinguish valid parameterized routes from the bare fallback path.

## Route-by-route mobile QA

The mobile captures covered `/`, `/registration`, `/booking`, `/checkout`, `/otp`, `/confirmation`, `/restaurant/1`, and `/404`. The homepage, confirmation, restaurant detail, and redesigned 404 have coherent branded surfaces. Registration and booking still show the campaign/logo artwork at natural dimensions, while checkout and OTP retain their payment-provider visual treatment. The dev log reports `Can't resolve 'tailwindcss' in '/home/ubuntu/diriyah-server-side/client/src'`; this likely prevents utility classes such as `h-10`, `max-w-*`, and responsive sizing from being generated, explaining the oversized image behavior. Fixing the Tailwind resolver is higher priority than adding page-specific overrides.

## Transactional Route QA — Final Pass

The final desktop and mobile captures covered `/checkout`, `/otp`, `/confirmation`, and `/reserve`. The payment modal remains centered with a controlled width and a clear primary action; the OTP screen keeps its compact verification card and readable Arabic hierarchy; the confirmation screen preserves the booking reference, date, time, and action buttons inside a responsive card; and the reserve route displays the shared missing/return state without overflow. The final responsive captures also covered the homepage, registration, booking, restaurants, restaurant detail, login, dashboard gate, and 404 state. Tailwind utility generation is active after aligning the Tailwind package and Vite plugin, so max-width, spacing, responsive, and image-sizing utilities now render consistently.

Validation after the visual pass: TypeScript check passed, the Vitest suite passed, and the production build completed successfully. Generated `dist` output was removed after validation so the checkpoint contains source and configuration only.

## Explicit Mobile Transaction QA

The mobile capture pass explicitly covered `/checkout`, `/otp`, `/confirmation`, and `/reserve`. Checkout displays the payment offer modal within the viewport without horizontal overflow; OTP maintains readable copy, a contained code field, and a full-width action; confirmation keeps the success card, reference, date, time, and actions inside the mobile frame; and the bare reserve path safely presents the branded 404 fallback without overflow. These captures complete the missing mobile evidence for the transactional route set.
