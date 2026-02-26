import axios from "axios";
import toast from "react-hot-toast";

// Provider Panel API Configuration
// Same backend, different prefix: /api/v1/provider-panel instead of /api/v1/dashboard
const API_PROVIDER_BASE_URL =
  process.env.NEXT_PUBLIC_API_PROVIDER_BASE_URL ||
  "https://backend.qarar-sat.com/api/v1/provider-panel";
const API_SECRET_KEY =
  process.env.NEXT_PUBLIC_API_SECRET_KEY || "zAyuqt8Fb#&*t-rnL3q%$";

// Create axios instance for provider panel
const providerClient = axios.create({
  baseURL: API_PROVIDER_BASE_URL,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    "Cache-Control": "no-cache",
    "Accept-Secret-Key": API_SECRET_KEY,
  },
});

// Request interceptor
providerClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Get language from URL path
      const pathLocale = window.location.pathname.split("/")[1];
      const locale = ["ar", "en"].includes(pathLocale)
        ? pathLocale
        : localStorage.getItem("locale") || "ar";
      config.headers["Accept-Language"] = locale;
    }

    // Handle FormData - delete Content-Type so axios auto-sets it with boundary
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"];
    }

    if (process.env.NODE_ENV === "development") {
      console.log(
        `[Provider API] ${config.method?.toUpperCase()} ${config.url}`
      );
    }

    return config;
  },
  (error) => {
    console.error("[Provider API Request Error]", error);
    return Promise.reject(error);
  }
);

// Response interceptor
providerClient.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[Provider API Response] ${response.config.url}`, response.data);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          if (!originalRequest._retry) {
            originalRequest._retry = true;

            try {
              const refreshResponse = await axios.get(
                `${API_PROVIDER_BASE_URL}/refresh`,
                {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("access_token")}`,
                    "Accept-Secret-Key": API_SECRET_KEY,
                  },
                }
              );

              if (refreshResponse.data?.data?.access_token) {
                const newToken = refreshResponse.data.data.access_token;
                localStorage.setItem("access_token", newToken);
                document.cookie = `access_token=${newToken}; path=/; max-age=${30 * 24 * 60 * 60}`;
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return providerClient(originalRequest);
              }
            } catch (refreshError) {
              handleProviderLogout();
            }
          } else {
            handleProviderLogout();
          }
          break;

        case 403:
          toast.error(data?.message || "Access denied");
          break;

        case 404:
          toast.error(data?.message || "Not found");
          break;

        case 422:
          if (data?.errors) {
            const errorMessages = Object.values(data.errors).flat();
            errorMessages.forEach((msg) => toast.error(msg));
          } else {
            toast.error(data?.message || "Validation error");
          }
          break;

        case 500:
        case 503:
          toast.error("Server error, please try again later");
          break;

        default:
          toast.error(data?.message || "Unexpected error");
      }
    } else if (error.code === "ECONNABORTED") {
      toast.error("Connection timeout, please try again");
    } else if (!error.response) {
      toast.error("Cannot connect to server");
    }

    return Promise.reject(error);
  }
);

// Handle provider logout - redirect to provider login
function handleProviderLogout() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_type");
    localStorage.removeItem("auth-storage");

    document.cookie = "access_token=; path=/; max-age=0";
    document.cookie = "user_type=; path=/; max-age=0";

    const pathLocale = window.location.pathname.split("/")[1];
    const locale = ["ar", "en"].includes(pathLocale) ? pathLocale : "ar";

    toast.error("Session expired, please login again");
    window.location.href = `/${locale}/provider/login`;
  }
}

export default providerClient;
export { API_PROVIDER_BASE_URL, API_SECRET_KEY };
