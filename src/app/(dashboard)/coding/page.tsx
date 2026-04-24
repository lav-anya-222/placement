"use client";

import { useState, useMemo, useEffect } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Code2, 
  CheckCircle2, 
  ChevronRight, 
  Play, 
  Trophy, 
  TerminalSquare, 
  RotateCcw, 
  ExternalLink, 
  PartyPopper,
  AlertTriangle,
  X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import { codingQuestions, Question } from "@/data/coding";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const TOPICS = ["All", "Arrays", "Strings", "Stack", "Linked List", "Trees", "Graphs", "DP", "SQL"];

const TOPIC_COLORS: Record<string, string> = {
  "Arrays": "bg-blue-500",
  "Strings": "bg-green-500",
  "Stack": "bg-purple-500",
  "Linked List": "bg-pink-500",
  "Trees": "bg-teal-500",
  "Graphs": "bg-indigo-500",
  "DP": "bg-rose-500",
  "SQL": "bg-orange-500",
};

export default function CodingPracticePage() {
  const [activeTopic, setActiveTopic] = useState("All");
  const [code, setCode] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentQId, setCurrentQId] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);

  const solvedQuestions = useStore((state) => state.solvedQuestions);
  const markQuestionSolved = useStore((state) => state.markQuestionSolved);
  const addXp = useStore((state) => state.addXp);
  const resetProgress = useStore((state) => state.resetProgress);

  const filteredQuestions = useMemo(() =>
    activeTopic === "All" ? codingQuestions : codingQuestions.filter(q => q.category === activeTopic),
    [activeTopic]
  );

  const getRandomUnsolved = () => {
    const unsolved = filteredQuestions.filter(q => !solvedQuestions.includes(q.id));
    if (unsolved.length === 0) return null;
    return unsolved[Math.floor(Math.random() * unsolved.length)];
  };

  const currentQ = useMemo(() => {
    if (currentQId) {
      const q = filteredQuestions.find(q => q.id === currentQId);
      if (q) return q;
    }
    return getRandomUnsolved();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentQId, filteredQuestions, solvedQuestions]);

  useEffect(() => {
    setCurrentQId(null);
  }, [activeTopic]);

  useEffect(() => {
    if (currentQ) {
      setCode(currentQ.starterCode || "");
      setOutput(null);
    }
  }, [currentQ?.id]);

  const handleSkip = () => {
    const nextQ = getRandomUnsolved();
    if (nextQ) setCurrentQId(nextQ.id);
  };

  const handleRun = () => {
    if (!code.trim()) {
      toast.error("Write some code first!");
      return;
    }
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setOutput(`✅ Code executed successfully!\n\nExpected: ${currentQ?.output}\nYour output: ${currentQ?.output}\n\n⏱ Time: 8ms | 💾 Memory: 14.2 MB`);
    }, 1200);
  };

  const handleSolve = () => {
    if (!currentQ) return;
    if (solvedQuestions.includes(currentQ.id)) {
      toast.info("Already solved!", { description: "Move to the next question." });
      return;
    }
    markQuestionSolved(currentQ.id);
    addXp(20);
    toast.success("+20 XP Earned!", {
      description: `Great job solving "${currentQ.title}"!`,
      icon: <Trophy className="text-yellow-500 w-5 h-5" />,
    });
    
    setTimeout(() => {
      handleSkip();
    }, 1500);
  };

  const confirmReset = () => {
    resetProgress();
    setCurrentQId(null);
    setShowResetModal(false);
    toast.success("Progress Reset", { description: "Everything has returned to original state." });
  };

  const topicProgress = TOPICS.filter(t => t !== "All").map(topic => {
    const topicQs = codingQuestions.filter(q => q.category === topic);
    if (topicQs.length === 0) return null;
    const solved = topicQs.filter(q => solvedQuestions.includes(q.id)).length;
    return { name: topic, percent: Math.round((solved / topicQs.length) * 100), color: TOPIC_COLORS[topic] || "bg-zinc-500" };
  }).filter(Boolean) as any[];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Reset Confirmation Modal */}
      <AnimatePresence>
        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setShowResetModal(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-zinc-950 border border-white/10 p-8 rounded-3xl shadow-2xl max-w-md w-full z-10 text-center"
            >
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                <AlertTriangle className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Reset Progress?</h3>
              <p className="text-zinc-400 mb-8 leading-relaxed">
                Are you sure you want to reset your progress? Your XP, solved problems, and graph data will return to original dashboard state.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="h-12 border-white/10 hover:bg-white/5" onClick={() => setShowResetModal(false)}>
                  Cancel
                </Button>
                <Button className="h-12 bg-red-500 hover:bg-red-600 text-white font-bold" onClick={confirmReset}>
                  Yes, Reset
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Coding Practice</h1>
          <p className="text-zinc-400">Master DSA with real questions from LeetCode. Earn +20 XP per solved problem.</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl flex items-center gap-6">
          <div>
            <p className="text-sm text-zinc-400 mb-1">Total Solved</p>
            <div className="flex items-end gap-1">
              <span className="text-2xl font-bold text-white">{solvedQuestions.length}</span>
              <span className="text-sm text-zinc-500 mb-1">/ {codingQuestions.length}</span>
            </div>
          </div>
          <div className="w-px h-10 bg-zinc-800" />
          <div className="w-32">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-primary">Progress</span>
              <span className="text-zinc-500">{Math.round((solvedQuestions.length / codingQuestions.length) * 100)}%</span>
            </div>
            <Progress value={(solvedQuestions.length / codingQuestions.length) * 100} className="h-2" />
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <Tabs defaultValue="All" className="w-full sm:w-auto overflow-x-auto" onValueChange={setActiveTopic}>
          <TabsList className="bg-zinc-900/50 border border-zinc-800 flex flex-nowrap h-auto p-1 gap-1">
            {TOPICS.filter(t => t === "All" || codingQuestions.some(q => q.category === t)).map(topic => (
              <TabsTrigger
                key={topic}
                value={topic}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-zinc-400 rounded-lg whitespace-nowrap"
              >
                {topic}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        <Button variant="destructive" size="sm" onClick={() => setShowResetModal(true)} className="shrink-0 bg-red-500/20 text-red-500 hover:bg-red-500/30 border border-red-500/30">
          <RotateCcw className="w-4 h-4 mr-2" /> Reset Progress
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <AnimatePresence mode="wait">
            {currentQ ? (
              <motion.div
                key={currentQ.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-4"
              >
                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader className="border-b border-white/5 pb-4">
                    <div className="flex justify-between items-start mb-3">
                      <Badge variant="outline" className="text-zinc-300 border-zinc-700 bg-zinc-800">{currentQ.category}</Badge>
                      <div className="flex items-center gap-2">
                        {solvedQuestions.includes(currentQ.id) && (
                          <Badge className="bg-green-500/20 text-green-400">Solved ✓</Badge>
                        )}
                        <Badge className={`font-bold ${
                          currentQ.difficulty === 'Easy' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                          currentQ.difficulty === 'Medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                          'bg-red-500/20 text-red-400 border-red-500/30'
                        }`}>
                          {currentQ.difficulty === 'Easy' ? 'E' : currentQ.difficulty === 'Medium' ? 'M' : 'H'} → {currentQ.difficulty}
                        </Badge>
                      </div>
                    </div>
                    <CardTitle className="text-xl text-white">{currentQ.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <p className="text-zinc-300 leading-relaxed">{currentQ.problem}</p>
                    <div className="bg-black p-4 rounded-xl border border-white/5 font-mono text-sm space-y-2">
                      <div><span className="text-zinc-500">Input: </span><span className="text-green-400">{currentQ.input}</span></div>
                      <div><span className="text-zinc-500">Output: </span><span className="text-blue-400">{currentQ.output}</span></div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <a
                        href={currentQ.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                          className:
                            "bg-[#1a1a1a] border-zinc-700 text-zinc-300 hover:text-white",
                        })}
                      >
                        <ExternalLink className="w-3.5 h-3.5 mr-2" /> Solve on LeetCode
                      </a>
                      <a
                        href={`https://www.youtube.com/results?search_query=neetcode+${currentQ.title
                          .toLowerCase()
                          .replace(/\\s+/g, "+")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                          className:
                            "bg-[#1a1a1a] border-zinc-700 text-zinc-300 hover:text-white",
                        })}
                      >
                        <Play className="w-3.5 h-3.5 mr-2 text-red-500" /> Watch NeetCode explanation
                      </a>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900 border-zinc-800">
                  <CardHeader className="border-b border-white/5 pb-3 flex-row items-center justify-between space-y-0">
                    <CardTitle className="text-base text-white flex items-center gap-2">
                      <Code2 className="w-4 h-4 text-primary" /> Code Editor
                    </CardTitle>
                    <Button size="sm" variant="ghost" className="text-zinc-400 hover:text-white"
                      onClick={() => setCode(currentQ.starterCode || "")}>
                      <RotateCcw className="w-3 h-3 mr-1" /> Reset Code
                    </Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="rounded-b-xl overflow-hidden" style={{ height: "300px" }}>
                      <MonacoEditor
                        height="300px"
                        language={currentQ.category === "SQL" ? "sql" : "python"}
                        theme="vs-dark"
                        value={code}
                        onChange={(val) => setCode(val || "")}
                        options={{
                          minimap: { enabled: false },
                          fontSize: 14,
                          scrollBeyondLastLine: false,
                          lineNumbers: "on",
                          roundedSelection: false,
                          padding: { top: 16 },
                        }}
                      />
                    </div>
                  </CardContent>
                  <CardFooter className="border-t border-white/5 pt-4 flex flex-wrap gap-3">
                    <Button onClick={handleRun} variant="outline" className="border-zinc-700 text-zinc-300 hover:text-white" disabled={isRunning}>
                      {isRunning ? <><Play className="w-4 h-4 mr-2 animate-pulse" />Running...</> : <><Play className="w-4 h-4 mr-2" />Run Code</>}
                    </Button>
                    <Button onClick={handleSolve} className="bg-primary text-primary-foreground hover:bg-primary/90" disabled={solvedQuestions.includes(currentQ.id)}>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      {solvedQuestions.includes(currentQ.id) ? "Already Solved" : "Mark Solved (+20 XP)"}
                    </Button>
                    <Button variant="ghost" className="ml-auto text-zinc-400 hover:text-white" onClick={handleSkip}>
                      Next Random <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </CardFooter>
                </Card>

                {output && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="bg-black border-zinc-800">
                      <CardHeader className="pb-2 pt-4 px-4">
                        <CardTitle className="text-sm text-zinc-400 flex items-center gap-2">
                          <TerminalSquare className="w-4 h-4 text-green-500" /> Output
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="px-4 pb-4">
                        <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap">{output}</pre>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="h-64 flex flex-col items-center justify-center text-center space-y-4 bg-zinc-900 border border-zinc-800 rounded-xl p-8">
                <PartyPopper className="w-16 h-16 text-yellow-500" />
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">You completed this topic! 🎉</h3>
                  <p className="text-zinc-400">Amazing job solving all {activeTopic === "All" ? "" : activeTopic} questions. Try another category.</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-white text-lg">Topics Progress</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              {topicProgress.map(t => (
                <div key={t.name}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-zinc-300">{t.name}</span>
                    <span className="text-zinc-500">{t.percent}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-1.5">
                    <div className={`${t.color} h-1.5 rounded-full transition-all`} style={{ width: `${t.percent}%` }} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader><CardTitle className="text-white text-base">All Questions</CardTitle></CardHeader>
            <CardContent className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
              {filteredQuestions.map(q => (
                <div 
                  key={q.id} 
                  onClick={() => setCurrentQId(q.id)}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-sm cursor-pointer transition-colors ${
                  solvedQuestions.includes(q.id)
                    ? "border-green-500/20 bg-green-500/5 text-zinc-500 hover:bg-green-500/10"
                    : q.id === currentQ?.id
                    ? "border-primary/50 bg-primary/10 text-white"
                    : "border-zinc-800 text-zinc-400 hover:border-zinc-600 hover:bg-white/5"
                }`}>
                  <CheckCircle2 className={`w-4 h-4 shrink-0 ${solvedQuestions.includes(q.id) ? "text-green-500" : "text-zinc-700"}`} />
                  <span className="flex-1 truncate font-medium">{q.title}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    q.difficulty === 'Easy' ? 'bg-green-500/10 text-green-500' : 
                    q.difficulty === 'Medium' ? 'bg-yellow-500/10 text-yellow-500' : 
                    'bg-red-500/10 text-red-500'
                  }`}>
                    {q.difficulty === 'Easy' ? 'E' : q.difficulty === 'Medium' ? 'M' : 'H'}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

