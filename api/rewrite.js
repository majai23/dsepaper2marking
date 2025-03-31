export default async function handler(req, res) {
  const { paragraph } = req.body;

  if (!paragraph) {
    return res.status(400).json({ error: "Missing paragraph" });
  }

  const prompt = `
You are an HKDSE English Paper 2 rewriting coach.

Polish the following paragraph to a strong Level 5**.

Improve clarity, word choice, sentence structure, and flow.

Highlight all improvements using **bold** formatting.

Original paragraph:
${paragraph}
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
          { role: "system", content: "You are a helpful HKDSE English rewriting assistant." },
          { role: "user", content: prompt }
        ],
        temperature: 0.6,
        max_tokens: 400
      })
    });

    const data = await response.json();
    const rewritten = data.choices?.[0]?.message?.content?.trim();
    res.status(200).json({ rewritten: rewritten || "⚠️ No content returned." });
  } catch (err) {
    console.error("Rewrite error:", err);
    res.status(500).json({ error: "Server error while rewriting." });
  }
}
