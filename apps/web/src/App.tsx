import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import SignupPage from './pages/auth/Signup';
import LoginPage from './pages/auth/Login';
import VerifyEmailPage from './pages/auth/verifyEmail';
import ForgotPasswordPage from './pages/auth/ForgotPassword';
import ResetPasswordPage from './pages/auth/ResetPassword';

const NotFound: React.FC = () => (
  <div className="flex min-h-svh items-center justify-center text-center">
    <div>
      <h2 className="text-4xl font-bold">404</h2>
      <p className="text-muted-foreground mt-2">Page not found.</p>
      <a href="/" className="mt-4 inline-block text-sm underline">
        Go home
      </a>
    </div>
  </div>
);

const App: React.FC = () => (
  <Router>
    <Routes>
      <Route path="/" element={<SignupPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="*" element={<NotFound />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
    </Routes>
  </Router>
);

export default App;
