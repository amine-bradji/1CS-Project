import api from '../api/axios.js';
import {
  createBackendRequirementResult,
  readEndpointData,
  runEndpointMutation,
} from './backendSupport.js';

export const TEACHER_PORTAL_ENDPOINTS = {
  dashboardOverview: 'teacher/dashboard/overview/',
  groups: 'teacher/groups/',
  modulesByYear: 'teacher/modules/by-year/',
  notifications: 'teacher/notifications/',
  markNotificationRead: (notificationId) => `teacher/notifications/${notificationId}/read/`,
  deleteNotification: (notificationId) => `teacher/notifications/${notificationId}/`,
  groupDetail: (groupId) => `teacher/groups/${groupId}/`,
  removeAbsence: (absenceId) => `teacher/absences/${absenceId}/remove/`,
};

function normalizeNumber(value) {
  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function normalizeText(value) {
  return String(value || '').trim();
}

function normalizeOption(value) {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    const normalizedValue = normalizeText(value);

    if (!normalizedValue) {
      return null;
    }

    return {
      value: normalizedValue,
      label: normalizedValue,
    };
  }

  const optionValue = normalizeText(value.value || value.id || value.code || value.slug || value.name);
  const optionLabel = normalizeText(value.label || value.name || value.title || optionValue);

  if (!optionValue && !optionLabel) {
    return null;
  }

  return {
    value: optionValue || optionLabel,
    label: optionLabel || optionValue,
  };
}

function normalizeOptions(values) {
  if (!Array.isArray(values)) {
    return [];
  }

  return values.map(normalizeOption).filter(Boolean);
}

function normalizeTeacherModuleOption(value, yearHint = '') {
  if (!value) {
    return null;
  }

  if (typeof value === 'string') {
    const normalizedLabel = normalizeText(value);

    if (!normalizedLabel) {
      return null;
    }

    return {
      value: normalizedLabel,
      label: yearHint ? `${yearHint} - ${normalizedLabel}` : normalizedLabel,
    };
  }

  const normalizedValue = normalizeText(
    value.value
      || value.id
      || value.code
      || value.module_id
      || value.moduleId
      || value.slug
      || value.name
      || value.module_name
      || value.title,
  );
  const normalizedLabel = normalizeText(value.label || value.module_name || value.name || value.title || normalizedValue);
  const normalizedYear = normalizeText(
    value.year
      || value.level
      || value.promotion
      || value.academic_year
      || value.academicYear
      || yearHint,
  );

  if (!normalizedValue && !normalizedLabel) {
    return null;
  }

  return {
    value: normalizedValue || normalizedLabel,
    label: normalizedYear ? `${normalizedYear} - ${normalizedLabel || normalizedValue}` : (normalizedLabel || normalizedValue),
  };
}

function dedupeOptionByValue(options) {
  const seenValues = new Set();

  return options.filter((option) => {
    const key = normalizeText(option?.value).toLowerCase();

    if (!key || seenValues.has(key)) {
      return false;
    }

    seenValues.add(key);
    return true;
  });
}

function normalizeTeacherModulesCollection(payload = {}) {
  if (Array.isArray(payload)) {
    return dedupeOptionByValue(payload.map((value) => normalizeTeacherModuleOption(value)).filter(Boolean));
  }

  const moduleCandidates = Array.isArray(payload.modules)
    ? payload.modules
    : Array.isArray(payload.results)
      ? payload.results
      : [];

  if (moduleCandidates.length > 0) {
    return dedupeOptionByValue(moduleCandidates.map((value) => normalizeTeacherModuleOption(value)).filter(Boolean));
  }

  const yearCollection = payload.modules_by_year || payload.modulesByYear || payload.by_year || payload.byYear || {};
  const groupedModuleOptions = Object.entries(yearCollection).flatMap(([year, modules]) => {
    if (!Array.isArray(modules)) {
      return [];
    }

    return modules
      .map((moduleValue) => normalizeTeacherModuleOption(moduleValue, normalizeText(year)))
      .filter(Boolean);
  });

  if (groupedModuleOptions.length > 0) {
    return dedupeOptionByValue(groupedModuleOptions);
  }

  return [];
}

function normalizePagination(payload = {}) {
  const count = normalizeNumber(payload.count || payload.total || payload.total_count);
  const pageSize = normalizeNumber(payload.page_size || payload.pageSize || payload.per_page) || 1;
  const page = normalizeNumber(payload.page || payload.current_page || 1) || 1;
  const totalPages = normalizeNumber(payload.total_pages || payload.totalPages || Math.ceil(count / pageSize) || 1) || 1;

  return {
    count,
    page,
    pageSize,
    totalPages,
    next: payload.next || '',
    previous: payload.previous || '',
  };
}

