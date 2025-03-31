export async function POST(req) {
  try {
    const { insights } = await req.json();

    let compiledInsights = insights
      .map((p, idx) => {
        if (typeof p === "string") return `Paragraph ${idx + 1} Feedback:\n${p}`;
        if (p?.content || p?.language || p?.organisation) {
          return `Paragraph ${idx + 1} Feedback:\n` +
            `Content: ${p.content || "Not provided"}\n` +
            `Language: ${p.language || "Not provided"}\n` +
            `Organisation: ${p.organisation || "Not provided"}`;
        }
        return null;
      })
      .filter(p => !!p)
      .join("\n\n");

    if (!compiledInsights || compiledInsights.trim().length < 10) {
      return new Response("Not enough detailed paragraph evaluations for scoring.", { status: 400 });
    }

    const prompt = `
You are a strict but fair HKDSE English Writing examiner. Evaluate the following feedback and assign a band score (1-7) for each of the three domains: Content (C), Language (L), and Organisation (O).

Then, provide a short justification (4–6 sentences) explaining why each domain received its respective score. Use direct evidence from the paragraph feedback.

Finally, summarize the overall strengths and weaknesses of the writing and suggest 2-3 concrete steps for improvement.

Here is the detailed paragraph feedback:
` + compiledInsights;

    // 💬 Make a call to Azure OpenAI
    const response = await fetch("https://dsegpt4marker.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2025-01-01-preview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.AZURE_OPENAI_KEY
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are an HKDSE English Writing examiner." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 1200
      })
    });

    const data = await response.json();
    const finalAnalysis = data.choices?.[0]?.message?.content || "⚠️ No summary returned.";

    return new Response(JSON.stringify({ finalAnalysis }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (e) {
    console.error("❌ Error summarizing feedback:", e);
    return new Response("Error summarizing feedback.", { status: 500 });
  }
}
