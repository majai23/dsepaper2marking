export default async function handler(req, res) {
  const { writing, level, mode, originalScores = null, paperType = "Part A" } = req.body;

  if (!writing || !level) {
    return res.status(400).json({ error: "Missing writing or level" });
  }

  const max_tokens = 1000;

  const scoreTable = originalScores
    ? `Original Marker Scores:

| Category      | 1st Marker | 2nd Marker |
|---------------|------------|------------|
| Content (C)   | ${originalScores.C1} | ${originalScores.C2} |
| Language (L)  | ${originalScores.L1} | ${originalScores.L2} |
| Organisation (O) | ${originalScores.O1} | ${originalScores.O2} |`
    : "";

  const prompt = `
You are an HKDSE English examiner.

Evaluate the writing below using HKDSE ${paperType} Rubrics. ${originalScores ? "Compare with the given marker scores." : ""}

${scoreTable}

Respond in this format:
📊 Marker Scores
✅ 📌 Content (C): [Strengths, Weaknesses, Verdict]
✅ 📌 Language (L): ...
✅ 📌 Organisation (O): ...
🏁 Final Judgement: [Suggested bands, final level, tips to reach 5**]

Student Writing:
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
          { role: "system", content: "You are a concise, accurate HKDSE English examiner." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens
      })
    });

    const data = await response.json();
    const feedback = data.choices?.[0]?.message?.content;
    if (!feedback) return res.status(500).json({ error: "No feedback returned" });
    res.status(200).json({ feedback });
  } catch (err) {
    console.error("GPT-4o Feedback Error:", err);
    res.status(504).json({ error: "Timeout or server error while generating feedback" });
  }
}
