import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext';
import { OrgProvider } from './context/OrgContext';
import { ToastProvider } from './components/Toast';
import CookieConsent from './components/CookieConsent';
import PrivateRoute from './components/PrivateRoute';
import { AdminLayoutSkeleton } from './components/LoadingSkeleton';
import './styles/global.css';

function PageTracker() {
  const location = useLocation();
  useEffect(() => {
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'PageView');
    }
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'page_view', { page_path: location.pathname });
    }
  }, [location.pathname]);
  return null;
}

const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Admin = lazy(() => import('./pages/Admin'));
const Users = lazy(() => import('./pages/Users'));
const PostList = lazy(() => import('./pages/PostList'));
const PostForm = lazy(() => import('./pages/PostForm'));
const Blog = lazy(() => import('./pages/Blog'));
const PostView = lazy(() => import('./pages/PostView'));
const Services = lazy(() => import('./pages/Services'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Profile = lazy(() => import('./pages/Profile'));
const EmailMarketing = lazy(() => import('./pages/EmailMarketing'));
const InstagramPage = lazy(() => import('./pages/InstagramPage'));
const CTAAnalytics = lazy(() => import('./pages/CTAAnalytics'));
const Legal = lazy(() => import('./pages/Legal'));
const MetaAdsCampaignForm = lazy(() => import('./pages/MetaAdsCampaignForm'));
const Plans = lazy(() => import('./pages/Plans'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const OrgSettings = lazy(() => import('./pages/OrgSettings'));
const MetaCallback = lazy(() => import('./pages/MetaCallback'));

export default function App() {
  return (
    <HelmetProvider>
    <AuthProvider>
      <OrgProvider>
      <ToastProvider>
      <BrowserRouter>
        <PageTracker />
        <Suspense fallback={<AdminLayoutSkeleton />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/servicos" element={<Services />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<PostView />} />
          <Route path="/privacidade" element={<Legal />} />
          <Route path="/exclusao-dados" element={<Legal />} />
          <Route path="/planos" element={<Plans />} />
          <Route path="/meta/callback" element={<MetaCallback />} />

          {/* Onboarding (auth required, no org needed) */}
          <Route path="/onboarding" element={<Onboarding />} />

          {/* Protected routes */}
          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <Admin />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <PrivateRoute>
                <Users />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/posts"
            element={
              <PrivateRoute>
                <PostList />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/posts/new"
            element={
              <PrivateRoute>
                <PostForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/posts/edit/:id"
            element={
              <PrivateRoute>
                <PostForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/email-marketing"
            element={
              <PrivateRoute>
                <EmailMarketing />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/instagram"
            element={
              <PrivateRoute>
                <InstagramPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/instagram/campaigns/new"
            element={
              <PrivateRoute>
                <MetaAdsCampaignForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/instagram/campaigns/edit/:id"
            element={
              <PrivateRoute>
                <MetaAdsCampaignForm />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/cta-analytics"
            element={
              <PrivateRoute>
                <CTAAnalytics />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={<Navigate to="/admin/profile" replace />}
          />
        </Routes>
        </Suspense>
      </BrowserRouter>
      </ToastProvider>
      </OrgProvider>
    </AuthProvider>
    <CookieConsent />
    </HelmetProvider>
  );
}
