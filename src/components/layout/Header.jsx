"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "@/i18n/routing";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  LogOut,
  Globe,
  Search,
  ChevronDown,
  User2,
  Calendar,
  Clock,
  Volume2,
  VolumeX,
  CheckCheck,
  Stethoscope,
  Activity,
  Building2,
  Hospital,
} from "lucide-react";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import BookingsService from "@/lib/services/bookings.service";
import ProviderBookingsService from "@/lib/services/provider-bookings.service";

// Provider type config for icons and colors
const PROVIDER_TYPE_CONFIG = {
  Doctor: {
    icon: Stethoscope,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    label: { en: "Doctor", ar: "طبيب" },
    route: "doctors",
  },
  Clinic: {
    icon: Building2,
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
    label: { en: "Clinic", ar: "عيادة" },
    route: "clinics",
  },
  Hospital: {
    icon: Hospital,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    label: { en: "Hospital", ar: "مستشفى" },
    route: "hospitals",
  },
};

export default function Header() {
  const router = useRouter();
  const { user, logout, userType } = useAuthStore();
  const {
    newBookingsCount,
    todayBookings,
    activeNow,
    hasNewNotification,
    latestBookings,
    soundEnabled,
    toggleSound,
    markAsSeen,
    initializeSound,
  } = useNotificationStore();
  const t = useTranslations("common");
  const params = useParams();
  const currentLocale = params.locale;
  const isAr = currentLocale === "ar";
  const isProvider = userType === "provider" || userType === "doctor" || userType === "hospital";
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  const notifRef = useRef(null);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const formatTime = () =>
      new Date().toLocaleTimeString(isAr ? "ar-QA" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    setCurrentTime(formatTime());
    const interval = setInterval(() => setCurrentTime(formatTime()), 60000);
    return () => clearInterval(interval);
  }, [isAr]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target))
        setShowNotifications(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target))
        setShowUserMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    const isProvider = userType === "provider" || userType === "doctor" || userType === "hospital";
    await logout();
    router.push(isProvider ? "/provider/login" : `/${userType}/login`);
  };

  const toggleLanguage = () => {
    const newLocale = isAr ? "en" : "ar";
    const pathParts = window.location.pathname.split("/");
    pathParts[1] = newLocale;
    window.location.href = pathParts.join("/");
  };

  const handleNotificationClick = useCallback(() => {
    initializeSound();
    setShowNotifications((prev) => !prev);
    if (!showNotifications && newBookingsCount > 0) {
      markAsSeen();
    }
  }, [showNotifications, newBookingsCount, markAsSeen, initializeSound]);

  const navigateToBooking = useCallback(
    (bookingId, providerType) => {
      setShowNotifications(false);
      if (isProvider) {
        router.push(`/${currentLocale}/provider/bookings/${bookingId}`);
      } else {
        const config = PROVIDER_TYPE_CONFIG[providerType];
        const route = config ? config.route : "doctors";
        router.push(`/${currentLocale}/admin/bookings/${route}`);
      }
    },
    [router, currentLocale, isProvider]
  );

  const getRelativeTime = useCallback(
    (dateStr) => BookingsService.getRelativeTime(dateStr, currentLocale),
    [currentLocale]
  );

  return (
    <header className="h-16 border-b border-border/50 bg-card/80 backdrop-blur-md px-6 flex items-center justify-between shadow-sm sticky top-0 z-50">
      {/* Left Side */}
      <div className="flex items-center gap-6">
        <div className="hidden md:block">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <span className="text-muted-foreground">👋</span>
            <span>
              {t("welcome")},{" "}
              <span className="text-primary">{user?.name?.split(" ")[0]}</span>
            </span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {new Date().toLocaleDateString(isAr ? "ar-QA" : "en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        <div className="hidden lg:flex items-center bg-muted/50 rounded-xl px-4 py-2 gap-3 min-w-[300px] hover:bg-muted/70 transition-colors group">
          <Search className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          <input
            type="text"
            placeholder={isAr ? "بحث..." : "Search..."}
            className="bg-transparent border-none outline-none text-sm w-full placeholder:text-muted-foreground"
          />
          <kbd className="hidden xl:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground bg-muted rounded border border-border">
            <span>⌘</span>K
          </kbd>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/5 border border-primary/20">
          <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-xs font-medium text-primary">{currentTime}</span>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggleLanguage}
          className="relative rounded-xl hover:bg-muted/80 transition-all duration-300 hover:scale-105"
          title="Change Language"
        >
          <Globe className="w-5 h-5" />
          <span className="absolute -bottom-0.5 -right-0.5 text-[8px] font-bold bg-primary text-white px-1 rounded">
            {currentLocale.toUpperCase()}
          </span>
        </Button>

        {/* Notifications Bell */}
        <div className="relative" ref={notifRef}>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleNotificationClick}
            className={cn(
              "relative rounded-xl hover:bg-muted/80 transition-all duration-300 hover:scale-105 group",
              hasNewNotification && "animate-bounce"
            )}
          >
            <Bell
              className={cn(
                "w-5 h-5 transition-all duration-300",
                hasNewNotification ? "text-primary" : "group-hover:text-primary"
              )}
            />
            {newBookingsCount > 0 && (
              <>
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
                </span>
                <Badge
                  variant="destructive"
                  className="absolute -top-1 -right-1 h-5 min-w-5 flex items-center justify-center p-0 px-1 text-[10px] font-bold"
                >
                  {newBookingsCount > 99 ? "99+" : newBookingsCount}
                </Badge>
              </>
            )}
          </Button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div
              className={cn(
                "absolute mt-2 w-[420px] bg-card rounded-2xl shadow-2xl border border-border/50 overflow-hidden animate-in slide-in-from-top-2 duration-200 z-[100]",
                isAr ? "left-0" : "right-0"
              )}
            >
              {/* Header */}
              <div className="px-5 py-4 bg-gradient-to-br from-primary/5 to-primary/10 border-b border-border/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Bell className="w-4.5 h-4.5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">
                        {isAr ? "آخر الحجوزات" : "Latest Bookings"}
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        {isAr ? "يتم التحديث كل 10 ثوان" : "Updates every 10s"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSound();
                    }}
                    className={cn(
                      "p-2 rounded-xl transition-all duration-200",
                      soundEnabled
                        ? "bg-primary/10 text-primary hover:bg-primary/20"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                    title={
                      soundEnabled ? "Mute notifications" : "Unmute notifications"
                    }
                  >
                    {soundEnabled ? (
                      <Volume2 className="w-4 h-4" />
                    ) : (
                      <VolumeX className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Quick Stats Row */}
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex-1 bg-card/90 rounded-xl px-3 py-2.5 border border-border/30 text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {isAr ? "اليوم" : "Today"}
                      </span>
                    </div>
                    <p className="text-xl font-bold text-foreground leading-none">
                      {todayBookings}
                    </p>
                  </div>
                  <div className="flex-1 bg-card/90 rounded-xl px-3 py-2.5 border border-border/30 text-center">
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      <Activity className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-[10px] font-medium text-muted-foreground">
                        {isAr ? "نشط الآن" : "Active"}
                      </span>
                    </div>
                    <p className="text-xl font-bold text-emerald-600 leading-none">
                      {activeNow}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bookings List */}
              <div className="max-h-[360px] overflow-y-auto">
                {latestBookings.length > 0 ? (
                  <div className="p-2 space-y-1">
                    {latestBookings.map((booking, index) => {
                      const providerType = booking.provider?.type || "Doctor";
                      const config = PROVIDER_TYPE_CONFIG[providerType] || PROVIDER_TYPE_CONFIG.Doctor;
                      const TypeIcon = config.icon;

                      return (
                        <div
                          key={booking.id || index}
                          onClick={() => navigateToBooking(booking.id, providerType)}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/40 transition-all duration-200 cursor-pointer group/item"
                        >
                          {/* Type Icon */}
                          <div
                            className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border",
                              config.bg,
                              config.border
                            )}
                          >
                            <TypeIcon className={cn("w-5 h-5", config.color)} />
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-[13px] font-semibold text-foreground truncate">
                                {booking.customer?.name ||
                                  booking.user?.name ||
                                  (isAr ? "مريض" : "Patient")}
                              </p>
                              <span
                                className={cn(
                                  "text-[9px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 uppercase tracking-wide",
                                  isProvider
                                    ? ProviderBookingsService.getStatusBadgeColor(booking.status)
                                    : BookingsService.getStatusBadgeColor(booking.status)
                                )}
                              >
                                {isProvider
                                  ? ProviderBookingsService.getStatusLabel(booking.status, isAr)
                                  : BookingsService.capitalizeStatus(booking.status)}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 mt-1">
                              {/* Provider type badge */}
                              <span
                                className={cn(
                                  "text-[9px] font-semibold px-1.5 py-0.5 rounded border",
                                  config.bg,
                                  config.color,
                                  config.border
                                )}
                              >
                                {config.label[currentLocale] || config.label.en}
                              </span>
                              {booking.provider?.name && (
                                <span className="text-[11px] text-muted-foreground truncate">
                                  {booking.provider.name}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 mt-1">
                              {(booking.date || booking.data_at) && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3 text-muted-foreground/50" />
                                  <span className="text-[10px] text-muted-foreground">
                                    {BookingsService.formatDate(
                                      booking.date || booking.data_at,
                                      currentLocale
                                    )}
                                  </span>
                                </div>
                              )}
                              {(booking.time || booking.start_time) && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-muted-foreground/50" />
                                  <span className="text-[10px] text-muted-foreground">
                                    {BookingsService.formatTime(
                                      booking.time || booking.start_time,
                                      booking.created_at
                                    )}
                                  </span>
                                </div>
                              )}
                              {booking.created_at && (
                                <span className="text-[9px] text-muted-foreground/40 ms-auto">
                                  {isProvider
                                    ? booking.created_at
                                    : getRelativeTime(booking.created_at)}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-14 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                      <CheckCheck className="w-7 h-7 text-muted-foreground/40" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {isAr ? "لا توجد حجوزات حديثة" : "No recent bookings"}
                    </p>
                    <p className="text-xs text-muted-foreground/50 mt-1">
                      {isAr
                        ? "سيتم إشعارك عند وصول حجز جديد"
                        : "You'll be notified when a new booking arrives"}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-border/50 p-2 bg-muted/10">
                <button
                  onClick={() => {
                    setShowNotifications(false);
                    router.push(
                      isProvider
                        ? `/${currentLocale}/provider/bookings`
                        : `/${currentLocale}/admin/bookings/doctors`
                    );
                  }}
                  className="w-full py-2.5 text-sm font-semibold text-primary hover:bg-primary/5 rounded-xl transition-colors"
                >
                  {isAr ? "عرض جميع الحجوزات" : "View All Bookings"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-3 px-3 py-2 rounded-xl bg-gradient-to-r from-muted/50 to-muted/30 hover:from-muted/70 hover:to-muted/50 transition-all duration-300 border border-border/50 group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <User2 className="w-5 h-5 text-white" />
            </div>
            <div className="hidden md:block text-left">
              <div className="text-sm font-semibold text-foreground leading-none">
                {user?.name}
              </div>
              <div className="text-[10px] text-muted-foreground mt-1 capitalize">
                {userType === "admin" ? "Super Admin" : (userType === "provider" || userType === "doctor" || userType === "hospital") ? "Provider" : userType}
              </div>
            </div>
            <ChevronDown
              className={cn(
                "w-4 h-4 text-muted-foreground transition-transform duration-300",
                showUserMenu && "rotate-180"
              )}
            />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-card rounded-xl shadow-xl border border-border/50 overflow-hidden animate-in slide-in-from-top-2 duration-200">
              <div className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border-b border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md">
                    <User2 className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{user?.name}</div>
                    <div className="text-xs text-muted-foreground">{user?.email}</div>
                  </div>
                </div>
              </div>
              <div className="p-2">
                <Button
                  onClick={() => {
                    setShowUserMenu(false);
                    handleLogout();
                  }}
                  variant="ghost"
                  className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 rounded-lg"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  {t("logout")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
