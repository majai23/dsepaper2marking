export default async function handler(req, res) {
  const { writing, originalScores, paperType = "Part A", mode = "detailed" } = req.body;

  const baseInstruction =
    mode === "quick"
      ? `Give band scores for Content (C), Language (L), and Organisation (O), each from 1 to 7.
Briefly explain in 2–3 sentences why the candidate earned that band in each domain. Be concise, focus on overall performance.

DO NOT quote specific examples or lines from the writing. This is a summary-level response.`
      : `Give band scores for Content (C), Language (L), and Organisation (O), each from 1 to 7.
Use concrete examples or specific phrases from the writing to support your assessment in each domain.
This is a full detailed feedback.`;

  const prompt = `
You are a Hong Kong DSE English Paper 2 marker.

Mark the following student writing using the official HKDSE Paper 2 rubrics.

Paper Type: ${paperType}
${baseInstruction}

Return your feedback in this format:

📊 Band Scores:
C: <score>
L: <score>
O: <score>

Feedback:
✅ 📌 Content (C):
<explanation>

✅ 📌 Language (L):
<explanation>

✅ 📌 Organisation (O):
<explanation>

Student writing:
${writing}
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
          { role: "system", content: "You are a DSE English Paper 2 writing marker." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 700
      })
    });

    const data = await response.json();
    const bandAnalysis = data.choices?.[0]?.message?.content?.trim();
    res.status(200).json({ bandAnalysis: bandAnalysis || "⚠️ No feedback generated." });
  } catch (err) {
    console.error("Band feedback error:", err);
    res.status(500).json({ error: "Failed to generate band feedback." });
  }
}
