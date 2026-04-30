import { api } from "./api";

export const authService = {
  signup(payload) {
    return api.post("/auth/signup", payload).then((res) => res.data);
  },
  login(payload) {
    return api.post("/auth/login", payload).then((res) => res.data);
  },
  me() {
    return api.get("/auth/me").then((res) => res.data);
  }
};
