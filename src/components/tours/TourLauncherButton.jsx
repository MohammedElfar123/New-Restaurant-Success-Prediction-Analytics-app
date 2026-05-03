"use client";

import { useLocale, useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { useAuthStore } from "@/stores/authStore";
import {
  getProviderTourSteps,
  PROVIDER_TOUR_STORAGE_KEY,
} from "@/lib/tours/providerTour";
import { getAdminTourSteps, ADMIN_TOUR_STORAGE_KEY } from "@/lib/tours/adminTour";

/**
 * Sidebar / profile-menu button that lets the user replay the guided
 * tour any time after the auto-start has fired once.
 *
 * Clears the localStorage flag and triggers the tour immediately. Sits
 * in the provider sidebar today; an admin variant lands in Phase 2.
 */
export default function TourLauncherButton({ scope = "provider", className = "" }) {
  const locale = useLocale();
  const t = useTranslations(`tour.${scope}`);
  const tCommon = useTranslations(`tour.${scope}`);
  const { user, providerType: storedProviderType } = useAuthStore();
  const isRTL = locale === "ar";

  const providerType =
    storedProviderType || user?.provider?.type || user?.type || "Provider";

  const handleClick = () => {
    if (typeof window === "undefined") return;

    const storageKey =
      scope === "provider" ? PROVIDER_TOUR_STORAGE_KEY : ADMIN_TOUR_STORAGE_KEY;

    // Reset the seen flag so a future first-login on a fresh browser
    // would still auto-start. Then drive the tour now.
    window.localStorage.removeItem(storageKey);

    const steps =
      scope === "provider"
        ? getProviderTourSteps(t, providerType, locale)
        : getAdminTourSteps(t, locale);

    if (!steps.length) return;

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
        window.localStorage.setItem(storageKey, "true");
      },
    });
    tour.setSteps(steps);
    tour.drive();
  };

  return (
    <button
      type="button"
      data-tour="tour-launcher"
      onClick={handleClick}
      className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors ${className}`}
      aria-label={tCommon("launcher.label")}
    >
      <Sparkles className="h-4 w-4 text-amber-500" />
      <span>{tCommon("launcher.label")}</span>
    </button>
  );
}
