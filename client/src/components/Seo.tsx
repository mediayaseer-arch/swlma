import { useEffect } from "react";

type SeoProps = {
  title: string;
  description: string;
  path?: string;
  image?: string;
  siteName?: string;
  type?: "website" | "article";
  structuredData?: Record<string, unknown>;
};

const SITE_NAME = "الدرعية | Diriyah";
const DEFAULT_IMAGE = "/images/diriyah-hero.webp";

function upsertMeta(attribute: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

export function Seo({
  title,
  description,
  path = "/",
  image = DEFAULT_IMAGE,
  siteName = SITE_NAME,
  type = "website",
  structuredData,
}: SeoProps) {
  useEffect(() => {
    const origin = window.location.origin;
    const canonicalUrl = new URL(path, origin).toString();
    const imageUrl = new URL(image, origin).toString();

    document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta("name", "robots", "index,follow,max-image-preview:large");
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:type", type);
    upsertMeta("property", "og:url", canonicalUrl);
    upsertMeta("property", "og:image", imageUrl);
    upsertMeta("property", "og:site_name", siteName);
    upsertMeta("property", "og:locale", "ar_SA");
    upsertMeta("name", "twitter:card", "summary_large_image");
    upsertMeta("name", "twitter:title", title);
    upsertMeta("name", "twitter:description", description);
    upsertMeta("name", "twitter:image", imageUrl);

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = canonicalUrl;

    const existingSchema = document.head.querySelector<HTMLScriptElement>(
      'script[data-seo-structured-data="true"]',
    );
    existingSchema?.remove();
    if (structuredData) {
      const schema = document.createElement("script");
      schema.type = "application/ld+json";
      schema.dataset.seoStructuredData = "true";
      schema.textContent = JSON.stringify(structuredData);
      document.head.appendChild(schema);
    }

    return () => {
      document.head.querySelector('link[rel="canonical"]')?.remove();
      document.head.querySelector('script[data-seo-structured-data="true"]')?.remove();
    };
  }, [description, image, path, siteName, structuredData, title, type]);

  return null;
}

export const siteName = SITE_NAME;
export const defaultSeoImage = DEFAULT_IMAGE;
