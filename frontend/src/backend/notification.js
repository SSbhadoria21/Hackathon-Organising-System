import api from "./axiosConfig.js";

class NotificationService {
  async getNotifications(params = {}) {
    const { data } = await api.get("/notifications", { params });
    return data;
  }

  async markAsRead(id) {
    const { data } = await api.patch(`/notifications/${id}/read`);
    return data;
  }

  async markAllAsRead() {
    const { data } = await api.patch("/notifications");
    return data;
  }

  async respondToInvite(id, action) {
    // action: 'ACCEPT' | 'DECLINE'
    const { data } = await api.post(`/notifications/${id}/respond`, { action });
    return data;
  }
}

const notificationService = new NotificationService();

export default notificationService;

