import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import toast from 'react-hot-toast';

/**
 * Login Page (Authentication Entry Point)
 * Պատասխանատու է օգտատիրոջ մուտքի (Authentication), JWT տոկենի պահպանման,
 * գլոբալ Auth/Theme վիճակների սինխրոնիզացիայի և Dashboard ուղղորդման համար։
 */
export const Login: React.FC = () => {
  // 1. LOCAL FORM STATE (Controlled Inputs)
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false); // Կանխում է Double Submit-ը և ցույց տալիս loading վիճակ

  // 2. GLOBAL STORE & ROUTER HOOKS
  // Selector-ով վերցնում ենք միայն login action-ը՝ կոմպոնենտի ավելորդ re-render-ներից խուսափելու համար
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  /**
   * 3. AUTHENTICATION FLOW (Մուտքի հարցման մշակում)
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Guard Clause. կանխում է կրկնակի POST հարցումը (օր.՝ Enter ստեղնը արագ երկու անգամ սեղմելիս)
    if (loading) return;

    // Մաքրում ենք միայն email-ի սկզբնական/վերջնական բացատները (Data Sanitization)։
    // Password-ը ԵՐԲԵՔ չենք trim անում, որովհետև բացատը կարող է լինել գաղտնաբառի մաս։
    const normalizedEmail = email.trim();
    if (!normalizedEmail || !password) return;

    setLoading(true);

    try {
      // Ուղարկում ենք credentials-ը սերվեր՝ JWT տոկեն և user օբյեկտ ստանալու համար
      const response = await api.post('/api/auth/login', {
        email: normalizedEmail,
        password,
      });

      const { user, token } = response.data ?? {};

      // Defensive Check. երաշխավորում է, որ localStorage-ում երբեք չի գրվի "undefined" տողը
      if (!user || !token) {
        throw new Error('Invalid authentication response from server.');
      }

      // Պահում ենք JWT տոկենը (Architectural Note. Enterprise միջավայրում XSS-ից պաշտպանվելու
      // համար տոկենը պետք է պահվի HttpOnly + Secure + SameSite Cookie-ում՝ Backend-ի կողմից)
      localStorage.setItem('token', token);

      // Թարմացնում ենք գլոբալ Auth Store-ը
      login(user);

      // Imperative Zustand Read (getState). կարդում ենք setTheme-ը առանց Login կոմպոնենտը
      // useThemeStore-ին բաժանորդագրելու, որպեսզի թեմայի փոփոխությունը ավելորդ re-render չառաջացնի
      if (user.theme) {
        useThemeStore.getState().setTheme(user.theme);
      }

      toast.success(`Welcome back, ${user.name}!`);

      // replace: true-ն փոխարինում է /login-ը բրաուզերի History Stack-ում,
      // որպեսզի "Back" սեղմելիս օգտատերը կրկին չվերադառնա մուտքի էջ
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      // Անվտանգ կերպով առանձնացնում ենք սերվերի սխալի հաղորդագրությունը՝ առանց "any" տիպի
      const serverMessage = (
        err as { response?: { data?: { message?: string } } }
      )?.response?.data?.message;

      toast.error(serverMessage || 'Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-950 transition-colors duration-200 px-4 py-8">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 p-8 transition-colors duration-200">
        {/* Բրենդի Լոգո և Վերնագիր */}
        <div className="text-center mb-8">
          <Link
            to="/"
            aria-label="EduSpace Home"
            className="inline-block w-12 h-12 bg-blue-600 rounded-xl text-white font-bold text-2xl leading-loose mb-4 shadow-sm"
          >
            E
          </Link>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Welcome Back
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
            Please sign in to your account.
          </p>
        </div>

        {/* Մուտքի Ֆորմա (A11y htmlFor/id և Password Manager autoComplete աջակցությամբ) */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="login-email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Email Address
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 outline-none transition-colors disabled:opacity-60"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Password
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 outline-none transition-colors disabled:opacity-60"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 px-4 mt-4 rounded-lg text-white font-bold transition-all shadow-md ${
              loading
                ? 'bg-blue-400 dark:bg-blue-500 cursor-wait'
                : 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 hover:shadow-lg'
            }`}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Անցում Գրանցման Էջ */}
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          >
            Create one here
          </Link>
        </div>
      </div>
    </div>
  );
};