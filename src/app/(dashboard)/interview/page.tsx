"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Mic, 
  Send, 
  RefreshCw, 
  StopCircle, 
  Star, 
  MessageSquare, 
  Trophy, 
  ChevronRight, 
  BarChart3, 
  Target, 
  Zap,
  Volume2,
  VolumeX
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import { HR_QUESTIONS, TECH_QUESTIONS } from "@/data/interview";

interface Feedback {
  score: number;
  confidence: number;
  clarity: number;
  critique: string;
  betterAnswer: string;
}

export default function MockInterviewPage() {
  const [activeTab, setActiveTab] = useState<"hr" | "tech">("hr");
  const [usedQuestions, setUsedQuestions] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  
  // Session states
  const [sessionScores, setSessionScores] = useState<number[]>([]);
  const [sessionFeedback, setSessionFeedback] = useState<string[]>([]);
  const [showSessionSummary, setShowSessionSummary] = useState(false);
  const SESSION_LIMIT = 5;

  const addXp = useStore((state) => state.addXp);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  const questions = activeTab === "hr" ? HR_QUESTIONS : TECH_QUESTIONS;

  const speak = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis || isMuted) return;
    
    // Stop any current speaking
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    // Try to find a good female voice
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes("Google UK English Female") || v.name.includes("Female"));
    if (preferredVoice) utterance.voice = preferredVoice;
    
    utterance.pitch = 1.1;
    utterance.rate = 1.0;
    
    window.speechSynthesis.speak(utterance);
  }, [isMuted]);

  useEffect(() => {
    // Load used questions from localStorage
    const stored = JSON.parse(localStorage.getItem("usedInterview") || "[]");
    setUsedQuestions(stored);
    
    // Pick first question
    const pool = activeTab === "hr" ? HR_QUESTIONS : TECH_QUESTIONS;
    const initialIdx = getNextUnusedIndex(stored, pool);
    setCurrentIndex(initialIdx);

    // Trigger mission for today
    useStore.getState().markInterviewUsed(0);
  }, [activeTab]);

  // Speak question when it changes
  useEffect(() => {
    if (questions[currentIndex] && !showSessionSummary && !feedback) {
      // Delay slightly for transition
      const timer = setTimeout(() => {
        speak(questions[currentIndex]);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [currentIndex, questions, showSessionSummary, feedback, speak]);

  const getNextUnusedIndex = (used: string[], pool: string[]) => {
    let available = pool.map((q, i) => ({ q, i })).filter(item => !used.includes(item.q));
    
    if (available.length === 0) {
      toast.info("All questions in this category used. Resetting!");
      const otherUsed = used.filter(u => !pool.includes(u));
      localStorage.setItem("usedInterview", JSON.stringify(otherUsed));
      setUsedQuestions(otherUsed);
      available = pool.map((q, i) => ({ q, i }));
    }
    
    return available[Math.floor(Math.random() * available.length)].i;
  };

  const handleTabChange = (tab: "hr" | "tech") => {
    setActiveTab(tab);
    setFeedback(null);
    setAnswer("");
  };

  const handleNext = () => {
    if (sessionScores.length >= SESSION_LIMIT) {
      setShowSessionSummary(true);
      return;
    }

    const pool = activeTab === "hr" ? HR_QUESTIONS : TECH_QUESTIONS;
    const nextIdx = getNextUnusedIndex(usedQuestions, pool);
    setCurrentIndex(nextIdx);
    setAnswer("");
    setFeedback(null);
    setIsRecording(false);
  };

  const submitAnswer = async () => {
    if (!answer.trim()) return toast.error("Please provide an answer first.");
    setIsEvaluating(true);

    try {
      const currentQ = questions[currentIndex];
      const res = await fetch("/api/evaluate-interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: currentQ,
          answer,
          type: activeTab,
        }),
      });
      if (!res.ok) throw new Error();
      const data: Feedback = await res.json();
      setFeedback(data);
      
      // Update session stats
      setSessionScores(prev => [...prev, data.score]);
      setSessionFeedback(prev => [...prev, data.critique]);
      
      addXp(40);
      
      // Mark question as used
      const newUsed = [...usedQuestions, currentQ];
      setUsedQuestions(newUsed);
      localStorage.setItem("usedInterview", JSON.stringify(newUsed));
      
      toast.success("+40 XP! Interview answer evaluated.");
      
      // Speak score and a bit of feedback
      speak(`Evaluation completed. You scored ${data.score} percent. ${data.critique.slice(0, 100)}`);

    } catch {
      toast.error("Evaluation failed. Please try again.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const toggleRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Voice not supported in this browser. Use Chrome for voice input.");
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    
    recognition.onresult = (event: any) => {
      const speechText = event.results[0][0].transcript;
      setAnswer(prev => prev ? prev + " " + speechText : speechText);
    };

    recognition.onerror = () => {
      setIsRecording(false);
      toast.error("Microphone error. Please check permissions.");
    };

    recognition.onend = () => setIsRecording(false);

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
    toast.info("🎤 Recording... Speak your answer clearly.");
  };

  const resetSession = () => {
    setSessionScores([]);
    setSessionFeedback([]);
    setShowSessionSummary(false);
    setFeedback(null);
    setAnswer("");
    const pool = activeTab === "hr" ? HR_QUESTIONS : TECH_QUESTIONS;
    setCurrentIndex(getNextUnusedIndex(usedQuestions, pool));
  };

  const currentQuestion = questions[currentIndex];
  
  if (showSessionSummary) {
    const avgScore = Math.round(sessionScores.reduce((a, b) => a + b, 0) / sessionScores.length);
    return (
      <div className="p-8 max-w-3xl mx-auto space-y-8">
        <Card className="bg-zinc-900 border-zinc-800 text-center py-12">
          <CardContent className="space-y-6">
            <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-3xl font-bold text-white">Interview Session Completed!</h2>
            <div className="flex justify-center gap-8 py-4">
              <div>
                <p className="text-zinc-500 text-sm uppercase tracking-wider mb-1">Questions</p>
                <p className="text-5xl font-bold text-white">{sessionScores.length}</p>
              </div>
              <div className="w-px bg-zinc-800" />
              <div>
                <p className="text-zinc-500 text-sm uppercase tracking-wider mb-1">Avg Score</p>
                <p className={`text-5xl font-bold ${avgScore >= 75 ? 'text-green-500' : avgScore >= 50 ? 'text-yellow-500' : 'text-red-500'}`}>{avgScore}%</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
              <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl">
                 <h4 className="font-semibold text-green-500 mb-2 flex items-center gap-2"><Trophy className="w-4 h-4"/> Strengths</h4>
                 <p className="text-sm text-green-100/70">Good articulation and structure in most answers. Confidence is showing improvements.</p>
              </div>
              <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl">
                 <h4 className="font-semibold text-yellow-500 mb-2 flex items-center gap-2"><Target className="w-4 h-4"/> Areas to Improve</h4>
                 <p className="text-sm text-yellow-100/70">Need more specific examples using the STAR method. Some answers lacked deep technical clarity.</p>
              </div>
            </div>
            <Button onClick={resetSession} className="mt-6 bg-primary text-primary-foreground font-semibold px-8 h-12">
              Start New Session <RefreshCw className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">AI Mock Interview</h1>
          <p className="text-zinc-400">Practice with real questions. Get AI feedback on confidence, clarity, and content.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsMuted(!isMuted)} 
            className="text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </Button>
          <div className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl text-center">
            <p className="text-xs text-zinc-500">Session Progress</p>
            <p className="font-bold text-white">{sessionScores.length} / {SESSION_LIMIT}</p>
          </div>
          <div className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-xl text-center">
            <p className="text-xs text-primary/80">Total Practiced</p>
            <p className="font-bold text-primary">{usedQuestions.length}</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="hr" className="w-full" onValueChange={(v) => handleTabChange(v as "hr" | "tech")}>
        <TabsList className="bg-zinc-900 border border-zinc-800 p-1 mb-6">
          <TabsTrigger value="hr" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            HR Interview
          </TabsTrigger>
          <TabsTrigger value="tech" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
            Technical (Frontend / Backend)
          </TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
        <motion.div key={currentIndex} initial={{opacity: 0, x: 20}} animate={{opacity: 1, x: 0}} exit={{opacity: 0, x: -20}}>
        <Card className="bg-zinc-900 border-zinc-800 shadow-2xl overflow-hidden relative">
          {isSpeaking && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-primary animate-pulse" />
          )}
          <CardHeader className="border-b border-white/5 pb-6">
            <div className="flex justify-between items-center mb-4">
              <Badge variant="outline" className="text-zinc-400 border-zinc-700 bg-zinc-800/50">
                Question {sessionScores.length + 1} of {SESSION_LIMIT}
              </Badge>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => speak(currentQuestion)} className="text-primary hover:text-primary hover:bg-primary/10">
                  <Volume2 className="w-4 h-4 mr-1" /> Replay Voice
                </Button>
                <Button variant="ghost" size="sm" onClick={handleNext} className="text-zinc-400 hover:text-white">
                  Skip <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
            <CardTitle className="text-2xl text-white font-bold leading-tight">
              {currentQuestion}
            </CardTitle>
          </CardHeader>

          <CardContent className="pt-6">
            {!feedback ? (
              <div className="space-y-4">
                <div className="relative">
                  <Textarea
                    placeholder="Speak your answer using the microphone, or type it here..."
                    className="min-h-[180px] bg-black border-zinc-800 focus-visible:ring-primary text-zinc-300 text-base p-5 resize-none leading-relaxed"
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                  />
                  <div className="absolute bottom-4 right-4 flex gap-3">
                    <Button
                      size="lg"
                      variant={isRecording ? "destructive" : "secondary"}
                      className={`rounded-full shadow-xl w-14 h-14 ${isRecording ? 'animate-pulse' : 'bg-primary/20 text-primary hover:bg-primary/30 border border-primary/20'}`}
                      onClick={toggleRecording}
                    >
                      {isRecording ? <StopCircle className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                    </Button>
                  </div>
                </div>
                {isRecording && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                    <p className="text-sm font-medium text-red-300">Listening to your voice... Speak now.</p>
                  </motion.div>
                )}
                <Button
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-14 text-lg font-bold shadow-lg shadow-primary/20"
                  onClick={submitAnswer}
                  disabled={isEvaluating || !answer.trim()}
                >
                  {isEvaluating ? (
                    <><RefreshCw className="w-5 h-5 mr-3 animate-spin" /> Analyzing your response...</>
                  ) : (
                    <><Send className="w-5 h-5 mr-3" /> Submit & Evaluate (+40 XP)</>
                  )}
                </Button>
              </div>
            ) : (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: "Overall Score", value: feedback.score, suffix: "/100", color: feedback.score > 75 ? 'text-green-500' : feedback.score > 50 ? 'text-yellow-500' : 'text-red-500' },
                    { label: "Confidence", value: feedback.confidence, suffix: "%", color: 'text-white' },
                    { label: "Clarity", value: feedback.clarity, suffix: "%", color: 'text-white' },
                  ].map((s) => (
                    <div key={s.label} className="bg-black border border-white/5 p-4 rounded-xl text-center">
                      <p className="text-zinc-500 text-xs mb-1 uppercase tracking-wider">{s.label}</p>
                      <p className={`text-3xl font-bold ${s.color}`}>{s.value}<span className="text-lg text-zinc-600">{s.suffix}</span></p>
                    </div>
                  ))}
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/20 p-5 rounded-xl">
                  <h4 className="text-yellow-500 font-bold flex items-center gap-2 mb-2">
                    <Star className="w-4 h-4" /> AI Feedback
                  </h4>
                  <p className="text-yellow-200/90 leading-relaxed text-sm">{feedback.critique}</p>
                </div>

                <div className="bg-primary/10 border border-primary/20 p-5 rounded-xl">
                  <h4 className="text-primary font-bold flex items-center gap-2 mb-2">
                    <MessageSquare className="w-4 h-4" /> Suggested Answer
                  </h4>
                  <p className="text-blue-100/90 leading-relaxed text-sm italic">"{feedback.betterAnswer}"</p>
                  <Button variant="ghost" size="sm" className="mt-3 text-primary p-0 h-auto hover:bg-transparent" onClick={() => speak(feedback.betterAnswer)}>
                    <Volume2 className="w-3.5 h-3.5 mr-1" /> Listen to Suggested Answer
                  </Button>
                </div>

                <div className="pt-2 flex gap-4">
                  <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 h-14 text-lg font-bold" onClick={handleNext}>
                    {sessionScores.length >= SESSION_LIMIT ? "View Final Summary" : "Next Question"} <ChevronRight className="w-5 h-5 ml-1" />
                  </Button>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
        </motion.div>
        </AnimatePresence>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gradient-to-br from-zinc-900 to-black border-zinc-800 md:col-span-2">
          <CardContent className="p-6">
            <h3 className="font-bold text-white mb-2 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" /> Interview Pro Tips
            </h3>
            <ul className="text-sm text-zinc-400 space-y-2 grid grid-cols-1 md:grid-cols-2">
              <li className="flex items-center gap-2"><div className="w-1 h-1 bg-primary rounded-full"/> Use the <span className="text-white font-medium">STAR method</span> for behavioral questions.</li>
              <li className="flex items-center gap-2"><div className="w-1 h-1 bg-primary rounded-full"/> Maintain a <span className="text-white font-medium">steady pace</span> while speaking.</li>
              <li className="flex items-center gap-2"><div className="w-1 h-1 bg-primary rounded-full"/> Mention <span className="text-white font-medium">specific technologies</span> in technical answers.</li>
              <li className="flex items-center gap-2"><div className="w-1 h-1 bg-primary rounded-full"/> Use the <span className="text-white font-medium">Mic button</span> for a real experience.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

