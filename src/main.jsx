import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { KindeProvider } from '@kinde-oss/kinde-auth-react';

createRoot(document.getElementById('root')).render(
    <KindeProvider
      clientId={import.meta.env.VITE_KINDE_CLIENT_ID}
      domain={import.meta.env.VITE_KINDE_DOMAIN}
redirectUri={import.meta.env.VITE_KINDE_REDIRECT_URL}
logoutUri={import.meta.env.VITE_KINDE_LOGOUT_REDIRECT_URL}
scopes="openid profile email"

    >
      <App />
    </KindeProvider>
  
);
