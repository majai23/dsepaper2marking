export default async function handler(req, res) {
  const { writing, level, mode } = req.body;

  if (!writing || !level) {
    return res.status(400).json({ error: "Missing writing or level" });
  }

  const max_tokens = mode === "detailed" ? 1000 : 600;

  const prompt = mode === "detailed"
    ? `You are an HKDSE English Paper 2 examiner.

Evaluate the student's writing below and be concise. Assign band scores (1–7) for:
- Content (C)
- Language (L)
- Organisation (O)

Give 1–2 sentence comments on each:
✅ What is good
✘ What needs improvement

Finish with 2–3 short suggestions to improve to Level 5 and 5**.

Student writing:
${writing}`
    : `You are an HKDSE English Paper 2 examiner.

Briefly comment on this student's writing in 3 areas:
C: Content
L: Language
O: Organisation

Student writing:
${writing}`;

  try {
    const response = await fetch("https://dsegpt4marker.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2025-01-01-preview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.AZURE_OPENAI_KEY
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "You are a concise but helpful HKDSE English examiner." },
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
    console.error("GPT-4o Feedback Timeout:", err);
    res.status(504).json({ error: "Timeout or server error while generating feedback" });
  }
}
