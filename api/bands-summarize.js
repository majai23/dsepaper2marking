
export const runtime = 'edge';

export async function POST(req) {
  try {
    const { insights = [], mode = "detailed" } = await req.json();

    if (!Array.isArray(insights) || insights.length === 0) {
      return new Response(JSON.stringify({ bandAnalysis: "⚠️ No paragraph insights received." }), { status: 400 });
    }

    const cleanInsights = insights
      .filter(text => text.includes("✅ Content:") && text.includes("✅ Language:") && text.includes("✅ Organisation:"))
      .join("\n\n");

    const prompt = `
You are a professional HKDSE English writing examiner.

The following are paragraph-by-paragraph analyses of a student's writing:

${cleanInsights}

Based on these insights, assign band scores (1 to 7) for:

- Content (C)
- Language (L)
- Organisation (O)

Summarise key strengths and weaknesses per domain, quoting from the analysis if needed.

Respond in this format:
**Band Scores:**
C: _
L: _
O: _

Then follow with concise justification.
`;

    const res = await fetch("https://dsegpt4marker.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2025-01-01-preview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.AZURE_OPENAI_KEY
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are a senior HKDSE English writing summarizer." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 700
      })
    });

    const data = await res.json();
    const bandAnalysis = data.choices?.[0]?.message?.content?.trim() || "⚠️ No summary returned.";
    return new Response(JSON.stringify({ bandAnalysis }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
