
export async function POST(req) {
  try {
    const { paragraphs, question } = await req.json();
    const results = [];

    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i];

      const prompt = \`
You are an HKDSE English Paper 2 writing examiner.

You will evaluate the student's paragraph based on three domains: Content (C), Language (L), and Organisation (O).

The writing question is:
\${question}

The paragraph to analyze is:
\${paragraph}

Return the following:
1. A heading: "🔎 Analyzing paragraph X..."
2. Feedback including:
   - Content: 2-3 sentences
   - Language: 2-3 sentences
   - Organisation: 2-3 sentences
3. At the end, include this on a separate line: [C:x][L:x][O:x] where x is the band score (1-7)

Your response must be fully self-contained and not reference any prior output.
\`;

      const response = await fetch("https://dsegpt4marker.openai.azure.com/openai/deployments/gpt-4o/chat/completions?api-version=2024-03-01", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": process.env.OPENAI_API_KEY,
        },
        body: JSON.stringify({
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          max_tokens: 800,
          temperature: 0.4,
        }),
      });

      const json = await response.json();
      const feedback = json.choices?.[0]?.message?.content || "❌ Error generating feedback.";
      results.push(feedback);
    }

    return new Response(JSON.stringify({ insights: results }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in bands-paragraph endpoint:", error);
    return new Response(JSON.stringify({ error: "❌ Failed to process paragraph analysis." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
