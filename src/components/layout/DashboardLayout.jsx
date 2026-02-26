"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "@/i18n/routing";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { useParams } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function DashboardLayout({ children, requiredUserType }) {
  const router = useRouter();
  const { isAuthenticated, userType } = useAuthStore();
  const { startPolling, stopPolling, reset: resetNotifications } = useNotificationStore();
  const params = useParams();
  const locale = params.locale;
  const [isClient, setIsClient] = useState(false);

  // Provider types that match "provider" requiredUserType
  const PROVIDER_TYPES = ["provider", "doctor", "hospital"];

  // Check if the current userType matches the required type
  const isTypeMatch = requiredUserType === "provider"
    ? PROVIDER_TYPES.includes(userType)
    : userType === requiredUserType;

  // Handle hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (isClient && !isAuthenticated) {
      router.replace(`/${requiredUserType}/login`);
    } else if (isClient && isAuthenticated && !isTypeMatch) {
      // Redirect to correct dashboard if user type doesn't match
      const redirectBase = PROVIDER_TYPES.includes(userType) ? "provider" : userType;
      router.replace(`/${redirectBase}/${userType === 'admin' ? 'users' : 'dashboard'}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, isAuthenticated, userType, requiredUserType, isTypeMatch]);

  // Start notification polling when authenticated, reset on logout
  useEffect(() => {
    if (isClient && isAuthenticated) {
      startPolling();
    } else if (isClient && !isAuthenticated) {
      resetNotifications();
    }
    return () => {
      stopPolling();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isClient, isAuthenticated]);

  // Show loading or nothing while checking auth on client
  if (!isClient) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated || !isTypeMatch) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar userType={userType} locale={locale} />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <Header />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
