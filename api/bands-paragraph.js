
export const runtime = 'edge';

export async function POST(req) {
  try {
    const { paragraphs = [] } = await req.json();

    if (!Array.isArray(paragraphs) || paragraphs.length === 0) {
      return new Response(JSON.stringify({ insights: [] }), { status: 400 });
    }

    const systemPrompt = "You are an HKDSE English teacher. For each paragraph, return its Content, Language, and Organisation feedback. If it's a greeting or closing (like 'Dear sir / madam', 'Thank you', 'Yours sincerely'), note that in feedback and say it's not applicable to scoring.";

    const formattedMessages = paragraphs.map((text, index) => {
      const lower = text.trim().toLowerCase();
      const isGreeting = lower.includes("dear") && lower.includes("sir");
      const isClosing = lower.includes("yours") || lower.includes("sincerely") || lower.includes("faithfully") || lower.includes("thank you") || lower.length < 10;
      const hint = isGreeting
        ? "(This is a greeting or salutation.)"
        : isClosing
        ? "(This is a closing or standalone polite phrase.)"
        : "";

      return {
        role: "user",
        content: `Paragraph ${index + 1}: ${hint}\n${text}`
      };
    });

    const response = await fetch("https://dsegpt4marker.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2025-01-01-preview", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.AZURE_OPENAI_KEY
      },
      body: JSON.stringify({
        messages: [{ role: "system", content: systemPrompt }, ...formattedMessages],
        temperature: 0.3,
        max_tokens: 2200
      })
    });

    const data = await response.json();
    const insights = data.choices?.[0]?.message?.content?.split(/\n(?=🔎|✅|❌|\*\*|Paragraph)/) || [];
    return new Response(JSON.stringify({ insights }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
