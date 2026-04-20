import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAppPreferences } from '../context/AppPreferencesContext';
import {
  changeSystemSettingsPassword,
} from '../services/systemSettingsEndpoint';
import { buildInstitutionalEmailFromFullName, buildUserEmail } from '../utils/userEmail';
import UserPasswordPlaceholderDialog from './UserPasswordPlaceholderDialog';
import styles from './TeacherSettingsPage.module.css';

const TEACHER_SETTINGS_STORAGE_KEY = 'teacher_settings_v1';

const SIDE_ITEMS = [
  { id: 'general-account', labelKey: 'teacherSettings.sideGeneralAccount', disabled: false },
  { id: 'absence-management', labelKey: 'teacherSettings.sideAbsenceManagement', disabled: false },
  { id: 'privacy-security', labelKey: 'teacherSettings.sidePrivacySecurity', disabled: true },
];

function createDefaultAbsenceManagementSettings() {
  return {
    thresholdAlerts: true,
    warningLevelDays: 3,
    criticalLevelDays: 5,
    presentByDefault: true,
    googleClassroomSync: true,
  };
}

function getNameParts(value) {
  return String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function getInitialsFromName(fullName, fallbackInitial = 'T') {
  const nameParts = getNameParts(fullName);
  const firstInitial = nameParts[0]?.[0] || '';
  const secondInitial = nameParts[1]?.[0] || '';
  const initials = `${firstInitial}${secondInitial}`.toUpperCase();
  return initials || fallbackInitial;
}

function splitFullName(fullName) {
  const nameParts = getNameParts(fullName);

  if (nameParts.length === 0) {
    return {
      firstName: '',
      familyName: '',
    };
  }

  if (nameParts.length === 1) {
    return {
      firstName: nameParts[0],
      familyName: '',
    };
  }

  return {
    firstName: nameParts.slice(0, -1).join(' '),
    familyName: nameParts[nameParts.length - 1],
  };
}

function composeFullName(firstName, familyName) {
  return [String(firstName || '').trim(), String(familyName || '').trim()]
    .filter(Boolean)
    .join(' ')
    .trim();
}

function createEmptyTeacherSettings() {
  return {
    teacherAccount: {
      fullName: '',
      email: '',
      phoneNumber: '',
      jobTitle: '',
      profilePhotoUrl: '',
      firstName: '',
      familyName: '',
      address: '',
      password: '',
    },
    absenceManagement: createDefaultAbsenceManagementSettings(),
  };
}

function readStoredTeacherSettings() {
  try {
    const rawValue = localStorage.getItem(TEACHER_SETTINGS_STORAGE_KEY);

    if (!rawValue) {
      return null;
    }

    const parsedValue = JSON.parse(rawValue);
    return parsedValue && typeof parsedValue === 'object' ? parsedValue : null;
  } catch {
    return null;
  }
}

function saveTeacherSettings(nextState) {
  localStorage.setItem(TEACHER_SETTINGS_STORAGE_KEY, JSON.stringify(nextState));
}

export default function TeacherSettingsPage() {
  const fileInputRef = useRef(null);
  const { user } = useAuth();
  const {
    teacherDisplayName,
    teacherPhotoUrl,
    setTeacherDisplayName,
    setTeacherPhotoUrl,
    t,
  } = useAppPreferences();

  const [settingsState, setSettingsState] = useState(createEmptyTeacherSettings());
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState('absence-management');
  const [savedAbsenceSettings, setSavedAbsenceSettings] = useState(createDefaultAbsenceManagementSettings());

  useEffect(() => {
    function loadSettings() {
      setIsLoading(true);

      try {
        const storedTeacherSettings = readStoredTeacherSettings();
        const storedTeacherAccount = storedTeacherSettings?.teacherAccount || storedTeacherSettings?.adminAccount || {};
        const fallbackFirstName = [user?.first_name, user?.middle_name]
          .filter(Boolean)
          .join(' ')
          .trim();
        const fallbackFamilyName = String(user?.last_name || '').trim();
        const nameSeed = storedTeacherAccount.fullName
          || teacherDisplayName
          || composeFullName(fallbackFirstName, fallbackFamilyName);
        const parsedNameSeed = splitFullName(nameSeed);
        const nextFirstName = String(storedTeacherAccount.firstName || '').trim() || fallbackFirstName || parsedNameSeed.firstName;
        const nextFamilyName = String(storedTeacherAccount.familyName || '').trim() || fallbackFamilyName || parsedNameSeed.familyName;
        const nextFullName = composeFullName(nextFirstName, nextFamilyName) || nameSeed;
        const nextEmail = buildUserEmail(nextFirstName, nextFamilyName)
          || buildInstitutionalEmailFromFullName(nextFullName)
          || storedTeacherAccount.email
          || user?.email
          || '';
        const nextPhone = storedTeacherAccount.phoneNumber || user?.phone_number || user?.phone || '';
        const nextAddress = storedTeacherAccount.address || user?.address || user?.adress || '';
        const nextJobTitle = storedTeacherAccount.jobTitle || user?.job_title || user?.title || t('teacherSettings.defaultJobTitle');
        const nextPassword = storedTeacherAccount.password || '';
        const nextPhoto = storedTeacherAccount.profilePhotoUrl || teacherPhotoUrl || user?.profile_picture || '';
        const nextAbsenceSettings = {
          ...createDefaultAbsenceManagementSettings(),
          ...(storedTeacherSettings?.absenceManagement || {}),
        };
        const nextState = {
          ...createEmptyTeacherSettings(),
          ...(storedTeacherSettings || {}),
          teacherAccount: {
            ...createEmptyTeacherSettings().teacherAccount,
            ...storedTeacherAccount,
            firstName: nextFirstName,
            familyName: nextFamilyName,
            fullName: nextFullName,
            email: nextEmail,
            phoneNumber: nextPhone,
            address: nextAddress,
            jobTitle: nextJobTitle,
            password: nextPassword,
            profilePhotoUrl: nextPhoto,
          },
          absenceManagement: nextAbsenceSettings,
        };

        setSettingsState(nextState);
        setSavedAbsenceSettings(nextAbsenceSettings);
        saveTeacherSettings(nextState);

        if (nextFullName) {
          setTeacherDisplayName(nextFullName);
        }

        if (nextPhoto) {
          setTeacherPhotoUrl(nextPhoto);
        }
      } catch {
        const fallbackFirstName = [user?.first_name, user?.middle_name]
          .filter(Boolean)
          .join(' ')
          .trim();
        const fallbackFamilyName = String(user?.last_name || '').trim();
        const fallbackFullName = composeFullName(fallbackFirstName, fallbackFamilyName);

        setSettingsState((currentState) => ({
          ...createEmptyTeacherSettings(),
          teacherAccount: {
            ...createEmptyTeacherSettings().teacherAccount,
            ...currentState.teacherAccount,
            firstName: currentState.teacherAccount.firstName || fallbackFirstName,
            familyName: currentState.teacherAccount.familyName || fallbackFamilyName,
            fullName: currentState.teacherAccount.fullName || teacherDisplayName || fallbackFullName,
            email: buildUserEmail(
              currentState.teacherAccount.firstName || fallbackFirstName,
              currentState.teacherAccount.familyName || fallbackFamilyName,
            ) || user?.email || '',
            phoneNumber: user?.phone_number || user?.phone || '',
            address: user?.address || user?.adress || '',
            jobTitle: user?.job_title || user?.title || t('teacherSettings.defaultJobTitle'),
            password: currentState.teacherAccount.password || '',
            profilePhotoUrl: teacherPhotoUrl || user?.profile_picture || '',
          },
          absenceManagement: {
            ...createDefaultAbsenceManagementSettings(),
            ...(currentState.absenceManagement || {}),
          },
        }));
        setSavedAbsenceSettings((currentValue) => ({
          ...createDefaultAbsenceManagementSettings(),
          ...(currentValue || {}),
        }));
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, [setTeacherDisplayName, setTeacherPhotoUrl, t, teacherDisplayName, teacherPhotoUrl, user]);

  function updateSettings(updater) {
    setSettingsState((currentState) => {
      const nextState = updater(currentState);
      saveTeacherSettings(nextState);
      return nextState;
    });
  }

  function updateTeacherField(fieldName, nextValue) {
    if (fieldName === 'firstName' || fieldName === 'familyName') {
      const nextFirstName = fieldName === 'firstName'
        ? nextValue
        : settingsState.teacherAccount.firstName;
      const nextFamilyName = fieldName === 'familyName'
        ? nextValue
        : settingsState.teacherAccount.familyName;
      const nextFullName = composeFullName(nextFirstName, nextFamilyName);
      const nextEmail = buildUserEmail(nextFirstName, nextFamilyName)
        || buildInstitutionalEmailFromFullName(nextFullName);

      updateSettings((currentState) => ({
        ...currentState,
        teacherAccount: {
          ...currentState.teacherAccount,
          firstName: nextFirstName,
          familyName: nextFamilyName,
          fullName: nextFullName,
          email: nextEmail,
        },
      }));
      setTeacherDisplayName(nextFullName);
      return;
    }

    updateSettings((currentState) => ({
      ...currentState,
      teacherAccount: {
        ...currentState.teacherAccount,
        [fieldName]: nextValue,
      },
    }));
  }

  async function handlePhotoSelection(event) {
    const selectedFile = event.target.files?.[0] || null;

    if (!selectedFile || !String(selectedFile.type || '').startsWith('image/')) {
      event.target.value = '';
      return;
    }

    try {
      const formData = new FormData();
      formData.append('profile_picture', selectedFile);
      // Wait, api is not imported in this file yet! I need to import it.
      // But wait, the previous replace will fail if api is not defined.
      // I will do a separate tool call to import it if it's not imported.
      const { default: api } = await import('../api/axios.js');
      const response = await api.put('/accounts/me/picture/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const nextPhotoUrl = response.data.profile_picture;
      updateTeacherField('profilePhotoUrl', nextPhotoUrl);
      setTeacherPhotoUrl(nextPhotoUrl);
    } catch (error) {
      console.error('Failed to update profile picture', error);
      // Fallback to local data URL if backend fails
      const reader = new FileReader();
      reader.onload = () => {
        const nextPhotoUrl = typeof reader.result === 'string' ? reader.result : '';
        updateTeacherField('profilePhotoUrl', nextPhotoUrl);
        setTeacherPhotoUrl(nextPhotoUrl);
      };
      reader.readAsDataURL(selectedFile);
    }

    event.target.value = '';
  }

  async function handleRemovePhoto() {
    try {
      const { default: api } = await import('../api/axios.js');
      await api.put('/accounts/me/picture/', { profile_picture: '' });
    } catch (error) {
      console.error('Failed to remove profile picture', error);
    }
    updateTeacherField('profilePhotoUrl', '');
    setTeacherPhotoUrl('');
  }

  async function handlePasswordChange({ currentPassword, newPassword }) {
    await changeSystemSettingsPassword({
      currentPassword,
      newPassword,
    });
  }

  function updateAbsenceSetting(fieldName, nextValue) {
    setSettingsState((currentState) => ({
      ...currentState,
      absenceManagement: {
        ...currentState.absenceManagement,
        [fieldName]: nextValue,
      },
    }));
  }

  function handleSaveAbsenceSettings() {
    const snapshot = {
      ...settingsState.absenceManagement,
    };

    updateSettings((currentState) => ({
      ...currentState,
      absenceManagement: snapshot,
    }));
    setSavedAbsenceSettings(snapshot);
  }

  function handleCancelAbsenceChanges() {
    setSettingsState((currentState) => ({
      ...currentState,
      absenceManagement: {
        ...savedAbsenceSettings,
      },
    }));
  }

  const displayPhotoUrl = settingsState.teacherAccount.profilePhotoUrl || teacherPhotoUrl;
  const fallbackInitial = t('teacherSettings.teacherFallbackInitial');
  const sideItems = useMemo(
    () => SIDE_ITEMS.map((item) => ({ ...item, label: t(item.labelKey) })),
    [t],
  );
  const accountTitle = useMemo(() => {
    const fullName = settingsState.teacherAccount.fullName || t('teacherSettings.teacherFallbackName');
    return `${fullName} ${t('teacherSettings.accountSuffix')}`;
  }, [settingsState.teacherAccount.fullName, t]);
  const hasAbsencePendingChanges = useMemo(
    () => JSON.stringify(settingsState.absenceManagement) !== JSON.stringify(savedAbsenceSettings),
    [savedAbsenceSettings, settingsState.absenceManagement],
  );

  return (
    <section className={styles.page} aria-busy={isLoading}>
      <header className={styles.header}>
        <h1 className={styles.title}>{t('teacherSettings.pageTitle')}</h1>
      </header>

      <div className={styles.layout}>
        <aside className={styles.sideNav}>
          {sideItems.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${styles.sideNavItem} ${activeSectionId === item.id ? styles.sideNavItemActive : ''}`}
              disabled={item.disabled}
              onClick={() => {
                if (!item.disabled) {
                  setActiveSectionId(item.id);
                }
              }}
            >
              <span className={styles.sideNavIndicator} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          ))}
        </aside>

        <div className={styles.content}>
          {activeSectionId === 'general-account' ? (
            <>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>{t('teacherSettings.generalAccountTitle')}</h2>
                <p className={styles.sectionDescription}>
                  {t('teacherSettings.generalAccountDescription')}
                </p>
              </div>

              <article className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>{accountTitle}</h3>
                  <p className={styles.cardHint}>
                    {t('teacherSettings.profileHint')}
                  </p>
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.profileRow}>
                    <div className={styles.avatar} aria-hidden="true">
                      {displayPhotoUrl ? (
                        <img src={displayPhotoUrl} alt={settingsState.teacherAccount.fullName || t('teacherSettings.teacherFallbackName')} className={styles.avatarImage} />
                      ) : (
                        <span>{getInitialsFromName(settingsState.teacherAccount.fullName, fallbackInitial)}</span>
                      )}
                    </div>

                    <div className={styles.profileControls}>
                      <div className={styles.profileButtons}>
                        <button type="button" className={styles.secondaryButton} onClick={() => fileInputRef.current?.click()}>
                          {t('settings.changePhoto')}
                        </button>
                        <button type="button" className={styles.secondaryButton} onClick={handleRemovePhoto}>
                          {t('settings.removePhoto')}
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className={styles.hiddenInput}
                          onChange={handlePhotoSelection}
                        />
                      </div>
                      <p className={styles.profileText}>{t('teacherSettings.changesSavedImmediately')}</p>
                    </div>
                  </div>

                  <div className={styles.fieldGrid}>
                    <label className={styles.field}>
                      <span className={styles.label}>{t('teacherSettings.familyName')}</span>
                      <input
                        type="text"
                        className={styles.input}
                        value={settingsState.teacherAccount.familyName}
                        onChange={(event) => updateTeacherField('familyName', event.target.value)}
                      />
                    </label>

                    <label className={styles.field}>
                      <span className={styles.label}>{t('teacherSettings.firstName')}</span>
                      <input
                        type="text"
                        className={styles.input}
                        value={settingsState.teacherAccount.firstName}
                        onChange={(event) => updateTeacherField('firstName', event.target.value)}
                      />
                    </label>

                    <label className={styles.field}>
                      <span className={styles.label}>{t('settings.emailAddress')}</span>
                      <input
                        type="email"
                        className={styles.input}
                        value={settingsState.teacherAccount.email}
                        readOnly
                      />
                    </label>

                    <label className={styles.field}>
                      <span className={styles.label}>{t('settings.phoneNumber')}</span>
                      <input
                        type="text"
                        className={styles.input}
                        value={settingsState.teacherAccount.phoneNumber}
                        onChange={(event) => updateTeacherField('phoneNumber', event.target.value)}
                      />
                    </label>

                    <label className={styles.field}>
                      <span className={styles.label}>{t('teacherSettings.jobTitle')}</span>
                      <input
                        type="text"
                        className={styles.input}
                        value={settingsState.teacherAccount.jobTitle}
                        onChange={(event) => updateTeacherField('jobTitle', event.target.value)}
                      />
                    </label>

                    <label className={styles.field}>
                      <span className={styles.label}>{t('teacherSettings.address')}</span>
                      <input
                        type="text"
                        className={styles.input}
                        value={settingsState.teacherAccount.address}
                        onChange={(event) => updateTeacherField('address', event.target.value)}
                      />
                    </label>

                  </div>

                  <div className={styles.passwordActionRow}>
                    <button
                      type="button"
                      className={styles.inlineActionButton}
                      onClick={() => setShowPasswordDialog(true)}
                    >
                      {t('settings.changePassword')}
                    </button>
                  </div>
                </div>
              </article>
            </>
          ) : null}

          {activeSectionId === 'absence-management' ? (
            <>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>{t('teacherSettings.absenceTitle')}</h2>
                <p className={styles.sectionDescription}>
                  {t('teacherSettings.absenceDescription')}
                </p>
              </div>

              <article className={styles.absenceCard}>
                <section className={styles.absenceSection}>
                  <h3 className={styles.absenceSectionTitle}>
                    <span className={styles.sectionIcon} aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path d="M12 4.5a4.8 4.8 0 0 0-4.8 4.8v2.1c0 1-.34 1.98-.95 2.78L4.8 16h14.4l-1.45-1.82a4.4 4.4 0 0 1-.95-2.78V9.3A4.8 4.8 0 0 0 12 4.5Z" />
                        <path d="M9.9 18.2a2.1 2.1 0 0 0 4.2 0" />
                      </svg>
                    </span>
                    <span>{t('teacherSettings.notificationSettings')}</span>
                  </h3>

                  <div className={styles.settingLine}>
                    <div>
                      <h4>{t('teacherSettings.dailyAbsenceSummary')}</h4>
                      <p>{t('teacherSettings.dailyAbsenceSummaryDescription')}</p>
                    </div>
                  </div>

                  <div className={styles.settingLine}>
                    <div>
                      <h4>{t('teacherSettings.thresholdAlerts')}</h4>
                      <p>{t('teacherSettings.thresholdAlertsDescription')}</p>
                    </div>
                    <label className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={Boolean(settingsState.absenceManagement.thresholdAlerts)}
                        onChange={(event) => updateAbsenceSetting('thresholdAlerts', event.target.checked)}
                      />
                      <span className={styles.switchTrack} />
                    </label>
                  </div>
                </section>

                <section className={styles.absenceSection}>
                  <h3 className={styles.absenceSectionTitle}>
                    <span className={styles.sectionIcon} aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <rect x="4" y="11" width="3" height="7" />
                        <rect x="10" y="7" width="3" height="11" />
                        <rect x="16" y="4" width="3" height="14" />
                      </svg>
                    </span>
                    <span>{t('teacherSettings.absenceThresholds')}</span>
                  </h3>

                  <div className={styles.thresholdGrid}>
                    <label className={styles.field}>
                      <span className={styles.label}>{t('teacherSettings.warningLevelDays')}</span>
                      <input
                        type="number"
                        min="0"
                        className={styles.input}
                        value={settingsState.absenceManagement.warningLevelDays}
                        onChange={(event) => updateAbsenceSetting('warningLevelDays', Number(event.target.value || 0))}
                      />
                    </label>

                    <label className={styles.field}>
                      <span className={styles.label}>{t('teacherSettings.criticalLevelDays')}</span>
                      <input
                        type="number"
                        min="0"
                        className={styles.input}
                        value={settingsState.absenceManagement.criticalLevelDays}
                        onChange={(event) => updateAbsenceSetting('criticalLevelDays', Number(event.target.value || 0))}
                      />
                      <span className={styles.inlineHint}>{t('teacherSettings.criticalLevelHint')}</span>
                    </label>
                  </div>
                </section>

                <section className={styles.absenceSection}>
                  <h3 className={styles.absenceSectionTitle}>
                    <span className={styles.sectionIcon} aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path d="M5 12l4 4 10-10" />
                      </svg>
                    </span>
                    <span>{t('teacherSettings.attendanceDefaults')}</span>
                  </h3>

                  <div className={styles.settingLine}>
                    <div>
                      <h4>{t('teacherSettings.presentByDefault')}</h4>
                      <p>{t('teacherSettings.presentByDefaultDescription')}</p>
                    </div>
                    <label className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={Boolean(settingsState.absenceManagement.presentByDefault)}
                        onChange={(event) => updateAbsenceSetting('presentByDefault', event.target.checked)}
                      />
                      <span className={styles.switchTrack} />
                    </label>
                  </div>
                </section>

                <section className={styles.absenceSection}>
                  <h3 className={styles.absenceSectionTitle}>
                    <span className={styles.sectionIcon} aria-hidden="true">
                      <svg viewBox="0 0 24 24">
                        <path d="M4 12h10" />
                        <path d="M10 6l-6 6 6 6" />
                        <path d="M20 12H10" />
                        <path d="M14 18l6-6-6-6" />
                      </svg>
                    </span>
                    <span>{t('teacherSettings.integrationSettings')}</span>
                  </h3>

                  <div className={styles.integrationCard}>
                    <div className={styles.integrationIdentity}>
                      <span className={styles.integrationBadge}>G</span>
                      <div>
                        <h4>{t('teacherSettings.googleClassroom')}</h4>
                        <p>{t('teacherSettings.googleClassroomDescription')}</p>
                      </div>
                    </div>
                    <label className={styles.switch}>
                      <input
                        type="checkbox"
                        checked={Boolean(settingsState.absenceManagement.googleClassroomSync)}
                        onChange={(event) => updateAbsenceSetting('googleClassroomSync', event.target.checked)}
                      />
                      <span className={styles.switchTrack} />
                    </label>
                  </div>
                </section>
              </article>

              <div className={styles.footerActions}>
                <button
                  type="button"
                  className={styles.footerButtonSecondary}
                  disabled={!hasAbsencePendingChanges}
                  onClick={handleCancelAbsenceChanges}
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  className={styles.footerButtonPrimary}
                  disabled={!hasAbsencePendingChanges}
                  onClick={handleSaveAbsenceSettings}
                >
                  {t('common.saveChanges')}
                </button>
              </div>
            </>
          ) : null}

          {activeSectionId === 'privacy-security' ? (
            <>
              <div className={styles.sectionHeader}>
                <h2 className={styles.sectionTitle}>{t('teacherSettings.privacyTitle')}</h2>
                <p className={styles.sectionDescription}>{t('teacherSettings.privacyUnavailable')}</p>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {showPasswordDialog && (
        <UserPasswordPlaceholderDialog
          title={t('settings.changePassword')}
          currentPasswordLabel={t('settings.currentPassword')}
          newPasswordLabel={t('settings.newPassword')}
          onSubmit={handlePasswordChange}
          submitLabel={t('settings.changePassword')}
          closeLabel={t('settings.close')}
          closeAriaLabel={t('settings.changePassword')}
          onClose={() => setShowPasswordDialog(false)}
        />
      )}
    </section>
  );
}
