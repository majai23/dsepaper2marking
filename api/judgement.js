
// /api/judgement.js
export const runtime = 'edge';

export async function POST(req) {
  try {
    const { writing, bands } = await req.json();

    const [C, L, O] = bands || [];
    if (!C || !L || !O) {
      return new Response(JSON.stringify({ error: "Missing band scores" }), { status: 400 });
    }

    const prompt = `
You are a senior HKDSE English Paper 2 examiner.
Based on the following band scores and student writing, provide a final evaluation.

Band Scores:
Content: ${C}
Language: ${L}
Organisation: ${O}

Explain what the scores mean.
Explain how close this performance is to Level 5 or 5**, and suggest what improvements could raise it.

Student writing:
${writing}
`;

    const response = await fetch("https://dsegpt4marker.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2025-01-01-preview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.AZURE_OPENAI_KEY
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are a DSE English Writing examiner." },
          { role: "user", content: prompt }
        ],
        temperature: 0.4,
        max_tokens: 700
      })
    });

    const data = await response.json();
    const judgement = data.choices?.[0]?.message?.content?.trim();
    return new Response(JSON.stringify({ judgement }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
