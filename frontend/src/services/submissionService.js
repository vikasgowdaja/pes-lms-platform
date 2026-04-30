import { api } from "./api";

export const submissionService = {
  run(payload) {
    return api.post("/submissions/run", payload).then((res) => res.data);
  },
  submit(attemptId, questionId, payload) {
    return api.post(`/submissions/${attemptId}/${questionId}`, payload).then((res) => res.data);
  }
};