function normalizeSessionStatus(status) {
  const normalizedStatus = normalizeText(status).toLowerCase();

  if (normalizedStatus === 'done' || normalizedStatus === 'completed') {
    return 'completed';
  }

  if (normalizedStatus === 'live' || normalizedStatus === 'active' || normalizedStatus === 'in_progress') {
    return 'active';
  }

  return 'upcoming';
}

function normalizeTeacherSession(payload = {}) {
  return {
    id: normalizeText(payload.id),
    title: normalizeText(payload.title || payload.module_name || payload.session_name || payload.name),
    room: normalizeText(payload.room || payload.location),
    groupLabel: normalizeText(payload.group_label || payload.group_name || payload.group || payload.section),
    startTime: normalizeText(payload.start_time || payload.startTime),
    endTime: normalizeText(payload.end_time || payload.endTime),
    status: normalizeSessionStatus(payload.status),
    statusLabel: normalizeText(payload.status_label || payload.statusLabel || payload.status),
  };
}

function normalizeGroupStatusTone(status) {
  const normalizedStatus = normalizeText(status).toLowerCase();

  if (normalizedStatus === 'stable' || normalizedStatus === 'ready') {
    return 'positive';
  }

  if (normalizedStatus === 'attention' || normalizedStatus === 'warning' || normalizedStatus === 'pending') {
    return 'warning';
  }

  if (normalizedStatus === 'critical' || normalizedStatus === 'blocked' || normalizedStatus === 'overdue') {
    return 'danger';
  }

  return 'neutral';
}

function normalizeTeacherGroup(payload = {}) {
  return {
    id: normalizeText(payload.id),
    name: normalizeText(payload.name || payload.group_name || payload.label),
    moduleName: normalizeText(payload.module_name || payload.module || payload.session_name),
    room: normalizeText(payload.room || payload.location),
    scheduleLabel: normalizeText(payload.schedule_label || payload.schedule || payload.time_range),
    semesterLabel: normalizeText(payload.semester_label || payload.semester),
    studentCount: normalizeNumber(payload.student_count || payload.students_count || payload.total_students),
    activeAbsenceCount: normalizeNumber(payload.active_absence_count || payload.absence_count || payload.active_absences),
    removableAbsenceCount: normalizeNumber(payload.removable_absence_count || payload.removable_absences || payload.absences_to_remove),
    statusLabel: normalizeText(payload.status_label || payload.status || payload.health_status),
    statusTone: normalizeGroupStatusTone(payload.status || payload.status_label || payload.health_status),
  };
}

function normalizeTeacherAbsenceRecord(payload = {}) {
  const absenceId = normalizeText(payload.id || payload.absence_id);

  if (!absenceId && !normalizeText(payload.student_name || payload.module_name || payload.module)) {
    return null;
  }

  return {
    id: absenceId,
    studentId: normalizeText(payload.student_id || payload.student?.id),
    studentName: normalizeText(payload.student_name || payload.student?.full_name || payload.student?.name),
    registrationNumber: normalizeText(payload.registration_number || payload.student?.registration_number || payload.matricule),
    moduleName: normalizeText(payload.module_name || payload.module),
    sessionLabel: normalizeText(payload.session_label || payload.session || payload.time_range),
    room: normalizeText(payload.room || payload.location),
    canRemove: Boolean(payload.can_remove ?? payload.removable ?? absenceId),
  };
}

function normalizeTeacherStudent(payload = {}) {
  return {
    id: normalizeText(payload.id || payload.student_id),
    fullName: normalizeText(payload.full_name || payload.name || payload.student_name),
    registrationNumber: normalizeText(payload.registration_number || payload.matricule || payload.student_code),
    groupLabel: normalizeText(payload.group_label || payload.group || payload.group_name),
    avatarUrl: normalizeText(payload.avatar_url || payload.photo_url || payload.profile_picture),
    absenceRecord: normalizeTeacherAbsenceRecord(payload.absence_record || payload.removable_absence || {}),
  };
}

function normalizeGroupsCollection(payload = {}) {
  const rawGroups = Array.isArray(payload.groups)
    ? payload.groups
    : Array.isArray(payload.results)
      ? payload.results
      : [];

  const summarySource = payload.summary || payload.meta || {};
  const filterSource = payload.filters || payload.filter_options || {};

  return {
    summary: {
      trackedGroups: normalizeNumber(summarySource.tracked_groups || payload.tracked_groups || rawGroups.length),
      displayedStudents: normalizeNumber(summarySource.displayed_students || payload.displayed_students),
      removableAbsences: normalizeNumber(summarySource.removable_absences || payload.removable_absences),
    },
    filters: {
      modules: normalizeOptions(filterSource.modules),
      semesters: normalizeOptions(filterSource.semesters),
      statuses: normalizeOptions(filterSource.statuses || filterSource.absence_statuses),
    },
    groups: rawGroups.map(normalizeTeacherGroup),
    pagination: normalizePagination(payload.pagination || payload),
  };
}

