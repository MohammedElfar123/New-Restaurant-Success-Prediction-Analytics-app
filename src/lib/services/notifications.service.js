import apiClient from "../api/client";
import providerClient from "../api/providerClient";

/**
 * Notifications Service - Handles all notification-related API calls
 * Used for real-time booking notifications via polling
 */
const NotificationsService = {
  /**
   * Get Notifications List (Dashboard)
   * GET /notifications
   * @param {Object} params - { page, per_page, search }
   * @returns {Promise} - { success, data, meta, message }
   */
  getNotifications: async (params = {}) => {
    try {
      const response = await apiClient.get("/notifications", { params });

      if (response.data?.status === "success") {
        const data = response.data.data;
        const items = Array.isArray(data) ? data : (data?.items || data?.data || []);

        const apiMeta = data?.meta || {};
        const meta = {
          current_page: apiMeta.current_page || data?.current_page || params.page || 1,
          last_page: apiMeta.last_page || data?.last_page || 1,
          total: apiMeta.total || data?.total || items.length,
          per_page: apiMeta.per_page || data?.per_page || params.per_page || 10,
        };

        return {
          success: true,
          data: items,
          meta,
          message: response.data.message,
        };
      }

      return {
        success: false,
        data: [],
        meta: { current_page: 1, last_page: 1, total: 0, per_page: 10 },
        message: response.data?.message || "Failed to fetch notifications",
      };
    } catch (error) {
      console.error("[NotificationsService] Get notifications error:", error);
      return {
        success: false,
        data: [],
        meta: { current_page: 1, last_page: 1, total: 0, per_page: 10 },
        message: error.response?.data?.message || "Error fetching notifications",
      };
    }
  },

  /**
   * Get Bookings with Reports (for polling new bookings)
   * GET /bookings - returns latest bookings + reports.today_bookings
   * The store compares booking IDs between polls to detect new ones
   * and checks provider.type for per-type categorization.
   * @returns {Promise} - { success, stats, latestBookings, message }
   */
  getBookingStats: async () => {
    try {
      // Fetch latest 10 bookings sorted newest first (backend supports sortBy=latest)
      const response = await apiClient.get("/bookings", {
        params: { per_page: 10, page: 1, sortBy: "latest" },
        _silent: true, // Suppress toast errors for polling requests
      });

      if (response.data?.status === "success") {
        const data = response.data.data;
        const items = Array.isArray(data) ? data : (data?.items || data?.data || []);
        const reports = data?.reports || null;

        console.log("[NotificationsService] Poll data:", {
          itemsCount: items.length,
          bookingIds: items.map((b) => b.id),
          todayBookings: reports?.today_bookings?.value,
        });

        return {
          success: true,
          stats: reports,
          latestBookings: items,
          message: response.data.message,
        };
      }

      return {
        success: false,
        stats: null,
        latestBookings: [],
        message: response.data?.message || "Failed to fetch booking stats",
      };
    } catch (error) {
      console.error("[NotificationsService] Get booking stats error:", error);
      return {
        success: false,
        stats: null,
        latestBookings: [],
        message: error.response?.data?.message || "Error fetching booking stats",
      };
    }
  },

  /**
   * Get Provider Bookings with Reports (for polling new bookings in provider panel)
   * GET /bookings via providerClient
   *
   * IMPORTANT: The backend returns different `reports` data per page:
   *   - Page 1: reports.total_bookings = correct count, today_bookings = correct
   *   - Other pages: reports.total_bookings = 0, today_bookings = 0
   * So we ALWAYS fetch page 1 for stats, and optionally fetch the last page
   * for display bookings (provider API sorts by appointment date ascending).
   *
   * @param {number|null} lastPage - Last page number from previous poll (null = first poll)
   * @returns {Promise} - { success, stats, latestBookings, lastPage, message }
   */
  getProviderBookingStats: async (lastPage = null) => {
    try {
      // Always fetch page 1 for accurate stats (reports data is only correct on page 1)
      const statsRequest = providerClient.get("/bookings", {
        params: { per_page: 10, page: 1 },
        _silent: true,
      });

      // If we know the last page and it's > 1, also fetch it for newest bookings
      const displayRequest = lastPage && lastPage > 1
        ? providerClient.get("/bookings", {
            params: { per_page: 10, page: lastPage },
            _silent: true,
          })
        : null;

      const [statsResponse, displayResponse] = await Promise.all([
        statsRequest,
        displayRequest || Promise.resolve(null),
      ]);

      if (statsResponse.data?.status === "success") {
        const statsData = statsResponse.data.data;
        const reports = statsData?.reports || null;
        const statsMeta = statsData?.meta || {};

        // Combine bookings from page 1 + last page, deduplicate by ID
        // This gives us the broadest set to find the most recently created bookings
        const page1Items = statsData?.items || [];
        const lastPageItems = displayResponse?.data?.status === "success"
          ? (displayResponse.data.data?.items || [])
          : [];

        const seenIds = new Set();
        const allItems = [];
        for (const item of [...page1Items, ...lastPageItems]) {
          if (item.id && !seenIds.has(item.id)) {
            seenIds.add(item.id);
            allItems.push(item);
          }
        }

        // Sort by ID descending (highest ID = most recently created)
        const displayItems = allItems.sort((a, b) => (b.id || 0) - (a.id || 0));

        console.log("[NotificationsService] Provider poll data:", {
          statsPage: 1,
          displayPage: lastPage || 1,
          lastPage: statsMeta.last_page,
          displayItemsCount: displayItems.length,
          totalBookings: reports?.total_bookings,
          todayBookings: reports?.today_bookings?.value,
        });

        return {
          success: true,
          stats: reports,
          latestBookings: displayItems,
          lastPage: statsMeta.last_page || 1,
          message: statsResponse.data.message,
        };
      }

      return {
        success: false,
        stats: null,
        latestBookings: [],
        lastPage: null,
        message: statsResponse.data?.message || "Failed to fetch provider booking stats",
      };
    } catch (error) {
      console.error("[NotificationsService] Get provider booking stats error:", error);
      return {
        success: false,
        stats: null,
        latestBookings: [],
        lastPage: null,
        message: error.response?.data?.message || "Error fetching provider booking stats",
      };
    }
  },

  /**
   * Store a new notification
   * POST /notifications
   * @param {Object} data - FormData with notification details
   * @returns {Promise}
   */
  storeNotification: async (data) => {
    try {
      const formData = new FormData();
      if (data.en_title) formData.append("en[title]", data.en_title);
      if (data.ar_title) formData.append("ar[title]", data.ar_title);
      if (data.en_body) formData.append("en[body]", data.en_body);
      if (data.ar_body) formData.append("ar[body]", data.ar_body);
      if (data.image) formData.append("image", data.image);
      if (data.for_all) formData.append("for_all", data.for_all);
      if (data.user_ids && Array.isArray(data.user_ids)) {
        data.user_ids.forEach((id) => formData.append("user_id[]", id));
      }

      const response = await apiClient.post("/notifications", formData);

      if (response.data?.status === "success") {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message,
        };
      }

      return {
        success: false,
        message: response.data?.message || "Failed to send notification",
      };
    } catch (error) {
      console.error("[NotificationsService] Store notification error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Error sending notification",
      };
    }
  },

  /**
   * Get users list for notification targeting
   * GET /notifications/users
   * @param {string} search - Search query
   * @returns {Promise}
   */
  getUsersForNotify: async (search = "") => {
    try {
      const params = {};
      if (search) params.search = search;

      const response = await apiClient.get("/notifications/users", { params });

      if (response.data?.status === "success") {
        return {
          success: true,
          data: response.data.data || [],
          message: response.data.message,
        };
      }

      return {
        success: false,
        data: [],
        message: response.data?.message || "Failed to fetch users",
      };
    } catch (error) {
      console.error("[NotificationsService] Get users for notify error:", error);
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || "Error fetching users",
      };
    }
  },
};

export default NotificationsService;
