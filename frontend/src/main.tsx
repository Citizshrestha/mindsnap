// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import {GoogleOAuthProvider} from '@react-oauth/google'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId='663069197970-jk03o0o9oje0si598d7af9cpl8oik6o4.apps.googleusercontent.com'>

    <BrowserRouter>
        <App />
    </BrowserRouter>
    </GoogleOAuthProvider>

  </React.StrictMode>
);