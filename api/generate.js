export default async function handler(req, res) {
  const { topic, type, level, original } = req.body;

  const prompt = `
You are an HKDSE English writing examiner and coach.

Your task is to rewrite the student's original writing to a strong Level 5**.

Use more precise vocabulary, clearer structure, and logical flow. Keep the same ideas.

Highlight all improvements using **bold** formatting.

Student's original writing:
${original}
`;

  try {
    const response = await fetch("https://dsewriterai.openai.azure.com/openai/deployments/gpt4-dse/chat/completions?api-version=2024-02-15-preview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.AZURE_OPENAI_KEY
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are a professional HKDSE English Paper 2 rewriting coach." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 1600
      })
    });

    const data = await response.json();
    const writing = data.choices?.[0]?.message?.content;
    if (!writing) return res.status(500).json({ error: "No output generated" });
    res.status(200).json({ writing });
  } catch (err) {
    console.error("Brush-up GPT-4 Error:", err);
    res.status(500).json({ error: "Server error while rewriting" });
  }
}
