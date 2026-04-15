import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import type { ScoredLead } from "@/lib/scoreLead";
import type { NewsArticle } from "@/app/api/news/route";

const SYSTEM_PROMPT = `You are an expert B2B cold outreach copywriter.
Your job is to write a 1-2 sentence personalized opening line for a cold email, LinkedIn message, or WhatsApp message directed at a business.
The line must:
- Reference something specific: a recent news event (if provided), the business name, niche, location, or rating
- Sound human, natural, and non-generic — no corporate jargon
- If recent news is provided, weave the most relevant headline naturally into the opener to show awareness
- Lead naturally into a value proposition (do not write the value prop itself, just set it up)
- Never mention that you scraped or found them online
Return ONLY the opening line. No subject line, no sign-off, no extra commentary.`;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { lead, geminiApiKey, articles } = body as {
    lead: ScoredLead;
    geminiApiKey: string;
    articles?: NewsArticle[];
  };

  if (!geminiApiKey) return NextResponse.json({ error: "Gemini API key is required" }, { status: 400 });
  if (!lead?.name)   return NextResponse.json({ error: "Lead data is required" }, { status: 400 });

  const ai = new GoogleGenAI({ apiKey: geminiApiKey });

  // Build lead details block
  const details = [
    `Business name: ${lead.name}`,
    lead.address     ? `Location: ${lead.address}`       : null,
    lead.website     ? `Website: ${lead.website}`         : null,
    lead.rating != null ? `Rating: ${lead.rating}/5`     : null,
    lead.phone       ? `Has phone: yes`                   : null,
    lead.email       ? `Has email: yes`                   : null,
    lead.description ? `Description: ${lead.description}` : null,
    lead.budget      ? `Budget/Salary range: ${lead.budget}` : null,
    lead.platform    ? `Platform: ${lead.platform}`       : null,
  ].filter(Boolean).join("\n");

  // Build news context block (top 3 articles)
  const newsBlock = articles && articles.length > 0
    ? "\n\nRecent news about this company:\n" +
      articles
        .slice(0, 3)
        .map((a, i) => `${i + 1}. [${a.source}] ${a.title}${a.description ? ` — ${a.description}` : ""}`)
        .join("\n")
    : "";

  const userPrompt = `Write a personalized cold outreach opening line for this business:\n\n${details}${newsBlock}`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: userPrompt,
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.85,
        maxOutputTokens: 150,
      },
    });

    const aiLine = response.text?.trim() ?? "";
    return NextResponse.json({ aiLine });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Gemini error: ${message}` }, { status: 502 });
  }
}
