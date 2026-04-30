import { api } from "./api";

export const testService = {
  list(params = {}) {
    return api.get("/tests", { params }).then((res) => res.data);
  },
  getById(id) {
    return api.get(`/tests/${id}`).then((res) => res.data);
  },
  create(payload) {
    return api.post("/tests", payload).then((res) => res.data);
  },
  importCsv(payload) {
    return api.post("/tests/import/csv", payload).then((res) => res.data);
  },
  update(id, payload) {
    return api.patch(`/tests/${id}`, payload).then((res) => res.data);
  },
  getQuestions(testId) {
    return api.get(`/tests/${testId}/questions`).then((res) => res.data);
  },
  addQuestion(testId, payload) {
    return api.post(`/tests/${testId}/questions`, payload).then((res) => res.data);
  },
  updateQuestion(testId, questionId, payload) {
    return api.patch(`/tests/${testId}/questions/${questionId}`, payload).then((res) => res.data);
  },
  deleteQuestion(testId, questionId) {
    return api.delete(`/tests/${testId}/questions/${questionId}`).then((res) => res.data);
  },
  publish(id) {
    return api.patch(`/tests/${id}/publish`).then((res) => res.data);
  },
  unpublish(id) {
    return api.patch(`/tests/${id}/unpublish`).then((res) => res.data);
  }
};
