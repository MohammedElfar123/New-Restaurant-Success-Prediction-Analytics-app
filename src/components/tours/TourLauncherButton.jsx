"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import {
  PROVIDER_TOUR_STORAGE_KEY,
  TOUR_RESUME_KEY,
} from "@/lib/tours/providerTour";
import { ADMIN_TOUR_STORAGE_KEY } from "@/lib/tours/adminTour";

/**
 * Sidebar button that replays the guided tour from the start.
 *
 * The actual driver.js orchestration lives in TourProvider — this
 * button only flips the resume flag and pushes the user to the
 * launchpad route. TourProvider on that page picks up the flag and
 * fires the tour, which means multi-page navigation goes through the
 * same code path on first launch and on relaunch.
 */
export default function TourLauncherButton({ scope = "provider", className = "" }) {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations(`tour.${scope}`);
  const isRTL = locale === "ar"; // eslint-disable-line @typescript-eslint/no-unused-vars

  const handleClick = () => {
    if (typeof window === "undefined") return;

    // Clear the "seen" flag so the auto-start gate re-opens on the
    // launchpad. Set the resume flag at step 0 so TourProvider knows to
    // drive even though the localStorage has just been wiped.
    const storageKey =
      scope === "provider" ? PROVIDER_TOUR_STORAGE_KEY : ADMIN_TOUR_STORAGE_KEY;
    window.localStorage.removeItem(storageKey);
    window.sessionStorage.setItem(
      TOUR_RESUME_KEY,
      JSON.stringify({ scope, stepIndex: 0 })
    );

    // Push to the launchpad. router.push to the SAME path is a no-op,
    // so we also fire a "tour:replay" event that TourProvider listens
    // for to force a re-evaluation of its start logic. Either way works:
    //   - already on launchpad: event triggers, navigation is a no-op
    //   - on a different page: navigation triggers TourProvider remount,
    //     event still fires (harmless)
    const launchpad =
      scope === "provider"
        ? `/${locale}/provider/dashboard`
        : `/${locale}/admin/users`;
    router.push(launchpad);
    window.dispatchEvent(new CustomEvent("tour:replay", { detail: { scope } }));
  };

  return (
    <button
      type="button"
      data-tour="tour-launcher"
      onClick={handleClick}
      className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors ${className}`}
      aria-label={t("launcher.label")}
    >
      <Sparkles className="h-4 w-4 text-amber-500" />
      <span>{t("launcher.label")}</span>
    </button>
  );
}
