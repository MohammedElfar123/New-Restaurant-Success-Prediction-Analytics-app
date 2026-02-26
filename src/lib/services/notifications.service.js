import apiClient from "../api/client";

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
