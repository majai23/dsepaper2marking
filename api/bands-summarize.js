import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = "edge";

export async function POST(req) {
  const { question, insights } = await req.json();

  if (!insights || !Array.isArray(insights) || insights.length === 0) {
    return new Response("⚠️ Not enough detailed paragraph evaluations for scoring.", { status: 400 });
  }

  let compiledInsights = insights
    .filter(p => typeof p === "string" && p.trim() !== "")
    .map((p, idx) => `Paragraph ${idx + 1} Feedback:
${p}`)
    .join("\n\n");

  const prompt = `
You are an HKDSE English Paper 2 expert marker.

A student has written a response to the following question:
"${question}"

Below is the paragraph-by-paragraph analysis of the student's writing:
${compiledInsights}

Based on the analysis above, assign band scores for the following three domains according to HKDSE standards:

Content (C)  
Language (L)  
Organisation (O)

Then provide a brief justification for each score, referring to the paragraph insights above when possible. Finally, conclude with an overall comment and 2–3 practical suggestions for improvement.

Format your response like this:

🧠 Summarizing band scores...
**Band Scores:**  
C:  
L:  
O:  

**Justification:**  
...

**Suggestions for Improvement:**  
1.  
2.  
3.
`;

  const result = await openai.chat.completions.create({
    model: "gpt-4",
    stream: false,
    messages: [
      {
        role: "system",
        content: "You are a strict but fair HKDSE English writing examiner.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const summary = result.choices[0]?.message?.content || "⚠️ No summary returned.";
  return new Response(JSON.stringify({ bandAnalysis: summary }), {
    headers: { "Content-Type": "application/json" },
  });
}
