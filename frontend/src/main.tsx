import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { App } from './App';
import './index.css';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const isValidClientId = !!(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID !== 'YOUR_GOOGLE_CLIENT_ID_HERE');

const root = (
  <React.StrictMode>
    {isValidClientId ? (
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <App googleEnabled={true} />
      </GoogleOAuthProvider>
    ) : (
      <App googleEnabled={false} />
    )}
  </React.StrictMode>
);

ReactDOM.createRoot(document.getElementById('root')!).render(root);
