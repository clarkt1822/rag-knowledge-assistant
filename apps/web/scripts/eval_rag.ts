import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const DEFAULT_BASE_URL = "http://localhost:3000";
const ABSTAIN_PHRASES = ["i don't know", "i do not know"];

type EvalQuestion = {
  id: string;
  question: string;
  expected_answer_contains: string[];
  expected_retrieved_titles_contains: string[];
  should_abstain: boolean;
};

type RetrievedItem = {
  title?: unknown;
};

type ChatResponse = {
  answer?: unknown;
  retrieved?: unknown;
};

type QuestionResult = {
  id: string;
  httpStatus: number | null;
  abstainExpected: boolean;
  abstainCorrect: boolean;
  answerKeywordScore: string;
  retrievedTitleScore: string;
  retrievedCount: number;
  answerPreview: string;
  passed: boolean;
};

function getBaseUrl() {
  return process.env.EVAL_BASE_URL?.trim() || DEFAULT_BASE_URL;
}

function getRepoRoot() {
  return path.resolve(__dirname, "../../..");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asStringArray(value: unknown) {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isEvalQuestion(value: unknown): value is EvalQuestion {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.question === "string" &&
    asStringArray(value.expected_answer_contains) &&
    asStringArray(value.expected_retrieved_titles_contains) &&
    typeof value.should_abstain === "boolean"
  );
}

async function loadQuestions(filePath: string) {
  const raw = await readFile(filePath, "utf8");
  const parsed = JSON.parse(raw) as unknown;

  if (!Array.isArray(parsed) || !parsed.every(isEvalQuestion)) {
    throw new Error("Invalid eval/questions.json format");
  }

  return parsed;
}

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toRetrievedItems(value: unknown): RetrievedItem[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isRecord);
}

function includesNormalized(haystack: string, needle: string) {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

function detectAbstain(answer: string) {
  const normalized = answer.toLowerCase();
  return ABSTAIN_PHRASES.some((phrase) => normalized.includes(phrase));
}

function scoreMatches(expected: string[], values: string[]) {
  if (expected.length === 0) {
    return { hits: 0, total: 0, ratio: 1 };
  }

  const hits = expected.filter((expectedValue) =>
    values.some((value) => includesNormalized(value, expectedValue))
  ).length;

  return {
    hits,
    total: expected.length,
    ratio: hits / expected.length,
  };
}

function formatScore(hits: number, total: number) {
  return `${hits}/${total}`;
}

function createAnswerPreview(answer: string) {
  if (!answer) {
    return "(empty)";
  }

  const singleLine = answer.replace(/\s+/g, " ").trim();
  return singleLine.length <= 100 ? singleLine : `${singleLine.slice(0, 97)}...`;
}

function toMarkdownTableRow(columns: string[]) {
  return `| ${columns.map((value) => value.replace(/\|/g, "\\|")).join(" | ")} |`;
}

async function evaluateQuestion(baseUrl: string, question: EvalQuestion): Promise<QuestionResult> {
  let httpStatus: number | null = null;
  let answer = "";
  let retrieved: RetrievedItem[] = [];

  try {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: question.question,
        traceMode: false,
      }),
    });

    httpStatus = response.status;

    let data: unknown = null;
    try {
      data = (await response.json()) as unknown;
    } catch {
      data = null;
    }

    if (isRecord(data)) {
      const chatData = data as ChatResponse;
      answer = normalizeText(chatData.answer);
      retrieved = toRetrievedItems(chatData.retrieved);
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Request failed before a response was received";

    return {
      id: question.id,
      httpStatus: null,
      abstainExpected: question.should_abstain,
      abstainCorrect: false,
      answerKeywordScore: formatScore(0, question.expected_answer_contains.length),
      retrievedTitleScore: formatScore(0, question.expected_retrieved_titles_contains.length),
      retrievedCount: 0,
      answerPreview: createAnswerPreview(`Request failed: ${message}`),
      passed: false,
    };
  }

  const abstained = detectAbstain(answer);
  const abstainCorrect = abstained === question.should_abstain;
  const answerScore = scoreMatches(question.expected_answer_contains, [answer]);
  const retrievedTitles = retrieved.map((item) => normalizeText(item.title)).filter(Boolean);
  const retrievedScore = scoreMatches(
    question.expected_retrieved_titles_contains,
    retrievedTitles
  );
  const passed =
    httpStatus !== null &&
    httpStatus >= 200 &&
    httpStatus < 300 &&
    abstainCorrect &&
    answerScore.hits === answerScore.total &&
    retrievedScore.hits === retrievedScore.total;

  return {
    id: question.id,
    httpStatus,
    abstainExpected: question.should_abstain,
    abstainCorrect,
    answerKeywordScore: formatScore(answerScore.hits, answerScore.total),
    retrievedTitleScore: formatScore(retrievedScore.hits, retrievedScore.total),
    retrievedCount: retrieved.length,
    answerPreview: createAnswerPreview(answer),
    passed,
  };
}

