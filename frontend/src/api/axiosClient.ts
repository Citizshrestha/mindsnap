import axios from "axios";

const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
    "Content-Type": "application/json",
  },
    withCredentials: true  // send cookies
});

axiosClient.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken){
            config.headers.Authorization =  `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)

);

// Interceptor to handle tokenRefresh on 401 errors
axiosClient.interceptors.response.use(
    (response) => response,
    async(error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry){
            originalRequest._retry = true;

            try {
                const {data} = await axiosClient.post('/api/auth/refresh');
                const newAccessToken = data.accessToken;
                localStorage.setItem('accessToken',newAccessToken);
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                return axiosClient(originalRequest);

            } catch (refreshErr) {
                localStorage.removeItem('accessToken');
                window.location.href = "/";
                return Promise.reject(refreshErr);
            }
        }
        return Promise.reject(error)
    }
);

export default axiosClient;

