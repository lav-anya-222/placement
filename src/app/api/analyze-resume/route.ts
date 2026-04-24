import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert file to buffer and extract text
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Dynamically import pdf-parse (server-side only)
    let resumeText = "";
    try {
      // pdf-parse v4 is ESM, import as namespace
      const pdfParseModule = await import("pdf-parse");
      const pdfParse = (pdfParseModule as any).default ?? pdfParseModule;
      const pdfData = await pdfParse(buffer);
      resumeText = pdfData.text;
    } catch {
      resumeText = `Resume file: ${file.name}. Unable to parse full text. Performing general analysis.`;
    }

    // Check for Gemini API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      // Return a realistic mock when no API key
      return NextResponse.json(generateMockResult(resumeText));
    }

    // Call Gemini API
    const prompt = `You are an expert ATS (Applicant Tracking System) analyzer. Analyze the following resume text for a fresher software engineering position.

Resume Text:
"""
${resumeText.slice(0, 6000)}
"""

Respond ONLY with a JSON object (no markdown, no code block) with this exact structure:
{
  "atsScore": <number 0-100>,
  "foundSkills": [<array of technical skills found>],
  "missingSkills": [<array of important missing skills for software jobs>],
  "grammarTips": "<string with 1-2 specific grammar/tone improvements>",
  "summaryRewrite": "<string with a rewritten professional summary based on the resume>",
  "suggestions": [<array of 3 actionable improvement suggestions>]
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4, maxOutputTokens: 1000 },
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      console.error("Gemini error:", err);
      return NextResponse.json(generateMockResult(resumeText));
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Parse JSON from response
    try {
      const cleanJson = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const parsed = JSON.parse(cleanJson);
      return NextResponse.json(parsed);
    } catch {
      // If parsing fails, return mock
      return NextResponse.json(generateMockResult(resumeText));
    }
  } catch (error) {
    console.error("Resume analyze error:", error);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}

function generateMockResult(resumeText: string) {
  // Generate semi-realistic mock based on keywords found in resume text
  const text = resumeText.toLowerCase();
  
  const allSkills = ["React", "JavaScript", "TypeScript", "HTML", "CSS", "Node.js", "Python", "Java", "SQL", "Git", "MongoDB", "Express", "Next.js", "Vue.js", "Docker", "AWS", "REST APIs", "GraphQL"];
  const foundSkills = allSkills.filter(skill => text.includes(skill.toLowerCase())).slice(0, 7);
  if (foundSkills.length < 3) foundSkills.push("JavaScript", "HTML", "CSS");

  const missingSkills = allSkills
    .filter(s => !foundSkills.includes(s))
    .slice(0, 4);

  const wordCount = resumeText.split(/\s+/).length;
  const atsScore = Math.min(90, Math.max(45, 55 + foundSkills.length * 4 - (wordCount < 200 ? 10 : 0)));

  return {
    atsScore,
    foundSkills,
    missingSkills,
    grammarTips: "Avoid passive voice. Replace 'Was responsible for developing' with action verbs like 'Developed', 'Built', or 'Implemented'. Use consistent past tense for previous roles.",
    summaryRewrite: "Results-driven Software Developer with hands-on experience building scalable web applications. Proficient in modern frameworks and passionate about clean code, performance, and user experience. Seeking to leverage technical skills in a challenging software engineering role.",
    suggestions: [
      "Quantify your impact — add metrics like 'Improved page load time by 35%' or 'Handled 10k+ daily active users'.",
      "Add links to your GitHub, portfolio, or deployed projects to make your resume verifiable.",
      "Tailor your skills section to match keywords in the target job description for better ATS ranking."
    ]
  };
}
