import styles from './TeacherStatCard.module.css';

export default function TeacherStatCard({ label, value, description, loading = false }) {
  return (
    <article className={styles.card}>
      <span className={styles.label}>{label}</span>
      <strong className={styles.value}>{loading ? '--' : value}</strong>
      <p className={styles.meta}>{description}</p>
    </article>
  );
}
