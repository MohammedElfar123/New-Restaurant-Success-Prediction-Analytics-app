import apiClient from "../api/client";

/**
 * Bookings Service - Manages appointment bookings
 * Handles listing, viewing details, and updating booking status
 */
const BookingsService = {
  /**
   * Booking Statuses (lowercase as returned from API)
   */
  STATUSES: {
    PENDING: "pending",
    CONFIRMED: "confirmed",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
    EXPIRED: "expired",
    NO_SHOW: "no_show",
    PROVIDER_NO_SHOW: "provider_no_show",
  },

  /**
   * Payment Methods
   */
  PAYMENT_METHODS: {
    CASH: "cash",
    CARD: "card",
    ONLINE: "online",
  },

  /**
   * Status transitions - which statuses can transition to which
   */
  STATUS_TRANSITIONS: {
    pending: ["confirmed", "cancelled", "no_show", "provider_no_show"],
    confirmed: ["completed", "cancelled", "no_show", "provider_no_show"],
    completed: [], // Final state
    cancelled: [], // Final state
    expired: [], // Final state (system-only)
    no_show: [], // Final state
    provider_no_show: [], // Final state
  },

  /**
   * List Bookings with filtering and pagination
   * GET /bookings
   */
  getBookings: async (params = {}) => {
    try {
      const response = await apiClient.get("/bookings", { params });

      if (response.data?.status === "success") {
        const data = response.data.data;

        // Handle different response structures
        const items = Array.isArray(data) ? data : (data?.items || data?.data || []);

        // Extract meta from data.meta (API structure) or fallback to direct properties
        const apiMeta = data?.meta || {};
        const meta = {
          current_page: apiMeta.current_page || data?.current_page || params.page || 1,
          last_page: apiMeta.last_page || data?.last_page || Math.ceil((apiMeta.total || data?.total || items.length) / (params.per_page || 10)),
          total: apiMeta.total || data?.total || data?.count || items.length,
          per_page: apiMeta.per_page || data?.per_page || params.per_page || 10,
        };

        // Extract reports/stats if available
        const reports = data?.reports || null;

        return {
          success: true,
          data: items,
          meta,
          stats: reports,
          message: response.data.message,
        };
      }

      return {
        success: false,
        data: [],
        meta: { current_page: 1, last_page: 1, total: 0, per_page: 10 },
        stats: null,
        message: response.data?.message || "Failed to fetch bookings",
      };
    } catch (error) {
      console.error("[BookingsService] Get bookings error:", error);
      return {
        success: false,
        data: [],
        meta: { current_page: 1, last_page: 1, total: 0, per_page: 10 },
        stats: null,
        message: error.response?.data?.message || "Error fetching bookings",
      };
    }
  },

  /**
   * Get Booking Details with Timeline
   * GET /bookings/{id}
   */
  getBookingById: async (id) => {
    try {
      const response = await apiClient.get(`/bookings/${id}`);

      if (response.data?.status === "success") {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message,
        };
      }

      return {
        success: false,
        data: null,
        message: response.data?.message || "Failed to fetch booking details",
      };
    } catch (error) {
      console.error("[BookingsService] Get booking by ID error:", error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || "Error fetching booking details",
      };
    }
  },

  /**
   * Update Booking Status
   * GET /bookings/update-status/{id}?status=confirmed
   */
  updateBookingStatus: async (id, status, cancellation_reason_id = null) => {
    try {
      const params = { status };

      if (status === "cancelled" && cancellation_reason_id) {
        params.reason_cancellation_id = cancellation_reason_id;
      }

      const response = await apiClient.get(`/bookings/update-status/${id}`, { params });

      if (response.data?.status === "success") {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message || "Booking status updated successfully",
        };
      }

      return {
        success: false,
        data: null,
        message: response.data?.message || "Failed to update booking status",
      };
    } catch (error) {
      console.error("[BookingsService] Update booking status error:", error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || "Error updating booking status",
      };
    }
  },

  /**
   * Get Cancellation Reasons
   */
  getCancellationReasons: async () => {
    try {
      const response = await apiClient.get("/drop-down-list/cancellation-reasons");

      if (response.data?.status === "success") {
        return {
          success: true,
          data: response.data.data || [],
          message: response.data.message,
        };
      }

      return {
        success: true,
        data: [],
        message: "No cancellation reasons available",
      };
    } catch (error) {
      console.error("[BookingsService] Get cancellation reasons error:", error);
      return {
        success: true,
        data: [],
        message: "Error fetching cancellation reasons",
      };
    }
  },

  /**
   * Capitalize first letter of status
   */
  capitalizeStatus: (status) => {
    if (!status) return "-";
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  },

  /**
   * Get status badge color (handles lowercase status from API)
   */
  getStatusBadgeColor: (status) => {
    const normalizedStatus = status?.toLowerCase();
    const colors = {
      pending: "bg-amber-50 text-amber-700 border-amber-200",
      confirmed: "bg-blue-50 text-blue-700 border-blue-200",
      approved: "bg-blue-50 text-blue-700 border-blue-200",
      checkedin: "bg-indigo-50 text-indigo-700 border-indigo-200",
      inprogress: "bg-purple-50 text-purple-700 border-purple-200",
      completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
      cancelled: "bg-rose-50 text-rose-700 border-rose-200",
      expired: "bg-zinc-100 text-zinc-700 border-zinc-300",
      no_show: "bg-orange-100 text-orange-800 border-orange-300",
      noshow: "bg-orange-100 text-orange-800 border-orange-300",
      provider_no_show: "bg-rose-100 text-rose-900 border-rose-400",
      rescheduled: "bg-orange-50 text-orange-700 border-orange-200",
    };
    return colors[normalizedStatus] || "bg-slate-50 text-slate-700 border-slate-200";
  },

  /**
   * Get payment method badge color
   */
  getPaymentMethodBadgeColor: (method) => {
    const normalizedMethod = method?.toLowerCase();
    const colors = {
      cash: "bg-emerald-50 text-emerald-700 border-emerald-200",
      card: "bg-blue-50 text-blue-700 border-blue-200",
      online: "bg-purple-50 text-purple-700 border-purple-200",
      pending: "bg-amber-50 text-amber-700 border-amber-200",
    };
    return colors[normalizedMethod] || "bg-slate-50 text-slate-700 border-slate-200";
  },

  /**
   * Get allowed transitions for a status
   */
  getAllowedTransitions: (currentStatus) => {
    const normalizedStatus = currentStatus?.toLowerCase();
    return BookingsService.STATUS_TRANSITIONS[normalizedStatus] || [];
  },

  /**
   * Format date for display
   */
  formatDate: (date, locale = "en") => {
    if (!date) return "-";
    try {
      const options = { year: "numeric", month: "short", day: "numeric" };
      return new Date(date).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", options);
    } catch {
      return date;
    }
  },

  /**
   * Format time for display (handles various formats)
   * @param {string} time - Time string
   * @param {string} dateTime - Optional datetime string to extract time from
   */
  formatTime: (time, dateTime = null) => {
    // If time is empty or is a placeholder "12:00 AM", try to extract from dateTime
    if (!time || time === "12:00 AM" || time === "00:00") {
      if (dateTime) {
        try {
          const date = new Date(dateTime);
          if (!isNaN(date.getTime())) {
            const hours = date.getHours();
            const minutes = date.getMinutes();
            // Only use extracted time if it's not midnight (likely a date-only field)
            if (hours !== 0 || minutes !== 0) {
              const ampm = hours >= 12 ? "PM" : "AM";
              const hour12 = hours % 12 || 12;
              return `${hour12}:${minutes.toString().padStart(2, "0")} ${ampm}`;
            }
          }
        } catch {
          // Fall through to return time or dash
        }
      }
      if (!time) return "-";
    }

    // If already in AM/PM format, return as is
    if (time.includes("AM") || time.includes("PM")) {
      return time;
    }
    // Convert 24h to 12h format
    try {
      const [hours, minutes] = time.split(":");
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? "PM" : "AM";
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    } catch {
      return time;
    }
  },

  /**
   * Format currency
   */
  formatCurrency: (amount, currency = "QAR") => {
    if (amount === null || amount === undefined || amount === "") return "-";
    const num = parseFloat(amount);
    if (isNaN(num)) return "-";
    return `${currency} ${num.toLocaleString()}`;
  },

  /**
   * Get relative time (e.g., "3 minutes ago" / "منذ 3 دقائق")
   * @param {string} dateString - Date string (created_at)
   * @param {string} locale - "en" or "ar"
   */
  getRelativeTime: (dateString, locale = "en") => {
    if (!dateString) return "-";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "-";

      const now = new Date();
      const diffMs = now - date;
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);
      const diffWeeks = Math.floor(diffDays / 7);
      const diffMonths = Math.floor(diffDays / 30);

      const isArabic = locale === "ar";

      // Just now (less than 1 minute)
      if (diffMins < 1) {
        return isArabic ? "الآن" : "Just now";
      }

      // Minutes
      if (diffMins < 60) {
        if (isArabic) {
          if (diffMins === 1) return "منذ دقيقة";
          if (diffMins === 2) return "منذ دقيقتين";
          if (diffMins >= 3 && diffMins <= 10) return `منذ ${diffMins} دقائق`;
          return `منذ ${diffMins} دقيقة`;
        }
        return diffMins === 1 ? "1 minute ago" : `${diffMins} minutes ago`;
      }

      // Hours
      if (diffHours < 24) {
        if (isArabic) {
          if (diffHours === 1) return "منذ ساعة";
          if (diffHours === 2) return "منذ ساعتين";
          if (diffHours >= 3 && diffHours <= 10) return `منذ ${diffHours} ساعات`;
          return `منذ ${diffHours} ساعة`;
        }
        return diffHours === 1 ? "1 hour ago" : `${diffHours} hours ago`;
      }

      // Days
      if (diffDays < 7) {
        if (isArabic) {
          if (diffDays === 1) return "منذ يوم";
          if (diffDays === 2) return "منذ يومين";
          if (diffDays >= 3 && diffDays <= 10) return `منذ ${diffDays} أيام`;
          return `منذ ${diffDays} يوم`;
        }
        return diffDays === 1 ? "1 day ago" : `${diffDays} days ago`;
      }

      // Weeks
      if (diffWeeks < 4) {
        if (isArabic) {
          if (diffWeeks === 1) return "منذ أسبوع";
          if (diffWeeks === 2) return "منذ أسبوعين";
          return `منذ ${diffWeeks} أسابيع`;
        }
        return diffWeeks === 1 ? "1 week ago" : `${diffWeeks} weeks ago`;
      }

      // Months
      if (diffMonths < 12) {
        if (isArabic) {
          if (diffMonths === 1) return "منذ شهر";
          if (diffMonths === 2) return "منذ شهرين";
          if (diffMonths >= 3 && diffMonths <= 10) return `منذ ${diffMonths} أشهر`;
          return `منذ ${diffMonths} شهر`;
        }
        return diffMonths === 1 ? "1 month ago" : `${diffMonths} months ago`;
      }

      // More than a year - show the date
      return BookingsService.formatDate(dateString, locale);
    } catch {
      return "-";
    }
  },
};

export default BookingsService;
