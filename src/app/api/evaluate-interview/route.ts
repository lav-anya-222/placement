import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { question, answer, type } = await req.json();

    if (!question || !answer) {
      return NextResponse.json({ error: "Missing question or answer" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(generateMockFeedback(answer));
    }

    const prompt = `You are an expert ${type === "hr" ? "HR interviewer" : "technical interviewer"} evaluating a candidate's interview response.

Question: "${question}"
Candidate's Answer: "${answer}"

Score the answer and provide feedback. Respond ONLY with a JSON object (no markdown):
{
  "score": <number 0-100>,
  "confidence": <number 0-100>,
  "clarity": <number 0-100>,
  "critique": "<2-3 sentence specific feedback on what was good and what to improve>",
  "betterAnswer": "<a concise, improved version of the answer they should have given>"
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 600 },
        }),
      }
    );

    if (!response.ok) return NextResponse.json(generateMockFeedback(answer));

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    try {
      const clean = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      return NextResponse.json(JSON.parse(clean));
    } catch {
      return NextResponse.json(generateMockFeedback(answer));
    }
  } catch (error) {
    console.error("Interview evaluate error:", error);
    return NextResponse.json({ error: "Evaluation failed" }, { status: 500 });
  }
}

function generateMockFeedback(answer: string) {
  const wordCount = answer.split(/\s+/).length;
  const score = Math.min(90, Math.max(40, 50 + Math.min(wordCount, 50)));
  const confidence = Math.max(40, score - 5 + Math.floor(Math.random() * 10));
  const clarity = Math.max(40, score - 10 + Math.floor(Math.random() * 15));

  return {
    score,
    confidence,
    clarity,
    critique: wordCount < 20
      ? "Your answer is too brief. Interviewers expect 2-3 minute responses with specific examples using the STAR method (Situation, Task, Action, Result)."
      : "Good effort! Your answer shows awareness of the topic. To improve, structure it with the STAR method and back claims with concrete numbers or outcomes.",
    betterAnswer: "A stronger response would begin by briefly contextualizing your background, then provide a specific example with measurable results. End by connecting your experience to the value you'd bring to this role. For example: 'In my last project, I led a team of 3 to deliver a feature 2 weeks ahead of schedule by implementing agile sprints and daily standups, which cut blockers by 40%'."
  };
}
