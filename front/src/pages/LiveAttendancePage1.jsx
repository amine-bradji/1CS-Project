import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTeacherPortal } from '../context/TeacherPortalContext';
import styles from './LiveAttendancePage1.module.css';

export function LiveAttendancePage1() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const {
    activeSession,
    instanceId,
    students,
    attendanceLoading,
    attendanceError,
    startAttendance,
    markAttendance,
    submitAttendance,
    clearAttendance,
  } = useTeacherPortal();

  const [filter, setFilter] = useState('all');
  const [teacherNote, setTeacherNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [pendingRecordIds, setPendingRecordIds] = useState(new Set());

  // On mount: read ?sessionId= from URL and kick off start_attendance
  useEffect(() => {
    const sessionId = searchParams.get('sessionId');
    if (!sessionId) return;
    // Only start if not already active for this session
    if (activeSession && String(activeSession.id) === String(sessionId)) return;
    startAttendance(sessionId).catch(() => {});
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalStudents = students.length;
  const presentCount = students.filter(s => s.status === 'present').length;
  const absentCount = students.filter(s => s.status === 'absent').length;
  const unmarkedCount = students.filter(s => s.status !== 'present' && s.status !== 'absent').length;
  const attendancePercentage = totalStudents > 0 ? Math.round((presentCount / totalStudents) * 100) : 0;

  const filteredStudents = students.filter(s => {
    if (filter === 'unmarked') return s.status !== 'present' && s.status !== 'absent';
    return true;
  });

  function buildInitials(name) {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    return `${parts[0]?.[0] || ''}${parts[1]?.[0] || ''}`.toUpperCase() || '?';
  }

  async function handleToggleStatus(recordId, newStatus) {
    if (pendingRecordIds.has(recordId)) return;
    setPendingRecordIds(prev => new Set(prev).add(recordId));
    try {
      await markAttendance(recordId, newStatus);
    } finally {
      setPendingRecordIds(prev => {
        const next = new Set(prev);
        next.delete(recordId);
        return next;
      });
    }
  }

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError('');
    try {
      await submitAttendance(teacherNote);
      navigate('/teacher/dashboard');
    } catch (err) {
      setSubmitError('Failed to submit attendance. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleBack() {
    clearAttendance();
    navigate('/teacher/dashboard');
  }

  const teacherName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim() || 'Teacher';

  if (attendanceLoading) {
    return (
      <div className={styles.page}>
        <div className={styles.mainPage}>
          <div className={styles.headerContainer}>
            <h3>Live Attendance</h3>
            <p className={styles.description}>Loading session data…</p>
          </div>
        </div>
      </div>
    );
  }

  if (attendanceError && !activeSession) {
    return (
      <div className={styles.page}>
        <div className={styles.mainPage}>
          <div className={styles.headerContainer}>
            <h3>Live Attendance</h3>
            <p className={styles.description} style={{ color: '#e63946' }}>{attendanceError}</p>
            <button className={styles.updateButton} onClick={handleBack}>← Back to Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  const sessionTitle = activeSession?.sessionName || activeSession?.title || 'Session';
  const sessionRoom = activeSession?.room || 'TBD';
  const sessionType = activeSession?.sessionType || activeSession?.session_type || '';
  const sessionGroups = (activeSession?.assignedGroups || []).join(', ');
  const sessionStart = activeSession?.startTime || activeSession?.start_time || '--';
  const sessionEnd = activeSession?.endTime || activeSession?.end_time || '--';

  return (
    <div className={styles.page}>
      {/* Main Content — sidebar is handled by TeacherShell */}
      <div className={styles.mainPage}>
        <div className={styles.headerContainer}>
          <div>
            <button
              type="button"
              onClick={handleBack}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem', marginBottom: '0.5rem', color: 'inherit' }}
              aria-label="Back to dashboard"
            >
              ← Back
            </button>
            <h3>Live Attendance</h3>
            <p className={styles.description}>
              Large, tablet-friendly class register for quick attendance during the current session.
            </p>
          </div>
          {sessionGroups && (
            <div className={styles.groupName}>
              <img src="/Icons/Container (1).png" alt="group" className={styles.groupIcon} />
              {sessionGroups}
            </div>
          )}
        </div>

        <div className={styles.contentContainer}>
          {/* LEFT COLUMN */}
          <div className={styles.leftPanel}>
            <div className={styles.currentSessionHeader}>
              <div>
                <p className={styles.currentSessionTitle}>Current session</p>
                <p className={styles.currentSessionSubtitle}>Mark each student as present or absent before submitting.</p>
              </div>
            </div>

            <div className={styles.infoSessionContainer}>
              <div>
                <p className={styles.sessionInfo}>Subject</p>
                <p className={styles.sessionName}>{sessionTitle}</p>
                <p className={styles.sessionType}>{sessionType}</p>
              </div>
              <div>
                <p className={styles.sessionInfo}>Room</p>
                <p className={styles.sessionName}>{sessionRoom}</p>
                <p className={styles.sessionType}>ESI SBA</p>
              </div>
              <div>
                <p className={styles.sessionInfo}>Time</p>
                <p className={styles.sessionName}>{sessionStart} - {sessionEnd}</p>
                <p className={styles.sessionType}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
              </div>
              <div>
                <p className={styles.sessionInfo}>Teacher</p>
                <p className={styles.sessionName}>{teacherName}</p>
                <p className={styles.sessionType}>ESI Sidi Bel Abbes</p>
              </div>
            </div>

            <div className={styles.statsBar}>
              <span className={styles.statsText}>
                <span className={styles.statsHighlight}>{totalStudents} students enrolled</span> •{' '}
                <span className={styles.statsHighlight}>{presentCount} marked present</span> •{' '}
                <span className={styles.statsHighlight}>{absentCount} marked absent</span>
              </span>
            </div>

            {/* Filter Tabs */}
            <div className={styles.filterTabs}>
              <button
                className={`${styles.filterTab} ${filter === 'all' ? styles.filterTabActive : ''}`}
                onClick={() => setFilter('all')}
              >
                All students
              </button>
              <button
                className={`${styles.filterTab} ${filter === 'unmarked' ? styles.filterTabActive : ''}`}
                onClick={() => setFilter('unmarked')}
              >
                Unmarked ({unmarkedCount})
              </button>
            </div>

            {/* STUDENT LIST */}
            <div className={styles.studentsList}>
              {filteredStudents.length === 0 ? (
                <p style={{ padding: '1rem', opacity: 0.6 }}>
                  {students.length === 0 ? 'No students found for this group.' : 'No unmarked students remaining.'}
                </p>
              ) : (
                filteredStudents.map((student) => {
                  const isPending = pendingRecordIds.has(student.record_id);
                  return (
                    <div key={student.record_id} className={styles.studentRow} style={{ opacity: isPending ? 0.6 : 1 }}>
                      <div className={styles.studentInfo}>
                        <div className={styles.studentAvatar}>
                          {buildInitials(student.full_name)}
                        </div>
                        <div className={styles.studentDetails}>
                          <span className={styles.studentName}>{student.full_name}</span>
                          <span className={styles.studentId}>
                            {student.registration_number || `ID: ${student.student_id}`}
                          </span>
                        </div>
                      </div>
                      <div className={styles.statusBtns}>
                        <button
                          className={`${styles.btnPresent} ${student.status === 'present' ? styles.on : ''}`}
                          onClick={() => handleToggleStatus(student.record_id, 'present')}
                          disabled={isPending}
                        >
                          Present
                        </button>
                        <button
                          className={`${styles.btnAbsent} ${student.status === 'absent' ? styles.on : ''}`}
                          onClick={() => handleToggleStatus(student.record_id, 'absent')}
                          disabled={isPending}
                        >
                          Absent
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className={styles.buttonGroup}>
              <button className={styles.submitButtonCurrent} onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Submitting…' : 'Submit Attendance'}
              </button>
            </div>
            {submitError && <p style={{ color: '#e63946', padding: '0.5rem' }}>{submitError}</p>}
          </div>

          {/* RIGHT COLUMN — SESSION SUMMARY */}
          <div className={styles.rightPanel}>
            <div className={styles.summaryHeader}>
              <h3>Session summary</h3>
              <p>Quick indicators for the current attendance sheet.</p>
            </div>

            <div className={styles.summaryCard}>
              <div className={styles.summaryCardTitle}>Attendance completion</div>
              <div className={styles.summaryCardValue}>{attendancePercentage}%</div>
              <div className={styles.summaryCardDesc}>
                {unmarkedCount > 0
                  ? `${unmarkedCount} students still unmarked.`
                  : 'All enrolled students have been reviewed.'}
              </div>
            </div>

            <div className={styles.statsRow}>
              <div className={styles.statBox}>
                <div className={styles.statNumber}>{absentCount}</div>
                <div className={styles.statLabel}>Marked absent</div>
                <div className={styles.statSub}>Students not present today.</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statNumber}>{presentCount}</div>
                <div className={styles.statLabel}>Marked present</div>
                <div className={styles.statSub}>Students checked in.</div>
              </div>
            </div>

            <div className={styles.noteSection}>
              <div className={styles.noteTitle}>Teacher note</div>
              <textarea
                className={styles.noteTextarea}
                rows="3"
                value={teacherNote}
                onChange={(e) => setTeacherNote(e.target.value)}
                placeholder="Optional remark before submission…"
              />
            </div>

            <button className={styles.attendanceHistoryButton} onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit & Close Session'}
            </button>

            <div className={styles.professorFooter}>
              <div className={styles.professorName}>{teacherName}</div>
              <div className={styles.professorTitle}>Teacher</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}