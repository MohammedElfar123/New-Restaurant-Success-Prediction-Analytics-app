import providerClient from "../api/providerClient";

/**
 * Provider Auth Service
 * Handles authentication for Doctors, Clinics, and Hospitals
 * Base URL: /api/v1/provider-panel
 */
const ProviderAuthService = {
  /**
   * Login - Single endpoint for all provider types
   * POST /login
   * Backend determines provider type from credentials
   * @param {Object} credentials - { email, password }
   * @returns {Promise} - { access_token, token_type, admin, admin.provider_id, admin.type }
   */
  login: async (credentials) => {
    try {
      const formData = new FormData();
      formData.append("email", credentials.email);
      formData.append("password", credentials.password);

      const response = await providerClient.post("/login", formData);

      if (response.data?.status === "success") {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message,
        };
      }

      return {
        success: false,
        message: response.data?.message || "Login failed",
      };
    } catch (error) {
      console.error("[ProviderAuthService] Login error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Login error",
      };
    }
  },

  /**
   * Logout
   * GET /logout
   */
  logout: async () => {
    try {
      const response = await providerClient.get("/logout");
      return {
        success: response.data?.status === "success",
        message: response.data?.message || "Logged out",
      };
    } catch (error) {
      console.error("[ProviderAuthService] Logout error:", error);
      return { success: true, message: "Logged out" };
    }
  },

  /**
   * Refresh Token
   * GET /refresh
   */
  refreshToken: async () => {
    try {
      const response = await providerClient.get("/refresh");

      if (response.data?.status === "success") {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message,
        };
      }

      return { success: false, message: "Token refresh failed" };
    } catch (error) {
      console.error("[ProviderAuthService] Refresh error:", error);
      return { success: false, message: "Token refresh error" };
    }
  },

  /**
   * Get Profile
   * GET /get-profile
   */
  getProfile: async () => {
    try {
      const response = await providerClient.get("/get-profile");

      if (response.data?.status === "success") {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message,
        };
      }

      return { success: false, data: null, message: "Failed to get profile" };
    } catch (error) {
      console.error("[ProviderAuthService] Get profile error:", error);
      return { success: false, data: null, message: "Profile error" };
    }
  },

  /**
   * Get My Permissions
   * GET /get-my-permission
   */
  getPermissions: async () => {
    try {
      const response = await providerClient.get("/get-my-permission");

      if (response.data?.status === "success") {
        return {
          success: true,
          data: response.data.data || [],
          message: response.data.message,
        };
      }

      return { success: false, data: [], message: "Failed to get permissions" };
    } catch (error) {
      console.error("[ProviderAuthService] Permissions error:", error);
      return { success: false, data: [], message: "Permissions error" };
    }
  },

  /**
   * Forget Password
   * POST /forget-password
   * @param {Object} data - { email }
   */
  forgetPassword: async (data) => {
    try {
      const formData = new FormData();
      formData.append("email", data.email);

      const response = await providerClient.post("/forget-password", formData);

      if (response.data?.status === "success") {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message,
        };
      }

      return { success: false, message: response.data?.message || "Failed" };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Error",
      };
    }
  },

  /**
   * Check Code (2FA/OTP verification)
   * POST /check-code
   * @param {Object} data - { email, code }
   */
  checkCode: async (data) => {
    try {
      const formData = new FormData();
      formData.append("email", data.email);
      formData.append("code", data.code);

      const response = await providerClient.post("/check-code", formData);

      if (response.data?.status === "success") {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message,
        };
      }

      return { success: false, message: response.data?.message || "Invalid code" };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Verification error",
      };
    }
  },

  /**
   * Reset Password
   * POST /reset-password
   * @param {Object} data - { email, code, password, password_confirmation }
   */
  resetPassword: async (data) => {
    try {
      const formData = new FormData();
      formData.append("email", data.email);
      formData.append("code", data.code);
      formData.append("password", data.password);
      formData.append("password_confirmation", data.password_confirmation);

      const response = await providerClient.post("/reset-password", formData);

      if (response.data?.status === "success") {
        return {
          success: true,
          message: response.data.message,
        };
      }

      return { success: false, message: response.data?.message || "Reset failed" };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Reset error",
      };
    }
  },

  /**
   * Change Password (authenticated)
   * POST /change-password
   * @param {Object} data - { old_password, password, password_confirmation }
   */
  changePassword: async (data) => {
    try {
      const formData = new FormData();
      formData.append("old_password", data.old_password);
      formData.append("new_password", data.new_password || data.password);
      formData.append("new_password_confirmation", data.new_password_confirmation || data.password_confirmation);

      const response = await providerClient.post("/change-password", formData);

      if (response.data?.status === "success") {
        return { success: true, message: response.data.message };
      }

      return { success: false, message: response.data?.message || "Failed" };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Error",
      };
    }
  },

  /**
   * Update Account
   * POST /update-account
   * @param {Object} data - { name, email, phone, image }
   */
  updateAccount: async (data) => {
    try {
      const formData = new FormData();
      if (data.name) formData.append("name", data.name);
      if (data.email) formData.append("email", data.email);
      if (data.phone) formData.append("phone", data.phone);
      if (data.image) formData.append("image", data.image);

      const response = await providerClient.post("/update-account", formData);

      if (response.data?.status === "success") {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message,
        };
      }

      return { success: false, message: response.data?.message || "Update failed" };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || "Update error",
      };
    }
  },
};

export default ProviderAuthService;
