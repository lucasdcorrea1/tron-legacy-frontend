import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import CookieConsent from './components/CookieConsent';
import PrivateRoute from './components/PrivateRoute';
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

export default function App() {
  return (
    <HelmetProvider>
    <AuthProvider>
      <ToastProvider>
      <BrowserRouter>
        <PageTracker />
        <Suspense fallback={null}>
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
        </Routes>
        </Suspense>
      </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
    <CookieConsent />
    </HelmetProvider>
  );
}
