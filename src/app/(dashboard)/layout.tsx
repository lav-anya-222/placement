"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Brain,
  LayoutDashboard,
  FileText,
  Code,
  Target,
  Users,
  Map,
  User,
  LogOut,
  Trophy
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Resume Analyzer", href: "/resume", icon: FileText },
  { name: "Coding Practice", href: "/coding", icon: Code },
  { name: "Aptitude Tests", href: "/aptitude", icon: Target },
  { name: "Mock Interview", href: "/interview", icon: Users },
  { name: "Mock Test", href: "/mock-test", icon: Trophy },
  { name: "Roadmap", href: "/roadmap", icon: Map },
  { name: "Profile", href: "/profile", icon: User },
];


import { useStore } from "@/store/useStore";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const getLevelInfo = (xp: number) => {
  if (xp < 100) return { level: "Beginner", max: 100, min: 0 };
  if (xp < 300) return { level: "Explorer", max: 300, min: 100 };
  if (xp < 700) return { level: "Challenger", max: 700, min: 300 };
  return { level: "Placement Pro", max: 1000, min: 700 }; // 1000 is arbitrary max
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  
  const user = useStore((state) => state.user);
  const xp = useStore((state) => state.xp);
  const logoutState = useStore((state) => state.logout);
  
  const { level, max, min } = getLevelInfo(xp);
  const progress = ((xp - min) / (max - min)) * 100;

  const [isHydrated, setIsHydrated] = useState(false);
  
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (isHydrated && !user) {
      const redirectPath = encodeURIComponent(pathname);
      router.push(`/login?redirectTo=${redirectPath}`);
    }
  }, [user, router, isHydrated, pathname]);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // Ignore
    }
    logoutState();
    router.push("/login");
  };

  if (!user) {
    return <div className="h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 border-r border-white/10 bg-zinc-950 flex flex-col z-20 hidden md:flex">
        <div className="p-6 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="bg-primary/20 p-2 rounded-lg group-hover:bg-primary transition-colors">
              <Brain className="w-6 h-6 text-primary group-hover:text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">Prep AI</span>
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href}>
                <span
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                    isActive
                      ? "bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20"
                      : "text-zinc-400 hover:bg-primary hover:text-primary-foreground"
                  }`}
                >
                  <item.icon className={`w-5 h-5 ${isActive ? "text-primary-foreground" : "text-zinc-400 group-hover:text-primary-foreground"}`} />
                  {item.name}
                </span>
              </Link>
            );
          })}
        </div>

        <div className="p-4 border-t border-white/10">
          <div className="mb-4 p-3 bg-white/5 rounded-xl border border-white/10">
            <div className="flex items-center gap-2 mb-2">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-semibold text-white">Level: {level}</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-1.5 mb-1">
              <div className="bg-gradient-to-r from-yellow-500 to-primary h-1.5 rounded-full" style={{ width: `${Math.min(progress, 100)}%` }}></div>
            </div>
            <span className="text-xs text-zinc-500">{xp} / {max} XP</span>
          </div>

          <Button 
            variant="ghost" 
            className="w-full justify-start text-zinc-400 hover:text-white hover:bg-white/5"
            onClick={handleLogout}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-zinc-950 relative">
        {/* Mobile Header */}
        <div className="md:hidden p-4 border-b border-white/10 flex items-center justify-between bg-zinc-950 sticky top-0 z-30">
          <Link href="/" className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            <span className="text-lg font-bold">Prep AI</span>
          </Link>
        </div>
        
        {children}
      </main>
    </div>
  );
}
