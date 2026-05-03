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
 * Auto-starts the guided tour and orchestrates navigation —
 * including the tricky case where the user manually clicks somewhere
 * during the tour.
 *
 * Three triggers + one safety net:
 *   1. First-time auto-start: user lands on the launchpad route
 *      (provider/dashboard or admin/users) and has not seen the tour.
 *   2. Tour-driven navigation: a step's onNextClick saves the next
 *      step's index and pushes to its route. The new page mounts,
 *      reads the resume flag, and continues.
 *   3. Manual relaunch: TourLauncherButton sets the resume flag at
 *      index 0 and dispatches "tour:replay".
 *   4. SAFETY NET — user manually navigates mid-tour: pathname
 *      changes, the cleanup function captures the active step index
 *      from driver.js and saves a resume marker. The new page then
 *      reads it and continues, but only if the new pathname actually
 *      matches a step's route. Otherwise we abort gracefully.
 */
export default function TourProvider({ scope = "provider" }) {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations(`tour.${scope}`);
  const { user, providerType: storedProviderType } = useAuthStore();
  const isRTL = locale === "ar";

  // The active driver.js instance, kept on a ref so the cleanup
  // function can introspect it when pathname changes mid-tour.
  const tourInstanceRef = useRef(null);

  // Bumps when the launcher button fires "tour:replay", so the effect
  // re-runs even if pathname did not change (replay from the launchpad).
  const [replayTick, setReplayTick] = useState(0);

  const providerType =
    storedProviderType || user?.provider?.type || user?.type || "Provider";

  // Listen for replay events from the launcher button.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = () => setReplayTick((n) => n + 1);
    window.addEventListener("tour:replay", handler);
    return () => window.removeEventListener("tour:replay", handler);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!user) return;

    // Scope guard
    const onProviderRoute = pathname.includes("/provider/");
    const onAdminRoute = pathname.includes("/admin/");
    if (scope === "provider" && !onProviderRoute) return;
    if (scope === "admin" && !onAdminRoute) return;

    const storageKey =
      scope === "provider" ? PROVIDER_TOUR_STORAGE_KEY : ADMIN_TOUR_STORAGE_KEY;
    const steps =
      scope === "provider"
        ? getProviderTourSteps(t, providerType, locale)
        : getAdminTourSteps(t, locale);
    if (!steps.length) return;

    // Strip the locale prefix (/ar, /en) so step.route comparisons line up.
    const stripLocale = (p) => p.replace(/^\/[a-z]{2}(?=\/)/, "");
    const currentRoute = stripLocale(pathname);

    // Decide whether we should drive a tour on this page.
    const resumeRaw = window.sessionStorage.getItem(TOUR_RESUME_KEY);
    let resumeIndex = null;
    if (resumeRaw) {
      try {
        const parsed = JSON.parse(resumeRaw);
        if (parsed.scope === scope && typeof parsed.stepIndex === "number") {
          resumeIndex = parsed.stepIndex;
        }
      } catch {
        // ignore corrupt
      }
      // We always consume the flag — if validation fails below we
      // abort, otherwise we drive. Either way it should not stick.
      window.sessionStorage.removeItem(TOUR_RESUME_KEY);
    }

    const onLaunchpad =
      pathname.endsWith(`/${scope}/dashboard`) ||
      pathname.endsWith(`/${scope}/users`);
    const seen = window.localStorage.getItem(storageKey) === "true";

    if (resumeIndex === null) {
      // No resume → auto-start only on the launchpad for first-time users.
      if (!onLaunchpad) return;
      if (seen) return;
    } else {
      // Resume flag present. The user might have been navigated by the
      // tour itself (good) or might have manually clicked somewhere
      // odd (bad). Validate that the resume step actually fits this
      // page; if not, look for the FIRST step whose route matches
      // current pathname and resume there. If nothing matches, abort.
      const expectedRoute = steps[resumeIndex]?.route;
      if (expectedRoute && expectedRoute !== currentRoute) {
        const fallbackIndex = steps.findIndex(
          (s) => s.route && s.route === currentRoute
        );
        if (fallbackIndex === -1) {
          // Tour cannot continue here. Drop the gate so it can auto-fire
          // from the launchpad if the user goes back.
          return;
        }
        resumeIndex = fallbackIndex;
      }
    }

    // We need a moment for the data-tour anchors to mount on the new
    // page. 400ms covers all current pages.
    const timeout = setTimeout(() => {
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
          // Only mark "seen" when the user finished or closed normally.
          // If we destroyed because of a navigation handoff, the resume
          // flag is set; do not mark seen in that case.
          if (!window.sessionStorage.getItem(TOUR_RESUME_KEY)) {
            window.localStorage.setItem(storageKey, "true");
          }
          tourInstanceRef.current = null;
        },
      });

      // Wrap each step's onNextClick to either (a) navigate forward
      // when the next step lives on a different route or (b) advance
      // normally when it does not.
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
            // Same idea for "Previous": if we'd have to go back to a
            // different page, navigate + stash the resume.
            onPrevClick: () => {
              const prev = steps[idx - 1];
              const needsBackNav =
                prev && prev.route && step.route && prev.route !== step.route;
              if (needsBackNav) {
                window.sessionStorage.setItem(
                  TOUR_RESUME_KEY,
                  JSON.stringify({ scope, stepIndex: idx - 1 })
                );
                tour.destroy();
                router.push(`/${locale}${prev.route}`);
                return;
              }
              tour.movePrevious();
            },
          },
        };
      });

      tour.setSteps(wrappedSteps);
      tour.drive(resumeIndex ?? 0);
      tourInstanceRef.current = tour;
    }, 400);

    // Cleanup runs on pathname change OR component unmount. If the
    // tour is still active when this happens, capture the current
    // step index and stash a resume marker so the next mount can
    // continue from there. This is the safety net that handles the
    // case where the user manually navigates mid-tour.
    return () => {
      clearTimeout(timeout);
      const active = tourInstanceRef.current;
      if (!active) return;
      try {
        if (typeof active.isActive === "function" && active.isActive()) {
          const idx =
            typeof active.getActiveIndex === "function"
              ? active.getActiveIndex()
              : null;
          if (typeof idx === "number") {
            window.sessionStorage.setItem(
              TOUR_RESUME_KEY,
              JSON.stringify({ scope, stepIndex: idx })
            );
          }
        }
        active.destroy();
      } catch {
        // best-effort — if driver internals changed shape, fall through
      }
      tourInstanceRef.current = null;
    };
    // We INTENTIONALLY include replayTick so that the launcher button
    // can re-trigger the effect even when pathname did not change.
  }, [pathname, user, providerType, scope, locale, t, isRTL, router, replayTick]);

  return null;
}
