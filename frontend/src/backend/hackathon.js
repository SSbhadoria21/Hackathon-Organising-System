import api from "./axiosConfig.js";

class HackathonService {
  async createDraft() {
    const { data } = await api.post("/hackathons/draft");
    return data;
  }

  async getLatestDraft() {
    const { data } = await api.get("/hackathons/draft/latest");
    return data;
  }

  async getDraftById(id) {
    const { data } = await api.get(`/hackathons/draft/${id}`);
    return data;
  }

  async saveDraftStep(id, step, stepData) {
    const { data } = await api.patch(
      `/hackathons/draft/${id}`,
      { step, data: stepData }
    );
    return data;
  }

  async uploadFile(file, folder = "general") {
    const formData = new FormData();
    formData.append("file", file);
    if (folder) {
      formData.append("folder", folder);
    }

    const { data } = await api.post("/upload", formData);
    return data;
  }

  async deleteDraft(id) {
    const { data } = await api.delete(`/hackathons/draft/${id}`);
    return data;
  }

  async publishHackathon(id) {
    const { data } = await api.post(`/hackathons/draft/${id}/publish`);
    return data;
  }

  async getDraftPreview(id) {
    const { data } = await api.get(`/hackathons/draft/${id}/preview`);
    return data;
  }

  async getJudges(id) {
    const { data } = await api.get(`/hackathons/${id}/judges`);
    return data;
  }

  async inviteJudge(id, judgeData) {
    const { data } = await api.post(`/hackathons/${id}/judges`, judgeData);
    return data;
  }

  async removeJudge(id, judgeId) {
    const { data } = await api.delete(`/hackathons/${id}/judges/${judgeId}`);
    return data;
  }

  async getHackathons(params = {}) {
    const { data } = await api.get("/hackathons", { params });
    return data;
  }

  async getHackathonById(id) {
    const { data } = await api.get(`/hackathons/${id}`);
    return data;
  }

  async getHomeData(params = {}) {
    const { data } = await api.get("/home", { params });
    return data;
  }

  async registerHackathon(id, payload = {}) {
    const { data } = await api.post(`/hackathons/${id}/register`, payload);
    return data;
  }

  async getMyTeam(id) {
    const { data } = await api.get(`/hackathons/${id}/my-team`);
    return data;
  }

  async leaveOrDisbandTeam(id) {
    const { data } = await api.delete(`/hackathons/${id}/my-team`);
    return data;
  }

  async getParticipateData(id) {
    const { data } = await api.get(`/hackathons/${id}/participate`);
    return data;
  }

  async getSubmissions(id, params = {}) {
    const { data } = await api.get(`/hackathons/${id}/submissions`, { params });
    return data;
  }

  async submitWork(id, submissionData) {
    const { data } = await api.post(`/hackathons/${id}/submissions`, submissionData);
    return data;
  }

  async getResults(id) {
    const { data } = await api.get(`/hackathons/${id}/results`);
    return data;
  }

  async getActivitiesOverview() {
    const { data } = await api.get("/activities");
    return data;
  }

  async getCreatedHackathons(params = {}) {
    const { data } = await api.get("/activities/created-hackathons", { params });
    return data;
  }

  async getParticipations(params = {}) {
    const { data } = await api.get("/activities/participations", { params });
    return data;
  }

  async getAccessedHackathons(params = {}) {
    const { data } = await api.get("/activities/accessed-hackathons", { params });
    return data;
  }

  async completePayment(hackathonId) {
    const { data } = await api.post(`/hackathons/${hackathonId}/payment/complete`);
    return data;
  }

  async getManageTeams(hackathonId) {
    const { data } = await api.get(`/hackathons/${hackathonId}/manage/teams`);
    return data;
  }

  async getManageSubmissions(hackathonId) {
    const { data } = await api.get(`/hackathons/${hackathonId}/submissions/all`);
    return data;
  }

  async deleteHackathon(hackathonId) {
    const { data } = await api.delete(`/hackathons/${hackathonId}`);
    return data;
  }

  async getManagementData(hackathonId) {
    const { data } = await api.get(`/hackathons/${hackathonId}/management`);
    return data;
  }

  async submitJudgeScore(hackathonId, payload) {
    const { data } = await api.post(`/hackathons/${hackathonId}/judge/score`, payload);
    return data;
  }

  async advanceRound(hackathonId, roundId, payload) {
    const { data } = await api.post(`/hackathons/${hackathonId}/rounds/${roundId}/advance`, payload);
    return data;
  }

  async getJudgeSubmissions(hackathonId, params = {}) {
    const { data } = await api.get(`/hackathons/${hackathonId}/judge/submissions`, { params });
    return data;
  }
}

const hackathonService = new HackathonService();

export default hackathonService;
