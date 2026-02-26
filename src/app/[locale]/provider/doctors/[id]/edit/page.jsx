"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import ProviderDoctorsService from "@/lib/services/provider-doctors.service";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Stethoscope,
  Loader2,
  AlertCircle,
  Save,
  Clock,
  DollarSign,
  FileText,
  ImageIcon,
} from "lucide-react";
import toast from "react-hot-toast";

export default function EditProviderDoctorPage() {
  const locale = useLocale();
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const isRTL = locale === "ar";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [doctor, setDoctor] = useState(null);
  const [categories, setCategories] = useState([]);

  const [formData, setFormData] = useState({
    ar_name: "",
    en_name: "",
    ar_short_description: "",
    en_short_description: "",
    category_id: "",
    experience_years: "",
    price_before_discount: "",
    price_after_discount: "",
    discount_percentage: "",
    is_active: true,
    schedules: ProviderDoctorsService.getDefaultSchedule(),
    image: null,
  });

  // Preview for existing image
  const [existingImage, setExistingImage] = useState(null);

  // Fetch doctor data and categories
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [doctorResult, catResult] = await Promise.all([
          ProviderDoctorsService.getProviderDoctorById(id),
          ProviderDoctorsService.getCategoriesDropdown(),
        ]);

        if (doctorResult.success && doctorResult.data) {
          const doc = doctorResult.data;
          setDoctor(doc);
          setExistingImage(doc.image || null);

          // Extract translations
          const arTrans = doc.translations?.find((t) => t.locale === "ar") || {};
          const enTrans = doc.translations?.find((t) => t.locale === "en") || {};

          // Extract schedules - merge API times with localStorage is_working flags
          let schedules;
          // Load cached is_working states from localStorage
          let cachedWorkingFlags = {};
          try {
            const cached = localStorage.getItem(`doctor_schedules_${id}`);
            if (cached) {
              const cachedSchedules = JSON.parse(cached);
              cachedSchedules.forEach(s => {
                cachedWorkingFlags[s.day_of_week] = s.is_working;
              });
            }
          } catch { /* ignore */ }

          if (doc.schedules?.length > 0) {
            const dayData = {};
            doc.schedules.forEach(s => {
              dayData[s.day_of_week] = {
                open_time: s.open_time?.substring(0, 5) || "08:00",
                close_time: s.close_time?.substring(0, 5) || "17:00",
              };
            });
            schedules = Array.from({ length: 7 }, (_, i) => ({
              day_of_week: i,
              open_time: dayData[i]?.open_time || "08:00",
              close_time: dayData[i]?.close_time || "17:00",
              // Use cached is_working if available, otherwise default to true
              is_working: cachedWorkingFlags[i] !== undefined ? cachedWorkingFlags[i] : true,
            }));
          } else {
            schedules = ProviderDoctorsService.getDefaultSchedule();
          }

          // Check active status
          const v = doc.status ?? doc.is_active;
          const isActive = v === 1 || v === true || v === "1" || v === "active";

          setFormData({
            ar_name: arTrans.name || doc.name || "",
            en_name: enTrans.name || "",
            ar_short_description: arTrans.short_description || doc.short_description || "",
            en_short_description: enTrans.short_description || "",
            category_id: doc.category_id || doc.category?.id || "",
            experience_years: doc.experience_years || "",
            price_before_discount: doc.price_before_discount || "",
            price_after_discount: doc.price_after_discount || "",
            discount_percentage: doc.discount_percentage || "",
            is_active: isActive,
            schedules,
            image: null,
          });
        }

        if (catResult.success) {
          setCategories(catResult.data);
        }
      } catch (error) {
        console.error("Error fetching doctor data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id]);

  // Update schedule
  const updateSchedule = (dayIndex, field, value) => {
    setFormData((prev) => ({
      ...prev,
      schedules: prev.schedules.map((s) =>
        s.day_of_week === dayIndex ? { ...s, [field]: value } : s
      ),
    }));
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.ar_name && !formData.en_name) {
      toast.error(isRTL ? "الاسم مطلوب" : "Name is required");
      return;
    }

    setSaving(true);
    try {
      const builtFormData = ProviderDoctorsService.buildFormData(formData);

      // Debug: log what's being sent
      if (process.env.NODE_ENV === "development") {
        console.log("[EditDoctor] Sending update for ID:", id);
        for (const [key, value] of builtFormData.entries()) {
          console.log(`[EditDoctor] ${key}:`, value);
        }
      }

      const result = await ProviderDoctorsService.updateProviderDoctor(id, builtFormData);

      // Debug: log the result
      if (process.env.NODE_ENV === "development") {
        console.log("[EditDoctor] Update result:", result);
      }

      if (result.success) {
        // Cache schedules in localStorage since API doesn't return them on GET
        try {
          localStorage.setItem(`doctor_schedules_${id}`, JSON.stringify(formData.schedules));
        } catch { /* ignore */ }
        toast.success(isRTL ? "تم تحديث الطبيب بنجاح" : "Doctor updated successfully");
        router.push(`/${locale}/provider/doctors/${id}`);
      } else {
        toast.error(result.message || (isRTL ? "فشل التحديث" : "Update failed"));
      }
    } catch (err) {
      console.error("[EditDoctor] Error:", err);
      toast.error(isRTL ? "حدث خطأ" : "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <DashboardLayout requiredUserType="provider">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
            <p className="text-slate-500">{isRTL ? "جاري التحميل..." : "Loading..."}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Not found state
  if (!doctor) {
    return (
      <DashboardLayout requiredUserType="provider">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <AlertCircle className="h-16 w-16 text-slate-300 mb-4" />
          <h2 className="text-xl font-semibold text-slate-700 mb-2">
            {isRTL ? "لم يتم العثور على الطبيب" : "Doctor not found"}
          </h2>
          <Button
            variant="outline"
            onClick={() => router.push(`/${locale}/provider/doctors`)}
            className="gap-2 mt-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {isRTL ? "رجوع" : "Back"}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredUserType="provider">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/${locale}/provider/doctors/${id}`)}
            className="h-10 w-10 rounded-xl hover:bg-slate-100"
          >
            <ArrowLeft className={`h-5 w-5 ${isRTL ? "rotate-180" : ""}`} />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
              <div className="h-10 w-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <Stethoscope className="h-5 w-5 text-amber-600" />
              </div>
              {isRTL ? "تعديل الطبيب" : "Edit Doctor"}
            </h1>
            <p className="text-slate-500 mt-1">
              {isRTL ? `تعديل بيانات ${doctor.name || ""}` : `Edit ${doctor.name || ""}'s information`}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Doctor Info Card */}
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  {isRTL ? "معلومات الطبيب" : "Doctor Information"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Arabic Name & English Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      {isRTL ? "الاسم بالعربية" : "Arabic Name"} *
                    </Label>
                    <Input
                      value={formData.ar_name}
                      onChange={(e) => setFormData((p) => ({ ...p, ar_name: e.target.value }))}
                      placeholder={isRTL ? "اسم الطبيب بالعربية" : "Doctor name in Arabic"}
                      className="h-10 bg-white"
                      dir="rtl"
                      disabled={saving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      {isRTL ? "الاسم بالإنجليزية" : "English Name"} *
                    </Label>
                    <Input
                      value={formData.en_name}
                      onChange={(e) => setFormData((p) => ({ ...p, en_name: e.target.value }))}
                      placeholder="Doctor name in English"
                      className="h-10 bg-white"
                      dir="ltr"
                      disabled={saving}
                    />
                  </div>
                </div>

                {/* Descriptions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      {isRTL ? "الوصف بالعربية" : "Arabic Description"}
                    </Label>
                    <textarea
                      value={formData.ar_short_description}
                      onChange={(e) => setFormData((p) => ({ ...p, ar_short_description: e.target.value }))}
                      placeholder={isRTL ? "وصف قصير بالعربية" : "Short description in Arabic"}
                      className="w-full h-24 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      dir="rtl"
                      disabled={saving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      {isRTL ? "الوصف بالإنجليزية" : "English Description"}
                    </Label>
                    <textarea
                      value={formData.en_short_description}
                      onChange={(e) => setFormData((p) => ({ ...p, en_short_description: e.target.value }))}
                      placeholder="Short description in English"
                      className="w-full h-24 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      dir="ltr"
                      disabled={saving}
                    />
                  </div>
                </div>

                {/* Category & Experience */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      {isRTL ? "التخصص" : "Specialty"}
                    </Label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData((p) => ({ ...p, category_id: e.target.value }))}
                      className="w-full h-10 px-3 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      disabled={saving}
                    >
                      <option value="">{isRTL ? "اختر التخصص" : "Select specialty"}</option>
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      {isRTL ? "سنوات الخبرة" : "Experience (years)"}
                    </Label>
                    <Input
                      type="number"
                      value={formData.experience_years}
                      onChange={(e) => setFormData((p) => ({ ...p, experience_years: e.target.value }))}
                      placeholder="5"
                      className="h-10 bg-white"
                      min="0"
                      disabled={saving}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing Card */}
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  {isRTL ? "التسعير" : "Pricing"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      {isRTL ? "السعر قبل الخصم" : "Price Before Discount"}
                    </Label>
                    <Input
                      type="number"
                      value={formData.price_before_discount}
                      onChange={(e) => setFormData((p) => ({ ...p, price_before_discount: e.target.value }))}
                      placeholder="200"
                      className="h-10 bg-white"
                      min="0"
                      disabled={saving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      {isRTL ? "السعر بعد الخصم" : "Price After Discount"}
                    </Label>
                    <Input
                      type="number"
                      value={formData.price_after_discount}
                      onChange={(e) => setFormData((p) => ({ ...p, price_after_discount: e.target.value }))}
                      placeholder="150"
                      className="h-10 bg-white"
                      min="0"
                      disabled={saving}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      {isRTL ? "نسبة الخصم %" : "Discount %"}
                    </Label>
                    <Input
                      type="number"
                      value={formData.discount_percentage}
                      onChange={(e) => setFormData((p) => ({ ...p, discount_percentage: e.target.value }))}
                      placeholder="25"
                      className="h-10 bg-white"
                      min="0"
                      max="100"
                      disabled={saving}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Working Schedule Card */}
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  {isRTL ? "أوقات العمل" : "Working Schedule"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {formData.schedules.map((schedule) => (
                    <div
                      key={schedule.day_of_week}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                        schedule.is_working
                          ? "bg-white border-slate-200"
                          : "bg-slate-50 border-slate-100"
                      }`}
                    >
                      <Switch
                        checked={schedule.is_working}
                        onCheckedChange={(checked) =>
                          updateSchedule(schedule.day_of_week, "is_working", checked)
                        }
                        disabled={saving}
                      />
                      <span className={`text-sm font-medium w-24 flex-shrink-0 ${
                        schedule.is_working ? "text-slate-700" : "text-slate-400"
                      }`}>
                        {ProviderDoctorsService.getDayName(schedule.day_of_week, locale)}
                      </span>
                      {schedule.is_working ? (
                        <>
                          <Input
                            type="time"
                            value={schedule.open_time}
                            onChange={(e) => updateSchedule(schedule.day_of_week, "open_time", e.target.value)}
                            className="h-9 text-sm bg-white flex-1"
                            disabled={saving}
                          />
                          <span className="text-xs text-slate-400">{isRTL ? "إلى" : "to"}</span>
                          <Input
                            type="time"
                            value={schedule.close_time}
                            onChange={(e) => updateSchedule(schedule.day_of_week, "close_time", e.target.value)}
                            className="h-9 text-sm bg-white flex-1"
                            disabled={saving}
                          />
                        </>
                      ) : (
                        <span className="text-sm text-slate-400 italic">
                          {isRTL ? "يوم إجازة" : "Day off"}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Status & Image Card */}
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-slate-900">
                  {isRTL ? "الحالة والصورة" : "Status & Image"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Active Toggle */}
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-sm font-medium text-slate-700">
                    {isRTL ? "طبيب نشط" : "Active Doctor"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, is_active: !p.is_active }))}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      formData.is_active ? "bg-emerald-500" : "bg-slate-300"
                    }`}
                    disabled={saving}
                  >
                    <div
                      className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                      style={{
                        [isRTL ? "right" : "left"]: formData.is_active ? "22px" : "2px",
                      }}
                    />
                  </button>
                </div>

                {/* Current Image Preview */}
                {existingImage && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      {isRTL ? "الصورة الحالية" : "Current Image"}
                    </Label>
                    <div className="relative">
                      <img
                        src={existingImage}
                        alt={doctor.name}
                        className="w-full h-48 object-cover rounded-xl border border-slate-200"
                      />
                    </div>
                  </div>
                )}

                {/* Upload New Image */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    {isRTL ? "تغيير الصورة" : "Change Image"}
                  </Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFormData((p) => ({ ...p, image: e.target.files?.[0] || null }))}
                    className="h-10 bg-white"
                    disabled={saving}
                  />
                  {formData.image && (
                    <p className="text-xs text-emerald-600">
                      {isRTL ? "تم اختيار صورة جديدة" : "New image selected"}: {formData.image.name}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card className="border-slate-200">
              <CardContent className="p-4 space-y-3">
                <Button
                  type="submit"
                  className="w-full h-11 gap-2 text-sm font-medium"
                  disabled={saving}
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saving
                    ? (isRTL ? "جاري الحفظ..." : "Saving...")
                    : (isRTL ? "حفظ التعديلات" : "Save Changes")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 gap-2 text-sm"
                  onClick={() => router.push(`/${locale}/provider/doctors/${id}`)}
                  disabled={saving}
                >
                  <ArrowLeft className={`w-4 h-4 ${isRTL ? "rotate-180" : ""}`} />
                  {isRTL ? "إلغاء والعودة" : "Cancel & Go Back"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
}
