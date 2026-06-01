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

export interface CandidateResult {
  id: string;
  name: string;
  party: string;
  color: string;
  score: number;
  maxScore: number;
  percentage: number;
}

const QUIZ_SIZE = 40;

function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function computeResults(
  questions: Question[],
  answers: Record<string, Answer>
): CandidateResult[] {
  const candidates = candidatesData as Candidate[];
  const positions = positionsData as Record<string, Record<string, string>>;

  const nonNeutralAnswers = Object.entries(answers).filter(
    ([, v]) => v !== "N"
  );
  const maxScore = nonNeutralAnswers.length;

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
  questions: Question[];
  currentIndex: number;
  answers: Record<string, Answer>;
  results: CandidateResult[] | null;
  isFinished: boolean;
  startQuiz: () => void;
  answer: (choice: Answer) => void;
  goBack: () => void;
  resetQuiz: () => void;
  progress: number;
}

const QuizContext = createContext<QuizContextType | null>(null);

export function QuizProvider({ children }: { children: React.ReactNode }) {
  const allQuestions = useRef<Question[]>(
    questionsData as Question[]
  );
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [results, setResults] = useState<CandidateResult[] | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  const startQuiz = useCallback(() => {
    const shuffled = shuffleArray(allQuestions.current).slice(0, QUIZ_SIZE);
    setQuestions(shuffled);
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
    if (currentIndex > 0) {
      setCurrentIndex((i) => i - 1);
    }
  }, [currentIndex]);

  const resetQuiz = useCallback(() => {
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
