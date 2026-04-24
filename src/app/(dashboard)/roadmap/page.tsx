"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Map, 
  Calendar, 
  Building2, 
  BrainCircuit,
  Clock,
  Code2,
  GraduationCap,
  CheckCircle2, 
  Wand2, 
  ChevronDown, 
  ExternalLink, 
  RotateCcw,
  RefreshCw,
  Sparkles,
  Layout
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";
import { DEFAULT_ROADMAP } from "@/data/roadmap";

interface RoadmapItem {
  id: string;
  day: string;
  title: string;
  desc: string;
  topic: string;
  resources: { label: string; url: string }[];
  isMockTest?: boolean;
}

const LEVELS = ["Beginner", "Intermediate", "Advanced"];
const LANGUAGES = ["Python", "Java", "C++", "JavaScript"];

export default function RoadmapPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"standard" | "ai">("standard");
  const [generating, setGenerating] = useState(false);
  const [aiRoadmap, setAiRoadmap] = useState<RoadmapItem[] | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [company, setCompany] = useState("Google");
  const [daysLeft, setDaysLeft] = useState("30");
  const [weakSkill, setWeakSkill] = useState("Dynamic Programming");
  const [level, setLevel] = useState("Beginner");
  const [language, setLanguage] = useState("Python");
  const [hoursPerDay, setHoursPerDay] = useState("2");

  const roadmapProgress = useStore((state) => state.roadmapProgress);
  const markRoadmapItemComplete = useStore((state) => state.markRoadmapItemComplete);

  const roadmap = activeTab === "standard" ? DEFAULT_ROADMAP : aiRoadmap;
  const completedCount = roadmap ? roadmap.filter(item => roadmapProgress.includes(item.id)).length : 0;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    setAiRoadmap(null);
    setExpandedId(null);

    try {
      const res = await fetch("/api/generate-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company, daysLeft: parseInt(daysLeft), weakSkill, level, language, hoursPerDay }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAiRoadmap(data.roadmap);
      toast.success("AI Roadmap Generated!", { description: `Your personalized ${daysLeft}-day plan is ready.` });
    } catch {
      toast.error("Failed to generate roadmap. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Study Roadmap</h1>
          <p className="text-zinc-400">Master coding interviews with a structured 30-day plan or custom AI roadmap.</p>
        </div>
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="bg-zinc-900 border border-zinc-800 p-1 rounded-xl">
          <TabsList className="bg-transparent">
            <TabsTrigger value="standard" className="data-[state=active]:bg-primary">
              <Layout className="w-4 h-4 mr-2" /> Standard
            </TabsTrigger>
            <TabsTrigger value="ai" className="data-[state=active]:bg-primary">
              <Sparkles className="w-4 h-4 mr-2" /> AI Custom
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "ai" && !aiRoadmap ? (
          <motion.div key="ai-form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <Card className="bg-zinc-900 border-zinc-800 shadow-2xl max-w-2xl mx-auto overflow-hidden">
              <div className="bg-primary/10 border-b border-primary/20 p-6 flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/20 rounded-xl flex items-center justify-center">
                  <Wand2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Generate Custom Roadmap</h3>
                  <p className="text-sm text-zinc-400">Personalized plan based on your target company and weak areas.</p>
                </div>
              </div>
              <form onSubmit={handleGenerate}>
                <CardContent className="space-y-5 pt-8">
                  {/* Row 1: Company + Days */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label className="text-zinc-300 flex items-center gap-2"><Building2 className="w-4 h-4 text-primary" /> Target Company</Label>
                      <Input value={company} onChange={e => setCompany(e.target.value)} required placeholder="e.g. Google, Amazon, Startup" className="bg-black border-zinc-800 text-white h-12" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-300 flex items-center gap-2"><Calendar className="w-4 h-4 text-primary" /> Days Remaining</Label>
                      <Input value={daysLeft} onChange={e => setDaysLeft(e.target.value)} required type="number" min="7" max="90" className="bg-black border-zinc-800 text-white h-12" />
                    </div>
                  </div>

                  {/* Row 2: Level + Language + Hours */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-zinc-300 flex items-center gap-2"><GraduationCap className="w-4 h-4 text-primary" /> Your Level</Label>
                      <div className="flex flex-col gap-1.5">
                        {LEVELS.map(l => (
                          <button
                            key={l}
                            type="button"
                            onClick={() => setLevel(l)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                              level === l
                                ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                                : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600"
                            }`}
                          >
                            {l === "Beginner" ? "🌱 Beginner" : l === "Intermediate" ? "🔥 Intermediate" : "⚡ Advanced"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-300 flex items-center gap-2"><Code2 className="w-4 h-4 text-primary" /> Language</Label>
                      <div className="flex flex-col gap-1.5">
                        {LANGUAGES.map(lang => (
                          <button
                            key={lang}
                            type="button"
                            onClick={() => setLanguage(lang)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                              language === lang
                                ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                                : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600"
                            }`}
                          >
                            {lang === "Python" ? "🐍 Python" : lang === "Java" ? "☕ Java" : lang === "C++" ? "⚙️ C++" : "🌐 JS"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-zinc-300 flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Hours/Day</Label>
                      <div className="flex flex-col gap-1.5">
                        {["1", "2", "3", "4+"].map(h => (
                          <button
                            key={h}
                            type="button"
                            onClick={() => setHoursPerDay(h === "4+" ? "4" : h)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium border transition-all ${
                              (h === "4+" ? "4" : h) === hoursPerDay
                                ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
                                : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-600"
                            }`}
                          >
                            {h} hr{h !== "1" ? "s" : ""}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Weak Skills */}
                  <div className="space-y-2">
                    <Label className="text-zinc-300 flex items-center gap-2"><BrainCircuit className="w-4 h-4 text-primary" /> Weak Skills to Focus On</Label>
                    <Input value={weakSkill} onChange={e => setWeakSkill(e.target.value)} required placeholder="e.g. Dynamic Programming, Graph Theory, Trees" className="bg-black border-zinc-800 text-white h-12" />
                  </div>

                  {/* Summary */}
                  <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-sm text-zinc-400">
                    <span className="text-white font-medium">Your plan: </span>
                    {daysLeft} days · {level} · {language} · {hoursPerDay}h/day · Targeting <span className="text-primary font-bold">{company}</span>
                    {weakSkill && <span> · Focus: {weakSkill}</span>}
                  </div>

                  <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-14 text-lg font-bold shadow-lg shadow-primary/20" disabled={generating}>
                    {generating ? <><RefreshCw className="w-5 h-5 mr-3 animate-spin" /> Crafting Your {daysLeft}-Day Plan...</> : <><Sparkles className="w-5 h-5 mr-3" /> Generate My Personalized Roadmap</>}
                  </Button>
                </CardContent>
              </form>
            </Card>
          </motion.div>
        ) : (
          <motion.div key="roadmap-content" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Header + Progress */}
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-2xl font-bold text-white">
                    {activeTab === "standard" ? "30-Day Master Roadmap" : `Roadmap for ${company}`}
                  </h3>
                  {activeTab === "ai" && (
                    <Button size="sm" variant="ghost" onClick={() => setAiRoadmap(null)} className="text-primary hover:bg-primary/10">
                      <RotateCcw className="w-3.5 h-3.5 mr-1" /> New
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-zinc-400">
                  <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {roadmap?.length} Days</span>
                  <span className="w-1.5 h-1.5 bg-zinc-700 rounded-full" />
                  <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-500" /> {completedCount} Done</span>
                </div>
              </div>
              <div className="w-full md:w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Overall Progress</span>
                  <span className="text-primary font-bold">{Math.round((completedCount / (roadmap?.length || 1)) * 100)}%</span>
                </div>
                <Progress value={(completedCount / (roadmap?.length || 1)) * 100} className="h-2.5" />
              </div>
            </div>

            {/* Timeline */}
            <div className="grid grid-cols-1 gap-4">
              {roadmap?.map((item, i) => {
                const isDone = roadmapProgress.includes(item.id);
                const isExpanded = expandedId === item.id;

                return (
                  <Card key={item.id} className={`group transition-all duration-300 border ${isDone ? 'bg-green-500/5 border-green-500/20 opacity-80' : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 hover:shadow-xl hover:shadow-primary/5'}`}>
                    <CardContent className="p-0">
                      <button
                        className="w-full text-left p-6 flex items-start gap-5"
                        onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      >
                        <div className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center shrink-0 transition-all ${isDone ? 'border-green-500 bg-green-500/20' : 'border-zinc-700 bg-zinc-800 group-hover:border-primary/50 group-hover:bg-primary/5'}`}>
                          {isDone ? <CheckCircle2 className="w-6 h-6 text-green-500" /> : <span className="text-sm font-bold text-zinc-400 group-hover:text-primary">{i + 1}</span>}
                        </div>
                        <div className="flex-1 min-w-0 pt-1">
                          <div className="flex items-center justify-between gap-4 mb-1">
                            <span className="text-xs font-bold text-primary tracking-widest uppercase">{item.day}</span>
                            <Badge variant="outline" className="text-zinc-500 border-zinc-700 text-[10px] uppercase font-bold tracking-tighter">{item.topic}</Badge>
                          </div>
                          <h4 className={`text-lg font-bold leading-tight ${isDone ? 'text-zinc-500 line-through' : 'text-white'}`}>{item.title}</h4>
                          {!isExpanded && <p className="text-sm text-zinc-500 mt-2 line-clamp-1">{item.desc}</p>}
                        </div>
                        <div className={`p-2 rounded-lg bg-zinc-800/50 text-zinc-500 transition-all ${isExpanded ? 'rotate-180 bg-primary/10 text-primary' : ''}`}>
                          <ChevronDown className="w-5 h-5" />
                        </div>
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="px-6 pb-6 space-y-6 border-t border-white/5 pt-6">
                              <div className="prose prose-invert max-w-none">
                                <p className="text-zinc-300 leading-relaxed text-base">{item.desc}</p>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {item.resources?.length > 0 && (
                                  <div className="space-y-3">
                                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Learning Materials</p>
                                    <div className="flex flex-col gap-2">
                                      {item.resources.map((r, ri) => (
                                        <a key={ri} href={r.url} target="_blank" rel="noopener noreferrer"
                                          className="flex items-center justify-between group/link bg-black/40 border border-zinc-800 p-3 rounded-xl hover:border-primary/50 transition-all"
                                          onClick={e => e.stopPropagation()}>
                                          <span className="text-sm text-zinc-300 group-hover/link:text-white transition-colors">{r.label}</span>
                                          <ExternalLink className="w-4 h-4 text-zinc-600 group-hover/link:text-primary transition-colors" />
                                        </a>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                <div className="flex flex-col justify-end">
                                  {item.isMockTest ? (
                                    <Button
                                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 rounded-xl shadow-lg shadow-primary/10"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        router.push("/mock-test");
                                      }}
                                    >
                                      <Sparkles className="w-5 h-5 mr-2" /> Start Mock Test
                                    </Button>
                                  ) : !isDone ? (
                                    <Button
                                      className="w-full bg-green-500 hover:bg-green-600 text-white font-bold h-12 rounded-xl shadow-lg shadow-green-500/10"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        markRoadmapItemComplete(item.id);
                                        toast.success(`Day Completed!`, { description: `You finished "${item.title}".` });
                                      }}
                                    >
                                      <CheckCircle2 className="w-5 h-5 mr-2" /> Complete Day
                                    </Button>
                                  ) : (
                                    <div className="flex items-center justify-center p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 font-bold">
                                      <CheckCircle2 className="w-5 h-5 mr-2" /> Finished
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

