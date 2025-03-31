export default async function handler(req, res) {
  const { topic, type, level, original } = req.body;

  const prompt = `
You are an HKDSE English Paper 2 rewriting coach.

Your job is to polish the student's writing to a strong Level 5**.

Make it more fluent, precise, and natural. Improve vocabulary and clarity.

Highlight all improvements using **bold** formatting.

Student's writing:
${original}
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
          { role: "system", content: "You are an experienced HKDSE English rewriting tutor." },
          { role: "user", content: prompt }
        ],
        temperature: 0.6,
        max_tokens: 1000
      })
    });

    const data = await response.json();
    const writing = data.choices?.[0]?.message?.content;
    if (!writing) return res.status(500).json({ error: "No output generated" });
    res.status(200).json({ writing });
  } catch (err) {
    console.error("Brush-up GPT-4o Error:", err);
    res.status(500).json({ error: "Server error while rewriting" });
  }
}
