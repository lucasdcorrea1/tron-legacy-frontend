import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import PrivateRoute from './components/PrivateRoute';
import './styles/global.css';

function MetaPixelPageView() {
  const location = useLocation();
  useEffect(() => {
    if (typeof window.fbq === 'function') {
      window.fbq('track', 'PageView');
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
const InstagramScheduling = lazy(() => import('./pages/InstagramScheduling'));

export default function App() {
  return (
    <HelmetProvider>
    <AuthProvider>
      <ToastProvider>
      <BrowserRouter>
        <MetaPixelPageView />
        <Suspense fallback={null}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/servicos" element={<Services />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<PostView />} />

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
                <InstagramScheduling />
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
    </HelmetProvider>
  );
}
