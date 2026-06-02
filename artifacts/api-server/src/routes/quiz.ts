import { Router } from "express";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const router = Router();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MOBILE_DATA = path.resolve(__dirname, "..", "..", "mobile", "data");
const API_DATA = path.resolve(__dirname, "..", "data");

if (!existsSync(API_DATA)) {
  mkdirSync(API_DATA, { recursive: true });
}

function readJson<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf-8")) as T;
}

function writeJson(filePath: string, data: unknown): void {
  writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

interface Vote {
  sessionId: string;
  questionId: string;
  choice: "A" | "B" | "N";
  date: string;
}

interface Result {
  sessionId: string;
  scores: Record<string, number>;
  questionCount: number;
  completedAt: string;
}

function getVotes(): Vote[] {
  const p = path.join(API_DATA, "votes.json");
  if (!existsSync(p)) return [];
  return readJson<Vote[]>(p);
}

function getResults(): Result[] {
  const p = path.join(API_DATA, "results.json");
  if (!existsSync(p)) return [];
  return readJson<Result[]>(p);
}

router.get("/questions", (req, res) => {
  const questions = readJson<unknown[]>(
    path.join(MOBILE_DATA, "questions.json"),
  );
  const raw = parseInt(req.query["limit"] as string) || 10;
  const count = [10, 40, 100].includes(raw) ? raw : 10;
  res.json(questions.slice(0, count));
});

router.get("/candidates", (_req, res) => {
  res.json(readJson(path.join(MOBILE_DATA, "candidates.json")));
});

router.get("/positions", (_req, res) => {
  res.json(readJson(path.join(MOBILE_DATA, "positions.json")));
});

router.post("/session", (_req, res) => {
  const sessionId =
    Math.random().toString(36).slice(2) + Date.now().toString(36);
  res.json({ sessionId });
});

router.post("/vote", (req, res) => {
  const body = req.body as {
    sessionId?: string;
    questionId?: string;
    choice?: string;
  };
  const { sessionId, questionId, choice } = body;
  if (!sessionId || !questionId || !["A", "B", "N"].includes(choice ?? "")) {
    res.status(400).json({ error: "Invalid vote data" });
    return;
  }
  const votes = getVotes();
  votes.push({
    sessionId,
    questionId,
    choice: choice as "A" | "B" | "N",
    date: new Date().toISOString(),
  });
  writeJson(path.join(API_DATA, "votes.json"), votes);
  res.json({ ok: true });
});

router.post("/finish", (req, res) => {
  const body = req.body as {
    sessionId?: string;
    scores?: Record<string, number>;
    questionCount?: number;
  };
  const { sessionId, scores, questionCount } = body;
  if (!sessionId || !scores) {
    res.status(400).json({ error: "Invalid finish data" });
    return;
  }
  const results = getResults();
  results.push({
    sessionId,
    scores,
    questionCount: questionCount ?? 0,
    completedAt: new Date().toISOString(),
  });
  writeJson(path.join(API_DATA, "results.json"), results);
  res.json({ ok: true });
});

router.get("/admin/stats", (req, res) => {
  const password = process.env["ADMIN_PASSWORD"] ?? "admin2027";
  const provided = req.query["pwd"] as string | undefined;
  if (provided !== password) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const votes = getVotes();
  const results = getResults();

  const votesByQuestion: Record<string, { A: number; B: number; N: number }> =
    {};
  for (const vote of votes) {
    if (!votesByQuestion[vote.questionId]) {
      votesByQuestion[vote.questionId] = { A: 0, B: 0, N: 0 };
    }
    votesByQuestion[vote.questionId][vote.choice]++;
  }

  const candidateWins: Record<string, number> = {};
  for (const result of results) {
    const sorted = Object.entries(result.scores).sort(([, a], [, b]) => b - a);
    if (sorted.length > 0) {
      const winner = sorted[0][0];
      candidateWins[winner] = (candidateWins[winner] ?? 0) + 1;
    }
  }

  res.json({
    totalVotes: votes.length,
    totalFinished: results.length,
    votesByQuestion,
    candidateWins,
  });
});

export default router;
