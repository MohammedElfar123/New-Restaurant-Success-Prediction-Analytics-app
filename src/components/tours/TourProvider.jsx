"use client";

import { useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import {
  getProviderTourSteps,
  PROVIDER_TOUR_STORAGE_KEY,
} from "@/lib/tours/providerTour";
import { getAdminTourSteps, ADMIN_TOUR_STORAGE_KEY } from "@/lib/tours/adminTour";

/**
 * Auto-starts the appropriate guided tour the first time a logged-in
 * user lands on the dashboard route, then never again unless the user
 * hits the "Restart tour" launcher button.
 *
 * Mount this once inside DashboardLayout. Pass the scope of the panel
 * (`provider` or `admin`) so the right tour fires for the right user.
 *
 * driver.js handles the keyboard, focus, click-outside, and the overlay
 * itself — we only orchestrate when to start it and remember whether
 * the user has seen it before.
 */
export default function TourProvider({ scope = "provider" }) {
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations(`tour.${scope}`);
  const { user, providerType: storedProviderType, userType } = useAuthStore();
  const isRTL = locale === "ar";
  const startedRef = useRef(false);

  // Provider type comes from the auth store, falls back to the user
  // payload Sidebar.jsx already trusts.
  const providerType =
    storedProviderType || user?.provider?.type || user?.type || "Provider";

  useEffect(() => {
    // Only run on the client, after auth is settled.
    if (typeof window === "undefined") return;
    if (!user) return;

    // Guard the scope/route match. Provider tour only runs on provider
    // routes, admin tour only on admin routes.
    const onProviderRoute = pathname.includes("/provider/");
    const onAdminRoute = pathname.includes("/admin/");
    if (scope === "provider" && !onProviderRoute) return;
    if (scope === "admin" && !onAdminRoute) return;

    // The dashboard is the launchpad — auto-start there. Other pages
    // are part of the tour but we don't want to fire from /provider/team
    // and have driver.js scrub forward to dashboard before the user has
    // even seen where they are.
    const onDashboard =
      pathname.endsWith(`/${scope}/dashboard`) ||
      pathname.endsWith(`/${scope}/users`); // admin landing is /users
    if (!onDashboard) return;

    // localStorage gate — once seen, don't re-trigger automatically.
    const storageKey =
      scope === "provider" ? PROVIDER_TOUR_STORAGE_KEY : ADMIN_TOUR_STORAGE_KEY;
    const seen = window.localStorage.getItem(storageKey);
    if (seen === "true") return;

    // Effect re-runs on every dependency change; we only want one tour.
    if (startedRef.current) return;

    const steps =
      scope === "provider"
        ? getProviderTourSteps(t, providerType, locale)
        : getAdminTourSteps(t, locale);

    if (!steps.length) return;

    // Wait one frame so the DOM has the data-tour anchors mounted —
    // otherwise driver.js can't find the first element and bails.
    const timeout = setTimeout(() => {
      startedRef.current = true;
      const tour = driver({
        showProgress: true,
        animate: true,
        smoothScroll: true,
        allowClose: true,
        overlayColor: "#1C2A3A",
        overlayOpacity: 0.7,
        nextBtnText: isRTL ? "التالي ←" : "Next →",
        prevBtnText: isRTL ? "→ السابق" : "← Previous",
        doneBtnText: isRTL ? "تم" : "Done",
        progressText: isRTL ? "الخطوة {{current}} من {{total}}" : "Step {{current}} of {{total}}",
        onDestroyed: () => {
          // User finished or closed — mark seen so we don't re-trigger.
          window.localStorage.setItem(storageKey, "true");
          startedRef.current = false;
        },
      });
      tour.setSteps(steps);
      tour.drive();
    }, 400);

    return () => clearTimeout(timeout);
  }, [pathname, user, providerType, scope, locale, t, isRTL]);

  return null;
}
