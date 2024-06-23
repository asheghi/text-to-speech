import React from 'react';
import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from './pages/index/RootLayout';
import { PageNotFound } from './pages/not-found/PageNotFound';
import { ErrorPage } from './pages/error/ErrorPage';
import { IndexPage } from './pages/index/IndexPage';
import { FlashCardsPage } from './pages/flash-cards/FlashCardsPage';
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
    path: '/flash-cards',
    element: <FlashCardsPage />,
  },
  {
    path: "*",
    element: <PageNotFound />,
  },
]);
