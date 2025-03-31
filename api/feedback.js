export default async function handler(req, res) {
  const { writing, level, mode, originalScores = null, paperType = "Part A" } = req.body;

  if (!writing || !level) {
    return res.status(400).json({ error: "Missing writing or level" });
  }

  const max_tokens = 1400;

  const scoreTable = originalScores
    ? `Original Marker Scores:

| Category      | 1st Marker | 2nd Marker |
|---------------|------------|------------|
| Content (C)   | ${originalScores.C1}          | ${originalScores.C2}          |
| Language (L)  | ${originalScores.L1}          | ${originalScores.L2}          |
| Organisation (O)| ${originalScores.O1}       | ${originalScores.O2}          |`
    : "";

  const prompt = `
You are a professional HKDSE English Paper 2 examiner.

Evaluate the student's writing below based on the official HKDSE Paper 2 marking rubrics (${paperType}).

${scoreTable}

Please provide the response in this format:

📊 Original Marker Scores (if provided)

✅ 📌 Domain 1: Content (C)
- Rubric Level Explanation
- Strengths
- Weaknesses
- Verdict

✅ 📌 Domain 2: Language (L)
...

✅ 📌 Domain 3: Organisation (O)
...

🏁 Final Judgement:
- Suggested bands per category
- Overall level (e.g. 5*, borderline 5**)
- 2–3 practical suggestions to improve to 5**

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
          { role: "system", content: "You are a professional HKDSE English writing examiner." },
          { role: "user", content: prompt }
        ],
        temperature: 0.4,
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
