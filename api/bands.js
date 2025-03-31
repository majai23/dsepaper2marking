
// /api/bands.js - full essay quick feedback with task-aware scoring

export const runtime = 'edge';

export async function POST(req) {
  try {
    const { writing, question = "", mode = "quick", paperType = "Part A", originalScores = null } = await req.json();

    if (!writing) {
      return new Response(JSON.stringify({ error: "No writing provided." }), { status: 400 });
    }

    const prompt = `
You are an experienced HKDSE English Paper 2 marker.
You are given a student's writing and the task question.

Writing Task:
${question}

Student's Response:
${writing}

Assign band scores from 1 to 7 for:
- Content (C)
- Language (L)
- Organisation (O)

Use this format:
**Band Scores:**
C: _
L: _
O: _

Then provide ${mode === "quick" ? "a short justification (2–3 sentences per domain)." : "detailed analysis with specific examples."}
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
