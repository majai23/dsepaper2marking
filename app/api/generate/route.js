export const runtime = 'edge';

export async function POST(req) {
  const { original } = await req.json();

  if (!original) {
    return new Response(JSON.stringify({ error: "Missing input writing" }), { status: 400 });
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
      const azureResponse = await fetch("https://dsegpt4marker.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2025-01-01-preview", {
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

      if (!azureResponse.ok) {
        const errorText = await azureResponse.text();
        console.error("Azure GPT error:", errorText);
        rewrittenParagraphs.push(`❌ Azure GPT error: ${azureResponse.status}`);
        continue;
      }

      const data = await azureResponse.json();
      const rewritten = data.choices?.[0]?.message?.content;
      rewrittenParagraphs.push(rewritten?.trim() || "⚠️ No content returned.");
    } catch (err) {
      console.error("Edge Function Error:", err);
      rewrittenParagraphs.push("❌ Unexpected server error.");
    }
  }

  const finalOutput = rewrittenParagraphs.join("\n\n");
  return new Response(JSON.stringify({ writing: finalOutput }), {
    headers: { "Content-Type": "application/json" },
    status: 200
  });
}
