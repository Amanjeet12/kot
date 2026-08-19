import axios from 'axios';
import Config from 'react-native-config';

const api = axios.create({
  baseURL: Config.API_URL || 'https://kot.workfoodap.in',

  timeout: 30000,

  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  config => {
    console.log(
      '[API REQUEST]',
      config.method?.toUpperCase(),
      `${config.baseURL}${config.url}`,
      config.data,
    );

    return config;
  },

  error => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  response => {
    console.log('[API RESPONSE]', response.config.url, response.data);

    return response;
  },

  error => {
    console.log(
      '[API ERROR]',
      error?.config?.url,
      error?.response?.data || error.message,
    );

    return Promise.reject(error);
  },
);

export default api;
