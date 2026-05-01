import apiClient from "../api/client";

/**
 * Ratings Service — admin-side global view across providers + provider_doctors.
 * Backend: GET /api/v1/dashboard/ratings
 */
const RatingsService = {
  /**
   * List ratings with filtering and pagination.
   * @param {Object} params
   * @param {'all'|'provider'|'provider_doctor'} [params.type='all']
   * @param {number[]} [params.ratings] - multi-select 1..5 (matches floor of rating)
   * @param {string} [params.search] - matches comment text
   * @param {number} [params.page]
   * @param {number} [params.per_page=10]
   * @returns {Promise<{ success, data, meta, reports, message }>}
   *   data: array of { id, entity_type, entity_id, entity_name, user_id, user_name, booking_id, rating, comment, created_at }
   *   reports: { total, average_rating, breakdown_by_stars: { 1..5 } }
   */
  getRatings: async (params = {}) => {
    try {
      // Backend accepts ratings[] (preferred multi-select). Convert empty array to no param.
      const queryParams = { ...params };
      if (Array.isArray(queryParams.ratings)) {
        if (queryParams.ratings.length === 0) {
          delete queryParams.ratings;
        } else {
          queryParams["ratings[]"] = queryParams.ratings;
          delete queryParams.ratings;
        }
      }
      const response = await apiClient.get("/ratings", { params: queryParams });

      if (response.data?.status === "success") {
        return {
          success: true,
          data: response.data.data?.items || [],
          meta: response.data.data?.meta || { current_page: 1, last_page: 1, total: 0 },
          reports: response.data.data?.reports || {
            total: 0,
            average_rating: 0,
            breakdown_by_stars: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
          },
          message: response.data.message,
        };
      }

      return {
        success: false,
        data: [],
        meta: { current_page: 1, last_page: 1, total: 0 },
        reports: { total: 0, average_rating: 0, breakdown_by_stars: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
        message: response.data?.message || "Failed to fetch ratings",
      };
    } catch (error) {
      console.error("[RatingsService] Get ratings error:", error);
      return {
        success: false,
        data: [],
        meta: { current_page: 1, last_page: 1, total: 0 },
        reports: { total: 0, average_rating: 0, breakdown_by_stars: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } },
        message: error.response?.data?.message || "Error fetching ratings",
      };
    }
  },
};

export default RatingsService;
