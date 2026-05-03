/**
 * Super Admin Panel guided tour.
 *
 * Single source of truth for both:
 *   1. The in-app driver.js walkthrough that auto-starts on first login.
 *   2. The narration script in docs/ADMIN_PANEL_VIDEO_SCRIPT.md.
 *
 * Step IDs map 1:1 to data-tour="..." attributes scattered across the
 * admin page.jsx files plus the adminNavigation array in Sidebar.jsx.
 *
 * Translation keys live under tour.admin.* in messages/{ar,en}.json.
 */

/**
 * Build the driver.js step list for the admin currently logged in.
 *
 * @param {(key: string) => string} t - next-intl translator scoped to "tour.admin"
 * @param {string} locale - "ar" | "en"
 * @returns {Array} driver.js step config
 */
export function getAdminTourSteps(t, locale) {
  const isRTL = locale === "ar";
  const sideStart = isRTL ? "left" : "right";

  return [
    {
      element: '[data-tour="admin-welcome"]',
      popover: {
        title: t("welcome.title"),
        description: t("welcome.description"),
      },
    },
    {
      element: '[data-tour="admin-sidebar-users"]',
      popover: {
        title: t("usersNav.title"),
        description: t("usersNav.description"),
        side: sideStart,
        align: "start",
      },
    },
    {
      element: '[data-tour="admin-sidebar-providers"]',
      popover: {
        title: t("providersNav.title"),
        description: t("providersNav.description"),
        side: sideStart,
        align: "start",
      },
    },
    {
      element: '[data-tour="admin-sidebar-bookings-doctors"]',
      popover: {
        title: t("bookingsNav.title"),
        description: t("bookingsNav.description"),
        side: sideStart,
        align: "start",
      },
    },
    {
      element: '[data-tour="admin-sidebar-sliders"]',
      popover: {
        title: t("slidersNav.title"),
        description: t("slidersNav.description"),
        side: sideStart,
        align: "start",
      },
    },
    {
      element: '[data-tour="admin-sidebar-notifications"]',
      popover: {
        title: t("notificationsNav.title"),
        description: t("notificationsNav.description"),
        side: sideStart,
        align: "start",
      },
    },
    {
      element: '[data-tour="admin-sidebar-statistics"]',
      popover: {
        title: t("statisticsNav.title"),
        description: t("statisticsNav.description"),
        side: sideStart,
        align: "start",
      },
    },
    {
      element: '[data-tour="admin-sidebar-admins"]',
      popover: {
        title: t("adminsNav.title"),
        description: t("adminsNav.description"),
        side: sideStart,
        align: "start",
      },
    },
    {
      element: '[data-tour="admin-settings-section"]',
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
        title: t("headerNotifications.title"),
        description: t("headerNotifications.description"),
        side: "bottom",
        align: "end",
      },
    },
    {
      popover: {
        title: t("done.title"),
        description: t("done.description"),
      },
    },
  ];
}

export const ADMIN_TOUR_STORAGE_KEY = "mawadk_admin_tour_v1";
