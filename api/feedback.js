export default async function handler(req, res) {
  const { writing, level, mode, originalScores = null, paperType = "Part A" } = req.body;

  if (!writing || !level) {
    return res.status(400).json({ error: "Missing writing or level" });
  }

  const max_tokens = 1200;

  const scoreTable = originalScores
    ? `Original Marker Scores:

| Category      | 1st Marker | 2nd Marker |
|---------------|------------|------------|
| Content (C)   | ${originalScores.C1} | ${originalScores.C2} |
| Language (L)  | ${originalScores.L1} | ${originalScores.L2} |
| Organisation (O) | ${originalScores.O1} | ${originalScores.O2} |`
    : "";

  const prompt = `
You are an HKDSE English Paper 2 examiner.

Evaluate the student's writing using the official HKDSE ${paperType} Rubrics.

${scoreTable}

Use this structured format:

📊 Marker Scores (if provided)

✅ 📌 Domain 1: Content (C)
- Strengths
- Weaknesses
- Band score (1–7) and justification

✅ 📌 Domain 2: Language (L)
...

✅ 📌 Domain 3: Organisation (O)
...

🏁 Final Judgement:
- Based ONLY on your three band scores above, calculate the average.
- Assign level using this scale:
  7 → Level 5**
  6 → Level 5*
  5 → Level 5
  4 → Level 4
  3 → Level 3
  2 → Level 2
  1 → Level 1

- Brief explanation for the level
- Then 2–3 actionable suggestions to improve to Level 5 or 5**

📝 Keep your entire response concise and under 500 words.

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
          { role: "system", content: "You are a clear, logical, and concise HKDSE English writing examiner." },
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
    res.status(500).json({ error: "Server error while generating feedback" });
  }
}
