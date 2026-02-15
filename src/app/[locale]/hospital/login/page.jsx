"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/routing";
import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/stores/authStore";
import toast, { Toaster } from "react-hot-toast";
import { Mail, Lock, Loader2, Building2, Globe, Heart, Users, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export default function HospitalLoginPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading } = useAuthStore();

  const switchLanguage = () => {
    const newLocale = locale === "en" ? "ar" : "en";
    router.push("/hospital/login", { locale: newLocale });
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
      userType: "hospital",
    });

    if (result.success) {
      toast.success(t("loginSuccess"));
      router.push("/hospital/dashboard");
    } else {
      toast.error(result.message || t("loginFailed"));
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      <Toaster position="top-center" />

      {/* Animated Background - Coral/Pink Theme */}
      <div className="absolute inset-0 bg-gradient-to-br from-pink-100 via-rose-50 to-orange-50">
        {/* Animated Circles */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-secondary/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-rose-100/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "2s" }}></div>
      </div>

      {/* Language Switcher */}
      <button
        onClick={switchLanguage}
        className="absolute top-6 right-6 z-20 flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-md hover:bg-white/80 rounded-xl text-secondary transition-all duration-300 border border-secondary/20 hover:scale-105 shadow-lg"
      >
        <Globe className="w-4 h-4" />
        <span className="text-sm font-medium">{locale === "en" ? "العربية" : "English"}</span>
      </button>

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-6xl mx-auto grid md:grid-cols-2 gap-8 items-center">

        {/* Left Side - Branding */}
        <div className="hidden md:block space-y-8">
          <div className="space-y-4">
            {/* Logo */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 rounded-2xl bg-white/60 backdrop-blur-md flex items-center justify-center border border-secondary/30 shadow-2xl">
                <Building2 className="w-8 h-8 text-secondary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-foreground">Mawadk</h1>
                <p className="text-muted-foreground text-sm">Hospital Management Portal</p>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-4 mt-12">
              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-secondary/20 shadow-lg">
                <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1 text-foreground">Patient Care Excellence</h3>
                  <p className="text-muted-foreground text-sm">Manage your hospital operations and deliver outstanding healthcare services</p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-4 rounded-xl bg-white/60 backdrop-blur-sm border border-secondary/20 shadow-lg">
                <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center flex-shrink-0">
                  <Users className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1 text-foreground">Staff Management</h3>
                  <p className="text-muted-foreground text-sm">Coordinate doctors, appointments, and resources efficiently</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full max-w-md mx-auto">
          {/* Glassmorphism Card */}
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/60 overflow-hidden">

            {/* Header */}
            <div className="bg-gradient-to-br from-secondary via-pink-300 to-rose-300 p-8 text-white text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Building2 className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold mb-2">{t("hospitalLogin")}</h2>
              <p className="text-white/90 text-sm">{t("loginToAccount")}</p>
            </div>

            {/* Form */}
            <div className="p-8">

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">{tCommon("email")}</Label>
                  <div className="relative group">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="hospital@mawadk.qa"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 bg-muted/50 border-muted focus:border-secondary focus:ring-secondary/20"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">{tCommon("password")}</Label>
                  <div className="relative group">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground group-hover:text-secondary transition-colors" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 h-12 bg-muted/50 border-muted focus:border-secondary focus:ring-secondary/20"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold bg-gradient-to-r from-secondary via-pink-300 to-rose-300 hover:from-secondary hover:to-pink-400 text-foreground shadow-lg hover:shadow-xl transition-all duration-300 group"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      {tCommon("loading")}
                    </>
                  ) : (
                    <>
                      {t("login")}
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
              </form>

            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-muted-foreground text-sm mt-6">
            © 2025 Mawadk. {locale === "ar" ? "جميع الحقوق محفوظة" : "All rights reserved"}
          </p>
        </div>
      </div>
    </div>
  );
}
