import apiClient from "../api/client";

/**
 * Customers Service - Handles all customer related API calls
 * Base URL: /dashboard (already in API_BASE_URL)
 */
const CustomersService = {
  /**
   * List Customers with filters and pagination
   * GET /customers
   * @param {Object} params - Query parameters
   * @param {string} params.search - Search by name, phone, email
   * @param {string} params.status - Filter by status (active, inactive)
   * @param {string} params.from_registration_at - Registration date from (YYYY-MM-DD)
   * @param {string} params.to_registration_at - Registration date to (YYYY-MM-DD)
   * @param {number} params.per_page - Items per page (default: 10)
   * @param {number} params.page - Page number
   * @param {number} params.activation - Filter by activation (0, 1)
   * @param {string} params.gender - Filter by gender (male, female)
   * @param {string} params.from_birth_date - Birth date from (YYYY-MM-DD)
   * @param {string} params.to_birth_date - Birth date to (YYYY-MM-DD)
   * @returns {Promise} - { items, meta, reports }
   */
  getCustomers: async (params = {}) => {
    try {
      const response = await apiClient.get("/customers", { params });

      if (response.data?.status === "success") {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message,
        };
      }

      return {
        success: false,
        data: { items: [], meta: {}, reports: {} },
        message: response.data?.message || "فشل جلب العملاء",
      };
    } catch (error) {
      console.error("[CustomersService] Get customers error:", error);
      return {
        success: false,
        data: { items: [], meta: {}, reports: {} },
        message: error.response?.data?.message || "حدث خطأ أثناء جلب العملاء",
      };
    }
  },

  /**
   * Get Customer Details
   * GET /customers/{id}
   * @param {number} id - Customer ID
   * @returns {Promise} - { customer, totals }
   */
  getCustomerById: async (id) => {
    try {
      const response = await apiClient.get(`/customers/${id}`);

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
        message: response.data?.message || "فشل جلب تفاصيل العميل",
      };
    } catch (error) {
      console.error("[CustomersService] Get customer by ID error:", error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || "حدث خطأ أثناء جلب تفاصيل العميل",
      };
    }
  },

  /**
   * Export Customers to Excel
   * GET /customers/export
   * @param {Object} params - Query parameters (same as getCustomers)
   * @returns {Promise} - { url }
   */
  exportCustomers: async (params = {}) => {
    try {
      const response = await apiClient.get("/customers/export", { params });

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
        message: response.data?.message || "فشل تصدير العملاء",
      };
    } catch (error) {
      console.error("[CustomersService] Export customers error:", error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || "حدث خطأ أثناء تصدير العملاء",
      };
    }
  },

  /**
   * Update Customer Status (Toggle active/inactive)
   * POST /customers/update-status/{id}
   * @param {number} id - Customer ID
   * @returns {Promise}
   */
  updateCustomerStatus: async (id) => {
    try {
      const response = await apiClient.post(`/customers/update-status/${id}`);

      if (response.data?.status === "success") {
        return {
          success: true,
          message: response.data.message || "تم تحديث حالة العميل بنجاح",
        };
      }

      return {
        success: false,
        message: response.data?.message || "فشل تحديث حالة العميل",
      };
    } catch (error) {
      console.error("[CustomersService] Update customer status error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "حدث خطأ أثناء تحديث حالة العميل",
      };
    }
  },

  /**
   * Restore Deleted Customer
   * GET /customers/restore/{id}
   * @param {number} id - Customer ID
   * @returns {Promise}
   */
  restoreCustomer: async (id) => {
    try {
      const response = await apiClient.get(`/customers/restore/${id}`);

      if (response.data?.status === "success") {
        return {
          success: true,
          message: response.data.message || "تم استعادة العميل بنجاح",
        };
      }

      return {
        success: false,
        message: response.data?.message || "فشل استعادة العميل",
      };
    } catch (error) {
      console.error("[CustomersService] Restore customer error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "حدث خطأ أثناء استعادة العميل",
      };
    }
  },

  /**
   * Delete Customer (Soft Delete)
   * DELETE /customers/{id}
   * @param {number} id - Customer ID
   * @returns {Promise}
   */
  deleteCustomer: async (id) => {
    try {
      const response = await apiClient.delete(`/customers/${id}`);

      if (response.data?.status === "success") {
        return {
          success: true,
          message: response.data.message || "تم حذف العميل بنجاح",
        };
      }

      return {
        success: false,
        message: response.data?.message || "فشل حذف العميل",
      };
    } catch (error) {
      console.error("[CustomersService] Delete customer error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "حدث خطأ أثناء حذف العميل",
      };
    }
  },

  /**
   * Get Deleted Customers
   * GET /customers with is_deleted=1
   * @param {Object} params - Query parameters
   * @returns {Promise}
   */
  getDeletedCustomers: async (params = {}) => {
    try {
      const response = await apiClient.get("/customers/index-deleted", {
        params,
      });

      if (response.data?.status === "success") {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message,
        };
      }

      return {
        success: false,
        data: { items: [], meta: {}, reports: {} },
        message: response.data?.message || "فشل جلب العملاء المحذوفين",
      };
    } catch (error) {
      console.error("[CustomersService] Get deleted customers error:", error);
      return {
        success: false,
        data: { items: [], meta: {}, reports: {} },
        message: error.response?.data?.message || "حدث خطأ أثناء جلب العملاء المحذوفين",
      };
    }
  },
};

export default CustomersService;
