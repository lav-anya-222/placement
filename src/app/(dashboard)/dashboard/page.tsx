"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { 
  Trophy, Flame, Target, Zap, 
  FileText, Code, Users, PlayCircle 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useRouter } from "next/navigation";

import { useStore } from "@/store/useStore";

const mockChartData = [
  { name: 'Mon', xp: 120 },
  { name: 'Tue', xp: 210 },
  { name: 'Wed', xp: 180 },
  { name: 'Thu', xp: 350 },
  { name: 'Fri', xp: 280 },
  { name: 'Sat', xp: 420 },
  { name: 'Sun', xp: 500 },
];
export default function DashboardPage() {
  const router = useRouter();
  const user = useStore((state) => state.user);
  const xp = useStore((state) => state.xp);
  const streak = useStore((state) => state.streak);
  const solvedQuestions = useStore((state) => state.solvedQuestions);
  const weeklyXp = useStore((state) => state.weeklyXp);

  const chartData = [
    { name: 'Mon', xp: weeklyXp[0] },
    { name: 'Tue', xp: weeklyXp[1] },
    { name: 'Wed', xp: weeklyXp[2] },
    { name: 'Thu', xp: weeklyXp[3] },
    { name: 'Fri', xp: weeklyXp[4] },
    { name: 'Sat', xp: weeklyXp[5] },
    { name: 'Sun', xp: weeklyXp[6] },
  ];

  const dailyCodingProblemsSolved = useStore((state) => state.dailyCodingProblemsSolved);
  const dailyMockInterviewJoined = useStore((state) => state.dailyMockInterviewJoined);
  const claimedMissions = useStore((state) => state.claimedMissions);
  const claimMission = useStore((state) => state.claimMission);
  const checkAndResetDaily = useStore((state) => state.checkAndResetDaily);

  useEffect(() => {
    checkAndResetDaily();
  }, [checkAndResetDaily]);

  useEffect(() => {
    const checkMissions = [
      { id: "solve_2_coding", title: "Solve 2 Coding Problems", xpReward: 40, isComplete: dailyCodingProblemsSolved >= 2 },
      { id: "reach_500_xp", title: "Reach 500 XP", xpReward: 100, isComplete: xp >= 500 },
      { id: "join_mock_interview", title: "Join Mock Interview", xpReward: 50, isComplete: dailyMockInterviewJoined },
    ];

    checkMissions.forEach(mission => {
      if (mission.isComplete && !claimedMissions.includes(mission.id)) {
        claimMission(mission.id, mission.xpReward);
        toast.success(`Mission Completed! 🎉`, {
          description: `You earned +${mission.xpReward} XP for: ${mission.title}`
        });
      }
    });
  }, [dailyCodingProblemsSolved, xp, dailyMockInterviewJoined, claimedMissions, claimMission]);

  const missions = [
    { title: "Solve 2 Coding Problems", xp: "+40 XP", done: claimedMissions.includes("solve_2_coding") },
    { title: "Reach 500 XP", xp: "+100 XP", done: claimedMissions.includes("reach_500_xp") },
    { title: "Join Mock Interview", xp: "+50 XP", done: claimedMissions.includes("join_mock_interview") },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header section */}
      <motion.div 
        className="flex flex-col md:flex-row md:items-center justify-between gap-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {user?.name || "Guest"}! 👋</h1>
          <p className="text-zinc-400">You are {Math.min(100, Math.round((xp / 1000) * 100))}% closer to being placement-ready.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="font-bold text-white">{streak} Day Streak</span>
          </div>
          <div className="flex items-center gap-2 bg-primary/10 border border-primary/20 px-4 py-2 rounded-xl">
            <Trophy className="w-5 h-5 text-primary" />
            <span className="font-bold text-primary">{xp} XP</span>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {[
          { title: "Total XP", value: xp, icon: Zap, color: "text-blue-500", bg: "bg-blue-500/10" },
          { title: "Coding Progress", value: `${solvedQuestions.length} Solved`, icon: Code, color: "text-green-500", bg: "bg-green-500/10" },
          { title: "Aptitude Tests", value: "92%", icon: Target, color: "text-purple-500", bg: "bg-purple-500/10" },
          { title: "Interview Ready", value: "78%", icon: Users, color: "text-pink-500", bg: "bg-pink-500/10" }
        ].map((stat, i) => (
          <motion.div key={i} variants={itemVariants}>
            <Card className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-sm font-medium mb-1">{stat.title}</p>
                  <h3 className="text-2xl font-bold text-white">{stat.value}</h3>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Area */}
        <motion.div className="lg:col-span-2 space-y-8" variants={containerVariants} initial="hidden" animate="visible">
          {/* XP Chart */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Weekly Activity (XP)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff', borderRadius: '8px' }}
                      itemStyle={{ color: '#3b82f6' }}
                    />
                    <Area type="monotone" dataKey="xp" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorXp)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Placement Readiness */}
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Placement Readiness Score
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <div className="flex justify-between mb-2 text-sm">
                  <span className="text-zinc-400">Overall Progress</span>
                  <span className="text-white font-medium">{Math.min(100, Math.round((xp / 1000) * 100))}%</span>
                </div>
                <Progress value={Math.min(100, (xp / 1000) * 100)} className="h-3" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Button className="w-full" variant="outline" onClick={() => router.push("/profile")}>View Full Report</Button>
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => router.push("/mock-test")}>Take Mock Test</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sidebar Missions */}
        <motion.div className="space-y-8" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <Card className="bg-zinc-900 border-zinc-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Today's Missions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {missions.map((mission, i) => (
                <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${mission.done ? 'bg-primary/10 border-primary/20 opacity-60' : 'bg-zinc-950 border-zinc-800'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${mission.done ? 'border-primary bg-primary' : 'border-zinc-600'}`}>
                      {mission.done && <div className="w-2 h-2 bg-primary-foreground rounded-full" />}
                    </div>
                    <span className={`text-sm ${mission.done ? 'text-zinc-400 line-through' : 'text-white'}`}>{mission.title}</span>
                  </div>
                  <span className="text-xs font-bold text-yellow-500">{mission.xp}</span>
                </div>
              ))}
              <Button className="w-full mt-4 bg-white/5 hover:bg-white/10 text-white" variant="ghost" onClick={() => router.push("/roadmap")}>View All Missions</Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-900/50 to-purple-900/50 border-indigo-500/30">
            <CardContent className="p-6 text-center space-y-4">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <PlayCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Next Step in Roadmap</h3>
              <p className="text-zinc-300 text-sm">Master Dynamic Programming (Day 14)</p>
              <Button className="w-full bg-white text-black hover:bg-zinc-200" onClick={() => router.push("/roadmap")}>Start Learning</Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
