import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import NotificationsService from "@/lib/services/notifications.service";

// ============================================================
// Sound Manager - Web Audio API notification chime
// ============================================================
class NotificationSoundManager {
  constructor() {
    this.audioContext = null;
    this.isInitialized = false;
  }

  initialize() {
    if (this.isInitialized) {
      // Already initialized - resume if suspended (works when called from user gesture)
      if (this.audioContext?.state === "suspended") {
        this.audioContext.resume();
      }
      return;
    }
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.isInitialized = true;
    } catch (e) {
      console.warn("[NotificationSound] Web Audio API not available:", e);
    }
  }

  play() {
    if (!this.audioContext) this.initialize();
    if (!this.audioContext) return;

    if (this.audioContext.state === "suspended") {
      this.audioContext.resume();
    }

    const now = this.audioContext.currentTime;

    // Tone 1 - A5
    const osc1 = this.audioContext.createOscillator();
    const gain1 = this.audioContext.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.3, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(this.audioContext.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    // Tone 2 - D6
    const osc2 = this.audioContext.createOscillator();
    const gain2 = this.audioContext.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1174.66, now + 0.15);
    gain2.gain.setValueAtTime(0, now + 0.15);
    gain2.gain.linearRampToValueAtTime(0.25, now + 0.17);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(this.audioContext.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.5);

    // Tone 3 - E6
    const osc3 = this.audioContext.createOscillator();
    const gain3 = this.audioContext.createGain();
    osc3.type = "sine";
    osc3.frequency.setValueAtTime(1318.51, now + 0.3);
    gain3.gain.setValueAtTime(0, now + 0.3);
    gain3.gain.linearRampToValueAtTime(0.2, now + 0.32);
    gain3.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
    osc3.connect(gain3);
    gain3.connect(this.audioContext.destination);
    osc3.start(now + 0.3);
    osc3.stop(now + 0.7);
  }
}

const soundManager = new NotificationSoundManager();

