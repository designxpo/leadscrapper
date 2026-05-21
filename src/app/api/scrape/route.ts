import { NextRequest, NextResponse } from "next/server";
import { ApifyClient } from "apify-client";

// ─── Unified lead shape ────────────────────────────────────────────────────────
export type RawLead = {
  name: string;
  website: string | null;
  phone: string | null;
  email: string | null;
  rating: number | null;
  address: string | null;
  source_url: string | null;
  extra_data: Record<string, unknown> | null;
  budget?: string | null;
  postedAt?: string | null;
  platform?: string | null;
  description?: string | null;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function str(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s || null;
}

function num(v: unknown): number | null {
  return typeof v === "number" && isFinite(v) ? v : null;
}

// ─── buildActorInput ──────────────────────────────────────────────────────────
// The sidebar's handleGenerateClick already transforms dynamicPayload into an
// apifyKey-keyed object before it reaches here, so this is a clean pass-through.
// No per-actor switch, no key remapping — the payload is already production-ready.

function buildActorInput(
  _actorId: string,
  payload: Record<string, unknown>
): Record<string, unknown> {
  return { ...payload };
}

// ─── normalizeData ─────────────────────────────────────────────────────────────
// Maps each actor's raw JSON output to the uniform RawLead shape.
// One case per registered actor — keeps the rest of the app actor-agnostic.

function normalizeData(
  rawItems: Record<string, unknown>[],
  actorId: string
): RawLead[] {
  switch (actorId) {

    // ── Google Maps Extractor ─────────────────────────────────────────────────
    // Captures everything the actor returns that's useful for B2B outreach:
    // categories, social profiles, hours, claimed status, location accuracy.
    case "compass/google-maps-extractor":
      return rawItems.map((i) => {
        // Social URLs sometimes nested under additionalInfo / contacts
        const additional = (i.additionalInfo as Record<string, unknown>) ?? {};
        const social = (i.contacts as Record<string, unknown>)
          ?? (additional.contact as Record<string, unknown>)
          ?? {};

        // Emails: actor returns array under `emails`
        const emails = Array.isArray(i.emails) ? (i.emails as string[]) : [];
        // Phones: array under `phones`
        const phones = Array.isArray(i.phones) ? (i.phones as string[]) : [];

        return {
          name:       str(i.title   ?? i.name)           ?? "Unknown",
          website:    str(i.website),
          phone:      str(phones[0] ?? i.phoneUnformatted ?? i.phone),
          email:      str(emails[0] ?? i.email),
          rating:     num(i.totalScore ?? i.rating),
          address:    str(i.address  ?? i.street),
          source_url: str(i.url     ?? i.googleUrl),
          extra_data: {
            place_id:        i.placeId ?? null,
            categoryName:    i.categoryName ?? null,
            categories:      Array.isArray(i.categories) ? i.categories : null,
            reviewsCount:    i.reviewsCount ?? null,
            phones_all:      phones.length > 1 ? phones : null,
            emails_all:      emails.length > 1 ? emails : null,
            opening_hours:   i.openingHours ?? null,
            permanently_closed: i.permanentlyClosed ?? null,
            temporarily_closed: i.temporarilyClosed ?? null,
            claimed:         i.isAdvertisement === false ? true : null,
            social: {
              facebook:  str(social.facebook  ?? additional.facebook),
              instagram: str(social.instagram ?? additional.instagram),
              linkedin:  str(social.linkedin  ?? additional.linkedin),
              twitter:   str(social.twitter   ?? additional.twitter),
              youtube:   str(social.youtube   ?? additional.youtube),
            },
            location: {
              lat:        (i.location as Record<string, unknown>)?.lat ?? null,
              lng:        (i.location as Record<string, unknown>)?.lng ?? null,
              city:       i.city ?? null,
              state:      i.state ?? null,
              country:    i.countryCode ?? i.country ?? null,
              postalCode: i.postalCode ?? null,
              neighborhood: i.neighborhood ?? null,
            },
            description:     str(i.description),
          },
          description: str(i.description ?? i.categoryName),
        };
      });

    // ── OLX India property buyers ─────────────────────────────────────────────
    // "Property wanted" ads: buyers post their requirements and budget.
    // Phone numbers are often present and usable for direct outreach.
    case "epctex/olx-scraper":
      return rawItems.map((i) => {
        const phones = Array.isArray(i.phoneNumbers)
          ? (i.phoneNumbers as string[])
          : i.phone ? [String(i.phone)] : [];
        const seller = (i.seller as Record<string, unknown>) ?? {};
        return {
          name:        str(i.title)                              ?? "Unknown buyer",
          website:     str(i.url),
          phone:       str(phones[0] ?? null),
          email:       null,
          rating:      null,
          address:     str(i.location ?? i.neighbourhood ?? i.city),
          source_url:  str(i.url),
          extra_data: {
            phones_all:  phones.length > 1 ? phones : null,
            sellerName:  str(seller.name ?? i.sellerName),
            postedAt:    i.lastUpdatedAt ?? i.postedAt ?? null,
            category:    i.category ?? null,
          },
          platform:    "OLX India",
          description: str(i.description ?? i.title),
          budget:      str(i.price),
          postedAt:    str(i.lastUpdatedAt ?? i.postedAt),
        };
      });

    // ── Craigslist "Real Estate Wanted" ──────────────────────────────────────
    // Buyer-intent posts: people describing the property they want to buy/rent
    // and their budget. Contact is via Craigslist's anonymous relay system.
    case "apify/craigslist-scraper":
      return rawItems.map((i) => ({
        name:        str(i.title)                              ?? "Unknown buyer",
        website:     str(i.url),
        phone:       null,                                     // Craigslist hides direct contact
        email:       null,
        rating:      null,
        address:     str(i.location ?? i.neighborhood),
        source_url:  str(i.url),
        extra_data:  {
          budget:   i.price ?? null,
          postedAt: i.time ?? i.postedAt ?? null,
        },
        platform:    "Craigslist",
        description: str(i.postingBody ?? i.description ?? i.title),
        budget:      str(i.price),
        postedAt:    str(i.time ?? i.postedAt),
      }));

    // ── LinkedIn Company Scraper ──────────────────────────────────────────────
    // name = companyName, website = companyUrl, extra_data = employeeCount
    case "epctex/linkedin-company-scraper":
      return rawItems.map((i) => ({
        name:        str(i.companyName ?? i.name) ?? "Unknown",
        website:     str(i.companyUrl  ?? i.website ?? i.websiteUrl),
        phone:       str(i.phone),
        email:       str(i.email),
        rating:      null,
        address:     str(i.location   ?? i.headquarters),
        source_url:  str(i.linkedinUrl ?? i.url),
        extra_data:  {
          employeeCount: i.employeeCount ?? i.staffCount ?? null,
          industry:      i.industry ?? null,
        },
        platform:    "LinkedIn",
        description: str(i.description ?? i.tagline ?? i.about),
      }));

    // ── Indeed Scraper ────────────────────────────────────────────────────────
    // name = company, extra_data = jobTitle & salary, source_url = url
    case "hynek/indeed-scraper":
      return rawItems.map((i) => ({
        name:        str(i.company     ?? i.companyName) ?? "Unknown",
        website:     str(i.companyUrl),
        phone:       null,
        email:       null,
        rating:      num(i.companyRating ?? i.rating),
        address:     str(i.location),
        source_url:  str(i.url),
        extra_data:  {
          jobTitle: str(i.title     ?? i.positionName),
          salary:   str(i.salary    ?? i.salaryText),
        },
        platform:    "Indeed",
        description: str(i.title    ?? i.positionName),
        budget:      str(i.salary   ?? i.salaryText),
        postedAt:    str(i.postedAt ?? i.date),
      }));

    // ── Zillow API Scraper ────────────────────────────────────────────────────
    // name = address.streetAddress, extra_data = price, source_url = url
    case "apify/zillow-api-scraper":
      return rawItems.map((i) => {
        // Zillow sometimes nests the address as an object
        const addr = typeof i.address === "object" && i.address !== null
          ? (i.address as Record<string, unknown>)
          : null;
        const streetAddress = addr
          ? str(addr.streetAddress)
          : str(i.streetAddress ?? i.address);

        return {
          name:        streetAddress ?? str(i.id) ?? "Unknown",
          website:     str(i.hdpUrl    ?? i.url),
          phone:       str(i.agentPhone ?? i.phone),
          email:       str(i.agentEmail ?? i.email),
          rating:      null,
          address:     streetAddress,
          source_url:  str(i.url       ?? i.hdpUrl),
          extra_data:  {
            price:        i.price ?? i.unformattedPrice ?? null,
            homeType:     i.homeType ?? i.propertyType ?? null,
            bedrooms:     i.bedrooms ?? null,
            bathrooms:    i.bathrooms ?? null,
          },
          platform:    "Zillow",
          description: str(i.homeType  ?? i.propertyType),
          budget:      str(i.price     ?? i.unformattedPrice),
          postedAt:    str(i.timeOnZillow ?? i.datePosted),
        };
      });

    // ── Instagram Profile Scraper ─────────────────────────────────────────────
    // name = fullName, website = externalUrl, extra_data = followersCount
    case "apify/instagram-profile-scraper":
      return rawItems.map((i) => ({
        name:        str(i.fullName    ?? i.username) ?? "Unknown",
        website:     str(i.externalUrl ?? i.websiteUrl),
        phone:       str(i.publicPhoneNumber ?? i.phone),
        email:       str(i.publicEmail ?? i.email),
        rating:      null,
        address:     str(i.city        ?? i.location),
        source_url:  str(i.url        ?? i.profileUrl),
        extra_data:  {
          followersCount: i.followersCount ?? null,
          postsCount:     i.postsCount ?? null,
          isVerified:     i.verified ?? i.isVerified ?? null,
        },
        platform:    "Instagram",
        description: str(i.biography   ?? i.bio),
      }));

    // ── Google Search Scraper ─────────────────────────────────────────────────
    // name = title, website = url, extra_data = description
    case "apify/google-search-scraper":
      return rawItems.map((i) => ({
        name:        str(i.title       ?? i.organicTitle) ?? "Unknown",
        website:     str(i.url         ?? i.displayLink),
        phone:       null,
        email:       null,
        rating:      null,
        address:     str(i.displayLink),
        source_url:  str(i.url),
        extra_data:  {
          description: str(i.description ?? i.snippet),
          position:    i.position ?? null,
        },
        platform:    "Google Search",
        description: str(i.description ?? i.snippet),
      }));

    // ── MagicBricks Buyer Requirements ───────────────────────────────────────
    case "epctex/magicbricks-scraper":
      return rawItems.map((i) => ({
        name:        str(i.buyerName ?? i.name ?? i.contactName) ?? "Property Buyer",
        website:     str(i.url       ?? i.listingUrl),
        phone:       str(i.phone     ?? i.contactNumber ?? i.mobile),
        email:       str(i.email     ?? i.contactEmail),
        rating:      null,
        address:     str(i.locality  ?? i.location ?? i.city),
        source_url:  str(i.url       ?? i.listingUrl),
        extra_data:  {
          budget:    i.budget  ?? i.price    ?? null,
          bhk:       i.bhk     ?? i.bedrooms ?? null,
          area:      i.area    ?? i.sqft     ?? null,
          intent:    i.type    ?? i.purpose  ?? "Buy",
          postedAt:  i.postedOn ?? i.date    ?? null,
        },
        platform:    "MagicBricks",
        description: str(i.description ?? i.requirement ?? i.title),
        budget:      str(i.budget ?? i.price),
        postedAt:    str(i.postedOn ?? i.date),
      }));

    // ── 99acres Buyer Requirements ────────────────────────────────────────────
    case "epctex/99acres-scraper":
      return rawItems.map((i) => ({
        name:        str(i.contactName ?? i.name ?? i.buyerName) ?? "Property Buyer",
        website:     str(i.url         ?? i.propertyUrl),
        phone:       str(i.phone       ?? i.mobile ?? i.contactNumber),
        email:       str(i.email       ?? i.contactEmail),
        rating:      null,
        address:     str(i.locality    ?? i.location ?? i.city),
        source_url:  str(i.url         ?? i.propertyUrl),
        extra_data:  {
          budget:    i.budget   ?? i.price    ?? null,
          bhk:       i.bhk      ?? i.bedrooms ?? null,
          area:      i.area     ?? i.sqft     ?? null,
          intent:    i.type     ?? i.purpose  ?? "Buy",
          postedAt:  i.postedOn ?? i.date     ?? null,
        },
        platform:    "99acres",
        description: str(i.description ?? i.requirement ?? i.title),
        budget:      str(i.budget ?? i.price),
        postedAt:    str(i.postedOn ?? i.date),
      }));

    // ── Generic fallback ──────────────────────────────────────────────────────
    default:
      return rawItems.map((i) => ({
        name:        str(i.name    ?? i.title   ?? i.company) ?? "Unknown",
        website:     str(i.website ?? i.url),
        phone:       str(i.phone   ?? i.tel),
        email:       str(i.email),
        rating:      num(i.rating),
        address:     str(i.address ?? i.location),
        source_url:  str(i.url    ?? i.source_url),
        extra_data:  null,
        platform:    str(actorId),
        description: str(i.description),
      }));
  }
}

// ─── Direct handler: OLX India ───────────────────────────────────────────────
// No Apify needed.
// Strategy:
//   1. Fetch the search page with full browser headers to pass Akamai WAF.
//   2. OLX redirects /mumbai/ → /mumbai_g4058997/; extract geo ID from final URL.
//   3. Hit the JSON API directly: /api/relevance/v4/search?location=<id>&...
//   4. Fallback: extract window.__APP blob from the HTML and parse listings from it.

const OLX_BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
    "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-IN,en-GB;q=0.9,en;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Sec-Ch-Ua": '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"Windows"',
  "Upgrade-Insecure-Requests": "1",
};

