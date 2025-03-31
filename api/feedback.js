export default async function handler(req, res) {
  const { writing, level, mode } = req.body;

  if (!writing || !level) {
    return res.status(400).json({ error: "Missing writing or level" });
  }

  const max_tokens = mode === "detailed" ? 1400 : 1000;

  const prompt = mode === "detailed"
    ? `You are an HKDSE English Paper 2 examiner.

Evaluate the following student writing. Assign band scores from 1–7 for Content, Language, and Organisation.

Then give short comments on strengths and weaknesses in each domain.

End with a list of suggestions to improve the writing to Level 5 and 5**.

Student Writing:
${writing}`
    : `You are an HKDSE English Paper 2 examiner.

Give brief feedback on the student's writing under 3 categories:

C: (Content)  
L: (Language)  
O: (Organisation)

Student Writing:
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
          { role: "system", content: "You are a strict and supportive HKDSE English Paper 2 examiner." },
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
