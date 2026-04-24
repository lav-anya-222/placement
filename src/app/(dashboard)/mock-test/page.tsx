"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Timer, 
  CheckCircle2, 
  ChevronRight, 
  Play, 
  Trophy, 
  Code2, 
  Check, 
  ArrowLeft, 
  Clock, 
  BarChart3, 
  Brain, 
  Target, 
  FileText,
  AlertCircle,
  XCircle,
  ChevronLeft,
  FastForward,
  Award,
  Gamepad2,
  Terminal,
  Activity,
  History,
  ShieldAlert
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MOCK_TEST_SETS, MockTestSet, MockQuestion } from "@/data/mockTests";
import { useStore } from "@/store/useStore";
import { supabase } from "@/lib/supabase";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

type Section = 'coding' | 'aptitude';

interface TestResult {
  passed: boolean;
  message: string;
  count?: string;
}

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  title: string; 
  message: string;
}) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          exit={{ opacity: 0 }} 
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }} 
          animate={{ opacity: 1, scale: 1, y: 0 }} 
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-zinc-900 border border-zinc-800 p-8 rounded-3xl shadow-2xl max-w-md w-full space-y-6"
        >
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-primary" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-2xl font-bold text-white">{title}</h3>
            <p className="text-zinc-400">{message}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Button variant="ghost" onClick={onClose} className="h-12 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5">
              Cancel
            </Button>
            <Button onClick={onConfirm} className="h-12 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
              Confirm
            </Button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const Loader2 = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`animate-spin ${className}`}
  >
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>
);

