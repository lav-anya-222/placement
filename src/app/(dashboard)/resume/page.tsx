"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Upload, FileText, CheckCircle2, AlertCircle, RefreshCw, Brain, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useStore } from "@/store/useStore";

interface ResumeResult {
  atsScore: number;
  foundSkills: string[];
  missingSkills: string[];
  grammarTips: string;
  summaryRewrite: string;
  suggestions: string[];
}

export default function ResumeAnalyzerPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ResumeResult | null>(null);

  const addXp = useStore((state) => state.addXp);

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files[0]) handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.type !== "application/pdf") {
      toast.error("Please upload a PDF file.");
      return;
    }
    setFile(selectedFile);
    setResult(null);
  };

  const analyzeResume = async () => {
    if (!file) return;
    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/analyze-resume", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Analysis failed");
      const data: ResumeResult = await res.json();
      setResult(data);
      addXp(50);
      toast.success("+50 XP! Resume analyzed!", {
        description: `ATS Score: ${data.atsScore}/100`,
      });
    } catch (err) {
      toast.error("Failed to analyze resume. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Resume Analyzer</h1>
        <p className="text-zinc-400">Upload your PDF resume. AI reads the real content and gives you ATS score, skills gap, and suggestions.</p>
      </div>

      {/* Upload Area */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardContent className="p-10">
          <div
            className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
              isDragging ? "border-primary bg-primary/5" : "border-zinc-700 bg-zinc-950/50"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
              {file ? <FileText className="w-8 h-8 text-primary" /> : <Upload className={`w-8 h-8 ${isDragging ? "text-primary" : "text-zinc-400"}`} />}
            </div>

            {!file ? (
              <>
                <h3 className="text-xl font-medium text-white mb-2">Drag and drop your resume PDF</h3>
                <p className="text-zinc-400 mb-6">AI reads the actual text — not just filename</p>
                <label className="cursor-pointer">
                  <div className="inline-flex h-9 items-center justify-center rounded-md bg-white text-black hover:bg-zinc-200 px-4 py-2 text-sm font-medium cursor-pointer">
                    Browse Files
                  </div>
                  <input type="file" className="hidden" accept=".pdf" onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])} />
                </label>
              </>
            ) : (
              <div className="flex flex-col items-center">
                <p className="text-lg text-white font-medium mb-1">{file.name}</p>
                <p className="text-sm text-zinc-400 mb-6">{(file.size / 1024 / 1024).toFixed(2)} MB · Ready to analyze</p>
                <div className="flex gap-4">
                  <Button variant="outline" onClick={() => { setFile(null); setResult(null); }}>Remove</Button>
                  <Button
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={analyzeResume}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <><Brain className="w-4 h-4 mr-2 animate-pulse" /> Analyzing with AI...</>
                    ) : <><Brain className="w-4 h-4 mr-2" /> Analyze Resume</>}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Score + Summary */}
          <div className="md:col-span-1 space-y-6">
            <Card className="bg-zinc-900 border-zinc-800 text-center relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
              <CardContent className="pt-8 pb-8 flex flex-col items-center">
                <div className="relative w-40 h-40 flex items-center justify-center mb-4">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                    <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-zinc-800" />
                    <circle
                      cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent"
                      strokeDasharray={2 * Math.PI * 70}
                      strokeDashoffset={2 * Math.PI * 70 * (1 - result.atsScore / 100)}
                      className={`transition-all duration-1000 ease-out ${result.atsScore >= 70 ? 'text-green-500' : result.atsScore >= 50 ? 'text-yellow-500' : 'text-red-500'}`}
                    />
                  </svg>
                  <div className="absolute">
                    <div className="text-4xl font-bold text-white">{result.atsScore}</div>
                    <div className="text-xs text-zinc-400 text-center">/100</div>
                  </div>
                </div>
                <h2 className="text-xl font-bold text-white mb-1">ATS Score</h2>
                <Badge className={result.atsScore >= 70 ? "bg-green-500/20 text-green-400" : result.atsScore >= 50 ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}>
                  {result.atsScore >= 70 ? "Good Match" : result.atsScore >= 50 ? "Needs Work" : "Low Match"}
                </Badge>
                <Button className="w-full mt-6" variant="outline" onClick={() => { setResult(null); setFile(null); }}>
                  Analyze Another
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Brain className="w-4 h-4 text-primary" /> AI Summary Rewrite
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-zinc-300 italic p-4 bg-white/5 rounded-xl border border-white/10 leading-relaxed">
                  "{result.summaryRewrite}"
                </p>
                <Button variant="ghost" className="w-full mt-3 text-primary text-sm hover:bg-primary/10"
                  onClick={() => { navigator.clipboard.writeText(result.summaryRewrite); toast.success("Copied to clipboard!"); }}>
                  <Copy className="w-4 h-4 mr-2" /> Copy Rewrite
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Skills + Suggestions */}
          <div className="md:col-span-2 space-y-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader><CardTitle className="text-white">Skills Analysis</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-medium text-zinc-400 mb-3">
                    <CheckCircle2 className="w-4 h-4 text-green-500" /> Detected in Your Resume
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {result.foundSkills.map((skill) => (
                      <Badge key={skill} className="bg-green-500/10 text-green-400 hover:bg-green-500/20">{skill}</Badge>
                    ))}
                  </div>
                </div>
                <div className="h-px bg-zinc-800 w-full" />
                <div>
                  <h4 className="flex items-center gap-2 text-sm font-medium text-zinc-400 mb-3">
                    <AlertCircle className="w-4 h-4 text-yellow-500" /> Missing / Add These
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {result.missingSkills.map((skill) => (
                      <Badge key={skill} variant="outline" className="border-yellow-500/30 text-yellow-500">{skill}</Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader><CardTitle className="text-white">Actionable Suggestions</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl flex gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-orange-200 mb-1">Grammar & Tone</h5>
                    <p className="text-sm text-orange-200/80">{result.grammarTips}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <h5 className="font-medium text-white">General Tips</h5>
                  {result.suggestions.map((sug, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-white/5 rounded-lg border border-white/5">
                      <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs shrink-0 font-bold">{i + 1}</div>
                      <p className="text-sm text-zinc-300 pt-0.5 leading-relaxed">{sug}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}
    </div>
  );
}
