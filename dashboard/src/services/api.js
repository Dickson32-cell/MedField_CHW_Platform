import axios from 'axios';

const API_URL = '/api'; // Assuming proxy or same origin

const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const userService = {
    getCHWs: async () => {
        const response = await api.get('/users?role=chw');
        return response.data;
    },
    createStaff: async (userData) => {
        const response = await api.post('/auth/register', userData);
        return response.data;
    },
    deactivate: async (id) => {
        const response = await api.delete(`/users/${id}`);
        return response.data;
    },
    approveUser: async (id) => {
        const response = await api.post(`/users/${id}/approve`);
        return response.data;
    },
    resetPassword: async (id, passwords) => {
        const response = await api.post(`/users/${id}/reset-password`, passwords);
        return response.data;
    }
};

export const dashboardService = {
    getStats: async () => {
        const response = await api.get('/dashboard/stats');
        return response.data;
    },
    getRecentActivity: async () => {
        // In a real app, we'd have a specific activity endpoint. 
        // For now, we fetch recent sync logs.
        const response = await api.get('/sync/status'); // This needs expansion in backend
        return response.data;
    }
};

export default {
    userService,
    dashboardService
};
