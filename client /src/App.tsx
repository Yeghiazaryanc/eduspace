import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import { Navbar } from './components/Navbar';
import { PublicRoute } from './components/PublicRoute';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useThemeStore } from './store/useThemeStore';

/**
 * 1. ROUTE-BASED CODE SPLITTING (React.lazy)
 * Յուրաքանչյուր էջ բաժանվում է առանձին JavaScript Chunk-ի և բեռնվում է միայն
 * այն պահին, երբ օգտատերն անցնում է այդ URL-ով։ Սա կտրուկ փոքրացնում է
 * սկզբնական Bundle Size-ը և արագացնում First Contentful Paint (FCP)-ը։
 * (.then(m => ({ default: ... })) ադապտերը անհրաժեշտ է Named Export-երի համար)
 */
const Home = lazy(() => import('./pages/Home').then((m) => ({ default: m.Home })));
const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Register').then((m) => ({ default: m.Register })));
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const CourseDetails = lazy(() =>
  import('./pages/CourseDetails').then((m) => ({ default: m.CourseDetails }))
);
const Profile = lazy(() => import('./pages/Profile').then((m) => ({ default: m.Profile })));

/**
 * 2. SUSPENSE FALLBACK UI
 * Ցուցադրվում է այն միլիվայրկյանների ընթացքում, երբ բրաուզերը ցանցից ներբեռնում է
 * տվյալ էջի Lazy Chunk-ը։
 */
const PageLoader = () => (
  <div className="min-h-[calc(100vh-64px)] flex items-center justify-center bg-gray-50 dark:bg-gray-950 transition-colors">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
  </div>
);

/**
 * 3. 404 FALLBACK VIEW (Catch-All Route)
 * Կանխում է դատարկ էկրանը, երբ օգտատերը մուտքագրում է գոյություն չունեցող URL։
 */
const NotFound = () => (
  <div className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-4 text-center bg-gray-50 dark:bg-gray-950 transition-colors">
    <h1 className="text-6xl font-extrabold text-blue-600 mb-4">404</h1>
    <p className="text-xl font-bold text-gray-900 dark:text-white mb-2">Page Not Found</p>
    <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
      The page you are looking for does not exist or has been moved.
    </p>
    <Link
      to="/"
      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors"
    >
      Go Back Home
    </Link>
  </div>
);

/**
 * Root Application Component
 * Միավորում է Router-ը, գլոբալ Theme սինխրոնիզացիան, Layout տարրերը (Navbar, Toaster)
 * և Role/Auth-պաշտպանված երթուղիները։
 */
function App() {
  const theme = useThemeStore((state) => state.theme);

  // Սինխրոնիզացնում է գլոբալ թեման HTML root (<html>) էլեմենտի հետ՝ Tailwind dark: դասերի համար
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <BrowserRouter>
      {/* Գլոբալ նավիգացիա և ծանուցումների համակարգ (մնում են mounted բոլոր էջերի միջև) */}
      <Navbar />
      <Toaster position="bottom-right" />

      {/* Սեմանտիկ <main> կոնտեյներ A11y-ի համար + Suspense սահման Lazy Loading-ի համար */}
      <main>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Բաց էջ (հասանելի է բոլորին) */}
            <Route path="/" element={<Home />} />

            {/* Հանրային երթուղիներ (մուտք գործած օգտատերերին ավտոմատ ուղղորդում է /dashboard) */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            {/* Պաշտպանված երթուղիներ (չգրանցված օգտատերերին արգելափակում և ուղղորդում է /login) */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/courses/:id" element={<CourseDetails />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* 404 Catch-All Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </main>
    </BrowserRouter>
  );
}

export default App;