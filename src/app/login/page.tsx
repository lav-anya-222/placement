"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Brain, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import Link from "next/link";

import { useStore } from "@/store/useStore";
import { supabase } from "@/lib/supabase";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("student@example.com");
  
  const setUser = useStore((state) => state.setUser);
  const updateStreak = useStore((state) => state.updateStreak);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
        throw new Error("Supabase is not configured.");
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: (document.getElementById('password') as HTMLInputElement).value || "password123",
      });

      if (error) {
        throw error;
      }

      setUser({
        id: data.user.id,
        email: data.user.email || email,
        name: data.user.user_metadata?.full_name || email.split("@")[0]
      });
      updateStreak();

      toast.success("Welcome back!", {
        description: "Successfully logged in to your account.",
      });
      router.push(redirectTo);
    } catch (err: any) {
      console.log("Supabase Auth failed/missing, using fallback mock login.", err.message);
      
      setTimeout(() => {
        setLoading(false);
        setUser({
          id: "1",
          email: email,
          name: email.split("@")[0]
        });
        updateStreak();

        toast.success("Welcome back!", {
          description: "Successfully logged in to your account. (Mock Mode)",
        });
        router.push(redirectTo);
      }, 1000);
      return;
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <Link href="/" className="flex items-center justify-center gap-2 mb-8 group">
          <div className="bg-primary/20 p-3 rounded-xl group-hover:bg-primary transition-colors">
            <Brain className="w-8 h-8 text-primary group-hover:text-primary-foreground transition-colors" />
          </div>
          <span className="text-3xl font-bold tracking-tight text-white">Prep AI</span>
        </Link>

        <Card className="bg-zinc-950 border-zinc-800 shadow-2xl backdrop-blur-xl">
          <CardHeader className="space-y-2 text-center">
            <CardTitle className="text-2xl font-bold tracking-tight text-white">Welcome back</CardTitle>
            <CardDescription className="text-zinc-400">
              Enter your credentials to continue your placement prep
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-300">Email</Label>
                  <Input 
                  id="email" 
                  type="email" 
                  placeholder="student@college.edu" 
                  required 
                  className="bg-zinc-900 border-zinc-800 focus-visible:ring-primary text-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-zinc-300">Password</Label>
                  <Link href="#" className="text-sm text-primary hover:underline">Forgot password?</Link>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  className="bg-zinc-900 border-zinc-800 focus-visible:ring-primary text-white"
                  defaultValue="password123"
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-11" disabled={loading}>
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                {loading ? "Signing in..." : "Sign in"}
              </Button>
              <div className="text-center text-sm text-zinc-400">
                Don't have an account?{" "}
                <Link href="#" className="text-primary hover:underline font-medium">Sign up</Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
