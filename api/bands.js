
// /api/bands.js - full essay quick feedback based on HKDSE Paper 2 rubric

export const runtime = 'edge';

export async function POST(req) {
  try {
    const { writing, mode = "quick", paperType = "Part A", originalScores = null } = await req.json();

    if (!writing) {
      return new Response(JSON.stringify({ error: "No writing provided." }), { status: 400 });
    }

    const prompt = `
You are an experienced HKDSE English Paper 2 marker.
Please evaluate the following student's ${paperType} writing.

Assign band scores from 1 to 7 for each of the following:
- Content (C)
- Language (L)
- Organisation (O)

Respond in this format:

**Band Scores:**
C: _
L: _
O: _

Then provide ${mode === "quick" ? "a short justification (2–3 sentences) for each domain." : "detailed analysis with specific examples."}

If original band scores were given by two markers, feel free to compare their scores with your evaluation:
${originalScores ? JSON.stringify(originalScores, null, 2) : "N/A"}

Student Writing:
${writing}
`;

    const res = await fetch("https://dsegpt4marker.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2025-01-01-preview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.AZURE_OPENAI_KEY
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are a professional HKDSE English writing examiner." },
          { role: "user", content: prompt }
        ],
        temperature: 0.4,
        max_tokens: 900
      })
    });

    const data = await res.json();
    const bandAnalysis = data.choices?.[0]?.message?.content?.trim() || "⚠️ No feedback returned.";
    return new Response(JSON.stringify({ bandAnalysis }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
