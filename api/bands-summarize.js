
export const runtime = 'edge';

export async function POST(req) {
  try {
    const { insights = [] } = await req.json();

    if (!Array.isArray(insights) || insights.length === 0) {
      return new Response(JSON.stringify({ bandAnalysis: "⚠️ No paragraph insights received." }), { status: 400 });
    }

    const filteredInsights = insights.filter(text =>
      typeof text === "string" &&
      text.includes("✅ Content:") &&
      text.includes("✅ Language:") &&
      text.includes("✅ Organisation:") &&
      !text.toLowerCase().includes("not applicable")
    );

    if (filteredInsights.length < 2) {
      return new Response(JSON.stringify({ bandAnalysis: "⚠️ Not enough detailed paragraph evaluations for scoring." }), { status: 400 });
    }

    const summaryPrompt = `
You are a senior HKDSE English examiner.

Based on these paragraph evaluations, assign band scores from 1–7 for:
- Content (C)
- Language (L)
- Organisation (O)

Rubric guidance:
- Band 7 = Excellent, well-developed, fluent and relevant with near-perfect accuracy
- Band 6 = Strong performance with occasional issues, task fulfilled
- Band 5 = Competent, some lapses but clear meaning and structure
- DO NOT penalise salutation or closing phrases.

Here are the paragraph evaluations:
${filteredInsights.join("\n\n")}

Now provide:

Band Scores:
C: ?
L: ?
O: ?

Justification:
Explain why each band score was awarded, referring to examples and performance levels only.`.trim();

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          { role: "system", content: "You are a strict and precise HKDSE examiner." },
          { role: "user", content: summaryPrompt }
        ],
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || "⚠️ No summary returned.";

    return new Response(JSON.stringify({ bandAnalysis: reply }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Summarizer Error:", error);
    return new Response(JSON.stringify({ bandAnalysis: "⚠️ Server error while summarizing bands." }), { status: 500 });
  }
}
