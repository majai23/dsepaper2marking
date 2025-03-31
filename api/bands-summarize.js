
// Improved bands-summarize.js
// Handles both quick and detailed modes with better fallbacks and insight formatting

export const runtime = 'edge';

export async function POST(req) {
  try {
    const { insights, mode = "detailed" } = await req.json();
    if (!insights || !Array.isArray(insights) || insights.length === 0) {
      return new Response(JSON.stringify({ bandAnalysis: "⚠️ No insights available for summarization." }), { status: 200 });
    }

    const formattedInsights = insights.map((p, i) => `Paragraph ${i + 1}:
${p}`).join("

");

    const summaryPrompt = `
You are an expert HKDSE English Paper 2 marker.
You will be given paragraph-level evaluations and must assign overall band scores for:
- Content (C)
- Language (L)
- Organisation (O)

Use the official rubric (bands 1–7).
Explain the reasoning ${mode === "quick" ? "briefly (2–3 lines per domain)" : "with detailed examples"}.

Format:
**Band Scores:**\nC: _  \nL: _  \nO: _

Then detailed analysis.

Student's paragraph evaluations:
${formattedInsights}
`;

    const response = await fetch("https://dsegpt4marker.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2025-01-01-preview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.AZURE_OPENAI_KEY
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are a senior HKDSE English examiner." },
          { role: "user", content: summaryPrompt }
        ],
        max_tokens: 1000,
        temperature: 0.5,
      })
    });

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content?.trim();
    return new Response(JSON.stringify({ bandAnalysis: result || "⚠️ No summary returned." }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