function buildReport(baseUrl: string, results: QuestionResult[]) {
  const totalQuestions = results.length;
  const abstainExpectedCount = results.filter((result) => result.abstainExpected).length;
  const abstainCorrectCount = results.filter((result) => result.abstainCorrect).length;
  const answerKeywordHits = results.reduce((sum, result) => {
    const [hits] = result.answerKeywordScore.split("/");
    return sum + Number(hits);
  }, 0);
  const answerKeywordTotal = results.reduce((sum, result) => {
    const [, total] = result.answerKeywordScore.split("/");
    return sum + Number(total);
  }, 0);
  const retrievedTitleHits = results.reduce((sum, result) => {
    const [hits] = result.retrievedTitleScore.split("/");
    return sum + Number(hits);
  }, 0);
  const retrievedTitleTotal = results.reduce((sum, result) => {
    const [, total] = result.retrievedTitleScore.split("/");
    return sum + Number(total);
  }, 0);
  const passCount = results.filter((result) => result.passed).length;

  const lines = [
    "# RAG Evaluation",
    "",
    `Base URL: \`${baseUrl}\``,
    "",
    "## Summary Metrics",
    "",
    `- Total questions: ${totalQuestions}`,
    `- Abstain accuracy: ${abstainCorrectCount}/${totalQuestions}`,
    `- Abstain expected count: ${abstainExpectedCount}`,
    `- Answer keyword hit rate: ${answerKeywordHits}/${answerKeywordTotal}`,
    `- Retrieved title hit rate: ${retrievedTitleHits}/${retrievedTitleTotal}`,
    `- Total question pass count: ${passCount}/${totalQuestions}`,
    "",
    "## Per-Question Results",
    "",
    toMarkdownTableRow([
      "id",
      "http status",
      "abstain expected",
      "abstain correct",
      "answer keyword score",
      "retrieved title score",
      "retrieved count",
      "answer preview",
    ]),
    toMarkdownTableRow([
      "---",
      "---",
      "---",
      "---",
      "---",
      "---",
      "---",
      "---",
    ]),
    ...results.map((result) =>
      toMarkdownTableRow([
        result.id,
        result.httpStatus === null ? "request failed" : String(result.httpStatus),
        String(result.abstainExpected),
        String(result.abstainCorrect),
        result.answerKeywordScore,
        result.retrievedTitleScore,
        String(result.retrievedCount),
        result.answerPreview,
      ])
    ),
  ];

  return `${lines.join("\n")}\n`;
}

async function main() {
  const repoRoot = getRepoRoot();
  const questionsPath = path.resolve(repoRoot, "eval", "questions.json");
  const docsDir = path.resolve(repoRoot, "docs");
  const outputPath = path.resolve(docsDir, "evaluation.md");
  const baseUrl = getBaseUrl();

  try {
    const questions = await loadQuestions(questionsPath);
    const results = await Promise.all(
      questions.map((question) => evaluateQuestion(baseUrl, question))
    );
    const report = buildReport(baseUrl, results);

    await mkdir(docsDir, { recursive: true });
    await writeFile(outputPath, report, "utf8");

    const failedRequests = results.filter((result) => result.httpStatus === null).length;

    console.log(`Evaluated ${results.length} questions.`);
    console.log(`Wrote report to ${outputPath}`);

    if (failedRequests > 0) {
      console.warn(
        `Warning: ${failedRequests} request(s) failed. Is the app running at ${baseUrl}?`
      );
      process.exitCode = 1;
    }
  } catch (error) {
    await mkdir(docsDir, { recursive: true });

    const message =
      error instanceof Error ? error.message : "Unexpected error while running evaluation";
    const fallbackReport = `# RAG Evaluation\n\nEvaluation failed: ${message}\n`;

    await writeFile(outputPath, fallbackReport, "utf8");

    console.error(message);
    console.error(`Wrote failure report to ${outputPath}`);
    process.exitCode = 1;
  }
}

void main();
