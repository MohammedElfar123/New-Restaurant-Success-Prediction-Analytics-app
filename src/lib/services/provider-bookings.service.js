import providerClient from "../api/providerClient";
import axios from "axios";

/**
 * Provider Bookings Service
 * Manages appointment bookings for the provider panel
 * Base URL: /api/v1/provider-panel (via providerClient)
 *
 * Business Logic:
 * - Doctor providers: see bookings made directly to them
 * - Clinic/Hospital providers: see bookings made to any of their doctors
 * - Status flow: pending -> confirmed -> completed OR pending/confirmed -> cancelled
 *
 * API Response (List):
 * {
 *   data: {
 *     items: [...bookings],
 *     meta: { current_page, last_page, total },
 *     reports: { total_bookings, today_bookings: { value, active_now }, upcoming, revenue_today: { value, change } }
 *   }
 * }
 *
 * Booking Object Fields:
 * - id, invoice_number, status, created_at
 * - provider: { id, type, name, image }
 * - provider_doctor: { id, type, name, image } (for hospitals/clinics) or []
 * - customer: { id, name, phone, image, email }
 * - category_id, category_name
 * - data_at (date), time (formatted)
 * - subtotal, fee_services, total
 * - payment_method (cash|card|wallet)
 * - cancellation_reason, cancelled_by_type (User|Admin|Provider), cancelled_by: { id, name }
 *
 * Booking Detail (additional fields):
 * - date (raw), time (raw "HH:MM:SS"), period (morning|afternoon|evening)
 * - payment_status (paid|pending|refunded)
 * - is_rated, category: { id, image, name, doctors_count }
 * - timeline: [{ status, time, readable, changed_by: { type, is_provider, id, name } }]
 */
