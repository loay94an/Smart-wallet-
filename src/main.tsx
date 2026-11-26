import {createRoot} from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import App from './App.tsx';
import './index.css';

if (Capacitor.isNativePlatform()) {
  StatusBar.setStyle({ style: Style.Dark }).catch(() => undefined);
  StatusBar.setBackgroundColor({ color: '#f5f5f5' }).catch(() => undefined);
}

createRoot(document.getElementById('root')!).render(<App />);
