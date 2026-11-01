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
}

const hackathonService = new HackathonService();

export default hackathonService;
