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

  const params = new URLSearchParams({
    q:        `"${companyName}"`,
    pageSize: "3",
    sortBy:   "publishedAt",
    language: "en",
    apiKey:   newsApiKey,
  });

  try {
    const res = await fetch(`https://newsapi.org/v2/everything?${params}`, {
      next: { revalidate: 3600 }, // cache per company for 1 hour
    });
    const data = await res.json();

    if (!res.ok || data.status === "error") {
      return NextResponse.json({ articles: [], error: data.message ?? "NewsAPI error" });
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

    return NextResponse.json({ articles });
  } catch (err: unknown) {
    return NextResponse.json({ articles: [], error: String(err) });
  }
}
