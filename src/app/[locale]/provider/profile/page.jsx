"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useAuthStore } from "@/stores/authStore";
import ProviderAuthService from "@/lib/services/provider-auth.service";
import ProviderInfoService from "@/lib/services/provider-info.service";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  UserCircle, Mail, Phone, MapPin, Building2, Stethoscope, Globe, Save,
  Activity, CheckCircle, Loader2, Clock, DollarSign, Tag, RefreshCw,
  Languages, Briefcase, Image as ImageIcon,
} from "lucide-react";
import toast from "react-hot-toast";

export default function ProviderProfilePage() {
  const locale = useLocale();
  const t = useTranslations("common");
  const { user, setUser, providerType: storedProviderType } = useAuthStore();
  const isRTL = locale === "ar";

  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [accountSaving, setAccountSaving] = useState(false);
  const [infoSaving, setInfoSaving] = useState(false);
  const [schedulesSaving, setSchedulesSaving] = useState(false);
  const [categoriesSaving, setCategoriesSaving] = useState(false);

  // Active tab
  const [activeTab, setActiveTab] = useState("account");
  // Language sub-tab for provider info
  const [langTab, setLangTab] = useState("ar");

  const providerType = storedProviderType || user?.provider?.type || user?.type || "Provider";
  const getProviderLabel = () => {
    if (providerType === "Doctor") return isRTL ? "طبيب" : "Doctor";
    if (providerType === "Hospital") return isRTL ? "مستشفى" : "Hospital";
    if (providerType === "Clinic") return isRTL ? "عيادة" : "Clinic";
    return isRTL ? "مقدم خدمة" : "Provider";
  };
  const ProviderIcon = providerType === "Doctor" ? Stethoscope : Building2;

  // Admin Account form
  const [accountForm, setAccountForm] = useState({
    name: "", email: "", phone: "", image: null,
  });
  const [accountImagePreview, setAccountImagePreview] = useState(null);

  // Provider Info form
  const [infoForm, setInfoForm] = useState({
    ar_name: "", ar_address: "", ar_description: "",
    en_name: "", en_address: "", en_description: "",
    email: "", phone: "", lat: "", lng: "",
    experience_years: "", price_before_discount: "", price_after_discount: "",
    discount_percentage: "", is_active: true, image: null,
  });
  const [providerImage, setProviderImage] = useState(null);
  const [infoImagePreview, setInfoImagePreview] = useState(null);

  // Schedules (with is_working flag)
  const [schedules, setSchedules] = useState(
    Array.from({ length: 7 }, (_, i) => ({
      day_of_week: i, open_time: "08:00", close_time: "17:00", is_working: false,
    }))
  );

  // Categories
  const [allCategories, setAllCategories] = useState([]);
  const [myCategories, setMyCategories] = useState([]);

  // Fetch all data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [profileResult, infoResult, allCatResult, myCatResult] = await Promise.all([
        ProviderAuthService.getProfile(),
        ProviderInfoService.getProviderInfo(),
        ProviderInfoService.getAllCategories(),
        ProviderInfoService.getMyCategories(),
      ]);

      // Profile data
      if (profileResult.success && profileResult.data) {
        const p = profileResult.data;
        setAccountForm({ name: p.name || "", email: p.email || "", phone: p.phone || "", image: null });
        if (p.image) setAccountImagePreview(p.image);
      } else {
        setAccountForm({ name: user?.name || "", email: user?.email || "", phone: user?.phone || "", image: null });
      }

      // Provider Info data
      if (infoResult.success && infoResult.data) {
        const info = infoResult.data;
        const getTr = (loc, field) => ProviderInfoService.getTranslation(info.translations, loc, field);

        setInfoForm({
          ar_name: getTr("ar", "name") || "", ar_address: getTr("ar", "address") || "",
          ar_description: getTr("ar", "description") || "",
          en_name: getTr("en", "name") || "", en_address: getTr("en", "address") || "",
          en_description: getTr("en", "description") || "",
          email: info.email || "", phone: info.phone || "",
          lat: info.lat || "", lng: info.lng || "",
          experience_years: info.experience_years || "",
          price_before_discount: info.price_before_discount || "",
          price_after_discount: info.price_after_discount || "",
          discount_percentage: info.discount_percentage || "",
          is_active: info.is_active === 1 || info.is_active === true,
          image: null,
        });
        if (info.image) setInfoImagePreview(info.image);

        // Schedules - API returns { day: "الاثنين", hours: "9:00 AM - 5:00 PM" }
        if (info.schedules?.length > 0) {
          const DAY_NAME_TO_NUMBER = {
            "الأحد": 0, "Sunday": 0, "الاثنين": 1, "Monday": 1,
            "الثلاثاء": 2, "Tuesday": 2, "الأربعاء": 3, "Wednesday": 3,
            "الخميس": 4, "Thursday": 4, "الجمعة": 5, "Friday": 5,
            "السبت": 6, "Saturday": 6,
          };
          const convertTo24 = (time12) => {
            if (!time12) return "08:00";
            try {
              const [time, period] = time12.trim().split(" ");
              let [hours, minutes] = time.split(":").map(Number);
              if (period?.toUpperCase() === "PM" && hours !== 12) hours += 12;
              if (period?.toUpperCase() === "AM" && hours === 12) hours = 0;
              return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
            } catch { return "08:00"; }
          };
          const workingDays = new Set();
          const dayData = {};
          info.schedules.forEach((s) => {
            let dayNum = s.day_of_week;
            let openTime = s.open_time;
            let closeTime = s.close_time;
            if (dayNum === undefined && s.day) dayNum = DAY_NAME_TO_NUMBER[s.day];
            if (!openTime && s.hours) {
              const [open, close] = s.hours.split(" - ");
              openTime = convertTo24(open);
              closeTime = convertTo24(close);
            }
            if (dayNum !== undefined) {
              workingDays.add(dayNum);
              dayData[dayNum] = {
                open_time: ProviderInfoService.formatScheduleTime(openTime) || "08:00",
                close_time: ProviderInfoService.formatScheduleTime(closeTime) || "17:00",
              };
            }
          });
          setSchedules(Array.from({ length: 7 }, (_, i) => ({
            day_of_week: i,
            open_time: dayData[i]?.open_time || "08:00",
            close_time: dayData[i]?.close_time || "17:00",
            is_working: workingDays.has(i),
          })));
        }
      }

      // Categories
      if (allCatResult.success) setAllCategories(allCatResult.data);
      if (myCatResult.success) setMyCategories(myCatResult.data.map((c) => c.id));
    } catch (error) {
      console.error("Error fetching profile data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Save Admin Account
  const handleSaveAccount = async (e) => {
    e.preventDefault();
    if (!accountForm.name || !accountForm.email) {
      toast.error(isRTL ? "الاسم والبريد مطلوبين" : "Name and email are required");
      return;
    }
    setAccountSaving(true);
    try {
      const result = await ProviderAuthService.updateAccount(accountForm);
      if (result.success) {
        toast.success(isRTL ? "تم تحديث الحساب" : "Account updated");
        if (result.data) setUser({ ...user, ...result.data });
      } else {
        toast.error(result.message);
      }
    } catch { toast.error(isRTL ? "حدث خطأ" : "An error occurred"); }
    finally { setAccountSaving(false); }
  };

  // Save Provider Info
  const handleSaveInfo = async (e) => {
    e.preventDefault();
    setInfoSaving(true);
    try {
      const result = await ProviderInfoService.updateProviderInfo(infoForm);
      if (result.success) {
        toast.success(isRTL ? "تم تحديث معلومات المنشأة" : "Provider info updated");
      } else {
        toast.error(result.message);
      }
    } catch { toast.error(isRTL ? "حدث خطأ" : "An error occurred"); }
    finally { setInfoSaving(false); }
  };

  // Save Schedules (only working days)
  const handleSaveSchedules = async () => {
    const workingSchedules = schedules.filter((s) => s.is_working);
    if (workingSchedules.length === 0) {
      toast.error(isRTL ? "يجب تحديد يوم عمل واحد على الأقل" : "Select at least one working day");
      return;
    }
    setSchedulesSaving(true);
    try {
      const result = await ProviderInfoService.updateSchedules(workingSchedules);
      if (result.success) {
        toast.success(isRTL ? "تم تحديث أوقات العمل" : "Schedules updated");
      } else {
        toast.error(result.message);
      }
    } catch { toast.error(isRTL ? "حدث خطأ" : "An error occurred"); }
    finally { setSchedulesSaving(false); }
  };

  // Save Categories
  const handleSaveCategories = async () => {
    if (myCategories.length === 0) {
      toast.error(isRTL ? "يجب اختيار تخصص واحد على الأقل" : "Select at least one category");
      return;
    }
    setCategoriesSaving(true);
    try {
      const result = await ProviderInfoService.updateCategories(myCategories);
      if (result.success) {
        toast.success(isRTL ? "تم تحديث التخصصات" : "Categories updated");
      } else {
        toast.error(result.message);
      }
    } catch { toast.error(isRTL ? "حدث خطأ" : "An error occurred"); }
    finally { setCategoriesSaving(false); }
  };

  const toggleCategory = (catId) => {
    setMyCategories((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const updateSchedule = (dayIndex, field, value) => {
    setSchedules((prev) =>
      prev.map((s) => (s.day_of_week === dayIndex ? { ...s, [field]: value } : s))
    );
  };

  const toggleWorkingDay = (dayIndex) => {
    setSchedules((prev) =>
      prev.map((s) => (s.day_of_week === dayIndex ? { ...s, is_working: !s.is_working } : s))
    );
  };

  const tabs = [
    { id: "account", label: isRTL ? "الحساب" : "Account", icon: UserCircle },
    { id: "info", label: isRTL ? "المنشأة" : "Provider", icon: Building2 },
    { id: "schedules", label: isRTL ? "المواعيد" : "Hours", icon: Clock },
    { id: "categories", label: isRTL ? "التخصصات" : "Specialties", icon: Tag },
  ];

  // Section header component
  const SectionHeader = ({ icon: Icon, iconBg, iconColor, title, description }) => (
    <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
      <div className="flex items-center gap-3">
        <div className={`h-10 w-10 ${iconBg} rounded-lg flex items-center justify-center`}>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
          <p className="text-xs text-slate-500">{description}</p>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <DashboardLayout requiredUserType="provider">
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
            <p className="text-slate-500">{isRTL ? "جاري تحميل البيانات..." : "Loading data..."}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredUserType="provider">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <UserCircle className="h-5 w-5 text-blue-600" />
            </div>
            {isRTL ? "الملف الشخصي" : "Profile"}
          </h1>
          <p className="text-slate-500 mt-1">
            {isRTL ? "إدارة معلومات حسابك ومنشأتك" : "Manage your account and facility information"}
          </p>
        </div>
        <Button variant="ghost" size="sm" className="h-9 w-9 p-0" onClick={fetchData} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="space-y-4">
          {/* Profile Summary Card */}
          <Card className="border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-br from-primary to-primary/80 p-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3">
                <ProviderIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-1">{user?.name || "Provider"}</h3>
              <Badge className="bg-white/20 text-white border-0 hover:bg-white/30">
                {getProviderLabel()}
              </Badge>
            </div>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 text-sm">
                <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-slate-600 truncate">{user?.email || "—"}</span>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 text-sm">
                <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-slate-600 truncate" dir="ltr">{user?.phone || "—"}</span>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 text-sm">
                <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-slate-600">
                  {schedules.filter(s => s.is_working).length} {isRTL ? "أيام عمل" : "working days"}
                </span>
              </div>
              <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-50 text-sm">
                <Tag className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-slate-600">
                  {myCategories.length} {isRTL ? "تخصصات" : "specialties"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Tab Navigation */}
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-2">
              <div className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? "bg-primary text-white"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Tab: Account */}
          {activeTab === "account" && (
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-0">
                <SectionHeader
                  icon={UserCircle} iconBg="bg-blue-100" iconColor="text-blue-600"
                  title={isRTL ? "الحساب الشخصي" : "My Account"}
                  description={isRTL ? "تعديل بيانات حسابك الشخصي" : "Update your personal account details"}
                />
                <form onSubmit={handleSaveAccount} className="p-6 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">
                        {isRTL ? "الاسم" : "Name"} <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        value={accountForm.name}
                        onChange={(e) => setAccountForm((p) => ({ ...p, name: e.target.value }))}
                        className="h-11 bg-white"
                        disabled={accountSaving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">
                        {isRTL ? "البريد الإلكتروني" : "Email"} <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        type="email"
                        value={accountForm.email}
                        onChange={(e) => setAccountForm((p) => ({ ...p, email: e.target.value }))}
                        className="h-11 bg-white"
                        disabled={accountSaving}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">{isRTL ? "الهاتف" : "Phone"}</Label>
                      <Input
                        value={accountForm.phone}
                        onChange={(e) => setAccountForm((p) => ({ ...p, phone: e.target.value }))}
                        className="h-11 bg-white" dir="ltr"
                        disabled={accountSaving}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">{isRTL ? "الصورة" : "Profile Image"}</Label>
                      <Input
                        type="file" accept="image/*"
                        onChange={(e) => setAccountForm((p) => ({ ...p, image: e.target.files?.[0] || null }))}
                        className="h-11 bg-white"
                        disabled={accountSaving}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end pt-2">
                    <Button type="submit" className="gap-2 h-10 min-w-[140px]" disabled={accountSaving}>
                      {accountSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {isRTL ? "حفظ التغييرات" : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Tab: Provider Info */}
          {activeTab === "info" && (
            <div className="space-y-6">
              {/* Translations Card */}
              <Card className="border-slate-200 shadow-sm">
                <CardContent className="p-0">
                  <SectionHeader
                    icon={Languages} iconBg="bg-blue-100" iconColor="text-blue-600"
                    title={isRTL ? "المعلومات والترجمات" : "Information & Translations"}
                    description={isRTL ? "البيانات العامة للمنشأة (تظهر للمرضى)" : "Public-facing facility information"}
                  />
                  <form onSubmit={handleSaveInfo} className="p-6 space-y-5">
                    {/* Language Tabs */}
                    <div className="flex items-center bg-slate-100 rounded-lg p-1 w-fit">
                      <button type="button" onClick={() => setLangTab("ar")}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          langTab === "ar" ? "bg-white text-primary shadow-sm" : "text-slate-600"
                        }`}>العربية</button>
                      <button type="button" onClick={() => setLangTab("en")}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                          langTab === "en" ? "bg-white text-primary shadow-sm" : "text-slate-600"
                        }`}>English</button>
                    </div>

                    {langTab === "ar" && (
                      <div className="space-y-4" dir="rtl">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700">الاسم بالعربية</Label>
                            <Input value={infoForm.ar_name} onChange={(e) => setInfoForm((p) => ({ ...p, ar_name: e.target.value }))} className="h-11 bg-white" disabled={infoSaving} />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700">العنوان بالعربية</Label>
                            <Input value={infoForm.ar_address} onChange={(e) => setInfoForm((p) => ({ ...p, ar_address: e.target.value }))} className="h-11 bg-white" disabled={infoSaving} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">الوصف بالعربية</Label>
                          <textarea value={infoForm.ar_description} onChange={(e) => setInfoForm((p) => ({ ...p, ar_description: e.target.value }))}
                            className="w-full h-24 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            disabled={infoSaving} />
                        </div>
                      </div>
                    )}

                    {langTab === "en" && (
                      <div className="space-y-4" dir="ltr">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700">English Name</Label>
                            <Input value={infoForm.en_name} onChange={(e) => setInfoForm((p) => ({ ...p, en_name: e.target.value }))} className="h-11 bg-white" disabled={infoSaving} />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium text-slate-700">English Address</Label>
                            <Input value={infoForm.en_address} onChange={(e) => setInfoForm((p) => ({ ...p, en_address: e.target.value }))} className="h-11 bg-white" disabled={infoSaving} />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">English Description</Label>
                          <textarea value={infoForm.en_description} onChange={(e) => setInfoForm((p) => ({ ...p, en_description: e.target.value }))}
                            className="w-full h-24 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            disabled={infoSaving} />
                        </div>
                      </div>
                    )}

                    <Separator />

                    {/* Contact & Location */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-emerald-500" />
                        {isRTL ? "التواصل والموقع" : "Contact & Location"}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">{isRTL ? "البريد الإلكتروني" : "Email"}</Label>
                          <Input type="email" value={infoForm.email} onChange={(e) => setInfoForm((p) => ({ ...p, email: e.target.value }))} className="h-11 bg-white" disabled={infoSaving} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">{isRTL ? "الهاتف" : "Phone"}</Label>
                          <Input value={infoForm.phone} onChange={(e) => setInfoForm((p) => ({ ...p, phone: e.target.value }))} className="h-11 bg-white" dir="ltr" disabled={infoSaving} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">{isRTL ? "خط العرض" : "Latitude"}</Label>
                          <Input value={infoForm.lat} onChange={(e) => setInfoForm((p) => ({ ...p, lat: e.target.value }))} className="h-11 bg-white" dir="ltr" disabled={infoSaving} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">{isRTL ? "خط الطول" : "Longitude"}</Label>
                          <Input value={infoForm.lng} onChange={(e) => setInfoForm((p) => ({ ...p, lng: e.target.value }))} className="h-11 bg-white" dir="ltr" disabled={infoSaving} />
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Experience & Pricing */}
                    <div>
                      <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-primary" />
                        {isRTL ? "الخبرة والتسعير" : "Experience & Pricing"}
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">{isRTL ? "سنوات الخبرة" : "Experience"}</Label>
                          <Input type="number" value={infoForm.experience_years} onChange={(e) => setInfoForm((p) => ({ ...p, experience_years: e.target.value }))} className="h-11 bg-white" min="0" disabled={infoSaving} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">{isRTL ? "السعر قبل" : "Price Before"}</Label>
                          <Input type="number" value={infoForm.price_before_discount} onChange={(e) => setInfoForm((p) => ({ ...p, price_before_discount: e.target.value }))} className="h-11 bg-white" min="0" disabled={infoSaving} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">{isRTL ? "السعر بعد" : "Price After"}</Label>
                          <Input type="number" value={infoForm.price_after_discount} onChange={(e) => setInfoForm((p) => ({ ...p, price_after_discount: e.target.value }))} className="h-11 bg-white" min="0" disabled={infoSaving} />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">{isRTL ? "الخصم %" : "Discount %"}</Label>
                          <Input type="number" value={infoForm.discount_percentage} onChange={(e) => setInfoForm((p) => ({ ...p, discount_percentage: e.target.value }))} className="h-11 bg-white" min="0" max="100" disabled={infoSaving} />
                        </div>
                      </div>
                    </div>

                    {/* Image */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-700">{isRTL ? "صورة المنشأة" : "Facility Image"}</Label>
                      <Input type="file" accept="image/*"
                        onChange={(e) => setInfoForm((p) => ({ ...p, image: e.target.files?.[0] || null }))}
                        className="h-11 bg-white" disabled={infoSaving} />
                    </div>

                    <div className="flex justify-end pt-2">
                      <Button type="submit" className="gap-2 h-10 min-w-[140px]" disabled={infoSaving}>
                        {infoSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        {isRTL ? "حفظ التغييرات" : "Save Changes"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Tab: Schedules */}
          {activeTab === "schedules" && (
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-0">
                <SectionHeader
                  icon={Clock} iconBg="bg-cyan-100" iconColor="text-cyan-600"
                  title={isRTL ? "أوقات العمل" : "Business Hours"}
                  description={isRTL ? "تحديد أوقات عمل المنشأة لكل يوم" : "Set your facility's working hours for each day"}
                />
                <div className="p-6 space-y-3">
                  {schedules.map((schedule, index) => (
                    <div
                      key={`day-${schedule.day_of_week}`}
                      className={`flex items-center gap-4 p-3 rounded-lg border transition-colors ${
                        schedule.is_working
                          ? "bg-white border-slate-200"
                          : "bg-slate-50 border-slate-100"
                      }`}
                    >
                      <Switch
                        checked={schedule.is_working}
                        onCheckedChange={() => toggleWorkingDay(schedule.day_of_week)}
                        disabled={schedulesSaving}
                      />
                      <span className={`w-24 text-sm font-medium ${
                        schedule.is_working ? "text-slate-900" : "text-slate-400"
                      }`}>
                        {ProviderInfoService.getDayName(schedule.day_of_week, locale)}
                      </span>
                      {schedule.is_working ? (
                        <>
                          <Input type="time" value={schedule.open_time}
                            onChange={(e) => updateSchedule(schedule.day_of_week, "open_time", e.target.value)}
                            className="w-32 h-9 text-sm bg-white" disabled={schedulesSaving} />
                          <span className="text-slate-400">—</span>
                          <Input type="time" value={schedule.close_time}
                            onChange={(e) => updateSchedule(schedule.day_of_week, "close_time", e.target.value)}
                            className="w-32 h-9 text-sm bg-white" disabled={schedulesSaving} />
                        </>
                      ) : (
                        <span className="text-sm text-slate-400">
                          {isRTL ? "يوم إجازة" : "Day off"}
                        </span>
                      )}
                    </div>
                  ))}

                  <div className="flex items-center justify-between pt-4">
                    <span className="text-sm text-slate-500">
                      {schedules.filter(s => s.is_working).length} / 7 {isRTL ? "أيام عمل" : "working days"}
                    </span>
                    <Button className="gap-2 h-10 min-w-[140px]" onClick={handleSaveSchedules} disabled={schedulesSaving}>
                      {schedulesSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      {isRTL ? "حفظ المواعيد" : "Save Schedule"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tab: Categories */}
          {activeTab === "categories" && (
            <Card className="border-slate-200 shadow-sm">
              <CardContent className="p-0">
                <SectionHeader
                  icon={Tag} iconBg="bg-purple-100" iconColor="text-purple-600"
                  title={isRTL ? "التخصصات الطبية" : "Medical Specialties"}
                  description={isRTL ? "اختر التخصصات التي تقدمها منشأتك" : "Select the specialties your facility offers"}
                />
                <div className="p-6">
                  {allCategories.length === 0 ? (
                    <div className="text-center py-8">
                      <Tag className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                      <p className="text-slate-500">{isRTL ? "لا توجد تخصصات متاحة" : "No categories available"}</p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {allCategories.map((cat) => {
                          const isSelected = myCategories.includes(cat.id);
                          return (
                            <button key={cat.id} onClick={() => toggleCategory(cat.id)}
                              className={`flex items-center gap-3 p-3 rounded-xl text-sm font-medium transition-all border ${
                                isSelected
                                  ? "bg-primary/5 text-primary border-primary shadow-sm"
                                  : "bg-white text-slate-600 border-slate-200 hover:border-primary/30"
                              }`}>
                              <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                isSelected ? "bg-primary/10" : "bg-slate-100"
                              }`}>
                                {cat.image ? (
                                  <img src={cat.image} alt="" className="h-5 w-5 rounded object-cover" />
                                ) : (
                                  <Tag className={`h-4 w-4 ${isSelected ? "text-primary" : "text-slate-400"}`} />
                                )}
                              </div>
                              <span className="flex-1 text-start">{cat.name}</span>
                              {isSelected && <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />}
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-sm text-slate-500">
                          {myCategories.length} / {allCategories.length} {isRTL ? "تخصص مختار" : "selected"}
                        </span>
                        <Button className="gap-2 h-10 min-w-[140px]" onClick={handleSaveCategories} disabled={categoriesSaving}>
                          {categoriesSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          {isRTL ? "حفظ التخصصات" : "Save Categories"}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
