import { useState, useEffect, useCallback, useRef } from 'react';
import {
  UserDraftData,
  FullAssessment,
  ChatMessage,
  LocationData,
  Language,
} from '../types';
import {
  syncUserAuth,
  fetchUserDraft,
  saveUserDraft,
  clearUserDraft,
  fetchUserReports,
  fetchUserChatHistory,
  saveUserChatMessage,
} from './api';

export interface UserProfile {
  user_id: string;
  name: string;
  phone: string;
  village: string;
  district?: string;
  platform?: 'mobile';
}

export type DisplayMode = 'app';
export type PlatformMode = 'mobile';

export function useCrossPlatformSync(initialLanguage: Language = 'en') {
  // Current user state
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('grambiz_auth_user');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  // Dedicated Mobile App Mode
  const displayMode: DisplayMode = 'app';
  const platform = 'mobile';
  const setDisplayMode = useCallback((_mode?: any) => {}, []);
  const toggleDisplayMode = useCallback(() => {}, []);
  const setPlatform = useCallback((_p?: any) => {}, []);
  const togglePlatform = useCallback(() => {}, []);

  // Active Draft State
  const [activeDraft, setActiveDraft] = useState<UserDraftData | null>(null);
  const [hasRemoteDraft, setHasRemoteDraft] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'offline' | 'idle'>('idle');

  // Central Saved Reports
  const [savedReports, setSavedReports] = useState<FullAssessment[]>(() => {
    try {
      const savedUser = localStorage.getItem('grambiz_auth_user');
      const uid = savedUser ? (JSON.parse(savedUser).user_id || JSON.parse(savedUser).phone) : null;
      if (uid) {
        const local = localStorage.getItem(`grambiz_saved_reports_${uid}`);
        if (local) return JSON.parse(local);
      }
    } catch {}
    return [];
  });

  // Central Shared AI Chat History
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // Debounce ref for draft auto-saving
  const draftSaveTimeoutRef = useRef<any>(null);

  // Logout handler
  const logoutUser = useCallback(() => {
    setCurrentUser(null);
    setActiveDraft(null);
    setHasRemoteDraft(false);
    setSavedReports([]);
    setChatMessages([]);
    try {
      localStorage.removeItem('grambiz_auth_user');
    } catch {}
  }, []);

  // Refresh all user data from backend
  const refreshUserData = useCallback(async (userId?: string) => {
    const uid = userId || currentUser?.user_id;
    if (!uid) {
      setActiveDraft(null);
      setHasRemoteDraft(false);
      setSavedReports([]);
      setChatMessages([]);
      return;
    }

    setIsSyncing(true);
    setSyncStatus('syncing');

    try {
      // 1. Fetch Draft strictly matching this user ID
      const draftRes = await fetchUserDraft(uid);
      if (draftRes.has_draft && draftRes.draft && draftRes.draft.user_id === uid) {
        setActiveDraft(draftRes.draft);
        setHasRemoteDraft(true);
      } else {
        setActiveDraft(null);
        setHasRemoteDraft(false);
      }

      // 2. Fetch Reports strictly matching this user ID
      const reports = await fetchUserReports(uid);
      if (reports && reports.length > 0) {
        setSavedReports(reports);
        try {
          localStorage.setItem(`grambiz_saved_reports_${uid}`, JSON.stringify(reports));
        } catch {}
      } else {
        setSavedReports([]);
        try {
          localStorage.removeItem(`grambiz_saved_reports_${uid}`);
        } catch {}
      }

      // 3. Fetch Chat History
      const chatHistory = await fetchUserChatHistory(uid);
      if (Array.isArray(chatHistory) && chatHistory.length > 0) {
        setChatMessages(chatHistory.map((m: any) => ({
          role: m.role || 'user',
          content: m.content || '',
        })));
      } else {
        setChatMessages([]);
      }

      setLastSyncedAt(new Date());
      setSyncStatus('synced');
    } catch (e) {
      console.warn('refreshUserData sync error', e);
      setActiveDraft(null);
      setHasRemoteDraft(false);
      setSyncStatus('offline');
    } finally {
      setIsSyncing(false);
    }
  }, [currentUser?.user_id]);

  // Login handler
  const loginUser = useCallback(async (user: { name: string; phone: string; village: string; district?: string }) => {
    const profile: UserProfile = {
      user_id: user.phone,
      name: user.name,
      phone: user.phone,
      village: user.village,
      district: user.district || 'Kanchipuram',
      platform,
    };

    // Immediately purge memory state to avoid cross-account contamination
    setActiveDraft(null);
    setHasRemoteDraft(false);
    setSavedReports([]);
    setChatMessages([]);
    setCurrentUser(profile);

    try {
      localStorage.setItem('grambiz_auth_user', JSON.stringify(profile));
    } catch {}

    // Register with backend
    try {
      await syncUserAuth({
        user_id: profile.user_id,
        name: profile.name,
        phone: profile.phone,
        village: profile.village,
        district: profile.district,
        platform,
      });
    } catch (e) {
      console.warn('Backend syncUserAuth error', e);
    }

    // Immediately load remote draft and saved reports for this specific user
    await refreshUserData(profile.user_id);
  }, [platform, refreshUserData]);

  // Initial load or user switch
  useEffect(() => {
    setActiveDraft(null);
    setHasRemoteDraft(false);
    if (currentUser?.user_id) {
      refreshUserData(currentUser.user_id);
    } else {
      setSavedReports([]);
      setChatMessages([]);
    }
  }, [currentUser?.user_id, refreshUserData]);

  // Save draft to cloud with auto-debounce
  const updateDraft = useCallback((draftPartial: Partial<UserDraftData>) => {
    const uid = currentUser?.user_id;
    if (!uid) {
      console.warn('updateDraft skipped: user not authenticated');
      return;
    }

    // Only inherit base properties if activeDraft actually belongs to this user
    const baseDraft = (activeDraft && activeDraft.user_id === uid) ? activeDraft : null;

    const updatedDraft: UserDraftData = {
      user_id: uid,
      current_step: draftPartial.current_step ?? baseDraft?.current_step ?? 1,
      business_data: draftPartial.business_data ?? baseDraft?.business_data ?? {},
      location_data: draftPartial.location_data ?? baseDraft?.location_data ?? {},
      capital_data: draftPartial.capital_data ?? baseDraft?.capital_data ?? {},
      feasibility_data: draftPartial.feasibility_data ?? baseDraft?.feasibility_data ?? {},
      completed_steps: draftPartial.completed_steps ?? baseDraft?.completed_steps ?? [],
      last_platform: platform,
    };

    setActiveDraft(updatedDraft);
    setHasRemoteDraft(true);
    setSyncStatus('syncing');

    if (draftSaveTimeoutRef.current) {
      clearTimeout(draftSaveTimeoutRef.current);
    }

    draftSaveTimeoutRef.current = setTimeout(async () => {
      try {
        const ok = await saveUserDraft(updatedDraft);
        if (ok) {
          setLastSyncedAt(new Date());
          setSyncStatus('synced');
        } else {
          setSyncStatus('offline');
        }
      } catch (err) {
        console.warn('updateDraft error', err);
        setSyncStatus('offline');
      }
    }, 400); // 400ms debounce
  }, [currentUser?.user_id, activeDraft, platform]);

  // Clear draft
  const discardDraft = useCallback(async () => {
    const uid = currentUser?.user_id;
    if (!uid) return;
    setActiveDraft(null);
    setHasRemoteDraft(false);
    await clearUserDraft(uid);
    setSyncStatus('synced');
  }, [currentUser?.user_id]);

  // Save report to cloud & local
  const addReport = useCallback(async (report: FullAssessment) => {
    const uid = currentUser?.user_id;
    setSavedReports((prev) => {
      const filtered = prev.filter((r) => r.id !== report.id);
      const updated = [report, ...filtered];
      if (uid) {
        try {
          localStorage.setItem(`grambiz_saved_reports_${uid}`, JSON.stringify(updated));
        } catch {}
      }
      return updated;
    });

    if (!uid) return;

    // Also persist to backend if online
    try {
      await saveUserDraft({
        user_id: uid,
        current_step: 10,
        business_data: report.business,
        location_data: report.location,
        capital_data: report.capital,
        feasibility_data: report,
        completed_steps: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        last_platform: platform,
      });
    } catch {}
  }, [currentUser?.user_id, platform]);

  // Add chat message
  const addChatMessage = useCallback(async (content: string, role: 'user' | 'assistant' = 'user') => {
    const msg: ChatMessage = { role, content };
    setChatMessages((prev) => [...prev, msg]);

    const uid = currentUser?.user_id;
    if (uid) {
      try {
        await saveUserChatMessage(uid, role, content);
      } catch (e) {
        console.warn('addChatMessage sync error', e);
      }
    }
  }, [currentUser?.user_id]);

  return {
    currentUser,
    loginUser,
    logoutUser,
    displayMode,
    setDisplayMode,
    toggleDisplayMode,
    platform,
    setPlatform,
    togglePlatform,
    activeDraft,
    hasRemoteDraft,
    updateDraft,
    discardDraft,
    refreshUserData,
    savedReports,
    addReport,
    chatMessages,
    addChatMessage,
    isSyncing,
    lastSyncedAt,
    syncStatus,
  };
}
