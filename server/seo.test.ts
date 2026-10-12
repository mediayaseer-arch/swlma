import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(path, "utf8");

describe("SEO configuration", () => {
  it("defines Arabic homepage metadata and social sharing tags", () => {
    const html = read("client/index.html");
    expect(html).toContain('name="description"');
    expect(html).toContain('property="og:title"');
    expect(html).toContain('name="twitter:card"');
    expect(html).toContain("الفحص الفني الدوري للمركبات");
  });

  it("provides route-aware SEO for public discovery pages", () => {
    const seo = read("client/src/components/Seo.tsx");
    const home = read("client/src/pages/home-inspection.tsx");
    const restaurants = read("client/src/pages/restaurants.tsx");
    const detail = read("client/src/pages/restaurant-detail.tsx");
    expect(seo).toContain('link[rel="canonical"]');
    expect(seo).toContain('application/ld+json');
    expect(home).toContain("<Seo");
    expect(restaurants).toContain('path="/restaurants"');
    expect(detail).toContain('"@type": "Restaurant"');
  });

  it("excludes transactional paths and publishes the public sitemap", () => {
    const routes = read("server/routes.ts");
    expect(routes).toContain('app.get("/robots.txt"');
    expect(routes).toContain('app.get("/sitemap.xml"');
    expect(routes).toContain('const publicPaths = ["/home", "/restaurants"');
    expect(routes).not.toContain('const publicPaths = ["/", "/restaurants"');
    expect(routes).toContain('Disallow: /checkout');
    expect(routes).toContain('Array.from({ length: 30 }');
  });
});
