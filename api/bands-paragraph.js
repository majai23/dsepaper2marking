
export const runtime = 'edge';

export async function POST(req) {
  try {
    const { paragraphs = [] } = await req.json();

    if (!Array.isArray(paragraphs) || paragraphs.length === 0) {
      return new Response(JSON.stringify({ insights: [] }), { status: 400 });
    }

    const systemPrompt = "You are an HKDSE English teacher. Analyze the student's writing paragraph by paragraph. For each paragraph, return feedback on Content, Language, and Organisation. If it's just a greeting or closing, note that it is not applicable for full feedback.";

    const combinedContent = paragraphs
      .map((p, i) => `Paragraph ${i + 1}:
${p.trim()}`)
      .join("\n\n");

    const response = await fetch("https://dsegpt4marker.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2025-01-01-preview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.AZURE_OPENAI_KEY
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: combinedContent }
        ],
        temperature: 0.3,
        max_tokens: 3000
      })
    });

    const data = await response.json();
    const rawOutput = data.choices?.[0]?.message?.content || "⚠️ No response content.";
    const insights = rawOutput
      .split(/(?=🔎 Analyzing Paragraph \d+)/)
      .filter(p => p.trim());

    return new Response(JSON.stringify({ rawOutput, insights }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
