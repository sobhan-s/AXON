import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import SignupPage from './pages/auth/Signup';
import LoginPage from './pages/auth/Login';
import VerifyEmailPage from './pages/auth/verifyEmail';
import ForgotPasswordPage from './pages/auth/ForgotPassword';
import ResetPasswordPage from './pages/auth/ResetPassword';
import AccountPage from './pages/Accounts';

import Dashboard from './pages/Dashboard';
import ProjectLayout from './pages/projects/Project.layout';

import SuperAdminOrgsPage from './pages/SuperAdminPage';
import UserManagementPage from './pages/Usermanagementpage';
import ProjectsPage from './pages/projects/Projectpage';
import MyTasksPage from './pages/projects/MytaskPage';
import TeamPage from './pages/TeamPage';
import SettingsPage from './pages/SettinPage';

import ProjectBoardPage from './pages/projects/ProjectBoard';
import ProjectUploadPage from './pages/projects/ProjectUpload';
import ProjectReviewsPage from './pages/projects/ProjectReviewPage';
import ProjectReportsPage from './pages/projects/ProjectReport';
import ProjectMembersPage from './pages/projects/ProjectMember';

import { ProtectedRoute, PublicRoute, RoleRoute } from './lib/roteGuard';

const NotFound = () => (
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
      {/* PUBLIC */}
      <Route element={<PublicRoute />}>
        <Route path="/" element={<SignupPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* PROTECTED */}
      <Route element={<ProtectedRoute />}>
        <Route path="/account" element={<AccountPage />} />

        {/* ── DASHBOARD (top-level layout) ─────────────────────────── */}
        <Route path="/dashboard/*" element={<Dashboard />} />
        {/*
          Dashboard.tsx handles its own nested Routes:
            /dashboard           → DashboardHome
            /dashboard/orgs      → SuperAdminOrgsPage  (SUPER_ADMIN)
            /dashboard/users     → UserManagementPage  (ADMIN)
            /dashboard/projects  → ProjectsPage        (all)
            /dashboard/tasks     → MyTasksPage         (all except REVIEWER)
            /dashboard/team      → TeamPage            (MANAGER + ADMIN)
            /dashboard/settings  → SettingsPage        (ADMIN)
            /dashboard/review    → ProjectReviewsPage  (REVIEWER)
        */}

        {/* ── PROJECT LAYOUT (sidebar fully replaces on enter) ─────── */}
        <Route path="/projects/:projectId" element={<ProjectLayout />}>
          <Route index element={<ProjectBoardPage />} />
          <Route path="board" element={<ProjectBoardPage />} />
          <Route path="reviews" element={<ProjectReviewsPage />} />

          {/* Not REVIEWER */}
          <Route
            element={
              <RoleRoute allowed={['ADMIN', 'MANAGER', 'LEAD', 'MEMBER']} />
            }
          >
            <Route path="upload" element={<ProjectUploadPage />} />
          </Route>

          {/* LEAD + MANAGER + ADMIN */}
          <Route element={<RoleRoute allowed={['ADMIN', 'MANAGER', 'LEAD']} />}>
            <Route path="reports" element={<ProjectReportsPage />} />
          </Route>

          {/* MANAGER + ADMIN */}
          <Route element={<RoleRoute allowed={['ADMIN', 'MANAGER']} />}>
            <Route path="members" element={<ProjectMembersPage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  </Router>
);

export default App;
