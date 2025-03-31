
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
You are a professional HKDSE English Paper 2 examiner.

The following are paragraph-by-paragraph evaluations of a student's writing, focusing on:
✅ Content (C)
✅ Language (L)
✅ Organisation (O)

Use the official HKDSE Paper 2 rubric to assign band scores from 1 (weak) to 7 (excellent):
- Band 5–6 means above average with clear task fulfillment and mostly accurate language.
- Band 7 (5**) means exceptional performance in clarity, accuracy, relevance, and organisation.
- Band 4 means there are more noticeable issues than strengths.

Most paragraphs below are reasonably developed with formal tone. Do not assign Band 4 unless issues dominate.

Now:
1. Assign band scores for each domain (C, L, O)
2. Summarise key strengths and weaknesses across the piece
3. Keep the tone supportive and encouraging

Respond in this format:

**Band Scores:**
C: _
L: _
O: _

**Justification:** ...
    
Paragraph Feedback:
${cleanInsights}
`;

    const res = await fetch("https://dsegpt4marker.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2025-01-01-preview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.AZURE_OPENAI_KEY
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are an HKDSE English Paper 2 examiner trained in rubric-based band scoring." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
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
