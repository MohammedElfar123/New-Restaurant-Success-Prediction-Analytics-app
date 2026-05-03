import apiClient from "../api/client";

/**
 * Refunds Service — wraps the admin refund-queue endpoints.
 *
 * Backend lives at `/dashboard/refunds`. The lifecycle finance operates:
 *
 *   1. Customer pays online → cancels → backend emits a payment_event
 *      with event_type='requires_refund'.
 *   2. The Pending Actions queue surfaces those events (no refund row
 *      created yet).
 *   3. Finance opens one, creates a refund record (status=pending) with
 *      amount + reason via createRefund().
 *   4. Finance pushes the refund through Sadad's merchant portal (Sadad
 *      doesn't expose a refund API at our merchant tier).
 *   5. Finance returns and calls markProcessed() with gateway_refund_ref
 *      → status flips to success, booking.payment_status='refunded'.
 *   6. If Sadad rejects the refund (rare), markFailed() with a reason.
 *
 * No automated execution — every state transition needs a human.
 */
const RefundsService = {
  STATUSES: {
    PENDING: "pending",
    SENT_TO_GATEWAY: "sent_to_gateway",
    SUCCESS: "success",
    FAILED: "failed",
  },

  /**
   * GET /dashboard/refunds/pending-actions
   * The queue: requires_refund events that don't yet have a refund row.
   */
  getPendingActions: async (params = {}) => {
    try {
      const response = await apiClient.get("/refunds/pending-actions", { params });
      if (response.data?.status === "success") {
        const data = response.data.data;
        return {
          success: true,
          data: data?.items || [],
          meta: data?.meta || {},
        };
      }
      return { success: false, message: response.data?.message };
    } catch (error) {
      return { success: false, message: error?.response?.data?.message || error.message };
    }
  },

  /**
   * GET /dashboard/refunds
   * Full refund history, optionally filtered by status.
   */
  getRefunds: async (params = {}) => {
    try {
      const response = await apiClient.get("/refunds", { params });
      if (response.data?.status === "success") {
        const data = response.data.data;
        return {
          success: true,
          data: data?.items || [],
          meta: data?.meta || {},
        };
      }
      return { success: false, message: response.data?.message };
    } catch (error) {
      return { success: false, message: error?.response?.data?.message || error.message };
    }
  },

  /**
   * GET /dashboard/refunds/{id}
   */
  getRefundById: async (id) => {
    try {
      const response = await apiClient.get(`/refunds/${id}`);
      if (response.data?.status === "success") {
        return { success: true, data: response.data.data };
      }
      return { success: false, message: response.data?.message };
    } catch (error) {
      return { success: false, message: error?.response?.data?.message || error.message };
    }
  },

  /**
   * POST /dashboard/refunds
   * Create a refund record from a payment_transaction.
   *
   * @param {object} payload
   * @param {number} payload.payment_transaction_id
   * @param {number} payload.amount_halalas - full or partial; backend rejects > tx amount
   * @param {string} payload.reason - free text the patient gave us
   */
  createRefund: async (payload) => {
    try {
      const response = await apiClient.post("/refunds", payload);
      if (response.data?.status === "success" || response.data?.code === 201) {
        return { success: true, data: response.data.data, message: response.data.message };
      }
      return { success: false, message: response.data?.message };
    } catch (error) {
      return { success: false, message: error?.response?.data?.message || error.message };
    }
  },

  /**
   * POST /dashboard/refunds/{id}/mark-processed
   * Finance has pushed the refund through Sadad portal — record the
   * gateway reference. Backend flips refund.status=success and
   * booking.payment_status=refunded if amount covers the full tx.
   *
   * @param {number} id
   * @param {object} payload
   * @param {string} payload.gateway_refund_ref - Sadad's confirmation ref
   */
  markProcessed: async (id, payload) => {
    try {
      const response = await apiClient.post(`/refunds/${id}/mark-processed`, payload);
      if (response.data?.status === "success") {
        return { success: true, data: response.data.data, message: response.data.message };
      }
      return { success: false, message: response.data?.message };
    } catch (error) {
      return { success: false, message: error?.response?.data?.message || error.message };
    }
  },

  /**
   * POST /dashboard/refunds/{id}/mark-failed
   * Sadad rejected the refund — record why so finance can re-try later.
   *
   * @param {number} id
   * @param {object} payload
   * @param {string} payload.failure_reason
   */
  markFailed: async (id, payload) => {
    try {
      const response = await apiClient.post(`/refunds/${id}/mark-failed`, payload);
      if (response.data?.status === "success") {
        return { success: true, data: response.data.data, message: response.data.message };
      }
      return { success: false, message: response.data?.message };
    } catch (error) {
      return { success: false, message: error?.response?.data?.message || error.message };
    }
  },
};

export default RefundsService;
