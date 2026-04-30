import { normalizeOptionArray } from "../utils/randomization.js";

export const calculateAttemptScore = ({ attempt, questionsById, test }) => {
  let score = 0;
  let maxScore = 0;
  let mcqCorrect = 0;
  let mcqIncorrect = 0;
  let codePassed = 0;
  let codeFailed = 0;

  for (const question of questionsById.values()) {
    maxScore += Number(question.marks || 0);
  }

  for (const answer of attempt.answers) {
    const question = questionsById.get(String(answer.questionId));
    if (!question) {
      continue;
    }

    const marks = Number(question.marks || 0);
    const negativeMarks = Number(question.negativeMarks || 0);

    if (question.type === "MCQ") {
      const selected = normalizeOptionArray(answer.selectedOptions || []);
      const actual = normalizeOptionArray(question.mcq?.correctAnswers || []);
      const isCorrect = JSON.stringify(selected) === JSON.stringify(actual);

      if (isCorrect) {
        score += marks;
        mcqCorrect += 1;
      } else if ((selected || []).length && test.negativeMarkingEnabled) {
        score -= negativeMarks;
        mcqIncorrect += 1;
      }
    }

    if (question.type === "CODE") {
      const latestSubmission = (attempt.codeSubmissions || [])
        .filter((entry) => String(entry.questionId) === String(question._id))
        .sort((a, b) => new Date(b.executedAt) - new Date(a.executedAt))[0];

      if (latestSubmission?.status === "PASSED") {
        score += marks;
        codePassed += 1;
      } else {
        codeFailed += 1;
      }
    }
  }

  return {
    score,
    maxScore,
    breakdown: {
      mcqCorrect,
      mcqIncorrect,
      codePassed,
      codeFailed
    }
  };
};
