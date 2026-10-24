const API_BASE = '/api/v1';

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('mydc_session_token');
  const headers = {
    ...(options.headers || {}),
  };

  // If payload is not FormData, set Content-Type to application/json
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    // If not on login or recovery, clean token if expired
    if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/recovery')) {
      localStorage.removeItem('mydc_session_token');
      localStorage.removeItem('mydc_user');
    }
  }

  const contentType = response.headers.get('content-type');
  let data = null;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else if (contentType && (contentType.includes('application/pdf') || contentType.includes('octet-stream'))) {
    data = await response.blob();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg = (data && data.detail) || response.statusText || 'Request failed';
    const error = new Error(typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg));
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const authApi = {
  register: (payload) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (payload) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  logout: () => apiRequest('/auth/logout', { method: 'POST' }),
  getCurrentUser: () => apiRequest('/auth/me'),
  initiateRecovery: (payload) => apiRequest('/auth/recovery/initiate', { method: 'POST', body: JSON.stringify(payload) }),
  verifyRecoveryToken: (token) => apiRequest(`/auth/recovery/verify?token=${encodeURIComponent(token)}`),
  completeRecovery: (payload) => apiRequest('/auth/recovery/complete', { method: 'POST', body: JSON.stringify(payload) }),
  checkAccountStatus: (identifier) => apiRequest('/auth/account-status', { method: 'POST', body: JSON.stringify({ identifier }) }),
};

export const studentApi = {
  getProfile: () => apiRequest('/students/profile'),
  updateProfile: (payload) => apiRequest('/students/profile', { method: 'PUT', body: JSON.stringify(payload) }),
  getDashboardStats: () => apiRequest('/students/dashboard-stats'),
  getCVs: () => apiRequest('/students/cvs'),
  uploadCV: (formData) => apiRequest('/students/cvs/upload', { method: 'POST', body: formData }),
  downloadCV: (cvId) => apiRequest(`/students/cvs/${cvId}/download`, { responseType: 'blob' }),
  getCVAnalysis: (cvId) => apiRequest(`/students/cvs/${cvId}/analysis`),
  generateCVBuilderPDF: (payload) => apiRequest('/students/cv-builder/generate-pdf', { method: 'POST', body: JSON.stringify(payload) }),
  getSavedOpportunities: () => apiRequest('/students/saved-opportunities'),
  toggleSaveOpportunity: (oppId) => apiRequest(`/students/saved-opportunities/${oppId}/toggle`, { method: 'POST' }),
  getApplications: () => apiRequest('/students/applications'),
  getApplicationDetail: (id) => apiRequest(`/students/applications/${id}`),
  submitApplication: (payload) => apiRequest('/students/applications', { method: 'POST', body: JSON.stringify(payload) }),
  getOffers: () => apiRequest('/students/offers'),
  respondToOffer: (offerId, action, notes) => apiRequest(`/students/offers/${offerId}/respond`, { method: 'POST', body: JSON.stringify({ action, notes }) }),
  downloadOfferPDF: (offerId) => apiRequest(`/students/offers/${offerId}/download-pdf`),
  getLearningProgress: () => apiRequest('/students/learning-progress'),
  toggleLearningComplete: (resourceId) => apiRequest(`/students/learning-progress/${resourceId}/toggle`, { method: 'POST' }),
  getNotifications: () => apiRequest('/students/notifications'),
  markNotificationRead: (id) => apiRequest(`/students/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => apiRequest('/students/notifications/read-all', { method: 'PUT' }),
};

export const opportunitiesApi = {
  getPublicList: (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiRequest(`/opportunities?${searchParams.toString()}`);
  },
  getDetail: (id) => apiRequest(`/opportunities/${id}`),
};

export const adminApi = {
  getDashboardStats: () => apiRequest('/admin/dashboard-stats'),
  getStudents: (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiRequest(`/admin/students?${searchParams.toString()}`);
  },
  getStudentDetail: (id) => apiRequest(`/admin/students/${id}`),
  updateStudentStatus: (id, status) => apiRequest(`/admin/students/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
  getOpportunities: (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiRequest(`/admin/opportunities?${searchParams.toString()}`);
  },
  createOpportunity: (payload) => apiRequest('/admin/opportunities', { method: 'POST', body: JSON.stringify(payload) }),
  updateOpportunity: (id, payload) => apiRequest(`/admin/opportunities/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  deleteOpportunity: (id) => apiRequest(`/admin/opportunities/${id}`, { method: 'DELETE' }),
  getApplications: (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiRequest(`/admin/applications?${searchParams.toString()}`);
  },
  updateApplicationStatus: (id, payload) => apiRequest(`/admin/applications/${id}/status`, { method: 'PUT', body: JSON.stringify(payload) }),
  addApplicationNote: (id, payload) => apiRequest(`/admin/applications/${id}/notes`, { method: 'POST', body: JSON.stringify(payload) }),
  issueOffer: (applicationId, payload) => apiRequest(`/admin/applications/${applicationId}/issue-offer`, { method: 'POST', body: JSON.stringify(payload) }),
  getAuditLogs: (params = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiRequest(`/admin/audit-logs?${searchParams.toString()}`);
  },
  getRecoveryRequests: () => apiRequest('/admin/recovery-requests'),
  resolveRecoveryRequest: (id, payload) => apiRequest(`/admin/recovery-requests/${id}/resolve`, { method: 'POST', body: JSON.stringify(payload) }),
  getLearningResources: () => apiRequest('/admin/learning-resources'),
  createLearningResource: (payload) => apiRequest('/admin/learning-resources', { method: 'POST', body: JSON.stringify(payload) }),
  deleteLearningResource: (id) => apiRequest(`/admin/learning-resources/${id}`, { method: 'DELETE' }),
};
