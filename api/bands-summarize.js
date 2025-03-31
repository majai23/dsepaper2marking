export default async function handler(req, res) {
  const { insights = [] } = req.body;

  const prompt = `
You are a HKDSE English Paper 2 examiner.

You will be given several short analyses of individual paragraphs from a student's essay.
Each analysis discusses how that paragraph contributes to Content (C), Language (L), and Organisation (O).

Your task is to:
1. Summarize overall strengths and weaknesses across the full essay.
2. Assign a final band score (1–7) for Content, Language, and Organisation.

Format your reply like this:

📊 Band Scores:
C: <score>
L: <score>
O: <score>

✅ 📌 Content (C):
<explanation>

✅ 📌 Language (L):
<explanation>

✅ 📌 Organisation (O):
<explanation>

Here are the paragraph-level insights:
${insights.join('\n\n')}
`;

  try {
    const response = await fetch("https://dsegpt4marker.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2025-01-01-preview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.AZURE_OPENAI_KEY
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are a DSE English Paper 2 examiner." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 700
      })
    });

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content?.trim();
    res.status(200).json({ bandAnalysis: result || "⚠️ No summary returned." });
  } catch (err) {
    console.error("Summary scoring error:", err);
    res.status(500).json({ error: "Failed to summarize bands." });
  }
}
