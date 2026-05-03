"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import {
  getProviderTourSteps,
  PROVIDER_TOUR_STORAGE_KEY,
  TOUR_RESUME_KEY,
} from "@/lib/tours/providerTour";
import { getAdminTourSteps, ADMIN_TOUR_STORAGE_KEY } from "@/lib/tours/adminTour";

/**
 * Auto-starts the guided tour and orchestrates multi-page navigation.
 *
 * Three triggers:
 *   1. First-time auto-start — user lands on the panel's launchpad
 *      route (provider/dashboard or admin/users) and has not seen the
 *      tour before (`localStorage` gate).
 *   2. Resume after navigation — when a tour step lives on a different
 *      page, we save the next step index to `sessionStorage` and push
 *      the route. When this component remounts on the new page, we
 *      read the resume flag and continue from that step.
 *   3. Manual relaunch — TourLauncherButton clears the localStorage
 *      gate and drives the tour directly (no resume state involved).
 *
 * driver.js itself only knows about a single page. This component is
 * the bridge that turns a list of cross-page steps into a continuous
 * walkthrough.
 */
export default function TourProvider({ scope = "provider" }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations(`tour.${scope}`);
  const { user, providerType: storedProviderType, userType } = useAuthStore();
  const isRTL = locale === "ar";
  const startedRef = useRef(false);

  const providerType =
    storedProviderType || user?.provider?.type || user?.type || "Provider";

  // Bumps every time the launcher button fires a "tour:replay" event,
  // so an already-mounted TourProvider re-runs its effect even when
  // the user is already on the launchpad route (router.push to the
  // same path is a no-op and would not trigger useEffect otherwise).
  const [replayTick, setReplayTick] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => setReplayTick((n) => n + 1);
    window.addEventListener("tour:replay", handler);
    return () => window.removeEventListener("tour:replay", handler);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!user) return;

    // Scope guard: provider tour only on provider routes; same for admin.
    const onProviderRoute = pathname.includes("/provider/");
    const onAdminRoute = pathname.includes("/admin/");
    if (scope === "provider" && !onProviderRoute) return;
    if (scope === "admin" && !onAdminRoute) return;

    if (startedRef.current) return;

    const storageKey =
      scope === "provider" ? PROVIDER_TOUR_STORAGE_KEY : ADMIN_TOUR_STORAGE_KEY;
    const steps =
      scope === "provider"
        ? getProviderTourSteps(t, providerType, locale)
        : getAdminTourSteps(t, locale);
    if (!steps.length) return;

    // Strip the locale prefix so step.route comparisons are clean.
    const stripLocale = (p) => p.replace(/^\/[a-z]{2}(?=\/)/, "");
    const currentRoute = stripLocale(pathname);

    // Decide whether to start. Resume flag wins; otherwise auto-start
    // only on the launchpad if the user has not seen the tour.
    const resumeRaw = window.sessionStorage.getItem(TOUR_RESUME_KEY);
    let resumeIndex = null;
    if (resumeRaw) {
      try {
        const parsed = JSON.parse(resumeRaw);
        if (parsed.scope === scope && typeof parsed.stepIndex === "number") {
          resumeIndex = parsed.stepIndex;
        }
      } catch {
        // corrupt — ignore + clear
      }
      window.sessionStorage.removeItem(TOUR_RESUME_KEY);
    }

    const onLaunchpad =
      pathname.endsWith(`/${scope}/dashboard`) ||
      pathname.endsWith(`/${scope}/users`); // admin landing
    const seen = window.localStorage.getItem(storageKey) === "true";

    if (resumeIndex === null) {
      if (!onLaunchpad) return;
      if (seen) return;
    }

    // Confirm the resume step actually belongs on this page; if the
    // user navigated away mid-tour to somewhere unexpected, abort the
    // resume rather than fire on the wrong page.
    if (resumeIndex !== null) {
      const expectedRoute = steps[resumeIndex]?.route;
      if (expectedRoute && expectedRoute !== currentRoute) {
        return;
      }
    }

    // Wait for the DOM to mount the data-tour anchors before driving.
    // 400ms covers the slowest pages we have; cheaper than guessing
    // mount completion via MutationObserver for one-time use.
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
        progressText: isRTL
          ? "الخطوة {{current}} من {{total}}"
          : "Step {{current}} of {{total}}",
        onDestroyed: () => {
          // Only mark "seen" if we finished or the user explicitly
          // closed. Resume-driven destroys don't count as seen because
          // we set the resume flag before destroying.
          if (!window.sessionStorage.getItem(TOUR_RESUME_KEY)) {
            window.localStorage.setItem(storageKey, "true");
          }
          startedRef.current = false;
        },
      });

      // Wrap each step's `onNextClick` so cross-page transitions
      // (current step's route !== next step's route) navigate first
      // and stash a resume marker. Driver.js calls onNextClick instead
      // of moveNext when it's defined, so we explicitly call moveNext
      // for in-page transitions.
      const wrappedSteps = steps.map((step, idx) => {
        const next = steps[idx + 1];
        const needsNav =
          next && next.route && step.route && next.route !== step.route;
        return {
          ...step,
          popover: {
            ...step.popover,
            onNextClick: () => {
              if (needsNav) {
                window.sessionStorage.setItem(
                  TOUR_RESUME_KEY,
                  JSON.stringify({ scope, stepIndex: idx + 1 })
                );
                tour.destroy();
                router.push(`/${locale}${next.route}`);
                return;
              }
              tour.moveNext();
            },
          },
        };
      });

      tour.setSteps(wrappedSteps);
      tour.drive(resumeIndex ?? 0);
    }, 400);

    return () => clearTimeout(timeout);
  }, [pathname, user, providerType, scope, locale, t, isRTL, router, replayTick]);

  return null;
}
