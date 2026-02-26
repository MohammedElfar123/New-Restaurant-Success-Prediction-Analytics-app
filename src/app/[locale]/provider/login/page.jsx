"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthStore } from "@/stores/authStore";
import toast, { Toaster } from "react-hot-toast";
import {
  Mail,
  Lock,
  Loader2,
  Globe,
  ArrowRight,
  Stethoscope,
  Building2,
  Heart,
  CalendarCheck,
  ShieldCheck,
  Eye,
  EyeOff,
  UserCog,
} from "lucide-react";

export default function ProviderLoginPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading } = useAuthStore();

  const switchLanguage = () => {
    const newLocale = locale === "en" ? "ar" : "en";
    router.push("/provider/login", { locale: newLocale });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error(tCommon("required"));
      return;
    }

    const result = await login({
      email,
      password,
      userType: "provider",
    });

    if (result.success) {
      toast.success(isRTL ? "تم تسجيل الدخول بنجاح" : "Login successful");
      // Redirect based on resolved provider type
      router.push("/provider/dashboard");
    } else {
      toast.error(result.message || t("loginFailed"));
    }
  };

  const isRTL = locale === "ar";

  return (
    <div className="min-h-screen flex">
      <Toaster position="top-center" />

      {/* Left Side - Visual Panel (teal/emerald healthcare theme) */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
              backgroundSize: "32px 32px",
            }}
          ></div>
        </div>

        {/* Floating Shapes */}
        <div className="absolute top-[15%] right-[10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[20%] left-[5%] w-80 h-80 bg-teal-300/15 rounded-full blur-3xl"></div>
        <div className="absolute top-[60%] right-[30%] w-48 h-48 bg-emerald-300/10 rounded-full blur-2xl"></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 w-full">
          {/* Main Text */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center">
                <Stethoscope className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">
                Mawadk
              </span>
            </div>
            <h2 className="text-4xl xl:text-5xl font-bold text-white mb-4 leading-tight">
              {isRTL ? (
                <>
                  بوابة مقدمي
                  <br />
                  <span className="text-emerald-200">الخدمات الصحية</span>
                </>
              ) : (
                <>
                  Healthcare
                  <br />
                  <span className="text-emerald-200">Provider Portal</span>
                </>
              )}
            </h2>
            <p className="text-white/70 text-lg max-w-md">
              {isRTL
                ? "ادر عيادتك، مستشفاك، او ملفك الطبي من مكان واحد - حجوزات، جداول، وفريقك"
                : "Manage your clinic, hospital, or practice from one place - bookings, schedules, and your team"}
            </p>
          </div>

          {/* Provider Type Cards */}
          <div className="space-y-3 max-w-md">
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-4">
              <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                <Stethoscope className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-white font-semibold">
                  {isRTL ? "الأطباء" : "Doctors"}
                </div>
                <div className="text-white/60 text-sm">
                  {isRTL
                    ? "ادر حجوزاتك وجدولك ومرضاك"
                    : "Manage bookings, schedule & patients"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-4">
              <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                <Heart className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-white font-semibold">
                  {isRTL ? "العيادات" : "Clinics"}
                </div>
                <div className="text-white/60 text-sm">
                  {isRTL
                    ? "ادر أطباءك وخدماتك وحجوزاتك"
                    : "Manage doctors, services & appointments"}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-4">
              <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="text-white font-semibold">
                  {isRTL ? "المستشفيات" : "Hospitals"}
                </div>
                <div className="text-white/60 text-sm">
                  {isRTL
                    ? "ادر الأقسام والأطباء والفرق الطبية"
                    : "Manage departments, doctors & medical teams"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-20 xl:px-28 bg-white relative">
        {/* Language Switcher */}
        <button
          onClick={switchLanguage}
          className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/80 transition-colors"
        >
          <Globe className="w-4 h-4" />
          <span>{locale === "en" ? "العربية" : "English"}</span>
        </button>

        <div className="w-full max-w-[420px] mx-auto">
          {/* Mobile Logo (hidden on desktop since left panel has it) */}
          <div className="flex items-center gap-3 mb-10 lg:hidden">
            <div className="w-11 h-11 rounded-xl bg-emerald-600 flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-foreground tracking-tight">
              Mawadk
            </span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <div className="hidden lg:flex w-9 h-9 rounded-lg bg-emerald-50 items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full lg:bg-transparent lg:px-0">
                {isRTL ? "بوابة مقدمي الخدمة" : "Provider Portal"}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {isRTL ? "مرحبا بعودتك" : "Welcome back"}
            </h1>
            <p className="text-muted-foreground">
              {isRTL
                ? "سجل الدخول للأطباء والعيادات والمستشفيات"
                : "Sign in for doctors, clinics & hospitals"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="text-sm font-medium text-foreground"
              >
                {tCommon("email")}
              </Label>
              <div className="relative">
                <Mail
                  className={`absolute top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground/60 ${isRTL ? "right-3.5" : "left-3.5"}`}
                />
                <Input
                  id="email"
                  type="email"
                  placeholder={
                    isRTL
                      ? "أدخل بريدك الإلكتروني"
                      : "Enter your email"
                  }
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`h-12 ${isRTL ? "pr-11 pl-4" : "pl-11 pr-4"} bg-muted/40 border-border/60 focus:border-emerald-500 focus:bg-white text-sm rounded-xl`}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-medium text-foreground"
              >
                {tCommon("password")}
              </Label>
              <div className="relative">
                <Lock
                  className={`absolute top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground/60 ${isRTL ? "right-3.5" : "left-3.5"}`}
                />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`h-12 ${isRTL ? "pr-11 pl-11" : "pl-11 pr-11"} bg-muted/40 border-border/60 focus:border-emerald-500 focus:bg-white text-sm rounded-xl`}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground ${isRTL ? "left-3.5" : "right-3.5"}`}
                >
                  {showPassword ? (
                    <EyeOff className="h-[18px] w-[18px]" />
                  ) : (
                    <Eye className="h-[18px] w-[18px]" />
                  )}
                </button>
              </div>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              className="w-full h-12 text-sm font-semibold rounded-xl shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 transition-all duration-300 group bg-emerald-600 hover:bg-emerald-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className={isRTL ? "mr-2" : "ml-2"}>
                    {tCommon("loading")}
                  </span>
                </>
              ) : (
                <>
                  {t("login")}
                  <ArrowRight
                    className={`w-4 h-4 ${isRTL ? "mr-2 group-hover:-translate-x-0.5 rotate-180" : "ml-2 group-hover:translate-x-0.5"} transition-transform`}
                  />
                </>
              )}
            </Button>
          </form>

          {/* Switch to Admin */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border/60"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-muted-foreground/60">
                  {isRTL ? "أو سجل الدخول كـ" : "OR LOGIN AS"}
                </span>
              </div>
            </div>

            <button
              onClick={() => router.push("/admin/login")}
              className="mt-4 w-full flex items-center justify-center gap-2 h-11 rounded-xl border border-border/60 bg-muted/30 hover:bg-muted/60 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <UserCog className="w-4 h-4" />
              {isRTL ? "مدير النظام" : "System Admin"}
            </button>
          </div>

          {/* Footer */}
          <p className="text-center text-muted-foreground/60 text-xs mt-10">
            &copy; {new Date().getFullYear()} Mawadk.{" "}
            {isRTL ? "جميع الحقوق محفوظة" : "All rights reserved"}
          </p>
        </div>
      </div>
    </div>
  );
}
