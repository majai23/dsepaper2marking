import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.AZURE_OPENAI_API_BASE,
  defaultHeaders: {
    "api-key": process.env.AZURE_OPENAI_API_KEY,
  },
  defaultQuery: {
    "api-version": "2023-12-01-preview",
  },
});

export async function POST(req) {
  const { feedback } = await req.json();

  if (!feedback || !Array.isArray(feedback) || feedback.length === 0) {
    return new Response(
      JSON.stringify({
        error: "No detailed feedback provided.",
        finalAnalysis: "⚠️ No detailed feedback provided. Please analyze the writing first.",
      }),
      { status: 400 }
    );
  }

  const prompt = `
You are a senior HKDSE English teacher. Based on the detailed paragraph-by-paragraph feedback below, assign band scores for Content (C), Language (L), and Organisation (O), following the HKDSE Paper 2 rubrics. Then, explain the strengths and weaknesses of the writing in terms of these three domains and give suggestions for improvement.

Paragraph Feedback:
${feedback.join("\n\n")}

Return the result in this format:

**Band Scores:**
C: [1–7]
L: [1–7]
O: [1–7]

**Justification:**
(Explain why you gave these scores. Point out strengths and weaknesses for C, L, and O.)
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const output = response.choices?.[0]?.message?.content?.trim();

    if (!output) {
      return new Response(JSON.stringify({
        finalAnalysis: "⚠️ No summary returned.",
        error: "❌ Error summarizing feedback.",
      }));
    }

    return new Response(JSON.stringify({ finalAnalysis: output }));
  } catch (err) {
    return new Response(JSON.stringify({
      finalAnalysis: "⚠️ No summary returned.",
      error: "❌ Error summarizing feedback.",
      debug: err.message,
    }), { status: 500 });
  }
}
