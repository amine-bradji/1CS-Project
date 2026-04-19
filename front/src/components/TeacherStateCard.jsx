import styles from './TeacherStateCard.module.css';

export default function TeacherStateCard({
  title,
  description,
  tone = 'neutral',
}) {
  return (
    <section className={`${styles.card} ${styles[`tone${tone.charAt(0).toUpperCase()}${tone.slice(1)}`]}`}>
      {title ? <p className={styles.title}>{title}</p> : null}
      {description ? <p className={styles.description}>{description}</p> : null}
    </section>
  );
}
