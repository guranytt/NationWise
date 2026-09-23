import { createBrowserRouter } from 'react-router';
import App from './App';
import MainLayout from './components/layout/MainLayout';
import LandingPage from './pages/LandingPage';
import IssueFeedPage from './pages/IssueFeedPage';
import ReportIssuePage from './pages/ReportIssuePage';
import IssueDetailPage from './pages/IssueDetailPage';
import AdminStatusPage from './pages/admin/AdminStatusPage';
import CandidatesPage from './pages/candidates/CandidatesPage';
import CandidateAdventurePage from './pages/candidates/CandidateAdventurePage';
import ComparePage from './pages/candidates/ComparePage';
import StateOfNationPage from './pages/StateOfNationPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        path: '/',
        element: <MainLayout />,
        children: [
          { index: true, element: <LandingPage /> },
          { path: 'issues', element: <IssueFeedPage /> },
          { path: 'report', element: <ReportIssuePage /> },
          { path: 'issues/:id', element: <IssueDetailPage /> },
          { path: 'admin/issues/:id', element: <AdminStatusPage /> },
          { path: 'candidates', element: <CandidatesPage /> },
          { path: 'candidates/:id', element: <CandidateAdventurePage /> },
          { path: 'compare', element: <ComparePage /> },
          { path: 'state-of-the-nation', element: <StateOfNationPage /> }, 
        ]
      }
    ]
  }
]);
