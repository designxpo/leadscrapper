import { NextRequest, NextResponse } from "next/server";

export type NewsArticle = {
  title: string;
  description: string | null;
  url: string;
  publishedAt: string;
  source: string;
};

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const { companyName, newsApiKey } = body as {
    companyName: string;
    newsApiKey: string;
  };

  if (!newsApiKey) return NextResponse.json({ error: "NewsAPI key required" }, { status: 400 });
  if (!companyName) return NextResponse.json({ error: "Company name required" }, { status: 400 });

  // Try exact-match first (best precision); if 0 results, fall back to broad search.
  async function search(query: string) {
    const params = new URLSearchParams({
      q:        query,
      pageSize: "3",
      sortBy:   "publishedAt",
      language: "en",
      apiKey:   newsApiKey,
    });
    const res = await fetch(`https://newsapi.org/v2/everything?${params}`, {
      next: { revalidate: 3600 },
    });
    const data = await res.json();
    return { res, data };
  }

  try {
    let { res, data } = await search(`"${companyName}"`);

    if (!res.ok || data.status === "error") {
      return NextResponse.json(
        { articles: [], error: data.message ?? `NewsAPI error (HTTP ${res.status})` },
        { status: res.status >= 400 ? res.status : 200 }
      );
    }

    // Fallback to unquoted query if exact match returned nothing
    if ((data.totalResults ?? 0) === 0) {
      const fallback = await search(companyName);
      if (fallback.res.ok && fallback.data.status !== "error") {
        data = fallback.data;
      }
    }

    const articles: NewsArticle[] = (data.articles ?? []).map(
      (a: Record<string, unknown>) => ({
        title:       (a.title as string) ?? "",
        description: (a.description as string) ?? null,
        url:         (a.url as string) ?? "",
        publishedAt: (a.publishedAt as string) ?? "",
        source:      ((a.source as Record<string, string>)?.name) ?? "",
      })
    );

    return NextResponse.json({ articles, totalResults: data.totalResults ?? 0 });
  } catch (err: unknown) {
    return NextResponse.json(
      { articles: [], error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
