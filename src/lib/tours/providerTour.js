/**
 * Provider Panel guided tour.
 *
 * Single source of truth for both:
 *   1. The in-app driver.js walkthrough that auto-starts on first login.
 *   2. The narration script in docs/PROVIDER_PANEL_VIDEO_SCRIPT.md.
 *
 * Step IDs map 1:1 to data-tour="..." attributes scattered across the
 * provider page.jsx files. If you change a step ID here, grep for the
 * matching data-tour attribute and update it too — otherwise driver.js
 * will silently skip the step.
 *
 * Translation keys live under tour.provider.* in messages/{ar,en}.json.
 *
 * The tour is locale-aware (RTL handled by driver.js v1.4+) and provider-
 * type-aware (Doctor vs Clinic vs Hospital see slightly different routes).
 */

/**
 * Build the driver.js step list for the provider currently logged in.
 *
 * @param {(key: string) => string} t - next-intl translator scoped to "tour.provider"
 * @param {string} providerType - "Doctor" | "Clinic" | "Hospital"
 * @param {string} locale - "ar" | "en"
 * @returns {Array} driver.js step config
 */
export function getProviderTourSteps(t, providerType, locale) {
  const isRTL = locale === "ar";
  const isClinicOrHospital = providerType === "Clinic" || providerType === "Hospital";

  // Side preference flips for RTL so the popover sits on the inside of the
  // viewport rather than crammed against the sidebar.
  const sideStart = isRTL ? "left" : "right";
  const sideEnd = isRTL ? "right" : "left";

  const steps = [
    {
      element: '[data-tour="welcome"]',
      popover: {
        title: t("welcome.title"),
        description: t("welcome.description"),
      },
    },
    {
      element: '[data-tour="sidebar-dashboard"]',
      popover: {
        title: t("dashboardNav.title"),
        description: t("dashboardNav.description"),
        side: sideStart,
        align: "start",
      },
    },
    {
      element: '[data-tour="dashboard-stats"]',
      popover: {
        title: t("dashboardStats.title"),
        description: t("dashboardStats.description"),
      },
    },
    {
      element: '[data-tour="dashboard-recent-bookings"]',
      popover: {
        title: t("dashboardRecent.title"),
        description: t("dashboardRecent.description"),
      },
    },
    {
      element: '[data-tour="sidebar-bookings"]',
      popover: {
        title: t("bookingsNav.title"),
        description: t("bookingsNav.description"),
        side: sideStart,
        align: "start",
      },
    },
    {
      element: '[data-tour="bookings-tabs"]',
      popover: {
        title: t("bookingsTabs.title"),
        description: t("bookingsTabs.description"),
      },
    },
    {
      element: '[data-tour="bookings-search"]',
      popover: {
        title: t("bookingsSearch.title"),
        description: t("bookingsSearch.description"),
      },
    },
    {
      element: '[data-tour="bookings-table"]',
      popover: {
        title: t("bookingsTable.title"),
        description: t("bookingsTable.description"),
      },
    },
  ];

  // Doctors menu only exists for Clinic/Hospital — see Sidebar.jsx:204.
  if (isClinicOrHospital) {
    steps.push(
      {
        element: '[data-tour="sidebar-doctors"]',
        popover: {
          title: t("doctorsNav.title"),
          description: t("doctorsNav.description"),
          side: sideStart,
          align: "start",
        },
      },
      {
        element: '[data-tour="doctors-add"]',
        popover: {
          title: t("doctorsAdd.title"),
          description: t("doctorsAdd.description"),
          side: sideEnd,
        },
      },
      {
        element: '[data-tour="doctors-table"]',
        popover: {
          title: t("doctorsTable.title"),
          description: t("doctorsTable.description"),
        },
      },
    );
  }

  steps.push(
    {
      element: '[data-tour="sidebar-statistics"]',
      popover: {
        title: t("statisticsNav.title"),
        description: t("statisticsNav.description"),
        side: sideStart,
        align: "start",
      },
    },
    {
      element: '[data-tour="sidebar-profile"]',
      popover: {
        title: t("profileNav.title"),
        description: t("profileNav.description"),
        side: sideStart,
        align: "start",
      },
    },
    {
      element: '[data-tour="sidebar-team"]',
      popover: {
        title: t("teamNav.title"),
        description: t("teamNav.description"),
        side: sideStart,
        align: "start",
      },
    },
    {
      element: '[data-tour="sidebar-settings"]',
      popover: {
        title: t("settingsNav.title"),
        description: t("settingsNav.description"),
        side: sideStart,
        align: "start",
      },
    },
    {
      element: '[data-tour="header-notifications"]',
      popover: {
        title: t("notifications.title"),
        description: t("notifications.description"),
        side: "bottom",
        align: "end",
      },
    },
    {
      element: '[data-tour="tour-launcher"]',
      popover: {
        title: t("relaunch.title"),
        description: t("relaunch.description"),
        side: sideStart,
        align: "start",
      },
    },
    {
      // Final step has no element — driver.js renders a centered modal.
      popover: {
        title: t("done.title"),
        description: t("done.description"),
      },
    },
  );

  return steps;
}

export const PROVIDER_TOUR_STORAGE_KEY = "mawadk_provider_tour_v1";
