import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL}/student` : 'http://localhost:4000/student';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

export const studentApi = {
  getApproved: (params) => api.get('/', { params }),
  getPending: (params) => api.get('/pending', { params }),
  getRejected: (params) => api.get('/rejected', { params }),
  getFilters: () => api.get('/filters'),
  submit: (formData) => api.post('/add', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateStatus: (id, status, admin_id) => api.put(`/update/${id}`, { status, admin_id }),
};

export default studentApi;
