import axios from 'axios';

// Backend port-ka saxda ah
const BASE_URL = 'https://localhost:7008/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// ============ DONOR API ============
export const donorAPI = {
  getAll:     ()           => api.get('/Donor'),
  getById:    (id)         => api.get(`/Donor/${id}`),
  search:     (name)       => api.get(`/Donor/search?name=${encodeURIComponent(name)}`),
  create:     (data)       => api.post('/Donor', data),
  update:     (id, data)   => api.put(`/Donor/${id}`, data),
  delete:     (id)         => api.delete(`/Donor/${id}`),
};

// ============ RECIPIENT API ============
export const recipientAPI = {
  getAll:     ()           => api.get('/Recipient'),
  getById:    (id)         => api.get(`/Recipient/${id}`),
  search:     (name)       => api.get(`/Recipient/search?name=${encodeURIComponent(name)}`),
  create:     (data)       => api.post('/Recipient', data),
  update:     (id, data)   => api.put(`/Recipient/${id}`, data),
  delete:     (id)         => api.delete(`/Recipient/${id}`),
};

// ============ BLOOD DONATION API ============
export const donationAPI = {
  getAll:     ()           => api.get('/BloodDonation'),
  getById:    (id)         => api.get(`/BloodDonation/${id}`),
  search:     (name)       => api.get(`/BloodDonation/search?name=${encodeURIComponent(name)}`),
  create:     (data)       => api.post('/BloodDonation', data),
  update:     (id, data)   => api.put(`/BloodDonation/${id}`, data),
  delete:     (id)         => api.delete(`/BloodDonation/${id}`),
};

// ============ BLOOD REQUEST API ============
export const requestAPI = {
  getAll:     ()           => api.get('/BloodRequest'),
  getById:    (id)         => api.get(`/BloodRequest/${id}`),
  search:     (name)       => api.get(`/BloodRequest/search?name=${encodeURIComponent(name)}`),
  create:     (data)       => api.post('/BloodRequest', data),
  update:     (id, data)   => api.put(`/BloodRequest/${id}`, data),
  delete:     (id)         => api.delete(`/BloodRequest/${id}`),
};

export default api;
