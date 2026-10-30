import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 45000,
});

export const getHealth = () => api.get('/health');

// Datasets
export const getDatasets = () => api.get('/datasets');
export const getDataset = (id) => api.get(`/datasets/${id}`);
export const getDatasetPreview = (id, limit = 20, offset = 0) => 
  api.get(`/datasets/${id}/preview?limit=${limit}&offset=${offset}`);
export const deleteDataset = (id) => api.delete(`/datasets/${id}`);
export const compareDatasets = (idA, idB) => 
  api.post('/datasets/compare', { dataset_id_a: idA, dataset_id_b: idB });

// Uploads
export const uploadDatasetFile = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const loadSampleDataset = (sampleName) => 
  api.post(`/upload/sample/${sampleName}`);

// Analytics
export const getActivityMetrics = () => api.get('/analytics/activity');
export const executeAnalyticsPlan = (datasetId, plan) => 
  api.post('/analytics/execute', { dataset_id: datasetId, plan });

// Conversational Chat
export const getConversations = (datasetId) => 
  api.get(`/chat/conversations/${datasetId}`);
export const createConversation = (datasetId, title) => 
  api.post('/chat/conversations', { dataset_id: datasetId, title });
export const getMessages = (conversationId) => 
  api.get(`/chat/messages/${conversationId}`);
export const sendChatMessage = (datasetId, conversationId, question) => 
  api.post('/chat/message', { dataset_id: datasetId, conversation_id: conversationId, question });

// Insights
export const getDatasetInsights = (datasetId) => 
  api.get(`/insights/${datasetId}`);
export const getAllInsights = (limit = 6) => 
  api.get(`/insights/all?limit=${limit}`);
export const toggleSaveInsight = (insightId) => 
  api.post(`/insights/toggle-save/${insightId}`);
export const refreshInsights = (datasetId) => 
  api.post(`/insights/refresh/${datasetId}`);

// Cleaning & Export
export const cleanDataset = (datasetId, options) => 
  api.post('/export/clean', { dataset_id: datasetId, ...options });

export const getPdfReportUrl = (datasetId) => 
  `/api/export/pdf-report/${datasetId}`;
export const getDownloadCsvUrl = (filename) => 
  `/api/export/download/${filename}`;

// Settings
export const getSettings = () => api.get('/settings');
export const updateSettings = (data) => api.post('/settings', data);

export default api;

// Axios response interceptor for unified error formatting
