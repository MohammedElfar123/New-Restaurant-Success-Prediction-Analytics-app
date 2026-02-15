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
  BarChart3,
  Users,
  CalendarCheck,
  Building2,
  Eye,
  EyeOff,
} from "lucide-react";

export default function AdminLoginPage() {
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
    router.push("/admin/login", { locale: newLocale });
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
      userType: "admin",
    });

    if (result.success) {
      toast.success(t("loginSuccess"));
      router.push("/admin/users");
    } else {
      toast.error(result.message || t("loginFailed"));
    }
  };

  const isRTL = locale === "ar";

  return (
    <div className="min-h-screen flex">
      <Toaster position="top-center" />

      {/* Left Side - Form */}
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
          {/* Logo */}
          <div className="flex items-center gap-3 mb-10">
            <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-foreground tracking-tight">Mawadk</span>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {isRTL ? "مرحبا بعودتك" : "Welcome back"}
            </h1>
            <p className="text-muted-foreground">
              {isRTL
                ? "سجل الدخول إلى لوحة التحكم الخاصة بك"
                : "Sign in to your admin dashboard"}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">
                {tCommon("email")}
              </Label>
              <div className="relative">
                <Mail className={`absolute top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground/60 ${isRTL ? "right-3.5" : "left-3.5"}`} />
                <Input
                  id="email"
                  type="email"
                  placeholder={isRTL ? "أدخل بريدك الإلكتروني" : "Enter your email"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`h-12 ${isRTL ? "pr-11 pl-4" : "pl-11 pr-4"} bg-muted/40 border-border/60 focus:border-primary focus:bg-white text-sm rounded-xl`}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                {tCommon("password")}
              </Label>
              <div className="relative">
                <Lock className={`absolute top-1/2 -translate-y-1/2 h-[18px] w-[18px] text-muted-foreground/60 ${isRTL ? "right-3.5" : "left-3.5"}`} />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`h-12 ${isRTL ? "pr-11 pl-11" : "pl-11 pr-11"} bg-muted/40 border-border/60 focus:border-primary focus:bg-white text-sm rounded-xl`}
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
              className="w-full h-12 text-sm font-semibold rounded-xl shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-all duration-300 group"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className={isRTL ? "mr-2" : "ml-2"}>{tCommon("loading")}</span>
                </>
              ) : (
                <>
                  {t("login")}
                  <ArrowRight className={`w-4 h-4 ${isRTL ? "mr-2 group-hover:-translate-x-0.5 rotate-180" : "ml-2 group-hover:translate-x-0.5"} transition-transform`} />
                </>
              )}
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center text-muted-foreground/60 text-xs mt-10">
            &copy; {new Date().getFullYear()} Mawadk.{" " /* v2 */}
            {isRTL ? "جميع الحقوق محفوظة" : "All rights reserved"}
          </p>
        </div>
      </div>

      {/* Right Side - Visual Panel */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden bg-gradient-to-br from-primary via-blue-600 to-sky-500">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: "32px 32px",
          }}></div>
        </div>

        {/* Floating Shapes */}
        <div className="absolute top-[15%] right-[10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[20%] left-[5%] w-80 h-80 bg-sky-300/15 rounded-full blur-3xl"></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 w-full">
          {/* Main Text */}
          <div className="mb-12">
            <h2 className="text-4xl xl:text-5xl font-bold text-white mb-4 leading-tight">
              {isRTL ? (
                <>
                  إدارة منصتك
                  <br />
                  <span className="text-sky-200">الصحية بسهولة</span>
                </>
              ) : (
                <>
                  Manage your
                  <br />
                  <span className="text-sky-200">healthcare platform</span>
                </>
              )}
            </h2>
            <p className="text-white/70 text-lg max-w-md">
              {isRTL
                ? "تحكم كامل في المستشفيات والأطباء والحجوزات من مكان واحد"
                : "Full control over hospitals, doctors, and appointments from one place"}
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4 max-w-md">
            <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center mb-3">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div className="text-2xl font-bold text-white">150+</div>
              <div className="text-white/60 text-sm">
                {isRTL ? "مستشفى وعيادة" : "Hospitals & Clinics"}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center mb-3">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div className="text-2xl font-bold text-white">500+</div>
              <div className="text-white/60 text-sm">
                {isRTL ? "طبيب متخصص" : "Specialist Doctors"}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center mb-3">
                <CalendarCheck className="w-5 h-5 text-white" />
              </div>
              <div className="text-2xl font-bold text-white">10K+</div>
              <div className="text-white/60 text-sm">
                {isRTL ? "حجز شهري" : "Monthly Bookings"}
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-5">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center mb-3">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <div className="text-2xl font-bold text-white">99.9%</div>
              <div className="text-white/60 text-sm">
                {isRTL ? "وقت التشغيل" : "Uptime"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
