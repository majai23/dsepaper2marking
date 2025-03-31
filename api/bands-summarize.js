
// Improved /api/bands-summarize.js with logging and error handling

export const runtime = 'edge';

export async function POST(req) {
  try {
    const { insights, mode = "detailed" } = await req.json();
    console.log("✅ Received insights for summarization:", insights?.length || "none");
    if (!insights || !Array.isArray(insights) || insights.length === 0) {
      return new Response(JSON.stringify({ bandAnalysis: "⚠️ No insights available for summarization." }), { status: 200 });
    }

    const formattedInsights = insights
      .map((p, i) => `🔹 Paragraph ${i + 1}:
${p}`)
      .join("\n\n");

    const summaryPrompt = `
You are an expert HKDSE English Paper 2 marker.
You will be given paragraph-level feedback and must assign band scores for:

- Content (C)
- Language (L)
- Organisation (O)

Use the official rubric (Band 1–7). Respond in this format:

**Band Scores:**
C: _  
L: _  
O: _

Then explain your judgement ${
      mode === "quick"
        ? "briefly (2–3 sentences per domain)."
        : "with examples from the student's writing."
    }

Paragraph-level feedback:
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
          { role: "system", content: "You are a senior HKDSE examiner." },
          { role: "user", content: summaryPrompt }
        ],
        temperature: 0.5,
        max_tokens: 1000
      })
    });

    const data = await response.json();
    console.log("🧠 GPT summary response:", data);

    const result = data.choices?.[0]?.message?.content?.trim();
    return new Response(JSON.stringify({ bandAnalysis: result || "⚠️ No summary returned." }), { status: 200 });
  } catch (err) {
    console.error("❌ Error in /api/bands-summarize:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
