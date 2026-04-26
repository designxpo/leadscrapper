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

  if (!apiKey)  return NextResponse.json({ error: "Apify API key is required" }, { status: 400 });
  if (!actorId) return NextResponse.json({ error: "actorId is required" },       { status: 400 });

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
