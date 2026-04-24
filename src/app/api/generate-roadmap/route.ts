import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────
// 30-Day fallback roadmap (no API key)
// ─────────────────────────────────────────────
function getFallbackRoadmap(company: string, level: string, language: string) {
  const weeks = [
    {
      week: 1, title: "Week 1: Basics",
      days: Array.from({ length: 7 }, (_, i) => ({
        day: i + 1,
        title: ["Arrays Basics", "Arrays Operations", "Searching in Arrays", "Strings Basics", "String Operations", "Hashing Basics", "Week 1 Revision"][i],
        topic: ["Arrays", "Arrays", "Arrays", "Strings", "Strings", "Hashing", "Revision"][i],
        desc: `🌟 Day ${i + 1}: Let's learn about ${["Arrays", "Arrays", "Arrays", "Strings", "Strings", "Hashing", "Revision"][i]}! It's like building blocks for your code. You're doing great!`,
        resources: [
          { label: "✅ LeetCode Practice", url: "https://leetcode.com/problemset/" },
          { label: "🧠 NeetCode Roadmap", url: "https://neetcode.io/roadmap" }
        ]
      }))
    },
    {
      week: 2, title: "Week 2: Smart Tricks",
      days: Array.from({ length: 7 }, (_, i) => ({
        day: i + 8,
        title: ["Hash Sets", "Hash Maps", "Two Pointers Basics", "Two Pointers Practice", "Sliding Window Basics", "Sliding Window Practice", "Week 2 Review"][i],
        topic: ["Hashing", "Hashing", "Two Pointers", "Two Pointers", "Sliding Window", "Sliding Window", "Revision"][i],
        desc: `🚀 Day ${i + 8}: Time for smart tricks! Today we focus on ${["Hash Sets", "Hash Maps", "Two Pointers", "Two Pointers", "Sliding Window", "Sliding Window", "Revision"][i]}. You're getting faster!`,
        resources: [
          { label: "✅ LeetCode Practice", url: "https://leetcode.com/problemset/" },
          { label: "🧠 NeetCode Roadmap", url: "https://neetcode.io/roadmap" }
        ]
      }))
    },
    {
      week: 3, title: "Week 3: Connections",
      days: Array.from({ length: 7 }, (_, i) => ({
        day: i + 15,
        title: ["Linked Lists Intro", "Linked List Operations", "Stacks Basics", "Queues Basics", "Stack & Queue Practice", "Recursion Basics", "Week 3 Review"][i],
        topic: ["Linked List", "Linked List", "Stack", "Queue", "Stack/Queue", "Recursion", "Revision"][i],
        desc: `🔗 Day ${i + 15}: Let's connect the dots! We are learning about ${["Linked Lists", "Linked Lists", "Stacks", "Queues", "Stacks/Queues", "Recursion", "Revision"][i]} today. So smart!`,
        resources: [
          { label: "✅ LeetCode Practice", url: "https://leetcode.com/problemset/" },
          { label: "🧠 NeetCode Roadmap", url: "https://neetcode.io/roadmap" }
        ]
      }))
    },
    {
      week: 4, title: "Week 4: The Big Map",
      days: Array.from({ length: 9 }, (_, i) => ({
        day: i + 22,
        title: ["Binary Trees Intro", "Tree Traversal", "Binary Search Trees", "Binary Search (Array)", "Sorting Basics", "Sorting Algorithms", "Graphs Intro", "Final Revision", "Final Mock Test"][i],
        topic: ["Trees", "Trees", "Trees", "Binary Search", "Sorting", "Sorting", "Graphs", "Revision", "Mock Test"][i],
        desc: `🌳 Day ${i + 22}: Master the big map! Today's focus: ${["Trees", "Trees", "Trees", "Binary Search", "Sorting", "Sorting", "Graphs", "Revision", "Mock Test"][i]}. You're almost a master!`,
        resources: [
          { label: "✅ LeetCode Practice", url: "https://leetcode.com/problemset/" },
          { label: "🧠 NeetCode Roadmap", url: "https://neetcode.io/roadmap" }
        ]
      }))
    }
  ];

  return weeks.flatMap(week =>
    week.days.map(day => {
      const isMockTest = day.title === "Final Mock Test";
      return {
        id: `day-${day.day}`,
        day: `Day ${day.day}`,
        title: day.title,
        desc: day.desc,
        topic: day.topic,
        week: week.week,
        weekTitle: week.title,
        resources: isMockTest ? [] : day.resources,
        isMockTest: isMockTest
      };
    })
  );
}

// ─────────────────────────────────────────────
// Main API Handler
// ─────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { company, daysLeft, weakSkill, level = "Beginner", language = "Python", hoursPerDay = "2" } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ roadmap: getFallbackRoadmap(company, level, language) });
    }

    const prompt = `You are Prep AI Roadmap Mentor.

Create a custom ${daysLeft} Days Coding Roadmap in very simple English for a student targeting ${company}.

Rules:
- No coding questions names like Two Sum, Valid Anagram.
- Only topic names.
- Example: Arrays, Strings, Hashing, Stack, Queue, Trees.
- Split into 4 Weeks.
- Mention Day wise plan from Day 1 to Day ${daysLeft}.
- Use beginner friendly English like teaching a child.
- Keep motivating tone.
- No difficult words.

For each day, provide:
1. Topic to study
2. LeetCode practice link: https://leetcode.com/problemset/
3. NeetCode roadmap link: https://neetcode.io/roadmap

Student Details:
- Level: ${level}
- Language: ${language}
- Focus: ${weakSkill}
- For the VERY FINAL DAY (Day ${daysLeft}), set "title" to "Final Mock Test", set "resources" to [], and set "isMockTest" to true.
- For all other days, set "isMockTest" to false.

Return ONLY a valid JSON object in this EXACT format:
{
  "roadmap": [
    {
      "id": "day-1",
      "day": "Day 1",
      "week": 1,
      "weekTitle": "Week 1: Basics",
      "title": "Arrays Basics",
      "topic": "Arrays",
      "desc": "🌟 Today we learn about Arrays! Think of them like a row of boxes. You are doing amazing! 🎉",
      "resources": [
        { "label": "✅ LeetCode Practice", "url": "https://leetcode.com/problemset/" },
        { "label": "🧠 NeetCode Roadmap", "url": "https://neetcode.io/roadmap" }
      ]
    }
  ]
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            response_mime_type: "application/json",
            temperature: 0.7,
            maxOutputTokens: 8192,
          },
        }),
      }
    );

    if (!response.ok) {
      console.error("Gemini error, using fallback roadmap");
      return NextResponse.json({ roadmap: getFallbackRoadmap(company, level, language) });
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    try {
      const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const result = JSON.parse(cleaned);
      if (!result.roadmap || result.roadmap.length === 0) {
        return NextResponse.json({ roadmap: getFallbackRoadmap(company, level, language) });
      }
      return NextResponse.json(result);
    } catch {
      console.error("JSON parse error, using fallback");
      return NextResponse.json({ roadmap: getFallbackRoadmap(company, level, language) });
    }

  } catch (error) {
    console.error("Roadmap error:", error);
    return NextResponse.json({ error: "Failed to generate roadmap" }, { status: 500 });
  }
}
