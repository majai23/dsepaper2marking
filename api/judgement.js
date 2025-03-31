export default async function handler(req, res) {
  const { writing, bands = [] } = req.body;

  if (!writing || bands.length !== 3) {
    return res.status(400).json({ error: "Missing writing or band scores (C, L, O)" });
  }

  const max_tokens = 600;
  const [C, L, O] = bands;

  const prompt = `
You're an HKDSE English Paper 2 examiner.

Using these band scores:
- Content (C): ${C}
- Language (L): ${L}
- Organisation (O): ${O}

1. Calculate the average score.
2. Assign the final level using this scale:
   - 7 → Level 5**
   - 6 → Level 5*
   - 5 → Level 5
   - 4 → Level 4
   - etc.

3. Give a short justification.
4. Provide 2–3 practical suggestions to improve to Level 5 or 5**.

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
          { role: "system", content: "You are a logical and concise HKDSE English marker." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens
      })
    });

    const data = await response.json();
    const judgement = data.choices?.[0]?.message?.content;
    if (!judgement) return res.status(500).json({ error: "No judgement returned" });
    res.status(200).json({ judgement });
  } catch (err) {
    console.error("Judgement Error:", err);
    res.status(500).json({ error: "Server error while generating final judgement" });
  }
}
