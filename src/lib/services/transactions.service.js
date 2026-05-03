import apiClient from "../api/client";

/**
 * Transactions Service — wraps the admin Sadad transactions viewer.
 *
 * Read-only window finance uses to:
 *   - reconcile our records against Sadad's daily report
 *   - investigate disputes ("did we charge this customer?")
 *   - confirm refunds actually happened
 *
 * The UI never mutates state through these endpoints. Refunds go
 * through RefundsService; everything else flows through the booking
 * lifecycle.
 */
const TransactionsService = {
  STATUSES: {
    INITIATED: "initiated",
    SENT_TO_GATEWAY: "sent_to_gateway",
    SUCCESS: "success",
    FAILED: "failed",
    EXPIRED: "expired",
    CANCELLED: "cancelled",
  },

  /**
   * GET /dashboard/transactions
   * Filterable list. Backend supports: status, gateway, from_date,
   * to_date, provider_id, search (matches gateway_order_id and
   * gateway_transaction_ref).
   */
  list: async (params = {}) => {
    try {
      const response = await apiClient.get("/transactions", { params });
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
   * GET /dashboard/transactions/{id}
   * Returns transaction + linked booking + event log (chronological).
   */
  show: async (id) => {
    try {
      const response = await apiClient.get(`/transactions/${id}`);
      if (response.data?.status === "success") {
        return { success: true, data: response.data.data };
      }
      return { success: false, message: response.data?.message };
    } catch (error) {
      return { success: false, message: error?.response?.data?.message || error.message };
    }
  },

  /**
   * GET /dashboard/transactions/reconciliation?date=YYYY-MM-DD
   * One-day snapshot finance compares against Sadad's daily report.
   */
  reconciliation: async (date) => {
    try {
      const response = await apiClient.get("/transactions/reconciliation", {
        params: { date },
      });
      if (response.data?.status === "success") {
        return { success: true, data: response.data.data };
      }
      return { success: false, message: response.data?.message };
    } catch (error) {
      return { success: false, message: error?.response?.data?.message || error.message };
    }
  },
};

export default TransactionsService;
