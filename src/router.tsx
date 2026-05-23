import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from './components/RootLayout';
import { PageNotFound } from './pages/not-found/PageNotFound';
import { ErrorPage } from './pages/error/ErrorPage';
import { IndexPage } from './pages/index/IndexPage';
// todo lazy loading pages
import ReaderPage from './pages/reader/ReaderPage';
import StatusPage from './pages/status/StatusPage';
import LandingPage from './pages/landing/LandingPage';
import DocsPage from './pages/docs/DocsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: '/docs',
    element: <DocsPage />,
    errorElement: <ErrorPage />,
  },
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: 'app',
        element: <IndexPage />,
      },
      {
        path: 'reader',
        element: <ReaderPage />,
      },
      {
        path: 'reader/:shareId',
        element: <ReaderPage />,
      },
      {
        path: 'status',
        element: <StatusPage />
      }
    ]
  },
  {
    path: "*",
    element: <PageNotFound />,
  },
]);
