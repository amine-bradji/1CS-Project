import { useAppPreferences } from '../context/AppPreferencesContext';

export default function AppLoadingScreen() {
  const { t } = useAppPreferences();

  return <div className="loading-screen">{t('common.loading')}</div>;
}
