import { api } from "./api";

export const analyticsService = {
  summary() {
    return api.get("/analytics/admin").then((res) => res.data);
  },
  activity(params = {}) {
    return api.get("/analytics/admin/activity", { params }).then((res) => res.data);
  },
  studentDetail(studentId) {
    return api.get(`/analytics/admin/students/${studentId}/detail`).then((res) => res.data);
  }
};