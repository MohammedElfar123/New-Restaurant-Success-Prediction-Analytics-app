"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import ProviderDoctorsService from "@/lib/services/provider-doctors.service";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Stethoscope,
  Star,
  Clock,
  Calendar,
  DollarSign,
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  Pencil,
  ToggleLeft,
  ToggleRight,
  BookOpen,
  TrendingUp,
  Users,
  Percent,
  RefreshCw,
  Globe,
} from "lucide-react";
import toast from "react-hot-toast";

export default function ProviderDoctorDetailsPage() {
  const locale = useLocale();
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const isRTL = locale === "ar";

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);

  // Fetch doctor details
  useEffect(() => {
    const fetchDoctor = async () => {
      setLoading(true);
      const result = await ProviderDoctorsService.getProviderDoctorById(id);
      if (result.success) {
        const doc = result.data;
        // If API doesn't return schedules, load from localStorage cache
        if (!doc.schedules || doc.schedules.length === 0) {
          try {
            const cached = localStorage.getItem(`doctor_schedules_${id}`);
            if (cached) {
              doc.schedules = JSON.parse(cached);
            }
          } catch { /* ignore */ }
        }
        setDoctor(doc);
      }
      setLoading(false);
    };

    if (id) {
      fetchDoctor();
    }
  }, [id]);

  // Refresh
  const handleRefresh = async () => {
    setLoading(true);
    const result = await ProviderDoctorsService.getProviderDoctorById(id);
    if (result.success) {
      const doc = result.data;
      if (!doc.schedules || doc.schedules.length === 0) {
        try {
          const cached = localStorage.getItem(`doctor_schedules_${id}`);
          if (cached) {
            doc.schedules = JSON.parse(cached);
          }
        } catch { /* ignore */ }
      }
      setDoctor(doc);
    }
    setLoading(false);
  };

  // Toggle status
  const handleToggleStatus = async () => {
    setStatusUpdating(true);
    try {
      const result = await ProviderDoctorsService.toggleDoctorStatus(doctor.id);
      if (result.success) {
        toast.success(isRTL ? "تم تحديث الحالة" : "Status updated");
        handleRefresh();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error(isRTL ? "حدث خطأ" : "An error occurred");
    } finally {
      setStatusUpdating(false);
    }
  };

  // Helper: check doctor active status
  const isDoctorActive = (doc) => {
    const v = doc?.status ?? doc?.is_active;
    return v === 1 || v === true || v === "1" || v === "active";
  };

  // Get doctor name based on locale
  const getDoctorName = (doc) => {
    if (!doc) return "";
    if (doc.translations) {
      const tr = doc.translations.find((t) => t.locale === locale);
      if (tr?.name) return tr.name;
    }
    return doc.name || "";
  };

  // Get translation for specific locale
  const getTranslation = (doc, loc) => {
    if (!doc?.translations) return null;
    return doc.translations.find((t) => t.locale === loc) || null;
  };

  // Format currency
  const formatCurrency = (amount) => {
    if (!amount || amount === "0.00") return "—";
    return `${parseFloat(amount).toFixed(2)} QAR`;
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

  const arTranslation = getTranslation(doctor, "ar");
  const enTranslation = getTranslation(doctor, "en");
  const isActive = isDoctorActive(doctor);

  return (
    <DashboardLayout requiredUserType="provider">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/${locale}/provider/doctors`)}
            className="h-10 w-10 rounded-xl hover:bg-slate-100"
          >
            <ArrowLeft className={`h-5 w-5 ${isRTL ? "rotate-180" : ""}`} />
          </Button>
          <div className="flex items-center gap-4">
            {doctor.image ? (
              <img
                src={doctor.image}
                alt={getDoctorName(doctor)}
                className="h-16 w-16 rounded-2xl object-cover border-2 border-white shadow-md"
              />
            ) : (
              <div className="h-16 w-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-md">
                <Stethoscope className="h-8 w-8 text-white" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{getDoctorName(doctor)}</h1>
              <div className="flex items-center gap-2 mt-1">
                {doctor.category?.name && (
                  <Badge className="bg-teal-50 text-teal-700 hover:bg-teal-50 border border-teal-200 text-xs">
                    {doctor.category.name}
                  </Badge>
                )}
                {isActive ? (
                  <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-200 gap-1 text-xs">
                    <CheckCircle className="h-3 w-3" />
                    {isRTL ? "نشط" : "Active"}
                  </Badge>
                ) : (
                  <Badge className="bg-rose-50 text-rose-700 hover:bg-rose-50 border border-rose-200 gap-1 text-xs">
                    <XCircle className="h-3 w-3" />
                    {isRTL ? "غير نشط" : "Inactive"}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2 h-10">
            <RefreshCw className="h-4 w-4" />
            {isRTL ? "تحديث" : "Refresh"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleStatus}
            disabled={statusUpdating}
            className="gap-2 h-10"
          >
            {statusUpdating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isActive ? (
              <ToggleLeft className="h-4 w-4 text-amber-500" />
            ) : (
              <ToggleRight className="h-4 w-4 text-emerald-500" />
            )}
            {isActive ? (isRTL ? "تعطيل" : "Deactivate") : (isRTL ? "تفعيل" : "Activate")}
          </Button>
          <Button
            size="sm"
            onClick={() => router.push(`/${locale}/provider/doctors/${doctor.id}/edit`)}
            className="gap-2 h-10"
            variant="outline"
          >
            <Pencil className="h-4 w-4" />
            {isRTL ? "تعديل" : "Edit"}
          </Button>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <BookOpen className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">{isRTL ? "الحجوزات" : "Bookings"}</p>
                <p className="text-xl font-bold text-slate-900">{doctor.bookings_count || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-emerald-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">{isRTL ? "الإيرادات" : "Revenue"}</p>
                <p className="text-xl font-bold text-slate-900">
                  {doctor.bookings_sum_total && doctor.bookings_sum_total !== 0
                    ? `${parseFloat(doctor.bookings_sum_total).toLocaleString()} QAR`
                    : "0 QAR"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Star className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-slate-500">{isRTL ? "التقييم" : "Rating"}</p>
                <div className="flex items-center gap-1">
                  <p className="text-xl font-bold text-slate-900">
                    {doctor.ratings_avg_rating
                      ? parseFloat(doctor.ratings_avg_rating).toFixed(1)
                      : "—"}
                  </p>
                  {doctor.ratings_count > 0 && (
                    <span className="text-xs text-slate-400">({doctor.ratings_count})</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-slate-500">{isRTL ? "الخبرة" : "Experience"}</p>
                <p className="text-xl font-bold text-slate-900">
                  {doctor.experience_years
                    ? `${doctor.experience_years} ${isRTL ? "سنة" : "yrs"}`
                    : "—"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Translations Card */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                {isRTL ? "معلومات الطبيب" : "Doctor Information"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Arabic */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">العربية</Badge>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1" dir="rtl">
                  {arTranslation?.name || doctor.name || "—"}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed" dir="rtl">
                  {arTranslation?.short_description || doctor.short_description || "—"}
                </p>
              </div>

              {/* English */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="text-xs">English</Badge>
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-1" dir="ltr">
                  {enTranslation?.name || "—"}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed" dir="ltr">
                  {enTranslation?.short_description || "—"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Working Schedule Card */}
          {doctor.schedules?.length > 0 && (
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  {isRTL ? "أوقات العمل" : "Working Schedule"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {doctor.schedules.map((schedule) => (
                    <div
                      key={schedule.day_of_week}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                    >
                      <span className="text-sm font-medium text-slate-700">
                        {ProviderDoctorsService.getDayName(schedule.day_of_week, locale)}
                      </span>
                      <span className="text-sm text-slate-600 font-mono">
                        {schedule.open_time?.substring(0, 5)} - {schedule.close_time?.substring(0, 5)}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Sidebar Info */}
        <div className="space-y-6">
          {/* Pricing Card */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                {isRTL ? "التسعير" : "Pricing"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-sm text-slate-600">
                  {isRTL ? "السعر قبل الخصم" : "Before Discount"}
                </span>
                <span className="text-sm font-semibold text-slate-900">
                  {formatCurrency(doctor.price_before_discount)}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                <span className="text-sm text-emerald-700">
                  {isRTL ? "السعر بعد الخصم" : "After Discount"}
                </span>
                <span className="text-sm font-bold text-emerald-700">
                  {formatCurrency(doctor.price_after_discount)}
                </span>
              </div>
              {doctor.discount_percentage && doctor.discount_percentage !== "0.00" && (
                <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50 border border-amber-100">
                  <span className="text-sm text-amber-700 flex items-center gap-1">
                    <Percent className="h-3.5 w-3.5" />
                    {isRTL ? "نسبة الخصم" : "Discount"}
                  </span>
                  <span className="text-sm font-bold text-amber-700">
                    {parseFloat(doctor.discount_percentage).toFixed(0)}%
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category Card */}
          {doctor.category && (
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <Stethoscope className="h-5 w-5 text-primary" />
                  {isRTL ? "التخصص" : "Specialty"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                  {doctor.category.image ? (
                    <img
                      src={doctor.category.image}
                      alt={doctor.category.name}
                      className="h-12 w-12 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 bg-teal-100 rounded-xl flex items-center justify-center">
                      <Stethoscope className="h-6 w-6 text-teal-600" />
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-slate-900">{doctor.category.name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Provider Card */}
          {doctor.provider && (
            <Card className="border-slate-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  {isRTL ? "المنشأة" : "Facility"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-sm text-slate-500">{isRTL ? "الاسم" : "Name"}</span>
                    <span className="text-sm font-medium text-slate-900">{doctor.provider.name}</span>
                  </div>
                  {doctor.provider.email && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-sm text-slate-500">{isRTL ? "البريد" : "Email"}</span>
                      <span className="text-sm text-slate-700 truncate max-w-[180px]">{doctor.provider.email}</span>
                    </div>
                  )}
                  {doctor.provider.phone && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-sm text-slate-500">{isRTL ? "الهاتف" : "Phone"}</span>
                      <span className="text-sm text-slate-700 direction-ltr">{doctor.provider.phone}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Dates Card */}
          <Card className="border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                {isRTL ? "التواريخ" : "Dates"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-sm text-slate-500">{isRTL ? "تاريخ الإنشاء" : "Created"}</span>
                <span className="text-sm text-slate-700">{doctor.created_at || "—"}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-sm text-slate-500">{isRTL ? "آخر تحديث" : "Updated"}</span>
                <span className="text-sm text-slate-700">{doctor.updated_at || "—"}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
