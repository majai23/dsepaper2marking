
// Updated bands-summarize.js
// Supports both quick and detailed mode using paragraph-based scores

export const runtime = 'edge';

export async function POST(req) {
  try {
    const { insights, mode = "detailed" } = await req.json();
    if (!insights || !Array.isArray(insights)) {
      return new Response(JSON.stringify({ error: "Missing or invalid insights array" }), { status: 400 });
    }

    const summaryPrompt = `
You are an expert HKDSE English Paper 2 marker.
You will be given individual paragraph-level feedback and asked to provide overall band scores for the writing.

Use the official HKDSE Paper 2 rubric to assign scores (1-7) for:
- Content (C)
- Language (L)
- Organisation (O)

Then explain the reasoning ${mode === "quick" ? "briefly in 2–3 sentences per domain." : "with detailed examples taken directly from the student's writing."}

End with the band scores in the format:
**Band Scores:**
C: [score]  \nL: [score]  \nO: [score]

Insights:
${insights.join("\n\n")}`;

    const completion = await fetch("https://dsegpt4marker.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2025-01-01-preview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.OPENAI_API_KEY
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are a professional English writing examiner for the HKDSE." },
          { role: "user", content: summaryPrompt }
        ],
        max_tokens: 1000,
        temperature: 0.5,
      })
    });

    const data = await completion.json();
    const bandAnalysis = data.choices?.[0]?.message?.content || "No summary returned.";
    return new Response(JSON.stringify({ bandAnalysis }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
