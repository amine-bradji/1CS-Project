import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TeacherPageHeader from '../components/TeacherPageHeader';
import TeacherStatCard from '../components/TeacherStatCard';
import TeacherStateCard from '../components/TeacherStateCard';
import { useAuth } from '../context/AuthContext';
import { useAppPreferences } from '../context/AppPreferencesContext';
import {
  createEmptyTeacherNotificationsCollection,
  deleteTeacherNotification,
  fetchTeacherDashboardOverview,
  fetchTeacherNotifications,
  markTeacherNotificationAsRead,
  TEACHER_PORTAL_ENDPOINTS,
} from '../services/teacherPortalEndpoint';
import styles from './TeacherDashboardPage.module.css';

function formatTodayLabel(locale) {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());
}

function getSessionStatusMeta(status, t) {
  if (status === 'completed') {
    return {
      actionLabel: t('teacherDashboard.sessionStatusDone'),
      actionVariant: 'Done',
      disabled: true,
    };
  }

  if (status === 'active') {
    return {
      actionLabel: t('teacherDashboard.sessionStatusStartNow'),
      actionVariant: 'Active',
      disabled: false,
    };
  }

  return {
    actionLabel: t('teacherDashboard.sessionStatusUpcoming'),
    actionVariant: 'Upcoming',
    disabled: true,
  };
}

function matchesSearch(session, searchQuery) {
  const normalizedQuery = String(searchQuery || '').trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return [
    session.title,
    session.room,
    session.groupLabel,
    session.startTime,
    session.endTime,
  ].some((value) => String(value || '').toLowerCase().includes(normalizedQuery));
}

