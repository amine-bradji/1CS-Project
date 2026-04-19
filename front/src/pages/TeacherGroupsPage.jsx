import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TeacherPageHeader from '../components/TeacherPageHeader';
import TeacherStatCard from '../components/TeacherStatCard';
import TeacherStateCard from '../components/TeacherStateCard';
import { useAppPreferences } from '../context/AppPreferencesContext';
import {
  createEmptyTeacherGroupDetail,
  createEmptyTeacherGroupsCollection,
  fetchTeacherGroupDetail,
  fetchTeacherGroups,
  fetchTeacherYearModules,
  removeTeacherAbsenceRecord,
  TEACHER_PORTAL_ENDPOINTS,
} from '../services/teacherPortalEndpoint';
import styles from './TeacherGroupsPage.module.css';

const SEMESTER_OPTIONS = [
  { value: 'S1', label: 'S1' },
  { value: 'S2', label: 'S2' },
];

function getTodayLabel(locale) {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());
}

function getToneClassName(statusTone) {
  if (statusTone === 'positive') {
    return styles.tonePositive;
  }

  if (statusTone === 'warning') {
    return styles.toneWarning;
  }

  if (statusTone === 'danger') {
    return styles.toneDanger;
  }

  return styles.toneNeutral;
}

export default function TeacherGroupsPage() {
  const navigate = useNavigate();
  const { t, locale } = useAppPreferences();
  const [draftFilters, setDraftFilters] = useState({
    search: '',
    module: '',
    semester: '',
    status: '',
  });
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    module: '',
    semester: '',
    status: '',
  });
  const [collection, setCollection] = useState(createEmptyTeacherGroupsCollection());
  const [collectionLoading, setCollectionLoading] = useState(true);
  const [collectionError, setCollectionError] = useState('');
  const [moduleOptions, setModuleOptions] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [studentPage, setStudentPage] = useState(1);
  const [detail, setDetail] = useState(createEmptyTeacherGroupDetail());
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [removalLoading, setRemovalLoading] = useState(false);
  const [removalMessage, setRemovalMessage] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadModuleOptions() {
      try {
        const nextModuleOptions = await fetchTeacherYearModules();

        if (isMounted) {
          setModuleOptions(nextModuleOptions);
        }
      } catch {
        if (isMounted) {
          setModuleOptions([]);
        }
      }
    }

    loadModuleOptions();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadGroupCollection() {
      try {
        setCollectionLoading(true);
        setCollectionError('');
        const nextCollection = await fetchTeacherGroups(appliedFilters);

        if (!isMounted) {
          return;
        }

        setCollection(nextCollection);
        setSelectedGroupId((currentValue) => {
          if (nextCollection.groups.some((group) => group.id === currentValue)) {
            return currentValue;
          }

          return nextCollection.groups[0]?.id || '';
        });
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        setCollection(createEmptyTeacherGroupsCollection());
        setCollectionError(requestError.response?.data?.error || requestError.message || t('teacherGroups.loadGroupsError'));
        setSelectedGroupId('');
      } finally {
        if (isMounted) {
          setCollectionLoading(false);
        }
      }
    }

    loadGroupCollection();

    return () => {
      isMounted = false;
    };
  }, [appliedFilters, t]);

  useEffect(() => {
    let isMounted = true;

    async function loadGroupDetail() {
      if (!selectedGroupId) {
        setDetail(createEmptyTeacherGroupDetail());
        setDetailError('');
        return;
      }

      try {
        setDetailLoading(true);
        setDetailError('');
        const nextDetail = await fetchTeacherGroupDetail(selectedGroupId, {
          search: appliedFilters.search,
          studentId: selectedStudentId,
          page: studentPage,
        });

        if (!isMounted) {
          return;
        }

        setDetail(nextDetail);

        if (!selectedStudentId && nextDetail.selectedStudentId) {
          setSelectedStudentId(nextDetail.selectedStudentId);
        }
      } catch (requestError) {
        if (!isMounted) {
          return;
        }

        setDetail(createEmptyTeacherGroupDetail());
        setDetailError(requestError.response?.data?.error || requestError.message || t('teacherGroups.loadGroupError'));
      } finally {
        if (isMounted) {
          setDetailLoading(false);
        }
      }
    }

    loadGroupDetail();

    return () => {
      isMounted = false;
    };
  }, [appliedFilters.search, selectedGroupId, selectedStudentId, studentPage, t]);

  const selectedStudent = detail.students.find((student) => student.id === (selectedStudentId || detail.selectedStudentId))
    || detail.students.find((student) => student.absenceRecord?.id === detail.absenceRecord?.id)
    || null;
  const activeAbsenceRecord = selectedStudent?.absenceRecord || detail.absenceRecord;
  const recordStudentName = activeAbsenceRecord?.studentName || selectedStudent?.fullName || t('teacherGroups.studentPending');
  const recordStudentRegistration = activeAbsenceRecord?.registrationNumber || selectedStudent?.registrationNumber || '--';
  const recordStudentGroup = selectedStudent?.groupLabel || detail.group.name || t('teacherGroups.groupPending');
  const recordModuleName = activeAbsenceRecord?.moduleName || detail.group.moduleName || t('teacherGroups.modulePending');
  const recordSessionLabel = activeAbsenceRecord?.sessionLabel || detail.group.scheduleLabel || '--';
  const recordRoom = activeAbsenceRecord?.room || detail.group.room || '--';
  const trackedModules = moduleOptions
    .map((option) => option.label)
    .slice(0, 4)
    .join(', ');
  const summaryStats = [
    {
      label: t('teacherGroups.trackedGroups'),
      value: collection.summary.trackedGroups,
      description: trackedModules || t('teacherGroups.noModuleSelected'),
    },
    {
      label: t('teacherGroups.displayedStudents'),
      value: collection.summary.displayedStudents,
      description: t('teacherGroups.displayedStudentsDescription'),
    },
    {
      label: t('teacherGroups.removableAbsences'),
      value: collection.summary.removableAbsences,
      description: t('teacherGroups.removableAbsencesDescription'),
    },
  ];

  async function handleRemoveAbsence() {
    if (!activeAbsenceRecord?.id) {
      return;
    }

    try {
      setRemovalLoading(true);
      setRemovalMessage('');
      const removalResponse = await removeTeacherAbsenceRecord(activeAbsenceRecord.id);

      if (removalResponse?.success === false) {
        setRemovalMessage(t('teacherGroups.removeAbsenceError'));
        return;
      }

      setRemovalMessage(t('teacherGroups.removeAbsenceSuccess'));
      const [nextCollection, nextDetail] = await Promise.all([
        fetchTeacherGroups(appliedFilters),
        fetchTeacherGroupDetail(selectedGroupId, {
          search: appliedFilters.search,
          studentId: selectedStudentId,
          page: studentPage,
        }),
      ]);

      setCollection(nextCollection);
      setDetail(nextDetail);
    } catch (requestError) {
      setRemovalMessage(requestError.response?.data?.error || requestError.message || t('teacherGroups.removeAbsenceError'));
    } finally {
      setRemovalLoading(false);
    }
  }

  return (
    <div className={styles.page}>
      <TeacherPageHeader
        title={t('teacherGroups.pageTitle')}
        subtitle={getTodayLabel(locale)}
        actions={(
          <button type="button" className={styles.weekButton} onClick={() => navigate('/teacher/sessions')}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="4" y="5" width="16" height="15" rx="2.6" />
              <path d="M8 3.5v4M16 3.5v4M4 10h16" />
            </svg>
            <span>{t('teacherGroups.weekSessions')}</span>
          </button>
        )}
      />

      <section className={styles.filtersCard}>
        <div className={styles.filtersHeader}>
          <div>
            <span className={styles.eyebrow}>{t('teacherGroups.overview')}</span>
            <h2>{t('teacherGroups.filtersTitle')}</h2>
            <p>{t('teacherGroups.filtersDescription')}</p>
          </div>
        </div>

        <div className={styles.filterGrid}>
          <label className={styles.field}>
            <span>{t('teacherGroups.search')}</span>
            <input
              type="search"
              value={draftFilters.search}
              placeholder={t('teacherGroups.searchPlaceholder')}
              onChange={(event) => setDraftFilters((currentValue) => ({ ...currentValue, search: event.target.value }))}
            />
          </label>

          <label className={styles.field}>
            <span>{t('teacherGroups.module')}</span>
            <select
              value={draftFilters.module}
              onChange={(event) => setDraftFilters((currentValue) => ({ ...currentValue, module: event.target.value }))}
            >
              <option value="">{t('teacherGroups.allModules')}</option>
              {moduleOptions.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>{t('teacherGroups.semester')}</span>
            <select
              value={draftFilters.semester}
              onChange={(event) => setDraftFilters((currentValue) => ({ ...currentValue, semester: event.target.value }))}
            >
              <option value="">{t('teacherGroups.allSemesters')}</option>
              {SEMESTER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span>{t('teacherGroups.status')}</span>
            <select
              value={draftFilters.status}
              onChange={(event) => setDraftFilters((currentValue) => ({ ...currentValue, status: event.target.value }))}
            >
              <option value="">{t('teacherGroups.allAbsenceStates')}</option>
              {collection.filters.statuses.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className={styles.applyButton}
            onClick={() => {
              setAppliedFilters({ ...draftFilters });
              setSelectedStudentId('');
              setStudentPage(1);
              setRemovalMessage('');
            }}
          >
            {t('common.apply')}
          </button>
        </div>

        <div className={styles.summaryGrid}>
          {summaryStats.map((stat) => (
            <TeacherStatCard key={stat.label} {...stat} loading={collectionLoading} />
          ))}
        </div>
      </section>

      {collectionError ? (
        <TeacherStateCard
          title=""
          description={collectionError}
          endpoint={TEACHER_PORTAL_ENDPOINTS.groups}
          tone="danger"
        />
      ) : null}

      <section className={styles.columns}>
        <article className={styles.panel}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>{t('teacherGroups.groupsTitle')}</span>
              <h3>{t('teacherGroups.groupsHeading')}</h3>
              <p className={styles.panelDescription}>
                {t('teacherGroups.groupsDescription')}
              </p>
            </div>
          </div>

          {collectionLoading ? (
            <TeacherStateCard title="" tone="soft" />
          ) : collection.groups.length === 0 ? (
            <TeacherStateCard
              title=""
              endpoint={TEACHER_PORTAL_ENDPOINTS.groups}
              tone="soft"
            />
          ) : (
            <div className={styles.groupList}>
              {collection.groups.map((group) => {
                const isSelectedGroup = selectedGroupId === group.id;
                const statusLabel = isSelectedGroup
                  ? t('teacherGroups.selected')
                  : (group.statusLabel || t('teacherGroups.noStatus'));
                const statusToneClassName = isSelectedGroup
                  ? styles.toneSelected
                  : getToneClassName(group.statusTone);

                return (
                  <button
                    key={group.id || group.name}
                    type="button"
                    className={`${styles.groupCard} ${isSelectedGroup ? styles.groupCardActive : ''}`}
                    onClick={() => {
                      setSelectedGroupId(group.id);
                      setSelectedStudentId('');
                      setStudentPage(1);
                      setRemovalMessage('');
                    }}
                  >
                    <div className={styles.groupCardHeader}>
                      <div>
                        <h4>{group.name || t('teacherGroups.unnamedGroup')}</h4>
                        <p>{group.moduleName || t('teacherGroups.modulePending')}</p>
                      </div>
                      <span className={`${styles.statusPill} ${statusToneClassName}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <p className={styles.groupMeta}>
                      {group.room || t('teacherGroups.roomPending')}
                      {group.scheduleLabel ? ` - ${group.scheduleLabel}` : ''}
                      {group.semesterLabel ? ` - ${group.semesterLabel}` : ''}
                    </p>
                    <div className={styles.groupMetrics}>
                      <div>
                        <span>{t('teacherGroups.students')}</span>
                        <strong>{group.studentCount}</strong>
                      </div>
                      <div>
                        <span>{t('teacherGroups.removableCount')}</span>
                        <strong>{group.removableAbsenceCount}</strong>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </article>

        <article className={`${styles.panel} ${styles.studentsPanel}`}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>{t('teacherGroups.studentList')}</span>
              <h3>{t('teacherGroups.selectedGroupStudents')}</h3>
              <p className={styles.panelDescription}>
                {t('teacherGroups.selectedGroupStudentsDescription')}
              </p>
            </div>
          </div>

          {detailError ? (
            <TeacherStateCard
              title=""
              description={detailError}
              endpoint={selectedGroupId ? TEACHER_PORTAL_ENDPOINTS.groupDetail(selectedGroupId) : TEACHER_PORTAL_ENDPOINTS.groups}
              tone="danger"
            />
          ) : detailLoading ? (
            <TeacherStateCard title="" tone="soft" />
          ) : !selectedGroupId ? (
            <TeacherStateCard title="" tone="soft" />
          ) : (
            <>
              <div className={styles.selectedGroupCard}>
                <div>
                  <span className={styles.selectedLabel}>{t('teacherGroups.selectedGroup')}</span>
                  <h4>{detail.group.name || t('teacherGroups.groupDetailsPending')}</h4>
                  <p className={styles.selectedHint}>
                    {detail.group.moduleName
                      ? `${t('teacherGroups.selectedGroupHintPrefix')} ${detail.group.moduleName} ${t('teacherGroups.selectedGroupHintInfix')} ${detail.group.name || '--'}`
                      : t('teacherGroups.selectedGroupHintEmpty')}
                  </p>
                </div>
                <dl className={styles.selectedMeta}>
                  <div>
                    <dt>{t('teacherGroups.module')}</dt>
                    <dd>{detail.group.moduleName || '--'}</dd>
                  </div>
                  <div>
                    <dt>{t('teacherGroups.session')}</dt>
                    <dd>{detail.group.scheduleLabel || '--'}</dd>
                  </div>
                  <div>
                    <dt>{t('teacherGroups.absencesToVerify')}</dt>
                    <dd>{detail.group.removableAbsenceCount}</dd>
                  </div>
                </dl>
              </div>

              {detail.students.length === 0 ? (
                <TeacherStateCard
                  title=""
                  endpoint={selectedGroupId ? TEACHER_PORTAL_ENDPOINTS.groupDetail(selectedGroupId) : ''}
                  tone="soft"
                />
              ) : (
                <>
                  <div className={styles.tableHeader}>
                    <span>{t('teacherGroups.student')}</span>
                    <span>{t('teacherGroups.registrationNumber')}</span>
                  </div>
                  <div className={styles.studentRows}>
                    {detail.students.map((student) => (
                      <button
                        key={student.id || student.registrationNumber}
                        type="button"
                        className={`${styles.studentRow} ${(selectedStudentId || detail.selectedStudentId) === student.id ? styles.studentRowActive : ''}`}
                        onClick={() => setSelectedStudentId(student.id)}
                      >
                        <div className={styles.studentIdentity}>
                          <div className={styles.studentAvatar}>
                            {String(student.fullName || '?').trim().charAt(0).toUpperCase() || '?'}
                          </div>
                          <div>
                            <strong>{student.fullName || t('teacherGroups.studentPending')}</strong>
                            <span>{student.groupLabel || detail.group.name || t('teacherGroups.groupPending')}</span>
                          </div>
                        </div>
                        <span className={styles.registrationCell}>{student.registrationNumber || '--'}</span>
                      </button>
                    ))}
                  </div>

                  <div className={styles.pagination}>
                    <span>
                      {t('teacherGroups.showing')} {detail.students.length} {t('common.of')} {detail.pagination.count} {t('teacherGroups.studentsSuffix')}
                    </span>
                    <div className={styles.paginationActions}>
                      <button
                        type="button"
                        onClick={() => setStudentPage((currentValue) => Math.max(1, currentValue - 1))}
                        disabled={detail.pagination.page <= 1}
                      >
                        {t('teacherGroups.previous')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setStudentPage((currentValue) => Math.min(detail.pagination.totalPages, currentValue + 1))}
                        disabled={detail.pagination.page >= detail.pagination.totalPages}
                      >
                        {t('teacherGroups.next')}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </article>

        <article className={`${styles.panel} ${styles.recordPanel}`}>
          <div className={styles.panelHeader}>
            <div>
              <span className={styles.panelEyebrow}>{t('teacherGroups.absenceRecord')}</span>
              <h3>{t('teacherGroups.absenceRecord')}</h3>
            </div>
          </div>

          {!activeAbsenceRecord ? (
            <TeacherStateCard
              title=""
              endpoint={selectedGroupId ? TEACHER_PORTAL_ENDPOINTS.groupDetail(selectedGroupId) : ''}
              tone="soft"
            />
          ) : (
            <div className={styles.recordCard}>
              <div className={styles.recordBadgeRow}>
                <strong>{recordModuleName}</strong>
                <span className={`${styles.statusPill} ${activeAbsenceRecord.canRemove ? styles.tonePositive : styles.toneWarning}`}>
                  {activeAbsenceRecord.canRemove ? t('teacherGroups.readyToRemove') : t('teacherGroups.reviewOnly')}
                </span>
              </div>

              <div className={styles.recordStudentCard}>
                <div className={styles.recordAvatar}>
                  {String(recordStudentName || '?').trim().charAt(0).toUpperCase() || '?'}
                </div>
                <div className={styles.recordStudentMeta}>
                  <h4>{recordStudentName}</h4>
                  <p>{recordStudentGroup}</p>
                </div>
                <span className={styles.recordRegistration}>{recordStudentRegistration}</span>
              </div>

              <dl className={styles.recordMeta}>
                <div>
                  <dt>{t('teacherGroups.session')}</dt>
                  <dd>{recordSessionLabel}</dd>
                </div>
                <div>
                  <dt>{t('teacherGroups.room')}</dt>
                  <dd>{recordRoom}</dd>
                </div>
              </dl>

              <button
                type="button"
                className={styles.removeButton}
                disabled={!activeAbsenceRecord.canRemove || removalLoading}
                onClick={handleRemoveAbsence}
              >
                {removalLoading ? t('teacherGroups.removing') : t('teacherGroups.removeThisAbsence')}
              </button>

              {removalMessage ? (
                <p className={styles.removalMessage}>{removalMessage}</p>
              ) : null}
            </div>
          )}
        </article>
      </section>
    </div>
  );
}
