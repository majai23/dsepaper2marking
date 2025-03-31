export default async function handler(req, res) {
  const { original } = req.body;

  if (!original) {
    return res.status(400).json({ error: "Missing input writing" });
  }

  const paragraphs = original.split(/\n{2,}/).filter(p => p.trim().length > 0);
  const rewrittenParagraphs = [];

  for (const para of paragraphs) {
    const prompt = `
You are an HKDSE English Paper 2 rewriting coach.

Polish the following paragraph to a strong Level 5**.

Improve clarity, word choice, sentence structure, and flow.

Highlight all improvements using **bold** formatting.

Original paragraph:
${para}
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

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Azure GPT Error Response:", errorText);
        rewrittenParagraphs.push(`❌ Azure GPT error: ${response.status}`);
        continue;
      }

      const data = await response.json();
      const rewritten = data.choices?.[0]?.message?.content;
      if (!rewritten) {
        rewrittenParagraphs.push("⚠️ GPT returned no content for this paragraph.");
      } else {
        rewrittenParagraphs.push(rewritten.trim());
      }
    } catch (err) {
      console.error("Error rewriting paragraph:", err);
      rewrittenParagraphs.push("❌ Unexpected server error.");
    }
  }

  const finalOutput = rewrittenParagraphs.join("\n\n");
  res.status(200).json({ writing: finalOutput });
}
