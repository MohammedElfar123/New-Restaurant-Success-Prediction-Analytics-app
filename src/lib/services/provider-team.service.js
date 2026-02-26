import providerClient from "../api/providerClient";

/**
 * Provider Team Service
 * Manages sub-admins (team members) for the provider panel
 * Base URL: /api/v1/provider-panel (via providerClient)
 *
 * Business Logic:
 * - Each provider has a main admin (owner) created at registration
 * - Owner can create sub-admins with specific permissions
 * - Sub-admins can manage bookings, doctors, etc. based on their permissions
 * - Supports soft delete with restore capability
 * - Permission format: "module.entity.action" (e.g., "bookings.bookings.view")
 */
const ProviderTeamService = {
  /**
   * List Team Members (admins)
   * GET /admins
   * @param {Object} params - Query parameters
   * @param {string} params.search - Search by name, email, phone
   * @param {number} params.id - Filter by admin ID
   * @param {string} params.email - Filter by email
   * @returns {Promise}
   */
  getAdmins: async (params = {}) => {
    try {
      const response = await providerClient.get("/admins", { params });

      if (response.data?.status === "success") {
        const data = response.data.data;
        // API returns array directly (not paginated)
        const items = Array.isArray(data) ? data : data?.items || [];
        return {
          success: true,
          data: items,
          message: response.data.message,
        };
      }

      return {
        success: false,
        data: [],
        message: response.data?.message || "Failed to fetch admins",
      };
    } catch (error) {
      console.error("[ProviderTeamService] Get admins error:", error);
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || "Error fetching admins",
      };
    }
  },

  /**
   * Get Admin Details (includes permissions)
   * GET /admins/{id}
   * @param {number} id - Admin ID
   * @returns {Promise} - includes permissions array
   */
  getAdminById: async (id) => {
    try {
      const response = await providerClient.get(`/admins/${id}`);

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
        message: response.data?.message || "Failed to fetch admin",
      };
    } catch (error) {
      console.error("[ProviderTeamService] Get admin by ID error:", error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || "Error fetching admin",
      };
    }
  },

  /**
   * Create Admin
   * POST /admins
   * @param {Object} data - Admin data
   * @param {string} data.name
   * @param {string} data.email
   * @param {string} data.phone
   * @param {string} data.password
   * @param {string} data.password_confirmation
   * @param {boolean} data.is_active
   * @param {string[]} data.permissions - Array of permission names
   * @param {File} data.image - Profile image (optional)
   * @returns {Promise}
   */
  createAdmin: async (data) => {
    try {
      const formData = new FormData();
      formData.append("name", data.name);
      formData.append("email", data.email);
      formData.append("phone", data.phone);
      formData.append("password", data.password);
      formData.append("password_confirmation", data.password_confirmation);
      formData.append("is_active", data.is_active ? "1" : "0");

      // Permissions array
      if (data.permissions && Array.isArray(data.permissions)) {
        data.permissions.forEach((perm) => {
          formData.append("permission_id[]", perm);
        });
      }

      // Image (optional)
      if (data.image instanceof File) {
        formData.append("image", data.image);
      }

      const response = await providerClient.post("/admins", formData);

      if (response.data?.status === "success") {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message || "Admin created successfully",
        };
      }

      return {
        success: false,
        message: response.data?.message || "Failed to create admin",
      };
    } catch (error) {
      console.error("[ProviderTeamService] Create admin error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Error creating admin",
      };
    }
  },

  /**
   * Update Admin
   * POST /admins/{id}
   * @param {number} id - Admin ID
   * @param {Object} data - Same as create but password is optional
   * @returns {Promise}
   */
  updateAdmin: async (id, data) => {
    try {
      const formData = new FormData();
      if (data.name) formData.append("name", data.name);
      if (data.email) formData.append("email", data.email);
      if (data.phone) formData.append("phone", data.phone);
      if (data.is_active !== undefined) formData.append("is_active", data.is_active ? "1" : "0");

      // Password (optional for update - only send if provided)
      if (data.password && data.password.trim()) {
        formData.append("password", data.password);
        formData.append("password_confirmation", data.password_confirmation || data.password);
      }

      // Permissions array
      if (data.permissions && Array.isArray(data.permissions)) {
        data.permissions.forEach((perm) => {
          formData.append("permission_id[]", perm);
        });
      }

      // Image (optional)
      if (data.image instanceof File) {
        formData.append("image", data.image);
      }

      const response = await providerClient.post(`/admins/${id}`, formData);

      if (response.data?.status === "success") {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message || "Admin updated successfully",
        };
      }

      return {
        success: false,
        message: response.data?.message || "Failed to update admin",
      };
    } catch (error) {
      console.error("[ProviderTeamService] Update admin error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Error updating admin",
      };
    }
  },

  /**
   * Delete Admin (soft delete)
   * DELETE /admins/{id}
   * @param {number} id - Admin ID
   * @returns {Promise}
   */
  deleteAdmin: async (id) => {
    try {
      const response = await providerClient.delete(`/admins/${id}`);

      if (response.data?.status === "success") {
        return {
          success: true,
          message: response.data.message || "Admin deleted successfully",
        };
      }

      return {
        success: false,
        message: response.data?.message || "Failed to delete admin",
      };
    } catch (error) {
      console.error("[ProviderTeamService] Delete admin error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Error deleting admin",
      };
    }
  },

  /**
   * Toggle Admin Status (active/inactive)
   * POST /admins/update-status/{id}
   * @param {number} id - Admin ID
   * @param {boolean} currentStatus - Current status to toggle from
   * @returns {Promise}
   */
  toggleAdminStatus: async (id, currentStatus) => {
    try {
      const formData = new FormData();
      // Send the opposite status
      formData.append("status", currentStatus ? "0" : "1");
      const response = await providerClient.post(`/admins/update-status/${id}`, formData);

      if (response.data?.status === "success") {
        return {
          success: true,
          message: response.data.message || "Admin status updated",
        };
      }

      return {
        success: false,
        message: response.data?.message || "Failed to toggle status",
      };
    } catch (error) {
      console.error("[ProviderTeamService] Toggle status error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Error toggling status",
      };
    }
  },

  /**
   * List Deleted Admins
   * GET /admins/index-deleted
   * @param {Object} params - Query parameters
   * @returns {Promise}
   */
  getDeletedAdmins: async (params = {}) => {
    try {
      const response = await providerClient.get("/admins/index-deleted", { params });

      if (response.data?.status === "success") {
        const data = response.data.data;
        const items = Array.isArray(data) ? data : data?.items || [];
        return {
          success: true,
          data: items,
          message: response.data.message,
        };
      }

      return {
        success: false,
        data: [],
        message: response.data?.message || "Failed to fetch deleted admins",
      };
    } catch (error) {
      console.error("[ProviderTeamService] Get deleted admins error:", error);
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || "Error fetching deleted admins",
      };
    }
  },

  /**
   * Restore Deleted Admin
   * GET /admins/restore/{id}
   * @param {number} id - Admin ID
   * @returns {Promise}
   */
  restoreAdmin: async (id) => {
    try {
      const response = await providerClient.get(`/admins/restore/${id}`);

      if (response.data?.status === "success") {
        return {
          success: true,
          message: response.data.message || "Admin restored successfully",
        };
      }

      return {
        success: false,
        message: response.data?.message || "Failed to restore admin",
      };
    } catch (error) {
      console.error("[ProviderTeamService] Restore admin error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Error restoring admin",
      };
    }
  },

  /**
   * Check Password (security verification before sensitive operations)
   * POST /admins/check-password
   * @param {string} password
   * @returns {Promise}
   */
  checkPassword: async (password) => {
    try {
      const formData = new FormData();
      formData.append("password", password);

      const response = await providerClient.post("/admins/check-password", formData);

      if (response.data?.status === "success") {
        return { success: true, message: response.data.message };
      }

      return { success: false, message: response.data?.message || "Invalid password" };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Password check failed",
      };
    }
  },

  /**
   * Get All Available Permissions
   * GET /get-all-permission
   *
   * API returns: { permissions: { module: { entity: "label" } }, special: [...] }
   * We expand this into full permission names with CRUD actions:
   *   - Regular entities get: view, create, edit, delete
   *   - Special entities (in special array) get: special
   *
   * Backend expects full names like "bookings.bookings.view" for permission_id[]
   *
   * @returns {Promise} - { success, data: { structured, flat }, message }
   */
  getAllPermissions: async () => {
    try {
      const response = await providerClient.get("/get-all-permission");

      if (response.data?.status === "success") {
        const raw = response.data.data;
        const permissions = raw?.permissions || {};
        const specialEntities = new Set(raw?.special || []);
        const crudActions = ["view", "create", "edit", "delete"];

        // Backend returns "orders" in permissions list but rejects it on create/update.
        // Filter out broken modules to prevent "The selected permission_id.0 is invalid."
        const brokenModules = new Set(["orders"]);

        // Build structured permissions: { module: { entity: [full_perm_names] } }
        const structured = {};
        const flat = []; // All valid permission names

        for (const [module, entities] of Object.entries(permissions)) {
          if (brokenModules.has(module)) continue;
          structured[module] = {};
          for (const [entity, label] of Object.entries(entities)) {
            if (specialEntities.has(entity)) {
              // Special entity: only "special" action
              const fullName = `${module}.${entity}.special`;
              structured[module][entity] = { label, actions: [{ name: fullName, action: "special" }] };
              flat.push(fullName);
            } else {
              // Regular entity: CRUD actions
              const actions = crudActions.map((action) => ({
                name: `${module}.${entity}.${action}`,
                action,
              }));
              structured[module][entity] = { label, actions };
              actions.forEach((a) => flat.push(a.name));
            }
          }
        }

        return {
          success: true,
          data: { structured, flat, raw },
          message: response.data.message,
        };
      }

      return {
        success: false,
        data: { structured: {}, flat: [], raw: {} },
        message: response.data?.message || "Failed to fetch permissions",
      };
    } catch (error) {
      console.error("[ProviderTeamService] Get permissions error:", error);
      return {
        success: false,
        data: { structured: {}, flat: [], raw: {} },
        message: error.response?.data?.message || "Error fetching permissions",
      };
    }
  },

  // === Utility Methods ===

  /**
   * Format permission name for display
   * "bookings.bookings.view" -> "Bookings - View"
   * @param {string} permName
   * @param {boolean} isRTL
   * @returns {string}
   */
  formatPermissionName: (permName, isRTL = false) => {
    if (!permName) return "";
    const parts = permName.split(".");
    const module = parts[0]?.replace(/_/g, " ");
    const action = parts[2] || parts[1] || "";

    const actionLabels = {
      view: isRTL ? "عرض" : "View",
      create: isRTL ? "إنشاء" : "Create",
      edit: isRTL ? "تعديل" : "Edit",
      delete: isRTL ? "حذف" : "Delete",
      special: isRTL ? "خاص" : "Special",
    };

    const moduleLabel = module.charAt(0).toUpperCase() + module.slice(1);
    const actionLabel = actionLabels[action] || action;

    return `${moduleLabel} - ${actionLabel}`;
  },
};

export default ProviderTeamService;
