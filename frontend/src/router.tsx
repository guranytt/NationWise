import { createBrowserRouter } from 'react-router';
import App from './App';
import LandingLayout from './components/layout/LandingLayout';
import LandingPage from './pages/LandingPage';
import IssueFeedPage from './pages/IssueFeedPage';
import ReportIssuePage from './pages/ReportIssuePage';
import IssueDetailPage from './pages/IssueDetailPage';
import AdminStatusPage from './pages/admin/AdminStatusPage';
import CandidatesPage from './pages/candidates/CandidatesPage';
import CandidateProfilePage from './pages/candidates/CandidateProfilePage';
import ComparePage from './pages/candidates/ComparePage';
import LeaderboardPage from './pages/candidates/LeaderboardPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingLayout />,
    children: [
      { index: true, element: <LandingPage /> }
    ]
  },
  {
    path: '/',
    element: <App />,
    children: [
      { path: 'issues', element: <IssueFeedPage /> },
      { path: 'report', element: <ReportIssuePage /> },
      { path: 'issues/:id', element: <IssueDetailPage /> },
      { path: 'admin/issues/:id', element: <AdminStatusPage /> },
      { path: 'candidates', element: <CandidatesPage /> },
      { path: 'candidates/:id', element: <CandidateProfilePage /> },
      { path: 'compare', element: <ComparePage /> },
      { path: 'leaderboard', element: <LeaderboardPage /> },
    ]
  }
]);