function normalizeOlxAd(ad: Record<string, unknown>): RawLead {
  // API response: price.value.display / price.value.raw
  // Legacy HTML path: price.display
  const priceTop   = (ad.price as Record<string, unknown>) ?? {};
  const priceValue = (priceTop.value as Record<string, unknown>) ?? priceTop;

  // API: locations_resolved[0].{city,district,sublocality}
  // Legacy: location.city_name / state_name
  const locsResolved = Array.isArray(ad.locations_resolved)
    ? (ad.locations_resolved as Record<string, unknown>[])
    : [];
  const locFirst = locsResolved[0] ?? (ad.location as Record<string, unknown>) ?? {};
  const address  = str(
    locFirst.city ?? locFirst.district ?? locFirst.city_name ?? locFirst.state_name ?? locFirst.name
  );

  // API: no phone in listing data (behind auth). Legacy HTML may have user.phone.
  const user = (ad.user as Record<string, unknown>) ?? {};

  // Build URL: OLX format is /item/<slug>_<id>.html — API may expose slug directly
  const adId  = str(ad.ad_id ?? ad.id);
  const adSlug = str(ad.slug);
  const adUrl  = str(ad.url) ??
    (adSlug && adId ? `https://www.olx.in/item/${adSlug}_${adId}.html` : null) ??
    (adId            ? `https://www.olx.in/item/${adId}.html`            : null);

  const images = Array.isArray(ad.images) ? ad.images as Record<string, unknown>[] : [];

  return {
    name:        str(ad.title)                                            ?? "Unknown buyer",
    website:     adUrl,   // OLX listing URL = the contact channel
    phone:       str(user.phone ?? ad.phone),
    email:       null,
    rating:      null,
    address,
    source_url:  adUrl,
    extra_data: {
      sellerName: str(ad.user_name ?? user.name),
      postedAt:   ad.created_at ?? ad.list_date ?? ad.activation_date ?? null,
      imageUrl:   str((images[0] as Record<string, unknown>)?.url ?? (images[0] as Record<string, unknown>)?.src),
      category:   str(ad.category_id ?? ad.category as string),
    },
    platform:    "OLX India",
    description: str(ad.description ?? ad.title),
    budget:      str(priceValue.display ?? priceValue.raw),
    postedAt:    str(ad.created_at ?? ad.list_date ?? ad.activation_date),
  };
}

