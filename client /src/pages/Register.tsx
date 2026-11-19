import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeStore } from '../store/useThemeStore';
import toast from 'react-hot-toast';

// Հաստատուն՝ Magic Number-ից խուսափելու համար (Client-side baseline validation)
const MIN_PASSWORD_LENGTH = 6;

/**
 * Register Page (User Onboarding & Registration Flow)
 * Պատասխանատու է նոր օգտատիրոջ տվյալների վավերացման (Client-side Validation),
 * գրանցման հարցման, ավտոմատ մուտքի (Auto-login after signup) և
 * գլոբալ Auth/Theme վիճակների սինխրոնիզացիայի համար։
 */
export const Register: React.FC = () => {
  // 1. LOCAL FORM STATE (Controlled Inputs)
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false); // Կանխում է Double Submit-ը

  // 2. GLOBAL STORE & ROUTER HOOKS
  // Selector-ով վերցնում ենք միայն login action-ը՝ ավելորդ re-render-ներից խուսափելու համար
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  /**
   * 3. REGISTRATION FLOW (Վավերացում -> API հարցում -> Auto-Login)
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Guard Clause. կանխում է կրկնակի POST հարցումը (օր.՝ Enter-ը արագ երկու անգամ սեղմելիս)
    if (loading) return;

    // Data Sanitization. մաքրում ենք միայն անունն ու email-ը (password-ը ԵՐԲԵՔ չենք trim անում)
    const normalizedName = name.trim();
    const normalizedEmail = email.trim();

    // Client-side Validation՝ նախքան ավելորդ Network Request ուղարկելը
    if (!normalizedName || !normalizedEmail) {
      toast.error('Please fill in your name and email.');
      return;
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      toast.error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`);
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      // Ուղարկում ենք միայն անհրաժեշտ դաշտերը (confirmPassword-ը սերվեր չի ուղարկվում)
      const response = await api.post('/api/auth/register', {
        name: normalizedName,
        email: normalizedEmail,
        password,
      });

      const { user, token } = response.data ?? {};

      // Defensive Check. պաշտպանում է localStorage-ում "undefined" գրելուց
      if (!user || !token) {
        throw new Error('Invalid registration response from server.');
      }

      // Պահում ենք JWT տոկենը (Architectural Note. Enterprise միջավայրում XSS-ից պաշտպանվելու
      // համար JWT-ն պետք է պահվի Backend-ի կողմից տրված HttpOnly + Secure Cookie-ում)
      localStorage.setItem('token', token);

      // Ավտոմատ մուտք ենք գործում գրանցումից անմիջապես հետո (Frictionless UX)
      login(user);

      // Imperative Zustand Read (getState)՝ թեման կիրառելու համար առանց store-ին բաժանորդագրվելու
      if (user.theme) {
        useThemeStore.getState().setTheme(user.theme);
      }

      toast.success('Account created successfully!');

      // replace: true-ն փոխարինում է /register-ը History Stack-ում, որպեսզի
      // "Back" սեղմելիս օգտատերը կրկին չվերադառնա գրանցման ֆորմա
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      // Անվտանգ կերպով առանձնացնում ենք սերվերի սխալը (օր.՝ 409 Conflict — email-ն արդեն զբաղված է)
      const serverMessage = (
        err as { response?: { data?: { message?: string } } }
      )?.response?.data?.message;

      toast.error(serverMessage || 'Registration failed. Please try again.');
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
            Create Account
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
            Join our learning platform today.
          </p>
        </div>

        {/* Գրանցման Ֆորմա (A11y htmlFor/id և Password Manager autoComplete աջակցությամբ) */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="register-name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Full Name
            </label>
            <input
              id="register-name"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 outline-none transition-colors disabled:opacity-60"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label
              htmlFor="register-email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Email Address
            </label>
            <input
              id="register-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 outline-none transition-colors disabled:opacity-60"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="register-password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Password
            </label>
            <input
              id="register-password"
              type="password"
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-600 outline-none transition-colors disabled:opacity-60"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label
              htmlFor="register-confirm-password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Confirm Password
            </label>
            <input
              id="register-confirm-password"
              type="password"
              autoComplete="new-password"
              minLength={MIN_PASSWORD_LENGTH}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        {/* Անցում Մուտքի Էջ */}
        <div className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          >
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
};