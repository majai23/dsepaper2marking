
export const runtime = 'edge';

export async function POST(req) {
  try {
    const { paragraph, position = "body" } = await req.json();

    if (!paragraph || paragraph.trim().length < 5) {
      return new Response(JSON.stringify({ paragraphAnalysis: "⚠️ Paragraph too short or empty to evaluate." }), { status: 200 });
    }

    let customInstruction = "";
    if (position === "salutation") {
      customInstruction = "This paragraph is a salutation. Evaluate only its tone and formality. Do not comment on content development or organisation.";
    } else if (position === "closing") {
      customInstruction = "This paragraph is a complimentary close. Evaluate only its appropriateness in tone and formality. Do not rate it on structure or development.";
    } else {
      customInstruction = "You must quote 1–2 phrases directly from the paragraph to justify your evaluation of Content, Language, and Organisation.";
    }

    const prompt = `
You are a professional HKDSE English Paper 2 examiner. You are given one paragraph from a student's writing.

Position of this paragraph: ${position.toUpperCase()}

${customInstruction}

Evaluate how this paragraph contributes to:
1. Content (C)
2. Language (L)
3. Organisation (O)

⚠️ Use the student's actual words (1–2 phrases per category) to support your comments.

Respond in the following format:

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
