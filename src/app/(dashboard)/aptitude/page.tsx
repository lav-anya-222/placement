"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Target, Timer, ArrowRight, RefreshCw, Trophy, Brain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import { aptitudeQuestions, AptitudeQuestion } from "@/data/aptitude";

export default function AptitudePage() {
  const [activeTab, setActiveTab] = useState<"Quant" | "Logical" | "Verbal">("Quant");
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedAns, setSelectedAns] = useState("");
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600);
  const [isStarted, setIsStarted] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState<{ id: number; correct: boolean }[]>([]);
  const [activeQuestions, setActiveQuestions] = useState<AptitudeQuestion[]>([]);

  const addXp = useStore((state) => state.addXp);
  const markQuizAttempted = useStore((state) => state.markQuizAttempted);
  const [usedCount, setUsedCount] = useState(0);

  useEffect(() => {
    // Initialize used count on load
    const used = JSON.parse(localStorage.getItem("usedApti") || "[]");
    setUsedCount(used.length);
  }, [isStarted]);

  const getNewQuestions = () => {
    const categoryQuestions = aptitudeQuestions.filter(q => q.topic === activeTab);
    let used = JSON.parse(localStorage.getItem("usedApti") || "[]");
    let unused = categoryQuestions.filter(q => !used.includes(q.id));

    if (unused.length < 10) {
      toast.info("All questions in this category attempted. Loading fresh set!");
      
      // Keep other categories' used questions, only remove this category's IDs from used
      const categoryIds = categoryQuestions.map(q => q.id);
      used = used.filter((id: number) => !categoryIds.includes(id));
      localStorage.setItem("usedApti", JSON.stringify(used));
      
      unused = categoryQuestions;
    }

    const shuffled = [...unused].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 10);

    const updatedUsed = [...used, ...selected.map(q => q.id)];
    localStorage.setItem("usedApti", JSON.stringify(updatedUsed));
    setUsedCount(updatedUsed.length);

    return selected;
  };

  const handleStart = () => {
    const newQs = getNewQuestions();
    setActiveQuestions(newQs);
    setIsStarted(true);
  };

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isStarted && !showResult && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    } else if (timeLeft === 0 && isStarted) {
      handleFinish();
    }
    return () => clearInterval(timer);
  }, [isStarted, showResult, timeLeft]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleNext = () => {
    if (!selectedAns) return toast.error("Please select an answer");
    const currentQuestion = activeQuestions[currentQIndex];
    const isCorrect = selectedAns === currentQuestion.correct;
    
    const newAnswered = [...answeredQuestions, { id: currentQuestion.id, correct: isCorrect }];
    setAnsweredQuestions(newAnswered);
    if (isCorrect) setScore(prev => prev + 1);

    if (currentQIndex < activeQuestions.length - 1) {
      setCurrentQIndex(prev => prev + 1);
      setSelectedAns("");
    } else {
      handleFinish(newAnswered.filter(q => q.correct).length);
    }
  };

  const handleFinish = (finalScore?: number) => {
    setShowResult(true);
    const s = finalScore ?? score;
    addXp(20);
    markQuizAttempted(Date.now());
    toast.success("+20 XP! Quiz completed.", {
      description: `You scored ${s}/${activeQuestions.length}`,
      icon: <Trophy className="text-yellow-500 w-5 h-5" />,
    });
  };

  const resetQuiz = () => {
    setIsStarted(false);
    setShowResult(false);
    setCurrentQIndex(0);
    setScore(0);
    setSelectedAns("");
    setTimeLeft(600);
    setAnsweredQuestions([]);
    setActiveQuestions([]);
  };

  if (!isStarted) {
    return (
      <div className="p-8 max-w-4xl mx-auto flex flex-col items-center justify-center min-h-[80vh] text-center space-y-6">
        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center">
          <Brain className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-4xl font-bold text-white">Aptitude Practice</h1>
        <p className="text-zinc-400 max-w-lg text-lg">10 randomized MCQs per session. Timed 10 minutes. AI feedback after every attempt. No repeated questions until all are used! +20 XP on completion.</p>
        <Tabs defaultValue="Quant" className="w-full max-w-sm pt-4" onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="grid grid-cols-3 w-full bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="Quant">Quant</TabsTrigger>
            <TabsTrigger value="Logical">Logical</TabsTrigger>
            <TabsTrigger value="Verbal">Verbal</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="grid grid-cols-3 gap-4 text-center pt-2">
          {["Quant", "Logical", "Verbal"].map(t => (
            <div key={t} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl">
              <p className="text-2xl font-bold text-white">{aptitudeQuestions.filter(q => q.topic === t).length}</p>
              <p className="text-xs text-zinc-400">{t} Questions</p>
            </div>
          ))}
        </div>
        <Button size="lg" className="h-14 px-12 text-lg font-bold mt-4" onClick={handleStart}>
          Start {activeTab} Quiz (10 Mins)
        </Button>
      </div>
    );
  }

  if (showResult) {
    const correct = answeredQuestions.filter(q => q.correct).length;
    const pct = Math.round((correct / activeQuestions.length) * 100);
    return (
      <div className="p-8 max-w-3xl mx-auto space-y-8">
        <Card className="bg-zinc-900 border-zinc-800 text-center py-12">
          <CardContent className="space-y-6">
            <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trophy className="w-12 h-12 text-yellow-500" />
            </div>
            <h2 className="text-3xl font-bold text-white">Test Completed!</h2>
            <div className="flex justify-center gap-8 py-4">
              <div>
                <p className="text-zinc-500 text-sm uppercase tracking-wider mb-1">Your Score</p>
                <p className="text-5xl font-bold text-white">{correct}<span className="text-2xl text-zinc-600">/{activeQuestions.length}</span></p>
              </div>
              <div className="w-px bg-zinc-800" />
              <div>
                <p className="text-zinc-500 text-sm uppercase tracking-wider mb-1">Accuracy</p>
                <p className={`text-5xl font-bold ${pct >= 70 ? 'text-green-500' : pct >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>{pct}%</p>
              </div>
            </div>
            <div className="max-w-md mx-auto bg-black border border-white/5 p-4 rounded-xl text-left">
              <h4 className="font-semibold text-white mb-2">AI Analysis</h4>
              <p className="text-zinc-400 text-sm">
                {pct >= 70
                  ? `Excellent performance! You scored ${pct}% in ${activeTab}. You're in good shape. Focus on speed — try to solve each question in under 60 seconds.`
                  : pct >= 50
                  ? `Decent attempt! Your ${activeTab} skills need some polish. Review the questions you got wrong and identify patterns in your mistakes.`
                  : `Your ${activeTab} needs focused practice. Spend 30 minutes daily on ${activeTab} problems and retake this test in 3 days.`
                }
              </p>
            </div>
            {/* Answer review */}
            <div className="max-w-md mx-auto space-y-2 text-left">
              {activeQuestions.map((q, i) => {
                const ans = answeredQuestions.find(a => a.id === q.id);
                return (
                  <div key={q.id} className={`p-3 rounded-xl border text-sm flex items-start gap-2 ${ans?.correct ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
                    <span className={`font-bold ${ans?.correct ? 'text-green-500' : 'text-red-500'}`}>{i + 1}.</span>
                    <div>
                      <p className="text-zinc-300 mb-1 line-clamp-1">{q.question}</p>
                      {!ans?.correct && <p className="text-xs text-zinc-500">✓ {q.correct} — {q.explanation}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
            <Button onClick={resetQuiz} variant="outline" className="mt-4 border-primary/50 text-primary hover:bg-primary/10">
              <RefreshCw className="w-4 h-4 mr-2" /> Start New Test
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const question = activeQuestions[currentQIndex];
  if (!question) return null; // safety

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-2xl font-bold text-white">Aptitude: {activeTab}</h1>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full border font-mono font-bold text-lg ${timeLeft < 60 ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-zinc-900 border-zinc-800 text-zinc-300'}`}>
          <Timer className="w-4 h-4" /> {formatTime(timeLeft)}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-2">
        <Progress value={(currentQIndex / activeQuestions.length) * 100} className="h-2 flex-1" />
        <span className="text-sm text-zinc-400 shrink-0">{currentQIndex + 1} / {activeQuestions.length}</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={currentQIndex} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
          <Card className="bg-zinc-900 border-zinc-800 shadow-xl">
            <CardHeader className="border-b border-white/5 pb-6">
              <p className="text-sm text-zinc-500 mb-2">Question {currentQIndex + 1} of {activeQuestions.length}</p>
              <CardTitle className="text-xl text-white leading-relaxed">{question.question}</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <RadioGroup value={selectedAns} onValueChange={setSelectedAns} className="space-y-3">
                {question.options.map((opt, i) => (
                  <div key={i}
                    className={`flex items-center space-x-3 p-4 rounded-xl border transition-all cursor-pointer ${selectedAns === opt ? 'bg-primary/20 border-primary' : 'bg-black border-zinc-800 hover:border-zinc-600'}`}
                    onClick={() => setSelectedAns(opt)}>
                    <RadioGroupItem value={opt} id={`opt-${i}`} className="text-primary border-zinc-500" />
                    <Label htmlFor={`opt-${i}`} className="text-base text-zinc-300 cursor-pointer flex-1">{opt}</Label>
                  </div>
                ))}
              </RadioGroup>
            </CardContent>
            <CardFooter className="pt-4 border-t border-white/5 flex justify-between">
              <div className="text-xs text-zinc-500">{usedCount} total questions practiced</div>
              <Button className="bg-white text-black hover:bg-zinc-200 font-semibold px-8" onClick={handleNext} disabled={!selectedAns}>
                {currentQIndex === activeQuestions.length - 1 ? 'Finish Test' : 'Next Question'} <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
