import { Suspense } from 'react';
import AppLoadingScreen from './components/AppLoadingScreen.jsx';
import AppRoutes from './routes/AppRoutes.jsx';
import './App.css';

export default function App() {
  return (
    <Suspense fallback={<AppLoadingScreen />}>
      <AppRoutes />
    </Suspense>
  );
}
