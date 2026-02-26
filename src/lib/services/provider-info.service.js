import providerClient from "../api/providerClient";

/**
 * Provider Info Service
 * Manages provider business information, schedules, and categories
 * Base URL: /api/v1/provider-panel (via providerClient)
 *
 * Business Logic:
 * - Provider info is the PUBLIC-FACING business profile (not the admin account)
 * - Includes multilingual content (Arabic/English): name, address, description
 * - Includes business hours (7-day schedule)
 * - Includes pricing (for Doctor providers or if applicable)
 * - Includes categories (medical specialties the provider offers)
 * - For Hospitals/Clinics: pricing might be 0 since each doctor has own pricing
 * - For Doctors: pricing is for their own consultations
 */
const ProviderInfoService = {
  /**
   * Get Provider Info for Editing
   * GET /show-for-update
   * @returns {Promise} - Full provider details with translations, schedules
   */
  getProviderInfo: async () => {
    try {
      const response = await providerClient.get("/show-for-update");

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
        message: response.data?.message || "Failed to fetch provider info",
      };
    } catch (error) {
      console.error("[ProviderInfoService] Get provider info error:", error);
      return {
        success: false,
        data: null,
        message: error.response?.data?.message || "Error fetching provider info",
      };
    }
  },

  /**
   * Update Provider Information
   * POST /update-information
   * @param {Object} data - Provider data
   * @param {string} data.ar_name - Arabic name
   * @param {string} data.ar_address - Arabic address
   * @param {string} data.ar_description - Arabic description
   * @param {string} data.en_name - English name
   * @param {string} data.en_address - English address
   * @param {string} data.en_description - English description
   * @param {string} data.email - Contact email
   * @param {string} data.phone - Contact phone
   * @param {number} data.lat - Latitude
   * @param {number} data.lng - Longitude
   * @param {number} data.experience_years - Years of experience
   * @param {number} data.price_before_discount - Original price
   * @param {number} data.price_after_discount - Discounted price
   * @param {number} data.discount_percentage - Discount percentage
   * @param {boolean} data.is_active - Active status
   * @param {File} data.image - Provider image (optional)
   * @returns {Promise}
   */
  updateProviderInfo: async (data) => {
    try {
      const formData = new FormData();

      // Multilingual fields
      if (data.ar_name) formData.append("ar[name]", data.ar_name);
      if (data.ar_address) formData.append("ar[address]", data.ar_address);
      if (data.ar_description) formData.append("ar[description]", data.ar_description);
      if (data.en_name) formData.append("en[name]", data.en_name);
      if (data.en_address) formData.append("en[address]", data.en_address);
      if (data.en_description) formData.append("en[description]", data.en_description);

      // Contact info
      if (data.email) formData.append("email", data.email);
      if (data.phone) formData.append("phone", data.phone);

      // Location
      if (data.lat !== undefined) formData.append("lat", data.lat);
      if (data.lng !== undefined) formData.append("lng", data.lng);

      // Experience
      if (data.experience_years !== undefined) formData.append("experience_years", data.experience_years);

      // Pricing
      if (data.price_before_discount !== undefined) formData.append("price_before_discount", data.price_before_discount);
      if (data.price_after_discount !== undefined) formData.append("price_after_discount", data.price_after_discount);
      if (data.discount_percentage !== undefined) formData.append("discount_percentage", data.discount_percentage);

      // Status
      if (data.is_active !== undefined) formData.append("is_active", data.is_active ? "1" : "0");

      // Image (optional)
      if (data.image instanceof File) {
        formData.append("image", data.image);
      }

      const response = await providerClient.post("/update-information", formData);

      if (response.data?.status === "success") {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message || "Provider info updated successfully",
        };
      }

      return {
        success: false,
        message: response.data?.message || "Failed to update provider info",
      };
    } catch (error) {
      console.error("[ProviderInfoService] Update provider info error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Error updating provider info",
      };
    }
  },

  /**
   * Update Business Hours / Schedules
   * POST /update-schedules
   * @param {Array} schedules - Array of { day_of_week, open_time, close_time }
   * @returns {Promise}
   */
  updateSchedules: async (schedules) => {
    try {
      const formData = new FormData();

      schedules.forEach((schedule, index) => {
        formData.append(`schedules[${index}][day_of_week]`, schedule.day_of_week);
        formData.append(`schedules[${index}][open_time]`, schedule.open_time);
        formData.append(`schedules[${index}][close_time]`, schedule.close_time);
      });

      const response = await providerClient.post("/update-schedules", formData);

      if (response.data?.status === "success") {
        return {
          success: true,
          data: response.data.data,
          message: response.data.message || "Schedules updated successfully",
        };
      }

      return {
        success: false,
        message: response.data?.message || "Failed to update schedules",
      };
    } catch (error) {
      console.error("[ProviderInfoService] Update schedules error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Error updating schedules",
      };
    }
  },

  /**
   * Get All Available Categories
   * GET /all-categories
   * @returns {Promise} - Array of { id, image, name, doctors_count }
   */
  getAllCategories: async () => {
    try {
      const response = await providerClient.get("/all-categories");

      if (response.data?.status === "success") {
        return {
          success: true,
          data: Array.isArray(response.data.data) ? response.data.data : [],
          message: response.data.message,
        };
      }

      return { success: false, data: [], message: "Failed to fetch categories" };
    } catch (error) {
      console.error("[ProviderInfoService] Get all categories error:", error);
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || "Error fetching categories",
      };
    }
  },

  /**
   * Get Provider's Selected Categories
   * GET /my-categories
   * @returns {Promise} - Array of { id, image, name, doctors_count }
   */
  getMyCategories: async () => {
    try {
      const response = await providerClient.get("/my-categories");

      if (response.data?.status === "success") {
        return {
          success: true,
          data: Array.isArray(response.data.data) ? response.data.data : [],
          message: response.data.message,
        };
      }

      return { success: false, data: [], message: "Failed to fetch my categories" };
    } catch (error) {
      console.error("[ProviderInfoService] Get my categories error:", error);
      return {
        success: false,
        data: [],
        message: error.response?.data?.message || "Error fetching my categories",
      };
    }
  },

  /**
   * Update Provider's Categories
   * POST /update-categories
   * @param {number[]} categoryIds - Array of category IDs
   * @returns {Promise}
   */
  updateCategories: async (categoryIds) => {
    try {
      const formData = new FormData();
      categoryIds.forEach((id) => {
        formData.append("category_id[]", id);
      });

      const response = await providerClient.post("/update-categories", formData);

      if (response.data?.status === "success") {
        return {
          success: true,
          message: response.data.message || "Categories updated successfully",
        };
      }

      return {
        success: false,
        message: response.data?.message || "Failed to update categories",
      };
    } catch (error) {
      console.error("[ProviderInfoService] Update categories error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Error updating categories",
      };
    }
  },

  // === Utility Methods ===

  /**
   * Get default 7-day schedule
   * @returns {Array}
   */
  getDefaultSchedule: () => {
    return Array.from({ length: 7 }, (_, i) => ({
      day_of_week: i,
      open_time: "08:00",
      close_time: "17:00",
    }));
  },

  /**
   * Get day name by index (0=Sunday, 6=Saturday)
   * @param {number} dayIndex
   * @param {string} locale - 'ar' or 'en'
   * @returns {string}
   */
  getDayName: (dayIndex, locale = "ar") => {
    const days = {
      ar: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
      en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    };
    return days[locale]?.[dayIndex] || days.ar[dayIndex];
  },

  /**
   * Extract translation value from translations array
   * @param {Array} translations - [{ locale: "ar", name: "..." }, { locale: "en", name: "..." }]
   * @param {string} locale - 'ar' or 'en'
   * @param {string} field - 'name', 'address', 'description'
   * @returns {string}
   */
  getTranslation: (translations, locale, field) => {
    if (!translations || !Array.isArray(translations)) return "";
    const translation = translations.find((t) => t.locale === locale);
    return translation?.[field] || "";
  },

  /**
   * Format schedule time from API (HH:MM:SS -> HH:MM)
   * @param {string} time
   * @returns {string}
   */
  formatScheduleTime: (time) => {
    if (!time) return "08:00";
    return time.substring(0, 5); // "08:00:00" -> "08:00"
  },
};

export default ProviderInfoService;
