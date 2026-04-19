import { Link } from 'react-router-dom';
import { useAppPreferences } from '../context/AppPreferencesContext';
import styles from './TeacherFeaturePlaceholderPage.module.css';

export default function TeacherFeaturePlaceholderPage({
  eyebrow,
  title,
  endpoint,
}) {
  const { t } = useAppPreferences();

  return (
    <div className={styles.page}>
      <section className={styles.card}>
        <span className={styles.eyebrow}>{eyebrow}</span>
        <h1 className={styles.title}>{title}</h1>
        <div className={styles.metaRow}>
          <code className={styles.endpoint}>{endpoint}</code>
        </div>
        <Link to="/teacher/dashboard" className={styles.linkButton}>
          {t('teacherPlaceholders.returnToDashboard')}
        </Link>
      </section>
    </div>
  );
}
