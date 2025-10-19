
import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import LoginPage from './pages/LoginPage';
import FeedPage from './pages/FeedPage';
import ProfilePage from './pages/ProfilePage';
import AccountManagementPage from './pages/AccountManagementPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import Header from './components/Header';
import { AnimatePresence } from 'framer-motion';

const AnimatedRoutes: React.FC = () => {
    const location = useLocation();
    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                <Route path="/" element={<LoginPage />} />
                <Route path="/feed" element={<ProtectedRoute><FeedPage /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/account-manage" element={<ProtectedRoute><AccountManagementPage /></ProtectedRoute>} />
                <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            </Routes>
        </AnimatePresence>
    );
};


const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
    const { currentUser, loading } = useAuth();
    if (loading) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="w-16 h-16 border-4 border-primary-500 border-dashed rounded-full animate-spin"></div>
            </div>
        );
    }
    return currentUser ? children : <Navigate to="/" replace />;
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
        <AuthProvider>
            <div className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen transition-colors duration-300">
                <Header />
                <main>
                    <AnimatedRoutes />
                </main>
            </div>
        </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
