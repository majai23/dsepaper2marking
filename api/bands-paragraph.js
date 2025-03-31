export const runtime = 'edge';

export async function POST(req) {
  try {
    const { paragraph = "", position = "body" } = await req.json();

    if (!paragraph.trim()) {
      return new Response(JSON.stringify({ paragraphAnalysis: "⚠️ Empty paragraph." }), { status: 400 });
    }

    const systemPrompt = "You are an HKDSE English teacher. Analyze the student's writing paragraph by paragraph. For each paragraph, return feedback on Content, Language, and Organisation. If it's just a greeting or closing, note that it is not applicable for full feedback.";

    const response = await fetch("https://dsegpt4marker.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2025-01-01-preview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.AZURE_OPENAI_KEY
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Paragraph (${position}):\n${paragraph.trim()}` }
        ],
        temperature: 0.3,
        max_tokens: 1200
      })
    });

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || "⚠️ No feedback generated.";

    return new Response(JSON.stringify({ paragraphAnalysis: analysis }), { status: 200 });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
