import React from 'react';
import { createBrowserRouter } from "react-router-dom";
import { RootLayout } from './pages/index/RootLayout';
import { PageNotFound } from './pages/not-found/PageNotFound';
import { ErrorPage } from './pages/error/ErrorPage';
import { IndexPage } from './pages/index/IndexPage';
import { WordDetailsPage } from './pages/word-details/WordDetailsPage';
import { FlashCardsPage } from './pages/flash-cards/FlashCardsPage';

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
        path: '/word/:word',
        element: <WordDetailsPage />,
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
