
// /api/bands-paragraph.js
export const runtime = 'edge';

export async function POST(req) {
  try {
    const { paragraph, position = "body" } = await req.json();

    if (!paragraph || paragraph.trim().length < 5) {
      return new Response(JSON.stringify({ paragraphAnalysis: "⚠️ Paragraph too short or empty to evaluate." }), { status: 200 });
    }

    const prompt = `
You are an HKDSE English Paper 2 examiner.

Evaluate ONE paragraph of a student's writing. This paragraph functions as the ${position}.

Assess how this paragraph contributes to the overall performance in:
1. Content (C)
2. Language (L)
3. Organisation (O)

✅ Use 1–2 direct quotes or phrases from the paragraph to justify your feedback.

Do NOT give band scores. Instead, give brief evaluations using this format:
✅ Content: ...
✅ Language: ...
✅ Organisation: ...

Student paragraph:
${paragraph}
`;

    const res = await fetch("https://dsegpt4marker.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2025-01-01-preview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.AZURE_OPENAI_KEY
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are a helpful HKDSE English Paper 2 paragraph evaluator." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });

    const data = await res.json();
    const paragraphAnalysis = data.choices?.[0]?.message?.content?.trim() || "⚠️ No analysis returned.";
    return new Response(JSON.stringify({ paragraphAnalysis }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
