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
import { Mail, Lock, Loader2, Globe, Stethoscope, Activity, Calendar, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export default function DoctorLoginPage() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading } = useAuthStore();

  const switchLanguage = () => {
    const newLocale = locale === "en" ? "ar" : "en";
    router.push("/doctor/login", { locale: newLocale });
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
      userType: "doctor",
    });

    if (result.success) {
      toast.success(t("loginSuccess"));
      router.push("/doctor/dashboard");
    } else {
      toast.error(result.message || t("loginFailed"));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center success-gradient p-4">
      <Toaster position="top-center" />

      {/* Language Switcher */}
      <button
        onClick={switchLanguage}
        className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
      >
        <Globe className="w-4 h-4" />
        <span className="text-sm font-medium">{locale === "en" ? "العربية" : "English"}</span>
      </button>

      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          {/* Logo */}
          <div className="mx-auto w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center">
            <Stethoscope className="w-8 h-8 text-accent" />
          </div>

          <div>
            <CardTitle className="text-2xl">{t("doctorLogin")}</CardTitle>
            <CardDescription className="mt-2">
              {t("loginToAccount")}
            </CardDescription>
          </div>

        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">{tCommon("email")}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="doctor@mawadk.qa"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password">{tCommon("password")}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {tCommon("loading")}
                </>
              ) : (
                t("login")
              )}
            </Button>
          </form>

          {/* Quick Stats After Login */}
          <div className="mt-6 p-4 bg-muted/30 rounded-lg">
            <div className="text-sm text-center text-muted-foreground mb-2">
              {locale === "ar" ? "بعد تسجيل الدخول:" : "After login:"}
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-lg font-bold text-primary">15</div>
                <div className="text-xs text-muted-foreground">
                  {locale === "ar" ? "اليوم" : "Today"}
                </div>
              </div>
              <div>
                <div className="text-lg font-bold text-accent">1,250</div>
                <div className="text-xs text-muted-foreground">
                  {locale === "ar" ? "المرضى" : "Patients"}
                </div>
              </div>
              <div>
                <div className="text-lg font-bold text-yellow-600">4.9</div>
                <div className="text-xs text-muted-foreground">
                  {locale === "ar" ? "التقييم" : "Rating"}
                </div>
              </div>
            </div>
          </div>

        </CardContent>
      </Card>

      {/* Footer */}
      <div className="absolute bottom-4 text-center text-white/80 text-sm">
        © 2026 Mawadk. {locale === "ar" ? "جميع الحقوق محفوظة" : "All rights reserved"}
      </div>
    </div>
  );
}