function normalizeGroupDetail(payload = {}) {
  const rawStudents = Array.isArray(payload.students)
    ? payload.students
    : Array.isArray(payload.results)
      ? payload.results
      : Array.isArray(payload.students?.results)
        ? payload.students.results
        : [];
  const groupSource = payload.group || payload.selected_group || payload;
  const studentPaginationSource = payload.student_pagination || payload.students || payload.pagination || {};
  const absenceRecord = normalizeTeacherAbsenceRecord(payload.absence_record || payload.absenceRecord || {});

  return {
    group: normalizeTeacherGroup(groupSource),
    students: rawStudents.map(normalizeTeacherStudent),
    selectedStudentId: normalizeText(payload.selected_student_id || payload.selectedStudentId || absenceRecord?.studentId),
    absenceRecord,
    pagination: normalizePagination(studentPaginationSource),
  };
}

function normalizeTeacherNotification(payload = {}) {
  const notificationId = normalizeText(payload.id || payload.notification_id || payload.uuid);
  const title = normalizeText(payload.title || payload.subject || payload.module_name || payload.name);
  const message = normalizeText(payload.message || payload.body || payload.description || payload.text);

  if (!notificationId && !title && !message) {
    return null;
  }

  const category = normalizeText(payload.category || payload.type || payload.level || payload.severity);
  const createdAt = normalizeText(payload.created_at || payload.createdAt || payload.timestamp || payload.date || payload.sent_at);
  const isRead = Boolean(payload.is_read ?? payload.read ?? payload.seen ?? payload.isSeen ?? false);
  const priority = normalizeText(payload.priority || payload.level || payload.severity).toLowerCase();
  const derivedUrgency = priority === 'urgent' || priority === 'high' || priority === 'critical';
  const isUrgent = Boolean(payload.is_urgent ?? payload.urgent ?? derivedUrgency);

  return {
    id: notificationId || `${title}-${createdAt}`,
    title: title || 'Notification',
    message,
    category,
    createdAt,
    isRead,
    isUrgent,
  };
}

function normalizeTeacherNotificationsCollection(payload = {}) {
  const rawNotifications = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.notifications)
      ? payload.notifications
      : Array.isArray(payload.results)
        ? payload.results
        : [];
  const notifications = rawNotifications.map(normalizeTeacherNotification).filter(Boolean);
  const computedUnreadCount = notifications.reduce((count, notification) => count + (notification.isRead ? 0 : 1), 0);
  const computedUrgentCount = notifications.reduce((count, notification) => count + (notification.isUrgent ? 1 : 0), 0);
  const unreadCountSource = payload?.unread_count ?? payload?.unreadCount;
  const urgentCountSource = payload?.urgent_count ?? payload?.urgentCount;

  return {
    notifications,
    unreadCount: unreadCountSource == null ? computedUnreadCount : normalizeNumber(unreadCountSource),
    urgentCount: urgentCountSource == null ? computedUrgentCount : normalizeNumber(urgentCountSource),
  };
}

export function createEmptyTeacherDashboardOverview() {
  return {
    summary: {
      totalSessionsToday: 0,
      completedSessions: 0,
      remainingSessions: 0,
      absencesThisWeek: 0,
      makeUpSessions: 0,
      urgentAlertsCount: 0,
    },
    sessions: [],
  };
}

export function normalizeTeacherDashboardOverview(payload = {}) {
  const summarySource = payload.summary || payload.meta || payload;
  const rawSessions = Array.isArray(payload.sessions)
    ? payload.sessions
    : Array.isArray(payload.today_sessions)
      ? payload.today_sessions
      : Array.isArray(payload.results)
        ? payload.results
        : [];

  return {
    summary: {
      totalSessionsToday: normalizeNumber(summarySource.total_sessions_today || summarySource.totalSessionsToday),
      completedSessions: normalizeNumber(summarySource.completed_sessions || summarySource.completedSessions),
      remainingSessions: normalizeNumber(summarySource.remaining_sessions || summarySource.remainingSessions),
      absencesThisWeek: normalizeNumber(summarySource.absences_this_week || summarySource.absencesThisWeek),
      makeUpSessions: normalizeNumber(summarySource.make_up_sessions || summarySource.makeUpSessions),
      urgentAlertsCount: normalizeNumber(summarySource.urgent_alerts || summarySource.urgentAlertsCount),
    },
    sessions: rawSessions.map(normalizeTeacherSession),
  };
}

export function createEmptyTeacherGroupsCollection() {
  return {
    summary: {
      trackedGroups: 0,
      displayedStudents: 0,
      removableAbsences: 0,
    },
    filters: {
      modules: [],
      semesters: [],
      statuses: [],
    },
    groups: [],
    pagination: normalizePagination({}),
  };
}