export default function TeacherDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, locale } = useAppPreferences();
  const notificationsPanelRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [overview, setOverview] = useState(null);
  const [notificationsCollection, setNotificationsCollection] = useState(createEmptyTeacherNotificationsCollection());
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsLoaded, setNotificationsLoaded] = useState(false);
  const [notificationsError, setNotificationsError] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationView, setNotificationView] = useState('all');
  const [notificationActionId, setNotificationActionId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadOverview() {
      try {
        setLoading(true);
        setError('');
        const nextOverview = await fetchTeacherDashboardOverview();

        if (isMounted) {
          setOverview(nextOverview);
        }
      } catch (requestError) {
        if (isMounted) {
          setOverview(null);
          setError(requestError.response?.data?.error || requestError.message || t('teacherDashboard.loadError'));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadOverview();

    return () => {
      isMounted = false;
    };
  }, [t]);

  useEffect(() => {
    let isMounted = true;

    async function loadNotifications() {
      try {
        setNotificationsLoading(true);
        setNotificationsError('');
        const nextCollection = await fetchTeacherNotifications();

        if (isMounted) {
          setNotificationsCollection(nextCollection);
          setNotificationsLoaded(true);
        }
      } catch (requestError) {
        if (isMounted) {
          setNotificationsCollection(createEmptyTeacherNotificationsCollection());
          setNotificationsError(requestError.response?.data?.error || requestError.message || t('teacherDashboard.notificationsLoadError'));
          setNotificationsLoaded(true);
        }
      } finally {
        if (isMounted) {
          setNotificationsLoading(false);
        }
      }
    }

    loadNotifications();

    return () => {
      isMounted = false;
    };
  }, [t]);

  useEffect(() => {
    if (!notificationsOpen) {
      return undefined;
    }

    function handleClickOutside(event) {
      if (notificationsPanelRef.current && !notificationsPanelRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [notificationsOpen]);

  async function requestNotifications() {
    try {
      setNotificationsLoading(true);
      setNotificationsError('');
      const nextCollection = await fetchTeacherNotifications();

      setNotificationsCollection(nextCollection);
      setNotificationsLoaded(true);
    } catch (requestError) {
      setNotificationsCollection(createEmptyTeacherNotificationsCollection());
      setNotificationsError(requestError.response?.data?.error || requestError.message || t('teacherDashboard.notificationsLoadError'));
      setNotificationsLoaded(true);
    } finally {
      setNotificationsLoading(false);
    }
  }

  async function handleMarkNotificationAsRead(notificationId) {
    const normalizedNotificationId = String(notificationId || '').trim();

    if (!normalizedNotificationId) {
      return;
    }

    try {
      setNotificationActionId(`read:${normalizedNotificationId}`);
      setNotificationsError('');
      const response = await markTeacherNotificationAsRead(normalizedNotificationId);

      if (response?.success === false) {
        setNotificationsError(response.error || t('teacherDashboard.notificationReadError'));
        return;
      }

      await requestNotifications();
    } catch (requestError) {
      setNotificationsError(requestError.response?.data?.error || requestError.message || t('teacherDashboard.notificationReadError'));
    } finally {
      setNotificationActionId('');
    }
  }

  async function handleDeleteNotification(notificationId) {
    const normalizedNotificationId = String(notificationId || '').trim();

    if (!normalizedNotificationId) {
      return;
    }

    try {
      setNotificationActionId(`delete:${normalizedNotificationId}`);
      setNotificationsError('');
      const response = await deleteTeacherNotification(normalizedNotificationId);

      if (response?.success === false) {
        setNotificationsError(response.error || t('teacherDashboard.notificationDeleteError'));
        return;
      }

      await requestNotifications();
    } catch (requestError) {
      setNotificationsError(requestError.response?.data?.error || requestError.message || t('teacherDashboard.notificationDeleteError'));
    } finally {
      setNotificationActionId('');
    }
  }

  function openNotifications(nextView) {
    setNotificationView(nextView);
    setNotificationsOpen(true);

    if (!notificationsLoaded && !notificationsLoading) {
      requestNotifications();
    }
  }

  const summary = overview?.summary || {
    totalSessionsToday: 0,
    completedSessions: 0,
    remainingSessions: 0,
    absencesThisWeek: 0,
    makeUpSessions: 0,
    urgentAlertsCount: 0,
  };
  const teacherName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || t('teacherDashboard.teacherFallbackName');
  const visibleSessions = (overview?.sessions || []).filter((session) => matchesSearch(session, searchQuery));
  const visibleNotifications = notificationView === 'urgent'
    ? notificationsCollection.notifications.filter((notification) => notification.isUrgent)
    : notificationsCollection.notifications;
  const urgentAlertsCount = notificationsLoaded
    ? notificationsCollection.urgentCount
    : summary.urgentAlertsCount;
  const stats = [
    {
      label: t('teacherDashboard.totalSessionsToday'),
      value: summary.totalSessionsToday,
      description: `${summary.completedSessions} ${t('teacherDashboard.totalSessionsMetaCompleted')}, ${summary.remainingSessions} ${t('teacherDashboard.totalSessionsMetaRemaining')}`,
    },
    {
      label: t('teacherDashboard.absencesThisWeek'),
      value: summary.absencesThisWeek,
      description: t('teacherDashboard.absencesThisWeekDescription'),
    },
    {
      label: t('teacherDashboard.makeUpSessions'),
      value: summary.makeUpSessions,
      description: t('teacherDashboard.makeUpSessionsDescription'),
    },
  ];

  return (
    <div className={styles.page}>
      <TeacherPageHeader
        title={`${t('teacherDashboard.welcomePrefix')} ${teacherName}`}
        subtitle={formatTodayLabel(locale)}
        actions={(
          <>
            <button type="button" className={styles.secondaryButton} onClick={() => navigate('/teacher/sessions')}>
              <span className={styles.buttonIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <rect x="4" y="5" width="16" height="15" rx="2.6" />
                  <path d="M8 3.5v4M16 3.5v4M4 10h16" />
                </svg>
              </span>
              <span>{t('teacherDashboard.viewMySessions')}</span>
            </button>
            <button type="button" className={styles.primaryButton} onClick={() => navigate('/teacher/attendance')}>
              <span className={styles.buttonIcon} aria-hidden="true">
                <svg viewBox="0 0 24 24">
                  <path d="M9 7.2v9.6l7-4.8-7-4.8Z" />
                </svg>
              </span>
              <span>{t('teacherDashboard.startAttendance')}</span>
            </button>
          </>
        )}
      />

      <section className={styles.toolbar}>
        <label className={styles.searchField}>
          <span className={styles.searchIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="6.2" />
              <path d="M20 20l-4.2-4.2" />
            </svg>
          </span>
          <input
            type="search"
            value={searchQuery}
            placeholder={t('header.searchPlaceholder')}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </label>

        <div className={styles.toolbarActions} ref={notificationsPanelRef}>
          <button type="button" className={styles.alertButton} onClick={() => openNotifications('urgent')}>
            <span className={styles.alertDot} aria-hidden="true" />
            <span>{urgentAlertsCount} {t('header.urgentAlertsPlural')}</span>
          </button>

          <button type="button" className={styles.iconButton} onClick={() => openNotifications('all')} aria-label={t('teacherDashboard.openNotifications')}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 4.5a4.8 4.8 0 0 0-4.8 4.8v2.1c0 1-.34 1.98-.95 2.78L4.8 16h14.4l-1.45-1.82a4.4 4.4 0 0 1-.95-2.78V9.3A4.8 4.8 0 0 0 12 4.5Z" />
              <path d="M9.9 18.2a2.1 2.1 0 0 0 4.2 0" />
            </svg>
          </button>

          {notificationsOpen ? (
            <section className={styles.notificationPanel} aria-label={t('teacherDashboard.notificationsList')}>
              <header className={styles.notificationPanelHeader}>
                <h3>{notificationView === 'urgent' ? t('teacherDashboard.urgentAlerts') : t('teacherDashboard.notifications')}</h3>
                <div className={styles.notificationPanelHeaderActions}>
                  <button
                    type="button"
                    className={styles.notificationPanelButton}
                    onClick={requestNotifications}
                    disabled={notificationsLoading}
                  >
                    {t('common.refresh')}
                  </button>
                  <button
                    type="button"
                    className={styles.notificationPanelButton}
                    onClick={() => setNotificationsOpen(false)}
                    aria-label={t('common.close')}
                  >
                    {t('common.close')}
                  </button>
                </div>
              </header>

              {notificationsError ? (
                <p className={styles.notificationError}>{notificationsError}</p>
              ) : null}

              {notificationsLoading ? (
                <p className={styles.notificationEmpty}>{t('teacherDashboard.loadingNotifications')}</p>
              ) : visibleNotifications.length === 0 ? (
                <p className={styles.notificationEmpty}>{t('teacherDashboard.noNotifications')}</p>
              ) : (
                <ul className={styles.notificationList}>
                  {visibleNotifications.map((notification) => (
                    <li
                      key={notification.id}
                      className={`${styles.notificationItem} ${notification.isRead ? styles.notificationItemRead : ''}`}
                    >
                      <div className={styles.notificationContent}>
                        <p className={styles.notificationTitle}>{notification.title}</p>
                        {notification.message ? (
                          <p className={styles.notificationMessage}>{notification.message}</p>
                        ) : null}
                        {(notification.category || notification.createdAt) ? (
                          <p className={styles.notificationMeta}>
                            {notification.category ? <span>{notification.category}</span> : null}
                            {notification.createdAt ? <span>{notification.createdAt}</span> : null}
                          </p>
                        ) : null}
                      </div>

                      <div className={styles.notificationItemActions}>
                        <button
                          type="button"
                          className={styles.notificationActionButton}
                          disabled={notification.isRead || notificationActionId === `read:${notification.id}`}
                          onClick={() => handleMarkNotificationAsRead(notification.id)}
                        >
                          {t('teacherDashboard.markAsRead')}
                        </button>
                        <button
                          type="button"
                          className={`${styles.notificationActionButton} ${styles.notificationDeleteButton}`}
                          disabled={notificationActionId === `delete:${notification.id}`}
                          onClick={() => handleDeleteNotification(notification.id)}
                        >
                          {t('header.delete')}
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : null}
        </div>
      </section>

      {error && (
        <TeacherStateCard
          title=""
          description={error}
          endpoint={TEACHER_PORTAL_ENDPOINTS.dashboardOverview}
          tone="danger"
        />
      )}

      <section className={styles.statsGrid}>
        {stats.map((stat) => (
          <TeacherStatCard key={stat.label} {...stat} loading={loading} />
        ))}
      </section>

      <section className={styles.sessionsCard}>
        <div className={styles.sectionHeader}>
          <div>
            <h2>{t('teacherDashboard.todaysSessions')}</h2>
            <p>{t('teacherDashboard.todaysSessionsDescription')}</p>
          </div>
          <button type="button" className={styles.textButton} onClick={() => navigate('/teacher/sessions')}>
            {t('common.viewAll')}
          </button>
        </div>

        {loading ? (
          <TeacherStateCard title="" tone="soft" />
        ) : visibleSessions.length === 0 ? (
          <TeacherStateCard
            title=""
            endpoint={TEACHER_PORTAL_ENDPOINTS.dashboardOverview}
            tone="soft"
          />
        ) : (
          <div className={styles.sessionList}>
            {visibleSessions.map((session) => {
              const statusMeta = getSessionStatusMeta(session.status, t);
              const hasSessionId = Boolean(session.id);

              return (
                <article
                  key={session.id || `${session.title}-${session.startTime}`}
                  className={`${styles.sessionCard} ${styles[`sessionCard${statusMeta.actionVariant}`]}`}
                >
                  <div className={styles.sessionTime}>
                    {session.startTime || '--'} - {session.endTime || '--'}
                  </div>
                  <div className={styles.sessionInfo}>
                    <h3>{session.title || t('teacherDashboard.untitledSession')}</h3>
                    <p>
                      {session.room || t('teacherDashboard.roomPending')}
                      {session.groupLabel ? ` - ${session.groupLabel}` : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    className={`${styles.sessionAction} ${styles[`sessionAction${statusMeta.actionVariant}`]}`}
                    disabled={statusMeta.disabled || !hasSessionId}
                    onClick={() => navigate(`/teacher/attendance${hasSessionId ? `?sessionId=${session.id}` : ''}`)}
                  >
                    {statusMeta.actionLabel}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
