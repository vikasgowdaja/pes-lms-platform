import { api } from "./api";

export const attemptService = {
  start(testId) {
    return api.post(`/attempts/start/${testId}`).then((res) => res.data);
  },
  getById(attemptId) {
    return api.get(`/attempts/${attemptId}`).then((res) => res.data);
  },
  saveAnswer(attemptId, payload) {
    return api.patch(`/attempts/${attemptId}/answers`, payload).then((res) => res.data);
  },
  submit(attemptId) {
    return api.post(`/attempts/${attemptId}/submit`).then((res) => res.data);
  },
  logEvent(attemptId, payload) {
    return api.post(`/attempts/${attemptId}/logs`, payload).then((res) => res.data);
  },
  list(params = {}) {
    return api.get("/attempts", { params }).then((res) => res.data);
  }
};
