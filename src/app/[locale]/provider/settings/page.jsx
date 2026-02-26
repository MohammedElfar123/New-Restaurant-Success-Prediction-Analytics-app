"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useAuthStore } from "@/stores/authStore";
import ProviderAuthService from "@/lib/services/provider-auth.service";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Settings,
  Lock,
  Bell,
  Globe,
  Save,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  CheckCircle,
} from "lucide-react";
import toast from "react-hot-toast";

export default function ProviderSettingsPage() {
  const locale = useLocale();
  const t = useTranslations("common");
  const { user } = useAuthStore();
  const isRTL = locale === "ar";

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error(isRTL ? "جميع الحقول مطلوبة" : "All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(isRTL ? "كلمة المرور غير متطابقة" : "Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error(isRTL ? "كلمة المرور يجب أن تكون 6 أحرف على الأقل" : "Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      const result = await ProviderAuthService.changePassword({
        old_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });

      if (result.success) {
        toast.success(isRTL ? "تم تغيير كلمة المرور بنجاح" : "Password changed successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(result.message || (isRTL ? "فشل تغيير كلمة المرور" : "Failed to change password"));
      }
    } catch (error) {
      toast.error(isRTL ? "حدث خطأ" : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout requiredUserType="provider">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="h-10 w-10 bg-slate-200 rounded-lg flex items-center justify-center">
              <Settings className="h-5 w-5 text-slate-600" />
            </div>
            {isRTL ? "الإعدادات" : "Settings"}
          </h1>
          <p className="text-slate-500 mt-1">
            {isRTL ? "إدارة إعدادات الحساب والأمان" : "Manage account and security settings"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Change Password Card */}
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-0">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-amber-50 rounded-lg flex items-center justify-center">
                  <Lock className="h-4.5 w-4.5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {isRTL ? "تغيير كلمة المرور" : "Change Password"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isRTL ? "حافظ على أمان حسابك" : "Keep your account secure"}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              {/* Current Password */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  {isRTL ? "كلمة المرور الحالية" : "Current Password"}
                </Label>
                <div className="relative">
                  <KeyRound className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 ${isRTL ? "right-3" : "left-3"}`} />
                  <Input
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className={`h-10 ${isRTL ? "pr-10 pl-10" : "pl-10 pr-10"} bg-white`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className={`absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 ${isRTL ? "left-3" : "right-3"}`}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  {isRTL ? "كلمة المرور الجديدة" : "New Password"}
                </Label>
                <div className="relative">
                  <Lock className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 ${isRTL ? "right-3" : "left-3"}`} />
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className={`h-10 ${isRTL ? "pr-10 pl-10" : "pl-10 pr-10"} bg-white`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className={`absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 ${isRTL ? "left-3" : "right-3"}`}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  {isRTL ? "تأكيد كلمة المرور" : "Confirm Password"}
                </Label>
                <div className="relative">
                  <Lock className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 ${isRTL ? "right-3" : "left-3"}`} />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`h-10 ${isRTL ? "pr-10 pl-4" : "pl-10 pr-4"} bg-white`}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-10 gap-2" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isRTL ? "حفظ التغييرات" : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Account Settings Card */}
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-0">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Settings className="h-4.5 w-4.5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-900">
                    {isRTL ? "إعدادات الحساب" : "Account Settings"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isRTL ? "تخصيص تجربة الاستخدام" : "Customize your experience"}
                  </p>
                </div>
              </div>
            </div>

            {/* Settings Options */}
            <div className="p-6 space-y-3">
              {/* Notification Setting */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 bg-pink-50 rounded-lg flex items-center justify-center">
                    <Bell className="w-4.5 h-4.5 text-pink-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {isRTL ? "الإشعارات" : "Notifications"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {isRTL ? "إشعارات البريد والتطبيق" : "Email & app notifications"}
                    </p>
                  </div>
                </div>
                <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-200 gap-1 text-xs">
                  <CheckCircle className="h-3 w-3" />
                  {isRTL ? "مفعل" : "Enabled"}
                </Badge>
              </div>

              {/* Language Setting */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 bg-blue-50 rounded-lg flex items-center justify-center">
                    <Globe className="w-4.5 h-4.5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-700">
                      {isRTL ? "اللغة" : "Language"}
                    </p>
                    <p className="text-xs text-slate-400">
                      {isRTL ? "العربية / English" : "English / العربية"}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-slate-200 text-slate-700 text-xs">
                  {isRTL ? "العربية" : "English"}
                </Badge>
              </div>

            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
