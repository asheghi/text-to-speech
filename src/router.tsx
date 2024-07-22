import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from './components/RootLayout';
import { PageNotFound } from './pages/not-found/PageNotFound';
import { ErrorPage } from './pages/error/ErrorPage';
import { IndexPage } from './pages/index/IndexPage';
import ReaderPage from './pages/reader/ReaderPage';

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: '',
        element: <IndexPage />,
      },
      {
        path: 'reader',
        element: <ReaderPage />,
      },
    ]
  },
  {
    path: "*",
    element: <PageNotFound />,
  },
]);
