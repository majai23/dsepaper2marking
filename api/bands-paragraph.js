// 📂 bands-paragraph.js

export async function POST(req) {
  try {
    const { paragraphs, question } = await req.json();
    const results = [];

    for (let i = 0; i < paragraphs.length; i++) {
      const prompt = `You are an HKDSE English Paper 2 marker. Carefully evaluate paragraph ${i + 1} of a student's writing based on Content, Language, and Organisation.

The writing task is:
"${question}"

Paragraph ${i + 1}:
"${paragraphs[i]}"

Provide detailed feedback for each domain. After each domain, include a hidden band score in the format [C:5], [L:4], [O:5] depending on how well the paragraph performs.`;

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      const data = await response.json();
      results.push(data.choices[0].message.content.trim());
    }

    return new Response(JSON.stringify({ insights: results }), {
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "Paragraph analysis failed." }), {
      status: 500,
    });
  }
}
