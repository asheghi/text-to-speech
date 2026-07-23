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
import { RouteSeo } from './components/Seo/RouteSeo';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RouteSeo><LandingPage /></RouteSeo>,
    errorElement: <ErrorPage />,
  },
  {
    path: '/docs',
    element: <RouteSeo><DocsPage /></RouteSeo>,
    errorElement: <ErrorPage />,
  },
  {
    path: '/studio',
    element: <RouteSeo><IndexPage /></RouteSeo>,
    errorElement: <ErrorPage />,
  },
  {
    path: '/',
    element: <RouteSeo><RootLayout /></RouteSeo>,
    errorElement: <ErrorPage />,
    children: [
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
    element: <RouteSeo><PageNotFound /></RouteSeo>,
  },
]);
