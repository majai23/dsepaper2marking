export default async function handler(req, res) {
  const { writing, originalScores = null, paperType = "Part A" } = req.body;

  if (!writing) {
    return res.status(400).json({ error: "Missing writing" });
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
You are an HKDSE English Paper 2 examiner.

Evaluate the following writing using the official HKDSE ${paperType} Rubrics.

${scoreTable}

For each domain (Content, Language, Organisation), give:
- Strengths
- Weaknesses
- Band score (1–7) and justification

Do NOT include the final level or suggestions yet.

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
          { role: "system", content: "You are a precise and concise HKDSE English Paper 2 examiner." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens
      })
    });

    const data = await response.json();
    const bandAnalysis = data.choices?.[0]?.message?.content;
    if (!bandAnalysis) return res.status(500).json({ error: "No band analysis returned" });
    res.status(200).json({ bandAnalysis });
  } catch (err) {
    console.error("Band Analysis Error:", err);
    res.status(500).json({ error: "Server error while generating band analysis" });
  }
}
