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

    return new Response(JSON.stringify({ prompt }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (e) {
    console.error("❌ Error summarizing feedback:", e);
    return new Response("Error summarizing feedback.", { status: 500 });
  }
}

