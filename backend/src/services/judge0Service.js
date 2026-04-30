import axios from "axios";
import { env } from "../config/env.js";

const languageMap = {
  javascript: 63,
  python: 71,
  java: 62,
  cpp: 54
};

const buildHeaders = () => ({
  "Content-Type": "application/json",
  ...(env.judge0ApiKey ? { "X-RapidAPI-Key": env.judge0ApiKey } : {}),
  ...(env.judge0Host ? { "X-RapidAPI-Host": env.judge0Host } : {})
});

export const executeCodeAgainstCases = async ({ sourceCode, language, testCases }) => {
  if (!env.judge0BaseUrl) {
    throw new Error("JUDGE0_BASE_URL not configured");
  }

  const languageId = languageMap[language];
  if (!languageId) {
    throw new Error("Unsupported language");
  }

  let passedCount = 0;
  const outputs = [];
  const times = [];

  for (const testCase of testCases) {
    const submitResponse = await axios.post(
      `${env.judge0BaseUrl}/submissions?base64_encoded=false&wait=true`,
      {
        source_code: sourceCode,
        language_id: languageId,
        stdin: testCase.input || "",
        expected_output: testCase.output
      },
      { headers: buildHeaders(), timeout: 20000 }
    );

    const result = submitResponse.data;
    const passed = Number(result.status?.id) === 3;

    if (passed) {
      passedCount += 1;
    }

    outputs.push(result.stdout || result.stderr || result.compile_output || "");
    times.push(Number(result.time || 0));
  }

  return {
    passedCount,
    totalCount: testCases.length,
    output: outputs.join("\n---\n"),
    executionTimeMs: Math.round(times.reduce((a, b) => a + b, 0) * 1000),
    status: passedCount === testCases.length ? "PASSED" : "FAILED"
  };
};
