import { api } from "../../shared/api/axios";

// Thin wrapper over the server's /users routes (admin only).
export const usersService = {
  list: () => api.get("/users").then((r) => r.data),
  create: (data) => api.post("/users", data).then((r) => r.data),
  update: (id, patch) => api.put(`/users/${id}`, patch).then((r) => r.data),
  remove: (id) => api.delete(`/users/${id}`),
  activity: (params) => api.get("/users/activity", { params }).then((r) => r.data),
  setPassword: (id, newPassword) =>
    api.put(`/users/${id}/password`, { newPassword }),
};
