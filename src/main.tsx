import {createRoot} from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import App from './App.tsx';
import './index.css';

if (Capacitor.isNativePlatform()) {
  StatusBar.setStyle({ style: Style.Light }).catch(() => undefined);
  StatusBar.setBackgroundColor({ color: '#0a0a1a' }).catch(() => undefined);
}

createRoot(document.getElementById('root')!).render(<App />);
