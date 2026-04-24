# Prep AI: Project Reference Guide

## 🚀 Overview
**Prep AI** is an AI-powered career and interview preparation platform designed to help students and professionals bridge the gap between learning and placement. It features gamified progress tracking, AI-driven resume analysis, and structured practice modules.

---

## 🛠️ Technology Stack
- **Framework:** [Next.js 15+](https://nextjs.org/) (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS, Framer Motion (Animations), [shadcn/ui](https://ui.shadcn.com/) (Components)
- **State Management:** [Zustand](https://zustand-demo.pmnd.rs/) (with `persist` middleware for local storage)
- **Backend/Auth:** [Supabase](https://supabase.com/)
- **AI Integration:** Google Gemini AI (Generative AI)
- **Icons:** Lucide React

---

## 🏗️ Core Architecture

### 1. **State Management (`src/store/useStore.ts`)**
The application uses a centralized Zustand store to manage:
- **User Profile:** Name, role, target company.
- **Progression:** XP, Level (Beginner to Placement Pro), and Streaks.
- **Completion Tracking:** Tracks finished aptitude tests, coding problems, and interview sessions.
- **Persistence:** Automatically saves progress to `localStorage`.

### 2. **Dashboard Layout (`src/app/(dashboard)/layout.tsx`)**
The dashboard uses a shared layout that includes:
- **Sidebar Navigation:** Context-aware navigation for all core modules.
- **User Progress Sidebar:** Real-time display of XP, Level, and Streak info.
- **Authentication Guard:** Ensures users are logged in via Supabase.

### 3. **AI Integration (`src/app/api/`)**
AI features are implemented as Next.js Route Handlers:
- `analyze-resume`: Uses Gemini Pro to parse resumes and provide ATS scores/feedback.
- `generate-roadmap`: Creates personalized 30-day prep plans based on user goals.
- `evaluate-interview`: Scores mock interview answers using AI.
- *Fallback Mechanism:* All AI routes include robust fallback/mock data generators for offline use or missing API keys.

---

## 📂 Key Modules & Data

| Module | Description | Data Source |
| :--- | :--- | :--- |
| **Aptitude** | Logic/Quant quizzes | `src/data/aptitude.ts` |
| **Coding** | DSA practice with LeetCode links | `src/data/coding.ts` |
| **Interview** | AI-powered mock interviews | `src/data/interview.ts` |
| **Roadmap** | Personalized 30-day prep plans | AI-generated / `roadmap.ts` |
| **Resume** | ATS-focused resume analyzer | AI-driven (`api/analyze-resume`) |

---

## 🔑 Key Files & Symbols
- `src/lib/supabase.ts`: Supabase client initialization.
- `src/lib/utils.ts`: Utility functions (cn, formatting).
- `src/components/ui/`: Reusable Radix UI components.
- `update_aptitude.js`: Script for managing/seeding aptitude data.

---

## 📈 Gamification Logic
- **XP Calculation:** Logic for earning XP is typically found within the `useStore.ts` `addXp` action.
- **Levels:** `getLevelInfo` in the dashboard layout maps XP to specific titles and rewards.
