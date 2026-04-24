import { aptitudeQuestions } from "./aptitude";
import { codingQuestions } from "./coding";

export interface MockQuestion {
  id: string;
  question: string;
  options?: string[];
  answer: string;
  explanation: string;
  type: 'aptitude' | 'reasoning' | 'verbal' | 'coding';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  // For coding
  starterCode?: string;
  problem?: string;
  input?: string;
  output?: string;
}

export interface MockTestSet {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Extreme';
  sections: {
    type: 'aptitude' | 'reasoning' | 'verbal' | 'coding';
    count: number;
  }[];
  questions: MockQuestion[];
}

// Helper to convert aptitude to mock
const aptToMock = (q: any): MockQuestion => ({
  id: `apt-${q.id}`,
  question: q.question,
  options: q.options,
  answer: q.correct,
  explanation: q.explanation,
  type: q.topic.toLowerCase() === 'quant' ? 'aptitude' : q.topic.toLowerCase() === 'logical' ? 'reasoning' : q.topic.toLowerCase() as any,
  difficulty: q.id < 115 ? 'Easy' : q.id < 125 ? 'Medium' : 'Hard'
});

// Helper to convert coding to mock
const codingToMock = (q: any): MockQuestion => ({
  id: `code-${q.id}`,
  question: q.title,
  problem: q.problem,
  input: q.input,
  output: q.output,
  starterCode: q.starterCode,
  answer: "Code submission",
  explanation: "Standard optimized solution",
  type: 'coding',
  difficulty: q.difficulty
});

const getAptQuestions = (topic: string, count: number) => {
  return aptitudeQuestions
    .filter(q => q.topic.toLowerCase() === topic.toLowerCase())
    .sort(() => 0.5 - Math.random())
    .slice(0, count)
    .map(aptToMock);
};

const getCodingQuestions = (count: number) => {
  return codingQuestions
    .sort(() => 0.5 - Math.random())
    .slice(0, count)
    .map(codingToMock);
};

export const MOCK_TEST_SETS: MockTestSet[] = Array.from({ length: 10 }, (_, i) => ({
  id: `set-${i + 1}`,
  title: `Mock Test ${i + 1}: ${["Foundation", "Core Skills", "Intermediate", "Mixed Pattern", "TCS Pattern", "Infosys Pattern", "Accenture Pattern", "Product Special", "Advanced Mixed", "Grand Final"][i]}`,
  description: `Complete assessment with 5 Coding problems and 25 Aptitude questions.`,
  duration: 60, // Total 60, but we will manage section timers in the UI
  difficulty: i < 3 ? 'Easy' : i < 7 ? 'Medium' : i < 9 ? 'Hard' : 'Extreme',
  sections: [
    { type: 'coding', count: 5 },
    { type: 'aptitude', count: 10 },
    { type: 'reasoning', count: 10 },
    { type: 'verbal', count: 5 }
  ],
  questions: [
    ...getCodingQuestions(5),
    ...getAptQuestions('Quant', 10),
    ...getAptQuestions('Logical', 10),
    ...getAptQuestions('Verbal', 5)
  ]
}));
