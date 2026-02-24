"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { usePermissions, PERMISSIONS } from "@/hooks/usePermissions";
import {
  LayoutDashboard,
  Users,
  UserCog,
  Building2,
  Stethoscope,
  Calendar,
  Settings,
  Star,
  Wallet,
  FileText,
  UserCircle,
  ClipboardList,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Sliders,
  MapPin,
  Bell,
  FolderTree,
  HelpCircle,
  Cog,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Sidebar({ userType, locale }) {
  const pathname = usePathname();
  const t = useTranslations("sidebar");
  const [hoveredItem, setHoveredItem] = useState(null);
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  const { hasPermission, isSuperAdmin } = usePermissions();

  // Check if current path is in settings section
  const isInSettingsSection = pathname.includes("/admin/settings");

  // Auto-expand settings if we're in settings section
  useMemo(() => {
    if (isInSettingsSection) {
      setSettingsExpanded(true);
    }
  }, [isInSettingsSection]);

  // Settings sub-navigation items
  const settingsSubNav = useMemo(() => [
    {
      name: t("generalSettings"),
      href: `/${locale}/admin/settings/general`,
      icon: Cog,
      permission: PERMISSIONS.GENERAL_SETTINGS,
    },
    {
      name: t("faqs"),
      href: `/${locale}/admin/settings/faqs`,
      icon: HelpCircle,
      permission: PERMISSIONS.GENERAL_SETTINGS,
    },
    {
      name: t("infoPages"),
      href: `/${locale}/admin/settings/info-pages`,
      icon: FileText,
      permission: PERMISSIONS.GENERAL_SETTINGS,
    },
    {
      name: t("specialties"),
      href: `/${locale}/admin/settings/categories`,
      icon: FolderTree,
      permission: PERMISSIONS.CATEGORIES_VIEW,
    },
  ], [locale, t]);

  // Filter settings sub-nav by permissions
  const filteredSettingsSubNav = useMemo(() => {
    return settingsSubNav.filter((item) => {
      if (!item.permission) return true;
      return hasPermission(item.permission);
    });
  }, [settingsSubNav, hasPermission]);

  // Admin navigation with permissions
  const adminNavigation = useMemo(() => [
    {
      name: t("users"),
      href: `/${locale}/admin/users`,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      badge: null,
      permission: PERMISSIONS.CLIENTS_VIEW,
    },
    {
      name: t("providers"),
      href: `/${locale}/admin/providers`,
      icon: Building2,
      color: "text-teal-500",
      bgColor: "bg-teal-50",
      badge: null,
      permission: PERMISSIONS.PROVIDERS_VIEW,
    },
    {
      name: t("doctorBookings"),
      href: `/${locale}/admin/bookings/doctors`,
      icon: Stethoscope,
      color: "text-emerald-500",
      bgColor: "bg-emerald-50",
      badge: null,
      permission: PERMISSIONS.BOOKINGS_VIEW,
    },
    {
      name: t("clinicBookings"),
      href: `/${locale}/admin/bookings/clinics`,
      icon: Building2,
      color: "text-purple-500",
      bgColor: "bg-purple-50",
      badge: null,
      permission: PERMISSIONS.BOOKINGS_VIEW,
    },
    {
      name: t("hospitalBookings"),
      href: `/${locale}/admin/bookings/hospitals`,
      icon: Calendar,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      badge: null,
      permission: PERMISSIONS.BOOKINGS_VIEW,
    },
    {
      name: t("sliders"),
      href: `/${locale}/admin/sliders`,
      icon: Sliders,
      color: "text-indigo-500",
      bgColor: "bg-indigo-50",
      badge: null,
      permission: PERMISSIONS.SLIDERS_VIEW,
    },
    {
      name: t("notifications"),
      href: `/${locale}/admin/notifications`,
      icon: Bell,
      color: "text-pink-500",
      bgColor: "bg-pink-50",
      badge: null,
      permission: PERMISSIONS.NOTIFICATIONS_VIEW,
    },
    {
      name: t("admins"),
      href: `/${locale}/admin/admins`,
      icon: UserCog,
      color: "text-slate-600",
      bgColor: "bg-slate-100",
      badge: null,
      permission: PERMISSIONS.ADMINS_VIEW,
    },
  ], [locale, t]);

  const hospitalNavigation = useMemo(() => [
    {
      name: t("dashboard"),
      href: `/${locale}/hospital/dashboard`,
      icon: LayoutDashboard,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      name: t("doctors"),
      href: `/${locale}/hospital/doctors`,
      icon: Stethoscope,
      color: "text-accent",
      bgColor: "bg-green-50",
      badge: null,
    },
    {
      name: t("appointments"),
      href: `/${locale}/hospital/appointments`,
      icon: Calendar,
      color: "text-purple-500",
      bgColor: "bg-purple-50",
      badge: null,
    },
    {
      name: t("reviews"),
      href: `/${locale}/hospital/reviews`,
      icon: Star,
      color: "text-amber-500",
      bgColor: "bg-amber-50",
    },
    {
      name: t("profile"),
      href: `/${locale}/hospital/profile`,
      icon: UserCircle,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      name: t("settings"),
      href: `/${locale}/hospital/settings`,
      icon: Settings,
      color: "text-slate-500",
      bgColor: "bg-slate-50",
    },
  ], [locale, t]);

  const doctorNavigation = useMemo(() => [
    {
      name: t("dashboard"),
      href: `/${locale}/doctor/dashboard`,
      icon: LayoutDashboard,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      name: t("appointments"),
      href: `/${locale}/doctor/appointments`,
      icon: Calendar,
      color: "text-purple-500",
      bgColor: "bg-purple-50",
      badge: null,
    },
    {
      name: t("patients"),
      href: `/${locale}/doctor/patients`,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      badge: null,
    },
    {
      name: t("schedule"),
      href: `/${locale}/doctor/schedule`,
      icon: ClipboardList,
      color: "text-teal-500",
      bgColor: "bg-teal-50",
    },
    {
      name: t("reviews"),
      href: `/${locale}/doctor/reviews`,
      icon: Star,
      color: "text-amber-500",
      bgColor: "bg-amber-50",
    },
    {
      name: t("earnings"),
      href: `/${locale}/doctor/earnings`,
      icon: Wallet,
      color: "text-accent",
      bgColor: "bg-green-50",
    },
    {
      name: t("profile"),
      href: `/${locale}/doctor/profile`,
      icon: UserCircle,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
    },
    {
      name: t("settings"),
      href: `/${locale}/doctor/settings`,
      icon: Settings,
      color: "text-slate-500",
      bgColor: "bg-slate-50",
    },
  ], [locale, t]);

  // Get navigation based on user type and filter by permissions
  const navigation = useMemo(() => {
    let navItems = [];

    if (userType === "admin") {
      navItems = adminNavigation;
    } else if (userType === "hospital") {
      navItems = hospitalNavigation;
    } else {
      navItems = doctorNavigation;
    }

    // Filter based on permissions (only for admin panel)
    if (userType === "admin") {
      return navItems.filter((item) => {
        // If no permission required, show the item
        if (!item.permission) return true;
        // Check if user has the required permission
        return hasPermission(item.permission);
      });
    }

    return navItems;
  }, [userType, adminNavigation, hospitalNavigation, doctorNavigation, hasPermission]);

  // Check if settings section should be shown
  const showSettingsSection = userType === "admin" && filteredSettingsSubNav.length > 0;

  // Get user badge text
  const getUserBadgeText = () => {
    if (userType === "admin") {
      return isSuperAdmin ? "Super Admin" : "Admin";
    }
    if (userType === "hospital") return "Hospital Panel";
    return "Doctor Panel";
  };

  const getAccessText = () => {
    if (isSuperAdmin) return "Full Access";
    return "Limited Access";
  };

  return (
    <div className="flex h-full w-64 flex-col bg-gradient-to-b from-card to-muted/20 border-e border-border/50 shadow-sm">
      {/* Logo */}
      <div className="flex h-16 items-center justify-center border-b border-border/50 px-6 bg-card/80 backdrop-blur-sm">
        <Link
          href={`/${locale}/${userType}/${userType === 'admin' ? 'users' : 'dashboard'}`}
          className="flex items-center gap-3 group transition-all duration-300 hover:scale-105"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:rotate-3">
            <Stethoscope className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Mawadk
          </span>
        </Link>
      </div>

      {/* User Badge */}
      <div className="px-4 pt-4 pb-2">
        <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-3 border border-primary/20">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-xs font-semibold text-primary">
              {getUserBadgeText()}
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground">{getAccessText()}</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        {navigation.length === 0 && !showSettingsSection ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {t("noAccess") || "No access to any modules"}
          </div>
        ) : (
          <>
            {navigation.map((item, index) => {
              const isActive = pathname === item.href;
              const isHovered = hoveredItem === item.name;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onMouseEnter={() => setHoveredItem(item.name)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={cn(
                    "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 overflow-hidden",
                    isActive
                      ? "bg-gradient-to-r from-primary to-primary/90 text-white shadow-md shadow-primary/30"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                  style={{
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  {/* Active Indicator */}
                  {isActive && (
                    <div className="absolute start-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white rounded-e-full animate-pulse" />
                  )}

                  {/* Icon Container */}
                  <div className={cn(
                    "flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-300",
                    isActive
                      ? "bg-white/20"
                      : isHovered
                        ? `${item.bgColor} ${item.color}`
                        : "bg-transparent"
                  )}>
                    <Icon className={cn(
                      "w-5 h-5 transition-all duration-300",
                      isActive && "scale-110",
                      isHovered && !isActive && "scale-110"
                    )} />
                  </div>

                  {/* Text */}
                  <span className={cn(
                    "flex-1 transition-all duration-300",
                    isActive && "font-semibold",
                    isHovered && !isActive && "translate-x-1"
                  )}>
                    {item.name}
                  </span>

                  {/* Badge */}
                  {item.badge && (
                    <Badge
                      variant={isActive ? "secondary" : "outline"}
                      className={cn(
                        "h-5 px-2 text-[10px] font-bold transition-all duration-300",
                        isActive && "bg-white/20 text-white border-white/30",
                        !isActive && "bg-muted text-muted-foreground"
                      )}
                    >
                      {item.badge}
                    </Badge>
                  )}

                  {/* Chevron */}
                  <ChevronRight className={cn(
                    "w-4 h-4 transition-all duration-300",
                    isActive ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                  )} />

                  {/* Hover Gradient Background */}
                  {!isActive && (
                    <div className={cn(
                      "absolute inset-0 bg-gradient-to-r from-transparent via-muted/30 to-transparent -translate-x-full transition-transform duration-500",
                      isHovered && "translate-x-full"
                    )} />
                  )}
                </Link>
              );
            })}

            {/* Settings Section (Expandable) */}
            {showSettingsSection && (
              <div className="pt-2">
                {/* Settings Header */}
                <button
                  onClick={() => setSettingsExpanded(!settingsExpanded)}
                  className={cn(
                    "w-full group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 overflow-hidden",
                    isInSettingsSection
                      ? "bg-gradient-to-r from-slate-600 to-slate-500 text-white shadow-md"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  {/* Icon Container */}
                  <div className={cn(
                    "flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-300",
                    isInSettingsSection ? "bg-white/20" : "bg-transparent group-hover:bg-slate-100"
                  )}>
                    <Settings className={cn(
                      "w-5 h-5 transition-all duration-300",
                      !isInSettingsSection && "group-hover:text-slate-600"
                    )} />
                  </div>

                  {/* Text */}
                  <span className="flex-1 text-start">
                    {t("settings")}
                  </span>

                  {/* Chevron */}
                  <ChevronDown className={cn(
                    "w-4 h-4 transition-transform duration-300",
                    settingsExpanded && "rotate-180"
                  )} />
                </button>

                {/* Settings Sub-Navigation */}
                {settingsExpanded && (
                  <div className="mt-1 ms-4 space-y-1 border-s-2 border-border/50 ps-2">
                    {filteredSettingsSubNav.map((subItem) => {
                      const isSubActive = pathname === subItem.href || pathname.startsWith(subItem.href + "/");
                      const SubIcon = subItem.icon;

                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={cn(
                            "flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200",
                            isSubActive
                              ? "bg-primary/10 text-primary font-medium"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                          )}
                        >
                          <SubIcon className="w-4 h-4" />
                          <span>{subItem.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-border/50 p-4 bg-card/50 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          <span className="font-medium">© 2025 Mawadk</span>
        </div>
        <p className="text-center text-[10px] text-muted-foreground/60 mt-1">
          Healthcare Platform
        </p>
      </div>
    </div>
  );
}
