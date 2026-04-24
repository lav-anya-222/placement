import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AppState {
  user: User | null;
  xp: number;
  streak: number;
  lastLoginDate: string | null;
  solvedQuestions: string[];
  attemptedQuizzes: number[];
  roadmapProgress: string[];
  usedApti: number[];
  usedInterview: number[];
  weeklyXp: number[]; // Index 0-6 for Mon-Sun
  
  // Daily Missions State
  dailyCodingProblemsSolved: number;
  dailyMockInterviewJoined: boolean;
  claimedMissions: string[];
  lastMissionResetDate: string | null;
  
  // Actions
  setUser: (user: User | null) => void;
  addXp: (amount: number) => void;
  updateStreak: () => void;
  markQuestionSolved: (id: string) => void;
  markQuizAttempted: (id: number) => void;
  markRoadmapItemComplete: (id: string) => void;
  markAptiUsed: (ids: number[]) => void;
  resetAptiUsed: () => void;
  markInterviewUsed: (id: number) => void;
  resetProgress: () => void;
  logout: () => void;
  claimMission: (id: string, xpReward: number) => void;
  checkAndResetDaily: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      xp: 0,
      streak: 0,
      lastLoginDate: null,
      solvedQuestions: [],
      attemptedQuizzes: [],
      roadmapProgress: [],
      usedApti: [],
      usedInterview: [],
      weeklyXp: [120, 210, 180, 0, 0, 0, 0], // Starting mock data
      
      dailyCodingProblemsSolved: 0,
      dailyMockInterviewJoined: false,
      claimedMissions: [],
      lastMissionResetDate: null,

      setUser: (user) => set({ user }),
      
      addXp: (amount) => set((state) => {
        const today = new Date().getDay(); // 0 (Sun) to 6 (Sat)
        // Recharts usually wants Mon-Sun, let's map it. 
        // Sunday is 0 in JS, let's make it index 6. 
        // Mon (1) -> 0, Tue (2) -> 1 ... Sat (6) -> 5, Sun (0) -> 6
        const rechartIdx = today === 0 ? 6 : today - 1;
        const newWeekly = [...state.weeklyXp];
        newWeekly[rechartIdx] = (newWeekly[rechartIdx] || 0) + amount;
        
        return { 
          xp: state.xp + amount,
          weeklyXp: newWeekly
        };
      }),
      
      updateStreak: () => {
        const today = new Date().toISOString().split('T')[0];
        const state = get();
        
        if (!state.lastLoginDate) {
          set({ streak: 1, lastLoginDate: today });
          return;
        }

        const lastDate = new Date(state.lastLoginDate);
        const currentDate = new Date(today);
        const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

        if (diffDays === 1) {
          set({ streak: state.streak + 1, lastLoginDate: today });
        } else if (diffDays > 1) {
          set({ streak: 1, lastLoginDate: today });
        }
      },

      markQuestionSolved: (id) => set((state) => {
        if (!state.solvedQuestions.includes(id)) {
          return { 
            solvedQuestions: [...state.solvedQuestions, id],
            dailyCodingProblemsSolved: state.dailyCodingProblemsSolved + 1
          };
        }
        return state;
      }),

      markQuizAttempted: (id) => set((state) => {
        if (!state.attemptedQuizzes.includes(id)) {
          return { attemptedQuizzes: [...state.attemptedQuizzes, id] };
        }
        return state;
      }),

      markRoadmapItemComplete: (id) => set((state) => {
        if (!state.roadmapProgress.includes(id)) {
          return { roadmapProgress: [...state.roadmapProgress, id] };
        }
        return state;
      }),

      markAptiUsed: (ids) => set((state) => {
        const newUsed = Array.from(new Set([...state.usedApti, ...ids]));
        return { usedApti: newUsed };
      }),

      resetAptiUsed: () => set({ usedApti: [] }),

      markInterviewUsed: (id) => set((state) => {
        if (!state.usedInterview.includes(id)) {
          return { 
            usedInterview: [...state.usedInterview, id],
            dailyMockInterviewJoined: true
          };
        }
        return { ...state, dailyMockInterviewJoined: true };
      }),

      resetProgress: () => set({
        xp: 0,
        streak: 0,
        solvedQuestions: [],
        attemptedQuizzes: [],
        roadmapProgress: [],
        usedApti: [],
        usedInterview: [],
        weeklyXp: [0, 0, 0, 0, 0, 0, 0]
      }),

      logout: () => set({ 
        user: null, 
      }),

      claimMission: (id, xpReward) => set((state) => {
        if (state.claimedMissions.includes(id)) return state;
        
        const today = new Date().getDay();
        const rechartIdx = today === 0 ? 6 : today - 1;
        const newWeekly = [...state.weeklyXp];
        newWeekly[rechartIdx] = (newWeekly[rechartIdx] || 0) + xpReward;

        return {
          claimedMissions: [...state.claimedMissions, id],
          xp: state.xp + xpReward,
          weeklyXp: newWeekly
        };
      }),

      checkAndResetDaily: () => {
        const today = new Date().toISOString().split('T')[0];
        const state = get();
        if (state.lastMissionResetDate !== today) {
          set({
            dailyCodingProblemsSolved: 0,
            dailyMockInterviewJoined: false,
            claimedMissions: [],
            lastMissionResetDate: today
          });
        }
      },
    }),
    {
      name: 'prep-ai-storage',
    }
  )
);

