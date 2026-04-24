"use client";

import { motion } from "framer-motion";
import { User, Trophy, Flame, Code, FileText, Target, Award, Hexagon, Medal, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { useStore } from "@/store/useStore";

const getLevelInfo = (xp: number) => {
  if (xp < 100) return { level: "Beginner", max: 100, min: 0 };
  if (xp < 300) return { level: "Explorer", max: 300, min: 100 };
  if (xp < 700) return { level: "Challenger", max: 700, min: 300 };
  return { level: "Placement Pro", max: 1000, min: 700 };
};

export default function ProfilePage() {
  const user = useStore((state) => state.user);
  const xp = useStore((state) => state.xp);
  const streak = useStore((state) => state.streak);
  const solvedQuestions = useStore((state) => state.solvedQuestions);
  const roadmapProgress = useStore((state) => state.roadmapProgress);
  const usedInterview = useStore((state) => state.usedInterview);
  
  const { level, max, min } = getLevelInfo(xp);
  const progress = ((xp - min) / (max - min)) * 100;

  const prepStats = [
    { label: "Coding Mastery", value: Math.round((solvedQuestions.length / 50) * 100), color: "bg-green-500" },
    { label: "Interview Readiness", value: Math.round((usedInterview.length / 20) * 100), color: "bg-blue-500" },
    { label: "Roadmap Completion", value: Math.round((roadmapProgress.length / 30) * 100), color: "bg-purple-500" },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      {/* Header Profile Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative"
      >
        <div className="h-48 w-full rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-primary relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20" />
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        </div>
        
        <div className="px-8 flex flex-col md:flex-row gap-6 relative -mt-16">
          <Avatar className="w-32 h-32 border-4 border-black shadow-2xl">
            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.name || 'Guest'}`} />
            <AvatarFallback className="bg-zinc-800 text-2xl">{user?.name?.charAt(0) || "G"}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1 pt-2 md:pt-20">
            <h1 className="text-3xl font-bold text-white mb-1">{user?.name || "Guest User"}</h1>
            <p className="text-zinc-400">{user?.email || "guest@example.com"}</p>
          </div>
          
          <div className="flex gap-4 md:pt-20 items-center">
            <div className="bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-xs text-zinc-500">Streak</p>
                <p className="font-bold text-white leading-none">{streak} Days</p>
              </div>
            </div>
            <div className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-xl flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              <div>
                <p className="text-xs text-primary/80">XP Level</p>
                <p className="font-bold text-primary leading-none">{xp} / {max}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-8">
          <Card className="bg-zinc-900 border-zinc-800 overflow-hidden">
            <CardHeader className="bg-white/5">
              <CardTitle className="text-white flex items-center gap-2 text-base">
                <Award className="w-5 h-5 text-yellow-500" /> Professional Rank
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center py-8">
              <div className="w-24 h-24 mx-auto mb-4 relative group">
                <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-xl group-hover:bg-yellow-500/40 transition-all" />
                <Hexagon className="w-full h-full text-yellow-500 relative z-10" fill="currentColor" fillOpacity={0.2} />
                <Trophy className="w-10 h-10 text-yellow-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{level}</h3>
              <p className="text-sm text-zinc-500 mb-6 font-medium uppercase tracking-wider">Student Tier</p>
              
              <div className="text-left space-y-2 px-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400 font-bold uppercase tracking-tighter">Level Progress</span>
                  <span className="text-white font-bold">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2.5 bg-zinc-800" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white text-lg">Activity Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg"><Code className="w-4 h-4 text-green-500" /></div>
                  <span className="text-sm text-zinc-300">Problems Solved</span>
                </div>
                <span className="font-bold text-white text-lg">{solvedQuestions.length}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 rounded-lg"><FileText className="w-4 h-4 text-blue-500" /></div>
                  <span className="text-sm text-zinc-300">Resumes Analyzed</span>
                </div>
                <span className="font-bold text-white text-lg">1</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-black/40 border border-white/5 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg"><Target className="w-4 h-4 text-purple-500" /></div>
                  <span className="text-sm text-zinc-300">Mock Sessions</span>
                </div>
                <span className="font-bold text-white text-lg">{usedInterview.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-8">
          <Card className="bg-zinc-900 border-zinc-800 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -mr-32 -mt-32" />
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" /> Preparation Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-8 pt-4">
              {prepStats.map((stat, i) => (
                <div key={i} className="space-y-3">
                  <div className="flex justify-between items-end">
                    <div>
                      <h4 className="text-white font-bold text-base mb-1">{stat.label}</h4>
                      <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Current Milestone</p>
                    </div>
                    <span className="text-2xl font-black text-primary">{stat.value}%</span>
                  </div>
                  <Progress value={stat.value} className={`h-3 bg-zinc-800 ${stat.color.replace('bg-', '[&>div]:bg-')}`} />
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Medal className="w-5 h-5 text-pink-500" /> Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { title: "Quick Starter", desc: "First resume analyzed", icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10", active: true },
                  { title: "Consistency", desc: "7 Day Streak", icon: Flame, color: "text-orange-500", bg: "bg-orange-500/10", active: streak >= 7 },
                  { title: "Coder", desc: "10 Problems Solved", icon: Code, color: "text-green-500", bg: "bg-green-500/10", active: solvedQuestions.length >= 10 },
                  { title: "Interview Pro", desc: "5 Mock Sessions", icon: Target, color: "text-purple-500", bg: "bg-purple-500/10", active: usedInterview.length >= 5 },
                ].map((badge, i) => (
                  <div key={i} className={`flex flex-col items-center text-center p-4 rounded-2xl border transition-all ${badge.active ? 'bg-black/60 border-primary/20 shadow-lg shadow-primary/5' : 'bg-black/20 border-white/5 opacity-40 grayscale'}`}>
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${badge.bg} shadow-inner`}>
                      <badge.icon className={`w-7 h-7 ${badge.color}`} />
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1">{badge.title}</h4>
                    <p className="text-[10px] text-zinc-500 font-medium leading-tight uppercase tracking-tighter">{badge.desc}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

