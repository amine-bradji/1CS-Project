import { Outlet } from 'react-router-dom';
import TeacherSidebar from '../components/TeacherSidebar';
import styles from './TeacherShell.module.css';

export default function TeacherShell() {
  return (
    <div className={styles.layout}>
      <TeacherSidebar />
      <main className={styles.content}>
        <div className={styles.surface}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
