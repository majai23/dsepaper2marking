
export const runtime = 'edge';

export async function POST(req) {
  try {
    const { insights = [] } = await req.json();

    if (!Array.isArray(insights) || insights.length === 0) {
      return new Response(JSON.stringify({ bandAnalysis: "⚠️ No paragraph insights received." }), { status: 400 });
    }

    const filteredInsights = insights.filter(text =>
      text.includes("✅ Content:") && text.includes("✅ Language:") && text.includes("✅ Organisation:")
      && !text.toLowerCase().includes("not applicable")
    );

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
- DO NOT penalise salutation or closing phrases. They are expected in formal letters.
- If 70%+ of content paragraphs show control and relevance, Band 6–7 is valid.

Avoid repeating the paragraph feedback again. Just summarise overall strengths and weaknesses.

Respond in this format:

**Band Scores:**
C: _
L: _
O: _

**Justification:** ...
`;

    const res = await fetch("https://dsegpt4marker.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2025-01-01-preview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.AZURE_OPENAI_KEY
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are an HKDSE Paper 2 scorer who only responds with band scores and summary." },
          { role: "user", content: summaryPrompt + filteredInsights.join("\n\n") }
        ],
        temperature: 0.2,
        max_tokens: 800
      })
    });

    const data = await res.json();
    const bandAnalysis = data.choices?.[0]?.message?.content?.trim() || "⚠️ No summary returned.";
    return new Response(JSON.stringify({ bandAnalysis }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
