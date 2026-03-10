import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ProtectedRoute, PublicRoute, RoleRoute } from './lib/roteGuard';

const SignupPage = lazy(() => import('./pages/auth/Signup'));
const LoginPage = lazy(() => import('./pages/auth/Login'));
const VerifyEmailPage = lazy(() => import('./pages/auth/verifyEmail'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPassword'));
const AccountPage = lazy(() => import('./pages/Accounts'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const TaskDetailPage = lazy(() => import('./pages/TaskDetails'));
const ProjectLayout = lazy(() => import('./pages/projects/Project.layout'));
const ProjectBoardPage = lazy(() => import('./pages/projects/ProjectBoard'));
const ProjectUploadPage = lazy(() => import('./pages/projects/ProjectUpload'));
const ProjectReviewsPage = lazy(
  () => import('./pages/projects/ProjectReviewPage'),
);
const ProjectReportsPage = lazy(() => import('./pages/projects/ProjectReport'));
const ProjectMembersPage = lazy(() => import('./pages/projects/ProjectMember'));
const FinalizedAssetsPage = lazy(
  () => import('./pages/projects/Finalizedassetspage'),
);
const MyTasksPage = lazy(() => import('./pages/projects/MytaskPage'));

const PageLoader = () => (
  <div className="flex min-h-svh items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
  </div>
);

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
    <Suspense fallback={<PageLoader />}>
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

          <Route path="/projects/:projectId" element={<ProjectLayout />}>
            <Route index element={<ProjectBoardPage />} />
            <Route path="board" element={<ProjectBoardPage />} />
            <Route path="tasks/:taskId" element={<TaskDetailPage />} />{' '}
            <Route path="reviews" element={<ProjectReviewsPage />} />
            <Route path="finalized" element={<FinalizedAssetsPage />} />
            <Route path="mytask" element={<MyTasksPage />} />
            <Route
              element={
                <RoleRoute allowed={['ADMIN', 'MANAGER', 'LEAD', 'MEMBER']} />
              }
            >
              <Route path="upload" element={<ProjectUploadPage />} />
            </Route>
            <Route
              element={<RoleRoute allowed={['ADMIN', 'MANAGER', 'LEAD']} />}
            >
              <Route path="reports" element={<ProjectReportsPage />} />
            </Route>
            <Route element={<RoleRoute allowed={['ADMIN', 'MANAGER']} />}>
              <Route path="members" element={<ProjectMembersPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  </Router>
);

export default App;
