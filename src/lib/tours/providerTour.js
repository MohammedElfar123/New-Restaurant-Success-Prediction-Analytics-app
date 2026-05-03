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

  // `route` is the page each step lives on. The tour navigates between
  // pages automatically (see TourProvider.jsx) when consecutive steps
  // sit on different routes. Sidebar items live on every page, so we
  // anchor them to whichever page they naturally lead to next, keeping
  // the navigation flow forwards (Dashboard → Bookings → Doctors → ...).
  const DASH = "/provider/dashboard";
  const BOOK = "/provider/bookings";
  const DOCS = "/provider/doctors";

  const steps = [
    {
      element: '[data-tour="welcome"]',
      route: DASH,
      popover: {
        title: t("welcome.title"),
        description: t("welcome.description"),
      },
    },
    {
      element: '[data-tour="sidebar-dashboard"]',
      route: DASH,
      popover: {
        title: t("dashboardNav.title"),
        description: t("dashboardNav.description"),
        side: sideStart,
        align: "start",
      },
    },
    {
      element: '[data-tour="dashboard-stats"]',
      route: DASH,
      popover: {
        title: t("dashboardStats.title"),
        description: t("dashboardStats.description"),
      },
    },
    {
      element: '[data-tour="dashboard-recent-bookings"]',
      route: DASH,
      popover: {
        title: t("dashboardRecent.title"),
        description: t("dashboardRecent.description"),
      },
    },
    {
      element: '[data-tour="sidebar-bookings"]',
      route: DASH, // still on dashboard while pointing at the sidebar item
      popover: {
        title: t("bookingsNav.title"),
        description: t("bookingsNav.description"),
        side: sideStart,
        align: "start",
      },
    },
    {
      element: '[data-tour="bookings-tabs"]',
      route: BOOK, // tour navigates to /provider/bookings before this step
      popover: {
        title: t("bookingsTabs.title"),
        description: t("bookingsTabs.description"),
      },
    },
    {
      element: '[data-tour="bookings-search"]',
      route: BOOK,
      popover: {
        title: t("bookingsSearch.title"),
        description: t("bookingsSearch.description"),
      },
    },
    {
      element: '[data-tour="bookings-table"]',
      route: BOOK,
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
        route: BOOK, // pointing at sidebar from /provider/bookings
        popover: {
          title: t("doctorsNav.title"),
          description: t("doctorsNav.description"),
          side: sideStart,
          align: "start",
        },
      },
      {
        element: '[data-tour="doctors-add"]',
        route: DOCS, // tour navigates to /provider/doctors here
        popover: {
          title: t("doctorsAdd.title"),
          description: t("doctorsAdd.description"),
          side: sideEnd,
        },
      },
      {
        element: '[data-tour="doctors-table"]',
        route: DOCS,
        popover: {
          title: t("doctorsTable.title"),
          description: t("doctorsTable.description"),
        },
      },
    );
  }

  // Sidebar tour items from here on — they exist on every page, so we
  // do not need a route navigation. The tour stays where it landed
  // (either /provider/bookings for Doctor providers, or /provider/doctors
  // for Clinic/Hospital).
  const lastRoute = isClinicOrHospital ? DOCS : BOOK;

  steps.push(
    {
      element: '[data-tour="sidebar-statistics"]',
      route: lastRoute,
      popover: {
        title: t("statisticsNav.title"),
        description: t("statisticsNav.description"),
        side: sideStart,
        align: "start",
      },
    },
    {
      element: '[data-tour="sidebar-profile"]',
      route: lastRoute,
      popover: {
        title: t("profileNav.title"),
        description: t("profileNav.description"),
        side: sideStart,
        align: "start",
      },
    },
    {
      element: '[data-tour="sidebar-team"]',
      route: lastRoute,
      popover: {
        title: t("teamNav.title"),
        description: t("teamNav.description"),
        side: sideStart,
        align: "start",
      },
    },
    {
      element: '[data-tour="sidebar-settings"]',
      route: lastRoute,
      popover: {
        title: t("settingsNav.title"),
        description: t("settingsNav.description"),
        side: sideStart,
        align: "start",
      },
    },
    {
      element: '[data-tour="header-notifications"]',
      route: lastRoute,
      popover: {
        title: t("notifications.title"),
        description: t("notifications.description"),
        side: "bottom",
        align: "end",
      },
    },
    {
      element: '[data-tour="tour-launcher"]',
      route: lastRoute,
      popover: {
        title: t("relaunch.title"),
        description: t("relaunch.description"),
        side: sideStart,
        align: "start",
      },
    },
    {
      // Final step has no element — driver.js renders a centered modal.
      route: lastRoute,
      popover: {
        title: t("done.title"),
        description: t("done.description"),
      },
    },
  );

  return steps;
}

/**
 * Session storage key used to resume the tour after a page navigation.
 * Stores { stepIndex, scope } so TourProvider can pick up where the
 * user left off when the new route mounts.
 */
export const TOUR_RESUME_KEY = "mawadk_tour_resume";

export const PROVIDER_TOUR_STORAGE_KEY = "mawadk_provider_tour_v1";
