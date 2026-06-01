import React, {
  createContext,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";

import candidatesData from "@/data/candidates.json";
import positionsData from "@/data/positions.json";
import questionsData from "@/data/questions.json";

export interface Question {
  id: string;
  theme: string;
  bloc: string;
  question: string;
  optionA: string;
  optionB: string;
  enonce: string;
}

export interface Candidate {
  id: string;
  name: string;
  party: string;
  color: string;
}

export type Answer = "A" | "B" | "N";
export type QuizMode = 10 | 40 | 100;

export interface CandidateResult {
  id: string;
  name: string;
  party: string;
  color: string;
  score: number;
  maxScore: number;
  percentage: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function selectBalanced(all: Question[], count: number): Question[] {
  if (all.length <= count) return shuffle(all);

  const byTheme: Record<string, Question[]> = {};
  for (const q of all) {
    const t = q.theme || "Autre";
    if (!byTheme[t]) byTheme[t] = [];
    byTheme[t].push(q);
  }
  Object.keys(byTheme).forEach((t) => {
    byTheme[t] = shuffle(byTheme[t]);
  });

  const themes = shuffle(Object.keys(byTheme));
  const selected: Question[] = [];
  let cursor = 0;

  while (selected.length < count) {
    const theme = themes[cursor % themes.length];
    const bucket = byTheme[theme];
    if (bucket && bucket.length > 0) selected.push(bucket.shift()!);
    cursor++;
    if (cursor > count * themes.length * 3) break;
  }

  if (selected.length < count) {
    const already = new Set(selected.map((q) => q.id));
    const remaining = shuffle(all.filter((q) => !already.has(q.id)));
    selected.push(...remaining.slice(0, count - selected.length));
  }

  return selected.slice(0, count);
}

function computeResults(
  questions: Question[],
  answers: Record<string, Answer>
): CandidateResult[] {
  const candidates = candidatesData as Candidate[];
  const positions = positionsData as Record<string, Record<string, string>>;

  const nonNeutral = Object.entries(answers).filter(([, v]) => v !== "N");
  const maxScore = nonNeutral.length;

  return candidates
    .map((candidate) => {
      let score = 0;
      for (const q of questions) {
        const userAnswer = answers[q.id];
        if (!userAnswer || userAnswer === "N") continue;
        const candidatePos = positions[candidate.id]?.[q.id];
        if (!candidatePos || candidatePos === "N") continue;
        if (userAnswer === candidatePos) score++;
      }
      const percentage =
        maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
      return {
        id: candidate.id,
        name: candidate.name,
        party: candidate.party,
        color: candidate.color,
        score,
        maxScore,
        percentage,
      };
    })
    .sort((a, b) => b.percentage - a.percentage || b.score - a.score);
}

interface QuizContextType {
  mode: QuizMode | null;
  questions: Question[];
  currentIndex: number;
  answers: Record<string, Answer>;
  results: CandidateResult[] | null;
  isFinished: boolean;
  startQuiz: (mode: QuizMode) => void;
  answer: (choice: Answer) => void;
  goBack: () => void;
  resetQuiz: () => void;
  progress: number;
}

const QuizContext = createContext<QuizContextType | null>(null);

export function QuizProvider({ children }: { children: React.ReactNode }) {
  const allQuestions = useRef<Question[]>(questionsData as Question[]);
  const [mode, setMode] = useState<QuizMode | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [results, setResults] = useState<CandidateResult[] | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  const startQuiz = useCallback((selectedMode: QuizMode) => {
    const selected = selectBalanced(allQuestions.current, selectedMode);
    setMode(selectedMode);
    setQuestions(selected);
    setCurrentIndex(0);
    setAnswers({});
    setResults(null);
    setIsFinished(false);
  }, []);

  const answer = useCallback(
    (choice: Answer) => {
      if (!questions[currentIndex]) return;
      const qId = questions[currentIndex].id;
      const newAnswers = { ...answers, [qId]: choice };
      setAnswers(newAnswers);
      const nextIndex = currentIndex + 1;
      if (nextIndex >= questions.length) {
        const computed = computeResults(questions, newAnswers);
        setResults(computed);
        setIsFinished(true);
      } else {
        setCurrentIndex(nextIndex);
      }
    },
    [questions, currentIndex, answers]
  );

  const goBack = useCallback(() => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  }, [currentIndex]);

  const resetQuiz = useCallback(() => {
    setMode(null);
    setQuestions([]);
    setCurrentIndex(0);
    setAnswers({});
    setResults(null);
    setIsFinished(false);
  }, []);

  const progress =
    questions.length > 0 ? currentIndex / questions.length : 0;

  return (
    <QuizContext.Provider
      value={{
        mode,
        questions,
        currentIndex,
        answers,
        results,
        isFinished,
        startQuiz,
        answer,
        goBack,
        resetQuiz,
        progress,
      }}
    >
      {children}
    </QuizContext.Provider>
  );
}

export function useQuiz() {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error("useQuiz must be used inside QuizProvider");
  return ctx;
}