export function createEmptyTeacherGroupDetail() {
  return {
    group: normalizeTeacherGroup({}),
    students: [],
    selectedStudentId: '',
    absenceRecord: null,
    pagination: normalizePagination({}),
  };
}

export function createEmptyTeacherNotificationsCollection() {
  return {
    notifications: [],
    unreadCount: 0,
    urgentCount: 0,
  };
}

function buildRequestParams(entries = {}) {
  const nextParams = {};

  Object.entries(entries).forEach(([key, value]) => {
    const normalizedValue = normalizeText(value);

    if (normalizedValue) {
      nextParams[key] = normalizedValue;
    }
  });

  return nextParams;
}

export async function fetchTeacherDashboardOverview() {
  return readEndpointData({
    getPreviewData: createEmptyTeacherDashboardOverview,
    request: () => api.get(TEACHER_PORTAL_ENDPOINTS.dashboardOverview),
    normalize: normalizeTeacherDashboardOverview,
  });
}

export async function fetchTeacherYearModules(academicYear = '') {
  const params = buildRequestParams({
    academic_year: academicYear,
  });

  return readEndpointData({
    getPreviewData: [],
    request: () => api.get(TEACHER_PORTAL_ENDPOINTS.modulesByYear, { params }),
    normalize: normalizeTeacherModulesCollection,
  });
}

export async function fetchTeacherNotifications(filters = {}) {
  const params = buildRequestParams({
    urgent: filters.onlyUrgent ? 'true' : '',
    unread: filters.onlyUnread ? 'true' : '',
    page: filters.page,
    page_size: filters.pageSize,
  });

  return readEndpointData({
    getPreviewData: createEmptyTeacherNotificationsCollection,
    request: () => api.get(TEACHER_PORTAL_ENDPOINTS.notifications, { params }),
    normalize: normalizeTeacherNotificationsCollection,
  });
}

export async function markTeacherNotificationAsRead(notificationId) {
  const normalizedNotificationId = normalizeText(notificationId);

  if (!normalizedNotificationId) {
    return null;
  }

  return runEndpointMutation({
    endpoint: TEACHER_PORTAL_ENDPOINTS.markNotificationRead(normalizedNotificationId),
    actionLabel: 'mark the notification as read',
    request: () => api.post(TEACHER_PORTAL_ENDPOINTS.markNotificationRead(normalizedNotificationId)),
  });
}

export async function deleteTeacherNotification(notificationId) {
  const normalizedNotificationId = normalizeText(notificationId);

  if (!normalizedNotificationId) {
    return null;
  }

  return runEndpointMutation({
    endpoint: TEACHER_PORTAL_ENDPOINTS.deleteNotification(normalizedNotificationId),
    actionLabel: 'delete the notification',
    request: () => api.delete(TEACHER_PORTAL_ENDPOINTS.deleteNotification(normalizedNotificationId)),
  });
}

export async function fetchTeacherGroups(filters = {}) {
  const params = buildRequestParams({
    search: filters.search,
    module: filters.module,
    semester: filters.semester,
    status: filters.status,
    page: filters.page,
  });

  return readEndpointData({
    getPreviewData: createEmptyTeacherGroupsCollection,
    request: () => api.get(TEACHER_PORTAL_ENDPOINTS.groups, { params }),
    normalize: normalizeGroupsCollection,
  });
}

export async function fetchTeacherGroupDetail(groupId, filters = {}) {
  const normalizedGroupId = normalizeText(groupId);

  if (!normalizedGroupId) {
    return createEmptyTeacherGroupDetail();
  }

  const endpoint = TEACHER_PORTAL_ENDPOINTS.groupDetail(normalizedGroupId);
  const params = buildRequestParams({
    search: filters.search,
    student: filters.studentId,
    page: filters.page,
  });

  return readEndpointData({
    getPreviewData: createEmptyTeacherGroupDetail,
    request: () => api.get(endpoint, { params }),
    normalize: normalizeGroupDetail,
  });
}

export async function removeTeacherAbsenceRecord(absenceId) {
  const normalizedAbsenceId = normalizeText(absenceId);

  if (!normalizedAbsenceId) {
    return null;
  }

  return runEndpointMutation({
    endpoint: TEACHER_PORTAL_ENDPOINTS.removeAbsence(normalizedAbsenceId),
    actionLabel: 'remove the absence record',
    request: () => api.post(TEACHER_PORTAL_ENDPOINTS.removeAbsence(normalizedAbsenceId)),
    getPreviewResult: createBackendRequirementResult(
      'remove the absence record',
      TEACHER_PORTAL_ENDPOINTS.removeAbsence(normalizedAbsenceId),
    ),
  });
}
