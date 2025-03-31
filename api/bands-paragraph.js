
export const runtime = 'edge';

export async function POST(req) {
  try {
    const { paragraph, position = "body" } = await req.json();

    const clean = (s) => s.trim().toLowerCase();
    const isSalutation = position === "salutation" || /^dear\b|^to whom|^sir|madam/i.test(clean(paragraph));
    const isClosing = position === "closing" || /yours|sincerely|faithfully|regards/i.test(clean(paragraph));

    if (!paragraph || clean(paragraph).length < 5) {
      return new Response(JSON.stringify({ paragraphAnalysis: "⚠️ Paragraph too short or empty to evaluate." }), { status: 200 });
    }

    if (isSalutation || isClosing) {
      const type = isSalutation ? "Salutation" : "Complimentary Close";
      const analysis = `✅ Content: Not applicable for ${type.toLowerCase()}s.\n✅ Language: Appropriate tone and formality for a formal letter.\n✅ Organisation: Properly positioned in the structure of a formal letter.`;
      return new Response(JSON.stringify({ paragraphAnalysis: analysis }), { status: 200 });
    }

    const prompt = `
You are a professional HKDSE English Paper 2 examiner.

You are given one paragraph from a student's writing (${position.toUpperCase()}).

Evaluate how this paragraph contributes to:
1. Content (C)
2. Language (L)
3. Organisation (O)

⚠️ You MUST quote 1–2 phrases from the student's paragraph to support each category.

Respond in this format:
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
          { role: "system", content: "You are a senior HKDSE English paragraph evaluator." },
          { role: "user", content: prompt }
        ],
        temperature: 0.4,
        max_tokens: 600
      })
    });

    const data = await res.json();
    const paragraphAnalysis = data.choices?.[0]?.message?.content?.trim() || "⚠️ No analysis returned.";
    return new Response(JSON.stringify({ paragraphAnalysis }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
