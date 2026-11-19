import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

// Հաստատուն՝ HTTP հարցման առավելագույն սպասման ժամանակը (15 վայրկյան)։
// Կանխում է անվերջ կախված հարցումները, երբ ցանցը կամ սերվերը չեն պատասխանում (Network Fallacy)։
const REQUEST_TIMEOUT_MS = 15_000;

/**
 * Կենտրոնացված Axios Instance (Singleton Pattern)։
 * Հավելվածի բոլոր HTTP հարցումներն անցնում են այս շերտով՝ ապահովելով
 * միասնական baseURL, timeout և ավտոմատ JWT Authorization Header-ներ։
 */
export const api = axios.create({
  // Vite-ում client-side միջավայրի փոփոխականները պարտադիր սկսվում են VITE_ նախածանցով
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 1. REQUEST INTERCEPTOR (Ելքային հարցումների միջնորդ)
 * Ամեն հարցում սերվեր ուղարկելուց առաջ կարդում է JWT տոկենը և
 * ավտոմատ կցում Authorization Header-ին (Bearer Authentication Scheme)։
 */
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * 2. RESPONSE INTERCEPTOR (Մուտքային պատասխանների գլոբալ մշակում)
 * Կենտրոնացված կերպով բռնում է 401 Unauthorized սխալները (ժամկետանց կամ անվավեր JWT)։
 * Ավտոմատ կանչում է logout(), ինչը մաքրում է տոկենը և ստիպում ProtectedRoute-ին
 * առանց էջի կոշտ reload-ի ուղղորդել օգտատիրոջը դեպի /login (կանխում է Zombie Session-ը)։
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl: string = error.config?.url || '';

    // Չենք անում ավտոմատ logout, եթե 401-ը եկել է հենց մուտքի կամ գրանցման հարցումից (սխալ գաղտնաբառ)
    const isAuthEndpoint =
      requestUrl.includes('/api/auth/login') ||
      requestUrl.includes('/api/auth/register');

    if (status === 401 && !isAuthEndpoint) {
      useAuthStore.getState().logout();
    }

    return Promise.reject(error);
  }
);