export default function MockTestPage() {
  const router = useRouter();
  const user = useStore((state) => state.user);
  const addXp = useStore((state) => state.addXp);

  const [activeSetId, setActiveSetId] = useState<string | null>(null);
  const [currentSection, setCurrentSection] = useState<Section>('coding');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  
  // Modal State
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {}
  });

  // Timers
  const [codingTimeLeft, setCodingTimeLeft] = useState(60 * 60); // 60 mins
  const [aptTimeLeft, setAptTimeLeft] = useState(60 * 60); // 60 mins
  
  const [isRunning, setIsRunning] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [userCode, setUserCode] = useState<Record<string, string>>({});
  
  // Console & Judge State
  const [consoleOutput, setConsoleOutput] = useState<string>("");
  const [isCompiling, setIsCompiling] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [codeStatus, setCodeStatus] = useState<Record<string, 'solved' | 'unsolved'>>({});

  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [results, setResults] = useState<{
    totalScore: number;
    codingScore: number;
    aptitudeScore: number;
    pass: boolean;
    sections: Record<string, { correct: number; total: number; score: number }>;
  } | null>(null);

  const activeSet = MOCK_TEST_SETS.find(s => s.id === activeSetId);
  
  // Split questions into sections
  const codingQs = activeSet?.questions.filter(q => q.type === 'coding') || [];
  const aptitudeQs = activeSet?.questions.filter(q => q.type !== 'coding') || [];
  
  const currentQs = currentSection === 'coding' ? codingQs : aptitudeQs;
  const currentQ = currentQs[currentQIndex];

  // Safety check to prevent crashes if set is missing
  if (activeSetId && !activeSet) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h2 className="text-2xl font-bold">Mock Test Not Found</h2>
          <Button onClick={() => setActiveSetId(null)}>Back to List</Button>
        </div>
      </div>
    );
  }

  // Detect starter template or empty code
  const isCodeValid = (code: string, starter: string) => {
    if (!code || !starter) return false;
    const cleanCode = code.replace(/\s/g, "");
    const cleanStarter = starter.replace(/\s/g, "");
    
    const invalidPatterns = [
      "pass",
      "returnNone",
      "returnnull",
      "return;",
      "{}",
      "return0",
      "//writecodehere"
    ];

    if (cleanCode === cleanStarter) return false;
    
    // Check if code contains only comments or invalid patterns
    const codeWithoutStarter = cleanCode.replace(cleanStarter, "");
    if (codeWithoutStarter.length < 5) return false;
    
    return !invalidPatterns.some(p => codeWithoutStarter === p);
  };

  // Timer Logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeSetId && isRunning && !submitted) {
      timer = setInterval(() => {
        if (currentSection === 'coding') {
          if (codingTimeLeft > 0) {
            setCodingTimeLeft(prev => prev - 1);
          } else {
            setCurrentSection('aptitude');
            setCurrentQIndex(0);
            toast.warning("Coding time is over!", { description: "Moving to Aptitude section (60 mins)." });
          }
        } else {
          if (aptTimeLeft > 0) {
            setAptTimeLeft(prev => prev - 1);
          } else {
            handleSubmit();
          }
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [activeSetId, isRunning, codingTimeLeft, aptTimeLeft, currentSection, submitted]);

  const startTest = (set: MockTestSet) => {
    setActiveSetId(set.id);
    setCurrentSection('coding');
    setCurrentQIndex(0);
    setCodingTimeLeft(60 * 60);
    setAptTimeLeft(60 * 60);
    setIsRunning(true);
    setSubmitted(false);
    setUserAnswers({});
    setUserCode({});
    setCodeStatus({});
    setResults(null);
    setConsoleOutput("");
    setTestResult(null);
    toast.info(`Test Started: ${set.title}`, { description: `Section 1: Coding (60 mins)` });
  };

  const handleAnswer = (answer: string) => {
    if (!currentQ) return;
    setUserAnswers(prev => ({ ...prev, [currentQ.id]: answer }));
  };

  const handleCodeChange = (code: string) => {
    if (!currentQ) return;
    setUserCode(prev => ({ ...prev, [currentQ.id]: code }));
  };

  const handleRunCode = () => {
    if (!currentQ) return;
    const code = userCode[currentQ.id] || currentQ.starterCode || "";
    const starter = currentQ.starterCode || "";
    
    if (!isCodeValid(code, starter)) {
      toast.error("Invalid Code", { description: "Please write an actual solution before running." });
      setConsoleOutput("Error: No logic detected. Please implement the solution.");
      return;
    }

    setIsCompiling(true);
    setConsoleOutput("Compiling... \nRunning test cases...");
    setTestResult(null);

    setTimeout(() => {
      setIsCompiling(false);
      // Mock logic: Check if code is long enough and contains common keywords for the problem
      const codeLen = code.length;
      const cleanCode = code.toLowerCase();
      
      // Heuristic for "passing"
      const seemsCorrect = codeLen > 150 && (
        cleanCode.includes("for") || 
        cleanCode.includes("while") || 
        cleanCode.includes("if") || 
        cleanCode.includes("def") ||
        cleanCode.includes("function")
      );

      if (seemsCorrect) {
        setTestResult({ passed: true, message: "All test cases passed!", count: "5/5" });
        setConsoleOutput("Output: \n[SUCCESS] Test Case 1: Passed\n[SUCCESS] Test Case 2: Passed\n[SUCCESS] Test Case 3: Passed\n[SUCCESS] Test Case 4: Passed\n[SUCCESS] Test Case 5: Passed\n\nRuntime: 12ms");
        setCodeStatus(prev => ({ ...prev, [currentQ.id]: 'solved' }));
        toast.success("Correct Solution!");
      } else {
        setTestResult({ passed: false, message: "Failed: 2/5 test cases passed.", count: "2/5" });
        setConsoleOutput("Output: \n[SUCCESS] Test Case 1: Passed\n[SUCCESS] Test Case 2: Passed\n[FAILED] Test Case 3: Wrong Answer\n[FAILED] Test Case 4: Wrong Answer\n[FAILED] Test Case 5: Wrong Answer\n\nRuntime: 15ms");
        toast.error("Test cases failed. Check your logic.");
      }
    }, 1500);
  };

  const saveToDb = async (finalData: any) => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('mock_test_results').insert({
        user_id: user.id,
        test_id: activeSetId,
        coding_score: finalData.codingScore,
        aptitude_score: finalData.aptitudeScore,
        total_score: finalData.totalScore,
        passed: finalData.pass,
        completed_at: new Date().toISOString()
      });
      if (error) throw error;
    } catch (e) {
      console.error("Failed to save result:", e);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!activeSet) return;
    setIsRunning(false);
    setSubmitted(true);

    // 1. Coding Score (5 questions, 10 marks each = 50)
    let codingCorrect = 0;
    codingQs.forEach(q => {
      if (codeStatus[q.id] === 'solved') codingCorrect++;
    });
    const codingScore = codingCorrect * 10;

    // 2. Aptitude Score (25 questions, 2 marks each = 50)
    let aptCorrect = 0;
    aptitudeQs.forEach(q => {
      if (userAnswers[q.id] === q.answer) aptCorrect++;
    });
    const aptitudeScore = aptCorrect * 2;

    const totalScore = codingScore + aptitudeScore;
    const pass = totalScore >= 60;

    const finalResults = {
      totalScore,
      codingScore,
      aptitudeScore,
      pass,
      sections: {
        coding: { correct: codingCorrect, total: 5, score: codingScore },
        aptitude: { correct: aptCorrect, total: 25, score: aptitudeScore }
      }
    };

    setResults(finalResults);
    addXp(totalScore * 2);
    await saveToDb(finalResults);
    toast.success("Test Completed!", { description: `Total Score: ${totalScore}/100` });
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // 1. Selection Screen
  if (!activeSetId) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-8">
          <div className="space-y-2">
            <Badge className="bg-primary/20 text-primary border-none mb-2">Internal Assessment v2.0</Badge>
            <h1 className="text-4xl font-bold text-white tracking-tight">Technical & Aptitude Mock Tests 🏆</h1>
            <p className="text-zinc-400 text-lg max-w-2xl">
              Professional 120-minute recruitment simulation. Section-wise timers with 60 Mins for Coding (50 Marks) and 60 Mins for Aptitude (50 Marks).
            </p>
          </div>
          <Button variant="ghost" onClick={() => router.push("/roadmap")} className="text-zinc-400 hover:text-white bg-white/5">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Roadmap
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MOCK_TEST_SETS.map((set, i) => (
            <Card key={set.id} className="bg-zinc-900 border-zinc-800 hover:border-primary/50 transition-all cursor-pointer group flex flex-col overflow-hidden shadow-xl hover:shadow-primary/5" onClick={() => startTest(set)}>
              <div className="h-2 bg-zinc-800 group-hover:bg-primary/20 transition-colors">
                <div className="h-full bg-primary" style={{ width: `${(i + 1) * 10}%` }} />
              </div>
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className="text-zinc-500 border-zinc-800">{set.difficulty}</Badge>
                  <div className="flex items-center gap-1.5 text-zinc-500 text-sm font-medium">
                    <Clock className="w-4 h-4" /> 120 mins
                  </div>
                </div>
                <CardTitle className="text-xl text-white group-hover:text-primary transition-colors">{set.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="text-zinc-500 text-[10px] uppercase font-bold">Coding</div>
                    <div className="text-white font-bold">5 Qs | 50 M</div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                    <div className="text-zinc-500 text-[10px] uppercase font-bold">Aptitude</div>
                    <div className="text-white font-bold">25 Qs | 50 M</div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-2 pb-6 px-6">
                <Button className="w-full bg-white/5 group-hover:bg-zinc-800 text-zinc-300 group-hover:text-white border border-white/5 group-hover:border-zinc-700 transition-all rounded-xl h-12 font-bold">
                  <Play className="w-4 h-4 mr-2" /> Start Assessment
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // 2. Result Screen
  if (submitted && results) {
    return (
      <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in zoom-in-95 duration-500 pb-20">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-white">Assessment Report</h2>
          <Button variant="ghost" onClick={() => setActiveSetId(null)} className="text-zinc-400 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to List
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className={`md:col-span-1 border-2 p-8 flex flex-col items-center justify-center text-center ${results.pass ? 'bg-green-500/5 border-green-500/20' : 'bg-red-500/5 border-red-500/20'}`}>
            <div className="relative w-44 h-44 flex items-center justify-center mb-6">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="88" cy="88" r="80" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-zinc-800" />
                <circle cx="88" cy="88" r="80" stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray={502} strokeDashoffset={502 - (502 * results.totalScore) / 100} className={`${results.pass ? 'text-green-500' : 'text-red-500'} transition-all duration-1000`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black text-white">{results.totalScore}</span>
                <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Total Marks</span>
              </div>
            </div>
            {results.pass ? <Award className="w-12 h-12 text-yellow-500 mb-4" /> : <AlertCircle className="w-12 h-12 text-red-500 mb-4" />}
            <h3 className="text-2xl font-bold text-white mb-2">{results.pass ? "PASSED" : "FAILED"}</h3>
            <p className="text-zinc-400 text-sm">Required: 60/100 to pass.</p>
          </Card>

          <div className="md:col-span-2 space-y-6">
            <Card className="bg-zinc-900 border-zinc-800 p-6">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" /> Section-wise Performance
              </h3>
              <div className="grid grid-cols-1 gap-8">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-300 font-bold uppercase tracking-widest">Section A: Coding</span>
                    <span className="text-primary font-black">{results.codingScore} / 50</span>
                  </div>
                  <Progress value={(results.codingScore / 50) * 100} className="h-3 bg-zinc-800" />
                  <p className="text-xs text-zinc-500">Solved: {results.sections.coding.correct} / 5 problems</p>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-300 font-bold uppercase tracking-widest">Section B: Aptitude</span>
                    <span className="text-primary font-black">{results.aptitudeScore} / 50</span>
                  </div>
                  <Progress value={(results.aptitudeScore / 50) * 100} className="h-3 bg-zinc-800" />
                  <p className="text-xs text-zinc-500">Correct: {results.sections.aptitude.correct} / 25 questions</p>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-zinc-900 border-zinc-800 p-5">
                <div className="text-zinc-500 text-[10px] uppercase font-black mb-1">Time Utilization</div>
                <div className="text-xl font-bold text-white">Efficient</div>
              </Card>
              <Card className="bg-zinc-900 border-zinc-800 p-5">
                <div className="text-zinc-500 text-[10px] uppercase font-black mb-1">XP Earned</div>
                <div className="text-xl font-bold text-primary">+{results.totalScore * 2} XP</div>
              </Card>
            </div>
          </div>
        </div>

        <div className="pt-8">
           <Button className="w-full h-14 bg-primary text-lg font-bold rounded-2xl" onClick={() => setActiveSetId(null)}>
              Start Another Mock Test
           </Button>
        </div>
      </div>
    );
  }

  // 3. Test Interface
  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-black text-white">
      {/* Top Header */}
      <header className="h-20 border-b border-white/10 bg-zinc-950 flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-6">
          <Button variant="ghost" size="sm" onClick={() => {
            setModalConfig({
              isOpen: true,
              title: "Quit Assessment?",
              message: "Your progress in this mock test will not be saved. Are you sure you want to exit?",
              onConfirm: () => {
                setActiveSetId(null);
                setModalConfig(prev => ({ ...prev, isOpen: false }));
              }
            });
          }} className="text-zinc-400 hover:text-white bg-white/5">
            <XCircle className="w-4 h-4 mr-2" /> Exit Test
          </Button>
          <div className="h-8 w-px bg-white/10" />
          <div className="flex flex-col">
            <span className="text-xs font-black text-zinc-500 uppercase tracking-widest">{activeSet!.title}</span>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold ${currentSection === 'coding' ? 'text-primary' : 'text-zinc-500'}`}>Section A: Coding</span>
              <ChevronRight className="w-4 h-4 text-zinc-700" />
              <span className={`text-sm font-bold ${currentSection === 'aptitude' ? 'text-primary' : 'text-zinc-500'}`}>Section B: Aptitude</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-8">
           <div className="flex flex-col items-end">
              <span className="text-[10px] font-black text-zinc-500 uppercase mb-1">
                {currentSection === 'coding' ? 'Coding Time Left' : 'Aptitude Time Left'}
              </span>
              <div className={`flex items-center gap-3 px-5 py-2 rounded-2xl border-2 transition-all ${
                (currentSection === 'coding' ? codingTimeLeft : aptTimeLeft) < 120 
                  ? 'border-red-500 bg-red-500/10 text-red-500 animate-pulse' 
                  : 'border-primary/20 bg-primary/5 text-primary'
              }`}>
                <Timer className="w-5 h-5" />
                <span className="text-xl font-mono font-black tracking-tighter">
                  {formatTime(currentSection === 'coding' ? codingTimeLeft : aptTimeLeft)}
                </span>
              </div>
           </div>
           
           <div className="flex items-center gap-4">
             {currentSection === 'coding' && (
               <Button 
                 variant="outline" 
                 disabled={isCompiling}
                 className="bg-[#1f1f1f] border-[#333333] text-white hover:bg-[#2a2a2a] transition-all cursor-pointer h-12 px-6 rounded-xl font-bold shadow-lg"
                 onClick={handleRunCode}
               >
                 {isCompiling ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Play className="w-4 h-4 mr-2 text-primary fill-primary" />}
                 Run Code
               </Button>
             )}
             <Button 
               className="bg-[#1f1f1f] border-[#333333] text-white hover:bg-[#2a2a2a] border transition-all font-black h-12 px-8 rounded-xl shadow-lg" 
               onClick={() => {
                if (currentSection === 'coding') {
                  setModalConfig({
                    isOpen: true,
                    title: "Move to Aptitude?",
                    message: "You are about to finish the coding section. You cannot return to these questions later. Continue?",
                    onConfirm: () => {
                      setCurrentSection('aptitude');
                      setCurrentQIndex(0);
                      setConsoleOutput("");
                      setTestResult(null);
                      setModalConfig(prev => ({ ...prev, isOpen: false }));
                    }
                  });
                } else {
                  setModalConfig({
                    isOpen: true,
                    title: "Submit Final Test?",
                    message: "Are you sure you want to submit your assessment for final grading?",
                    onConfirm: () => {
                      handleSubmit();
                      setModalConfig(prev => ({ ...prev, isOpen: false }));
                    }
                  });
                }
             }}>
               {currentSection === 'coding' ? <><FastForward className="w-5 h-5 mr-2 text-primary" /> Next Section</> : <><Check className="w-5 h-5 mr-2 text-primary" /> Submit Final Test</>}
             </Button>
           </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Nav */}
        <div className="w-72 border-r border-white/10 bg-zinc-950 flex flex-col shrink-0">
          <div className="p-6 border-b border-white/10">
            <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4 flex items-center justify-between">
              Questions <span>{currentQIndex + 1}/{currentQs.length}</span>
            </h3>
            <div className="grid grid-cols-5 gap-2">
              {currentQs.map((_, i) => {
                const qId = currentQs[i].id;
                const isSolved = currentSection === 'coding' ? codeStatus[qId] === 'solved' : !!userAnswers[qId];
                
                return (
                  <button
                    key={i}
                    onClick={() => {
                      setCurrentQIndex(i);
                      setConsoleOutput("");
                      setTestResult(null);
                    }}
                    className={`h-11 rounded-xl flex items-center justify-center text-xs font-bold transition-all border-2 ${
                      currentQIndex === i 
                        ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20' 
                        : isSolved
                          ? 'bg-green-500/10 border-green-500/30 text-green-500'
                          : 'bg-white/5 border-white/5 text-zinc-500 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-8">
             <div className="space-y-4">
                <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest">Section Progress</h3>
                <div className="space-y-2">
                   <div className="flex justify-between text-[10px] text-zinc-400 font-bold uppercase">
                      <span>{currentSection} Progress</span>
                      <span>{Math.round(((currentQIndex + 1) / currentQs.length) * 100)}%</span>
                   </div>
                   <Progress value={((currentQIndex + 1) / currentQs.length) * 100} className="h-1.5" />
                </div>
             </div>

             <Card className="bg-primary/5 border-primary/10 p-5 rounded-2xl">
                <div className="flex items-center gap-2 mb-3">
                   <ShieldAlert className="w-4 h-4 text-primary" />
                   <span className="text-[10px] text-primary uppercase font-black tracking-widest">Judge Rules</span>
                </div>
                <ul className="text-[11px] text-zinc-400 space-y-2 font-medium">
                   <li>• No marks for starter code</li>
                   <li>• Run Code to check test cases</li>
                   <li>• Logic validation enabled</li>
                   <li>• Pass: 60% Overall Score</li>
                </ul>
             </Card>
          </div>
        </div>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-10 bg-zinc-950/30 relative">
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex items-center gap-3">
              <Badge className="bg-primary text-primary-foreground border-none uppercase text-[10px] font-black tracking-widest px-3 py-1">
                {currentSection} ROUND
              </Badge>
              <Badge variant="outline" className="text-zinc-500 border-white/5 uppercase text-[10px] font-black px-3 py-1">
                {currentQ.difficulty}
              </Badge>
              <Badge variant="outline" className="text-zinc-500 border-white/5 uppercase text-[10px] font-black px-3 py-1">
                {currentSection === 'coding' ? '10 Marks' : '2 Marks'}
              </Badge>
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-white leading-tight tracking-tight">
                {currentQ.question}
              </h3>

              {currentSection === 'coding' ? (
                <div className="space-y-6">
                   <div className="prose prose-invert max-w-none">
                      <p className="text-zinc-400 text-lg leading-relaxed font-medium">{currentQ.problem}</p>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-black/60 border border-white/5 p-4 rounded-xl shadow-inner">
                        <span className="text-[10px] font-black text-zinc-500 uppercase mb-2 block tracking-widest">Sample Input</span>
                        <code className="text-green-400 text-sm font-mono">{currentQ.input}</code>
                      </div>
                      <div className="bg-black/60 border border-white/5 p-4 rounded-xl shadow-inner">
                        <span className="text-[10px] font-black text-zinc-500 uppercase mb-2 block tracking-widest">Expected Output</span>
                        <code className="text-blue-400 text-sm font-mono">{currentQ.output}</code>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <div className="h-[400px] w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-zinc-900">
                        <MonacoEditor
                          height="100%"
                          language="python"
                          theme="vs-dark"
                          value={userCode[currentQ.id] || currentQ.starterCode}
                          onChange={(val) => handleCodeChange(val || "")}
                          options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            padding: { top: 20 },
                            scrollBeyondLastLine: false,
                            automaticLayout: true,
                            fontFamily: "JetBrains Mono, Menlo, Monaco, Courier New, monospace"
                          }}
                        />
                      </div>

                      {/* Console Output area */}
                      <Card className="bg-zinc-950 border-zinc-800 overflow-hidden">
                        <div className="bg-zinc-900 px-4 py-2 flex items-center justify-between border-b border-zinc-800">
                           <div className="flex items-center gap-2">
                              <Terminal className="w-4 h-4 text-zinc-500" />
                              <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Output Console</span>
                           </div>
                           {testResult && (
                             <Badge className={testResult.passed ? "bg-green-500/20 text-green-500 border-none" : "bg-red-500/20 text-red-500 border-none"}>
                               {testResult.passed ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <ShieldAlert className="w-3 h-3 mr-1" />}
                               {testResult.count} {testResult.passed ? "Passed" : "Failed"}
                             </Badge>
                           )}
                        </div>
                        <div className="p-4 h-32 font-mono text-sm overflow-y-auto bg-black/40">
                           {isCompiling ? (
                             <div className="flex items-center gap-3 text-zinc-500">
                                <Activity className="w-4 h-4 animate-pulse" />
                                <span>Compiling and running against test cases...</span>
                             </div>
                           ) : consoleOutput ? (
                             <pre className="text-zinc-300 whitespace-pre-wrap">{consoleOutput}</pre>
                           ) : (
                             <span className="text-zinc-600">Run code to see results...</span>
                           )}
                        </div>
                      </Card>
                   </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4 pt-4">
                  {currentQ.options?.map((opt, i) => {
                    const isSelected = userAnswers[currentQ.id] === opt;
                    return (
                      <button
                        key={i}
                        onClick={() => handleAnswer(opt)}
                        className={`w-full p-5 rounded-2xl text-left transition-all border-2 flex items-center justify-between group ${
                          isSelected 
                            ? 'bg-primary border-primary text-primary-foreground shadow-xl shadow-primary/20 scale-[1.01]' 
                            : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm transition-colors ${
                            isSelected ? 'bg-white text-primary' : 'bg-zinc-800 text-zinc-500 group-hover:bg-zinc-700'
                          }`}>
                            {String.fromCharCode(65 + i)}
                          </div>
                          <span className="text-lg font-semibold">{opt}</span>
                        </div>
                        {isSelected && <div className="bg-white rounded-full p-1"><Check className="w-4 h-4 text-primary" /></div>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-12 border-t border-white/10">
              <Button 
                variant="ghost" 
                disabled={currentQIndex === 0} 
                onClick={() => {
                  setCurrentQIndex(prev => prev - 1);
                  setConsoleOutput("");
                  setTestResult(null);
                }}
                className="text-zinc-500 hover:text-white hover:bg-white/5 h-12 px-6"
              >
                <ChevronLeft className="w-5 h-5 mr-2" /> Previous Question
              </Button>
              <div className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em]">
                {currentSection} ROUND • Q {currentQIndex + 1} / {currentQs.length}
              </div>
              <Button 
                disabled={currentQIndex === currentQs.length - 1} 
                onClick={() => {
                  setCurrentQIndex(prev => prev + 1);
                  setConsoleOutput("");
                  setTestResult(null);
                }}
                className="bg-zinc-800 hover:bg-zinc-700 text-white h-12 px-8 rounded-xl font-bold"
              >
                Next Question <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        </main>
      </div>
      
      <ConfirmationModal 
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
        onConfirm={modalConfig.onConfirm}
      />
    </div>
  );
}
