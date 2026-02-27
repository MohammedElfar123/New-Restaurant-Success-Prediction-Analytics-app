import axios from "axios";
import toast from "react-hot-toast";

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://backend.qarar-sat.com/api/v1/dashboard";
const API_SECRET_KEY = process.env.NEXT_PUBLIC_API_SECRET_KEY || "zAyuqt8Fb#&*t-rnL3q%$";

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "Cache-Control": "no-cache",
    "Accept-Secret-Key": API_SECRET_KEY,
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Get language preference from URL path (more reliable than localStorage)
      // URL pattern: /ar/... or /en/...
      const pathLocale = window.location.pathname.split('/')[1];
      const locale = ['ar', 'en'].includes(pathLocale) ? pathLocale : (localStorage.getItem("locale") || "ar");
      config.headers["Accept-Language"] = locale;

      // Sync localStorage with URL locale for consistency
      if (localStorage.getItem("locale") !== locale) {
        localStorage.setItem("locale", locale);
      }
    }

    // Handle FormData
    if (config.data instanceof FormData) {
      config.headers["Content-Type"] = "multipart/form-data";
    }

    // Debug logging in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
        headers: config.headers,
        data: config.data,
      });
    }

    return config;
  },
  (error) => {
    console.error("[API Request Error]", error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Debug logging in development
    if (process.env.NODE_ENV === "development") {
      console.log(`[API Response] ${response.config.url}`, response.data);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const isSilent = originalRequest?._silent === true;

    // Handle different error status codes
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // Unauthorized - Token expired or invalid
          if (!originalRequest._retry) {
            originalRequest._retry = true;

            // Try to refresh token
            try {
              const refreshResponse = await axios.get(`${API_BASE_URL}/refresh`, {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem("access_token")}`,
                  "Accept-Secret-Key": API_SECRET_KEY,
                },
              });

              if (refreshResponse.data?.data?.access_token) {
                const newToken = refreshResponse.data.data.access_token;
                localStorage.setItem("access_token", newToken);
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return apiClient(originalRequest);
              }
            } catch (refreshError) {
              // Refresh failed - logout user
              if (!isSilent) handleLogout();
            }
          } else {
            if (!isSilent) handleLogout();
          }
          break;

        case 403:
          if (!isSilent) toast.error(data?.message || "ليس لديك صلاحية للوصول");
          break;

        case 404:
          if (!isSilent) toast.error(data?.message || "العنصر غير موجود");
          break;

        case 422:
          // Validation errors
          if (!isSilent) {
            if (data?.errors) {
              const errorMessages = Object.values(data.errors).flat();
              errorMessages.forEach((msg) => toast.error(msg));
            } else {
              toast.error(data?.message || "خطأ في البيانات المدخلة");
            }
          }
          break;

        case 500:
        case 503:
          if (!isSilent) toast.error("حدث خطأ في الخادم، يرجى المحاولة لاحقاً");
          break;

        default:
          if (!isSilent) toast.error(data?.message || "حدث خطأ غير متوقع");
      }
    } else if (error.code === "ECONNABORTED") {
      if (!isSilent) toast.error("انتهت مهلة الاتصال، يرجى المحاولة مرة أخرى");
    } else if (!error.response) {
      if (!isSilent) toast.error("لا يمكن الاتصال بالخادم، تحقق من اتصالك بالإنترنت");
    }

    return Promise.reject(error);
  }
);

// Handle logout - redirect to the correct login page based on user type
function handleLogout() {
  if (typeof window !== "undefined") {
    const userType = localStorage.getItem("user_type");

    localStorage.removeItem("access_token");
    localStorage.removeItem("user_type");
    localStorage.removeItem("auth-storage");

    // Clear cookies
    document.cookie = "access_token=; path=/; max-age=0";
    document.cookie = "user_type=; path=/; max-age=0";

    // Determine locale from URL
    const pathLocale = window.location.pathname.split("/")[1];
    const locale = ["ar", "en"].includes(pathLocale) ? pathLocale : "ar";

    // Redirect to appropriate login page
    const isProvider = userType === "provider" || userType === "doctor" || userType === "hospital";
    const loginPath = isProvider ? `/${locale}/provider/login` : `/${locale}/admin/login`;

    toast.error("انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى");
    window.location.href = loginPath;
  }
}

// Export the client
export default apiClient;

// Export base URL for other uses
export { API_BASE_URL, API_SECRET_KEY };