// ============================================================
// Notification Store
// ============================================================
const useNotificationStore = create(
  persist(
    (set, get) => ({
      // --- State ---
      newBookingsCount: 0,          // Total new bookings (all types)
      newDoctorCount: 0,            // New doctor bookings
      newClinicCount: 0,            // New clinic bookings
      newHospitalCount: 0,          // New hospital bookings
      todayBookings: 0,
      activeNow: 0,
      lastKnownBookingIds: null,    // Set of booking IDs from last poll (as array for storage)
      lastKnownTotalBookings: null, // Total bookings count from reports (for provider detection)
      providerLastPage: null,       // Last page number for provider API (to fetch newest bookings)
      lastPollTimestamp: null,
      isPolling: false,
      soundEnabled: true,
      pollIntervalId: null,
      hasNewNotification: false,
      latestBookings: [],           // Latest bookings for dropdown
      currentUserType: null,        // "admin" or "provider"/"doctor"/"hospital"

      // --- Actions ---

      initializeSound: () => {
        soundManager.initialize();
      },

      toggleSound: () => {
        set({ soundEnabled: !get().soundEnabled });
      },

      /**
       * Main polling function
       * Admin: Detects new bookings by comparing booking IDs (sortBy=latest ensures newest on page 1)
       * Provider: Detects new bookings by comparing reports.total_bookings count
       *   (provider API sorts by appointment date, so new bookings don't appear on page 1)
       */
      pollForNewBookings: async () => {
        const state = get();
        if (state.isPolling) return;

        set({ isPolling: true });

        try {
          const isProvider = state.currentUserType && state.currentUserType !== "admin";
          const result = isProvider
            ? await NotificationsService.getProviderBookingStats(state.providerLastPage)
            : await NotificationsService.getBookingStats();

          if (result.success) {
            const stats = result.stats;
            const latestBookings = result.latestBookings || [];

            const todayCount = stats?.today_bookings?.value || 0;
            const activeCount = stats?.today_bookings?.active_now || 0;
            const totalBookings = stats?.total_bookings || 0;

            let newDoctor = 0;
            let newClinic = 0;
            let newHospital = 0;
            let hasNew = false;
            let totalNewCount = 0;

            if (isProvider) {
              // ===== PROVIDER: Total count-based detection =====
              // Provider API sorts by appointment date (oldest first),
              // so new bookings don't appear on page 1. Instead, we
              // compare the total_bookings count from reports.
              if (state.lastKnownTotalBookings !== null && totalBookings > state.lastKnownTotalBookings) {
                totalNewCount = totalBookings - state.lastKnownTotalBookings;
                hasNew = true;

                console.log(
                  `[NotificationStore] Provider: ${totalNewCount} new booking(s) detected`,
                  { previous: state.lastKnownTotalBookings, current: totalBookings }
                );

                if (state.soundEnabled) {
                  soundManager.play();
                }
              }

              // Store lastPage for next poll + recalculate if total changed
              const newLastPage = result.lastPage || state.providerLastPage || 1;
              // If new bookings were added, the last page might have changed
              const recalcLastPage = hasNew ? Math.ceil(totalBookings / 10) : newLastPage;
              set({ providerLastPage: recalcLastPage });
            } else {
              // ===== ADMIN: ID-based detection =====
              // Admin API supports sortBy=latest, so newest bookings are on page 1.
              const sortedBookings = [...latestBookings].sort((a, b) => {
                const dateA = new Date(a.created_at || 0);
                const dateB = new Date(b.created_at || 0);
                return dateB - dateA;
              });

              const currentIds = new Set(sortedBookings.map((b) => b.id).filter(Boolean));
              const prevIds = state.lastKnownBookingIds
                ? new Set(state.lastKnownBookingIds)
                : null;

              if (prevIds !== null && currentIds.size > 0) {
                const newBookings = sortedBookings.filter(
                  (b) => b.id && !prevIds.has(b.id)
                );

                if (newBookings.length > 0) {
                  hasNew = true;

                  for (const booking of newBookings) {
                    const providerType = booking.provider?.type;
                    if (providerType === "Doctor") newDoctor++;
                    else if (providerType === "Clinic") newClinic++;
                    else if (providerType === "Hospital") newHospital++;
                  }

                  totalNewCount = newDoctor + newClinic + newHospital;
                  if (totalNewCount === 0) totalNewCount = newBookings.length;

                  console.log(
                    `[NotificationStore] Admin: ${newBookings.length} new booking(s) detected:`,
                    {
                      doctor: newDoctor,
                      clinic: newClinic,
                      hospital: newHospital,
                      newIds: newBookings.map((b) => b.id),
                    }
                  );

                  if (state.soundEnabled) {
                    soundManager.play();
                  }
                }
              }

              // Update admin ID tracking
              set({ lastKnownBookingIds: [...currentIds] });
            }

            set({
              todayBookings: todayCount,
              activeNow: activeCount,
              latestBookings: latestBookings.slice(0, 5),
              lastKnownTotalBookings: totalBookings,
              lastPollTimestamp: Date.now(),
              isPolling: false,
              ...(hasNew
                ? {
                    newBookingsCount: state.newBookingsCount + totalNewCount,
                    newDoctorCount: state.newDoctorCount + newDoctor,
                    newClinicCount: state.newClinicCount + newClinic,
                    newHospitalCount: state.newHospitalCount + newHospital,
                    hasNewNotification: true,
                  }
                : {}),
            });

            // Auto-clear bounce animation
            if (hasNew) {
              setTimeout(() => {
                set({ hasNewNotification: false });
              }, 3000);
            }
          } else {
            set({ isPolling: false });
          }
        } catch (error) {
          console.error("[NotificationStore] Polling error:", error);
          set({ isPolling: false });
        }
      },

      /**
       * Start polling (every 10 seconds)
       * @param {string} userType - "admin" | "provider" | "doctor" | "hospital"
       */
      startPolling: (userType) => {
        const state = get();

        // If already polling with the SAME user type, skip
        if (state.pollIntervalId && state.currentUserType === userType) return;

        // If polling with a DIFFERENT user type, stop and restart
        if (state.pollIntervalId) {
          clearInterval(state.pollIntervalId);
          console.log(`[NotificationStore] Restarting polling: ${state.currentUserType} → ${userType}`);
        }

        soundManager.initialize();

        // Reset baseline on fresh session
        set({
          lastKnownBookingIds: null,
          lastKnownTotalBookings: null,
          providerLastPage: null,
          newBookingsCount: 0,
          newDoctorCount: 0,
          newClinicCount: 0,
          newHospitalCount: 0,
          currentUserType: userType || null,
          pollIntervalId: null,
        });

        // Initial poll (establishes baseline IDs - no notification on first poll)
        get().pollForNewBookings();

        const intervalId = setInterval(() => {
          get().pollForNewBookings();
        }, 10000);

        set({ pollIntervalId: intervalId });
        console.log(`[NotificationStore] Polling started (every 10s) for ${userType || "unknown"}`);
      },

      stopPolling: () => {
        const state = get();
        if (state.pollIntervalId) {
          clearInterval(state.pollIntervalId);
          set({ pollIntervalId: null });
        }
      },

      /**
       * Mark all as seen
       */
      markAsSeen: () => {
        set({
          newBookingsCount: 0,
          newDoctorCount: 0,
          newClinicCount: 0,
          newHospitalCount: 0,
          hasNewNotification: false,
        });
      },

      /**
       * Reset store (on logout)
       */
      reset: () => {
        const state = get();
        if (state.pollIntervalId) {
          clearInterval(state.pollIntervalId);
        }
        set({
          newBookingsCount: 0,
          newDoctorCount: 0,
          newClinicCount: 0,
          newHospitalCount: 0,
          todayBookings: 0,
          activeNow: 0,
          lastKnownBookingIds: null,
          lastKnownTotalBookings: null,
          providerLastPage: null,
          lastPollTimestamp: null,
          isPolling: false,
          pollIntervalId: null,
          hasNewNotification: false,
          latestBookings: [],
          currentUserType: null,
        });
      },
    }),
    {
      name: "notification-storage",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : undefined
      ),
      partialize: (state) => ({
        soundEnabled: state.soundEnabled,
      }),
    }
  )
);

export { useNotificationStore };
export default useNotificationStore;
