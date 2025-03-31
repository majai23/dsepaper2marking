export default async function handler(req, res) {
  const { paragraph, level = "5**" } = req.body;

  if (!paragraph) {
    return res.status(400).json({ error: "Missing paragraph" });
  }

  const prompt = `
You are an HKDSE English Paper 2 rewriting coach.

Rewrite ONLY the following paragraph to a strong Level ${level} standard.

Improve clarity, tone, word choice, sentence structure, and logical flow.

Then, explain the changes made in 2–5 bullet points, showing what was improved and why.

Focus ONLY on this paragraph. Do not merge, summarize, or anticipate other paragraphs.

If the paragraph is a salutation or complimentary close (e.g., “Dear Sir”, “Yours faithfully”), adjust it to match the appropriate tone and formality of the writing.

Even if the paragraph is very short or a standalone line, rewrite it meaningfully.

Highlight all improvements using **bold** formatting.

Format your reply like this:
**Rewritten Paragraph:**
<new paragraph with **bold** enhancements>

**Improvements Made:**
- Point 1...
- Point 2...

Here is the original paragraph:
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
        temperature: 0.5,
        max_tokens: 600
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