const ProviderBookingsService = {
  // Booking status constants
  STATUSES: {
    PENDING: "pending",
    CONFIRMED: "confirmed",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
    EXPIRED: "expired",
    NO_SHOW: "no_show",
    PROVIDER_NO_SHOW: "provider_no_show",
  },

  // Payment status constants
  PAY_STATUSES: {
    PAID: "paid",
    PENDING: "pending",
    REFUNDED: "refunded",
  },

  // Valid status transitions
  STATUS_TRANSITIONS: {
    pending: ["confirmed", "cancelled", "no_show", "provider_no_show"],
    confirmed: ["completed", "cancelled", "no_show", "provider_no_show"],
    completed: [], // final state
    cancelled: [], // final state
    expired: [], // final state (system-only)
    no_show: [], // final state
    provider_no_show: [], // final state
  },

  /**
   * Get allowed status transitions for a booking
   * @param {string} currentStatus
   * @returns {string[]}
   */
  getAllowedTransitions: (currentStatus) => {
    return ProviderBookingsService.STATUS_TRANSITIONS[currentStatus] || [];
  },

  /**
   * List Bookings with pagination and filters
   * GET /bookings
   * @param {Object} params - Query parameters
   * @param {string} params.invoice_number - Search by invoice number
   * @param {string} params.status - Filter by status (pending, confirmed, completed, cancelled)
   * @param {number} params.category_id - Filter by category/specialty
   * @param {string} params.pay_status - Filter by payment status (paid, pending, refunded)
   * @param {string} params.type_filter - Quick filter (upcoming_today, requires_action, active_now)
   * @param {number} params.per_page - Items per page (default: 10)
   * @param {number} params.page - Page number
   * @returns {Promise} - { success, data: items[], meta, reports, message }
   */
  getBookings: async (params = {}) => {
    try {
      const response = await providerClient.get("/bookings", { params });

      if (response.data?.status === "success") {
        const data = response.data.data;
        return {
          success: true,
          data: data?.items || (Array.isArray(data) ? data : []),
          meta: data?.meta || {
            current_page: 1,
            last_page: 1,
            total: 0,
          },
          reports: data?.reports || null,
          message: response.data.message,
        };
      }

      return {
        success: false,
        data: [],
        meta: { current_page: 1, last_page: 1, total: 0 },
        reports: null,
        message: response.data?.message || "Failed to fetch bookings",
      };
    } catch (error) {
      console.error("[ProviderBookingsService] Get bookings error:", error);
      return {
        success: false,
        data: [],
        meta: { current_page: 1, last_page: 1, total: 0 },
        reports: null,
        message: error.response?.data?.message || "Error fetching bookings",
      };
    }
  },

  /**
   * Get Booking Details (includes timeline, full category, payment_status, period)
   * GET /bookings/{id}
   * @param {number} id - Booking ID
   * @returns {Promise}
   */
  getBookingById: async (id) => {
    try {
      const response = await providerClient.get(`/bookings/${id}`);

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
        message: response.data?.message || "Failed to fetch booking",
      };
    } catch (error) {
      console.error("[ProviderBookingsService] Get booking by ID error:", error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || "Error fetching booking",
      };
    }
  },

  /**
   * Update Booking Status
   * GET /bookings/update-status/{id}?status=xxx&reason_cancellation_id=xxx
   * NOTE: This is a GET request (not POST) per the backend implementation
   * @param {number} id - Booking ID
   * @param {string} status - New status (pending, confirmed, completed, cancelled)
   * @param {number|null} reasonCancellationId - Cancellation reason ID (required for cancelled)
   * @returns {Promise}
   */
  updateBookingStatus: async (id, status, reasonCancellationId = null) => {
    try {
      const params = { status };
      if (reasonCancellationId && status === "cancelled") {
        params.reason_cancellation_id = reasonCancellationId;
      }

      const response = await providerClient.get(`/bookings/update-status/${id}`, { params });

      if (response.data?.status === "success") {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message || "Booking status updated",
        };
      }

      return {
        success: false,
        message: response.data?.message || "Failed to update booking status",
      };
    } catch (error) {
      console.error("[ProviderBookingsService] Update status error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Error updating booking status",
      };
    }
  },

  /**
   * Export Bookings to Excel (with optional filters)
   * GET /bookings/export
   * @param {Object} filters - Optional filters
   * @param {string} filters.invoice_number
   * @param {number} filters.category_id
   * @param {string} filters.pay_status - paid|pending|refunded
   * @param {string} filters.type_filter - upcoming_today|requires_action|active_now
   * @returns {Promise} - { url: "download_url" }
   */
  exportBookings: async (filters = {}) => {
    try {
      const response = await providerClient.get("/bookings/export", { params: filters });

      if (response.data?.status === "success") {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message || "Export generated successfully",
        };
      }

      return { success: false, message: response.data?.message || "Export failed" };
    } catch (error) {
      console.error("[ProviderBookingsService] Export error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Export error",
      };
    }
  },

  /**
   * Get Cancellation Reasons
   * GET /provider-panel/cancellation-reasons (admin-guarded list of active 'User' reasons)
   * @returns {Promise} - { success, data: Array of { id, title } }
   */
  getCancellationReasons: async () => {
    try {
      const response = await providerClient.get("/cancellation-reasons");

      if (response.data?.status === "success") {
        return {
          success: true,
          data: Array.isArray(response.data.data) ? response.data.data : [],
          message: response.data.message,
        };
      }

      return { success: false, data: [], message: "Failed to fetch cancellation reasons" };
    } catch (error) {
      console.error("[ProviderBookingsService] Get cancellation reasons error:", error);
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || "Error fetching cancellation reasons",
      };
    }
  },

  // === Utility Methods ===

  /**
   * Get status badge color class
   * @param {string} status
   * @returns {string}
   */
  getStatusBadgeColor: (status) => {
    const colors = {
      pending: "bg-amber-50 text-amber-700 border-amber-200",
      confirmed: "bg-blue-50 text-blue-700 border-blue-200",
      completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
      cancelled: "bg-rose-50 text-rose-700 border-rose-200",
      expired: "bg-zinc-100 text-zinc-700 border-zinc-300",
      no_show: "bg-orange-100 text-orange-800 border-orange-300",
      provider_no_show: "bg-rose-100 text-rose-900 border-rose-400",
    };
    return colors[status] || "bg-slate-100 text-slate-700 border-slate-200";
  },

  /**
   * Get payment status badge color class
   * @param {string} payStatus
   * @returns {string}
   */
  getPayStatusBadgeColor: (payStatus) => {
    const colors = {
      paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
      pending: "bg-amber-50 text-amber-700 border-amber-200",
      refunded: "bg-purple-50 text-purple-700 border-purple-200",
    };
    return colors[payStatus] || "bg-slate-100 text-slate-700 border-slate-200";
  },

  /**
   * Get status label (bilingual)
   * @param {string} status
   * @param {boolean} isRTL
   * @returns {string}
   */
  getStatusLabel: (status, isRTL = false) => {
    const labels = {
      pending: isRTL ? "معلق" : "Pending",
      confirmed: isRTL ? "مؤكد" : "Confirmed",
      completed: isRTL ? "مكتمل" : "Completed",
      cancelled: isRTL ? "ملغي" : "Cancelled",
      expired: isRTL ? "منتهي" : "Expired",
      no_show: isRTL ? "لم يحضر" : "No Show",
      provider_no_show: isRTL ? "مقدم الخدمة لم يحضر" : "Provider No Show",
    };
    return labels[status] || status;
  },

  /**
   * Get payment status label (bilingual)
   * @param {string} payStatus
   * @param {boolean} isRTL
   * @returns {string}
   */
  getPayStatusLabel: (payStatus, isRTL = false) => {
    const labels = {
      paid: isRTL ? "مدفوع" : "Paid",
      pending: isRTL ? "معلق" : "Pending",
      refunded: isRTL ? "مسترد" : "Refunded",
    };
    return labels[payStatus] || payStatus || "—";
  },

  /**
   * Get payment method label (bilingual)
   * @param {string} method
   * @param {boolean} isRTL
   * @returns {string}
   */
  getPaymentMethodLabel: (method, isRTL = false) => {
    const labels = {
      cash: isRTL ? "نقدي" : "Cash",
      card: isRTL ? "بطاقة" : "Card",
      wallet: isRTL ? "محفظة" : "Wallet",
    };
    return labels[method] || method || "—";
  },

  /**
   * Get period label (bilingual)
   * @param {string} period
   * @param {boolean} isRTL
   * @returns {string}
   */
  getPeriodLabel: (period, isRTL = false) => {
    const labels = {
      morning: isRTL ? "صباحي" : "Morning",
      afternoon: isRTL ? "مسائي" : "Afternoon",
      evening: isRTL ? "ليلي" : "Evening",
    };
    return labels[period] || period || "—";
  },

  /**
   * Format date for display
   * @param {string} date - Date string from API
   * @returns {string}
   */
  formatDate: (date) => {
    if (!date) return "—";
    try {
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return date;
    }
  },

  /**
   * Format time for display
   * Handles both "HH:MM:SS" (raw) and "12:00 AM" (formatted) from API
   * @param {string} time - Time string
   * @returns {string}
   */
  formatTime: (time) => {
    if (!time) return "—";
    // If already formatted (contains AM/PM), return as is
    if (time.includes("AM") || time.includes("PM")) return time;
    try {
      const [hours, minutes] = time.split(":");
      const h = parseInt(hours);
      const ampm = h >= 12 ? "PM" : "AM";
      const h12 = h % 12 || 12;
      return `${h12}:${minutes} ${ampm}`;
    } catch {
      return time;
    }
  },

  /**
   * Format currency
   * @param {string|number} amount
   * @returns {string}
   */
  formatCurrency: (amount) => {
    if (!amount || amount === "0.00") return "—";
    return `${parseFloat(amount).toFixed(2)} QAR`;
  },

  /**
   * Check if provider_doctor exists (for hospitals/clinics)
   * API returns empty array [] for individual doctors, object for hospitals/clinics
   * @param {*} providerDoctor
   * @returns {object|null}
   */
  getProviderDoctor: (providerDoctor) => {
    if (!providerDoctor || Array.isArray(providerDoctor)) return null;
    if (typeof providerDoctor === "object" && providerDoctor.id) return providerDoctor;
    return null;
  },
};

export default ProviderBookingsService;
