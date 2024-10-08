import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  RouterProvider,
} from "react-router-dom";

import './index.scss'
import TrpcWrapper from './TrpcWrapper';
import { router } from './router';
import packageInfo from '../package.json'
import '@fontsource/inter';


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TrpcWrapper>
      <RouterProvider router={router} />
    </TrpcWrapper>
  </React.StrictMode>,
)

document.title = import.meta.env.VITE_APP_TITLE ?? packageInfo.name