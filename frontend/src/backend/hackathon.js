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
}

const hackathonService = new HackathonService();

export default hackathonService;
