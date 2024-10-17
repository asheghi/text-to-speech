import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from './components/RootLayout';
import { PageNotFound } from './pages/not-found/PageNotFound';
import { ErrorPage } from './pages/error/ErrorPage';
import { IndexPage } from './pages/index/IndexPage';
// todo lazy loading pages
import ReaderPage from './pages/reader/ReaderPage';
import NewIndex from './pages/newIndex/ReaderPage';
import StatusPage from './pages/status/StatusPage';

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: '',
        element: <NewIndex />,
      },
      {
        path: 'old',
        element: <IndexPage />,
      },
      {
        path: 'reader',
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
