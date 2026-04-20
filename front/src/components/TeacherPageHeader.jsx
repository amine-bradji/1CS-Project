import styles from './TeacherPageHeader.module.css';

export default function TeacherPageHeader({ title, subtitle, actions = null }) {
  return (
    <section className={styles.header}>
      <div className={styles.copy}>
        <h1>{title}</h1>
        {subtitle ? <p>{subtitle}</p> : null}
      </div>
      {actions ? <div className={styles.actions}>{actions}</div> : null}
    </section>
  );
}
