import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { App } from './App';
import './index.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const isValidClientId = !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID_HERE');

// Provide valid client ID if present, or a safe placeholder to provide GoogleOAuthProvider context
const fallbackClientId = GOOGLE_CLIENT_ID || '1000000000000-placeholder.apps.googleusercontent.com';

const root = (
  <React.StrictMode>
    <GoogleOAuthProvider clientId={fallbackClientId}>
      <App googleEnabled={isValidClientId} />
    </GoogleOAuthProvider>
  </React.StrictMode>
);

ReactDOM.createRoot(document.getElementById('root')!).render(root);

