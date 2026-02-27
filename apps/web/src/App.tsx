import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import SignupPage from './pages/auth/Signup';
import LoginPage from './pages/auth/Login';
import VerifyEmailPage from './pages/auth/verifyEmail';
import ForgotPasswordPage from './pages/auth/ForgotPassword';
import ResetPasswordPage from './pages/auth/ResetPassword';
import Dashboard from './pages/Dashboard';
import AccountPage from './pages/Accounts';
import UserManagementPage from './pages/Usermanagementpage';
import SuperAdminOrgsPage from './pages/SuperAdminPage';

import { ProtectedRoute, PublicRoute, RoleRoute } from './lib/roteGuard';

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
      <Route element={<PublicRoute />}>
        <Route path="/" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/account" element={<AccountPage />} />
        <Route path="/dashboard/*" element={<Dashboard />} />

        <Route element={<RoleRoute allowed={['SUPER_ADMIN']} />}>
          <Route path="/dashboard/orgs" element={<SuperAdminOrgsPage />} />
        </Route>

        <Route element={<RoleRoute allowed={['ADMIN', 'SUPER_ADMIN']} />}>
          <Route path="/dashboard/users" element={<UserManagementPage />} />
        </Route>

        <Route
          element={<RoleRoute allowed={['ADMIN', 'MANAGER']} />}
        >
          <Route
            path="/dashboard/projects"
            element={<div>Projects Page</div>}
          />
        </Route>

        <Route
          element={
            <RoleRoute allowed={['ADMIN', 'MANAGER', 'LEAD']} />
          }
        >
          <Route path="/dashboard/team" element={<div>Team Page</div>} />
          <Route path="/dashboard/tasks" element={<div>Tasks Page</div>} />
        </Route>

        <Route element={<RoleRoute allowed={['REVISER']} />}>
          <Route path="/dashboard/review" element={<div>Review Queue</div>} />
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  </Router>
);

export default App;