// Safely extract the first complete JSON object starting at `pos` in `html`.
// OLX embeds window.__APP={...} — we can't use a regex because the value is
// deeply nested and contains arbitrary strings.
function extractJsonBlob(html: string, startMarker: string): Record<string, unknown> | null {
  const start = html.indexOf(startMarker);
  if (start === -1) return null;
  const braceStart = html.indexOf("{", start + startMarker.length);
  if (braceStart === -1) return null;

  let depth = 0;
  let inStr = false;
  let escape = false;

  for (let i = braceStart; i < html.length; i++) {
    const ch = html[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\" && inStr) { escape = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(braceStart, i + 1)) as Record<string, unknown>;
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

async function scrapeOlxIndia(
  payload: Record<string, unknown>,
  maxItems: number
): Promise<RawLead[]> {
  const startUrls = payload.startUrls as { url: string }[] | undefined;
  const searchUrl = startUrls?.[0]?.url;
  if (!searchUrl) throw new Error("OLX India: no search URL in payload");

  // ── Step 1: Fetch page, follow redirect to get geo ID ─────────────────────
  const pageRes = await fetch(searchUrl, {
    headers: OLX_BROWSER_HEADERS,
    redirect: "follow",
  });

  const finalUrl = pageRes.url; // after redirect, e.g. /mumbai_g4058997/q-property-wanted
  const geoMatch = finalUrl.match(/_g(\d+)/);
  const html = pageRes.ok ? await pageRes.text() : "";

  // ── Step 2: Try the JSON search API (primary) ─────────────────────────────
  if (geoMatch) {
    const geoId = geoMatch[1];

    // Build query from the URL path: q-property-wanted-andheri → property wanted andheri
    const querySegment = (finalUrl.match(/\/q-([^/?#]+)/) ?? [])[1] ?? "property-wanted";
    const query = querySegment.replace(/-/g, " ");

    const apiUrl =
      `https://www.olx.in/api/relevance/v4/search` +
      `?location=${geoId}&query=${encodeURIComponent(query)}` +
      `&size=${Math.min(maxItems, 100)}&platform=web-desktop` +
      `&relaxedfilters=true&spellcheck=true&user=anonymous&pttenabled=true`;

    try {
      const apiRes = await fetch(apiUrl, {
        headers: {
          ...OLX_BROWSER_HEADERS,
          Accept: "application/json, text/plain, */*",
          "Accept-Encoding": "gzip, deflate, br",
          "Sec-Fetch-Dest": "empty",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Site": "same-origin",
          Referer: finalUrl,
        },
      });

      if (apiRes.ok) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = await apiRes.json() as Record<string, any>;
        // API returns { "data": [...ads], "metadata": {...} }
        const ads: Record<string, unknown>[] =
          (Array.isArray(data?.data) ? data.data : null) ??
          data?.data?.ads ??
          data?.ads ??
          [];

        if (ads.length > 0) {
          return ads.slice(0, maxItems).map(normalizeOlxAd);
        }
      }
    } catch {
      // fall through to HTML fallback
    }
  }

  // ── Step 3: Fallback — parse window.__APP from HTML ───────────────────────
  if (!html) throw new Error("OLX India: page fetch failed and no fallback HTML");

  const appData = extractJsonBlob(html, "window.__APP=") ?? extractJsonBlob(html, "window.__APP =");
  if (!appData) throw new Error("OLX India: could not find listing data in page");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d = appData as Record<string, any>;
  // OLX Panamera framework: window.__APP = { props, states }
  // states.items is the listings array on search pages
  const ads: Record<string, unknown>[] =
    d?.states?.items ??
    d?.props?.pageProps?.ads ??
    d?.listingReducer?.data?.ads ??
    d?.listings?.ads ??
    d?.data?.ads ??
    d?.ads ??
    [];

  if (ads.length === 0) throw new Error("OLX India: no ads found in page data");

  return ads.slice(0, maxItems).map(normalizeOlxAd);
}

// ─── POST /api/scrape ─────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { apiKey, actorId, payload = {} } = body as {
    apiKey:   string;
    actorId:  string;
    payload?: Record<string, unknown>;
  };

  if (!actorId) return NextResponse.json({ error: "actorId is required" }, { status: 400 });

  // ── Direct scrapers (no Apify) ────────────────────────────────────────────
  if (actorId === "direct/olx-india") {
    try {
      const maxItems = typeof payload.maxItems === "number" ? payload.maxItems : 50;
      const leads = await scrapeOlxIndia(payload, maxItems);
      return NextResponse.json({ leads });
    } catch (err: unknown) {
      return NextResponse.json(
        { error: `OLX India scrape failed: ${err instanceof Error ? err.message : String(err)}` },
        { status: 502 }
      );
    }
  }

  // ── Apify-backed scrapers ─────────────────────────────────────────────────
  if (!apiKey) return NextResponse.json({ error: "Apify API key is required" }, { status: 400 });

  const client     = new ApifyClient({ token: apiKey });
  const actorInput = buildActorInput(actorId, payload);

  let run;
  try {
    run = await client.actor(actorId).call(actorInput, { waitSecs: 120 });
  } catch (err: unknown) {
    return NextResponse.json(
      { error: `Apify actor "${actorId}" failed: ${err instanceof Error ? err.message : String(err)}` },
      { status: 502 }
    );
  }

  let items: Record<string, unknown>[] = [];
  try {
    const dataset = await client.dataset(run.defaultDatasetId).listItems();
    items = dataset.items as Record<string, unknown>[];
  } catch (err: unknown) {
    return NextResponse.json(
      { error: `Failed to fetch dataset: ${err instanceof Error ? err.message : String(err)}` },
      { status: 502 }
    );
  }

  return NextResponse.json({ leads: normalizeData(items, actorId) });
}
