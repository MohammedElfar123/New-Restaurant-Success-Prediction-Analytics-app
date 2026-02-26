"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  ArrowRight, Building2, Stethoscope, Mail, Phone, MapPin, Clock,
  Star, Users, DollarSign, Edit3, CheckCircle, XCircle, Loader2,
  Calendar, User, Globe, BookOpen, Plus, Search, TrendingUp,
  Activity, FileText, RefreshCw
} from "lucide-react";
import ProvidersService from "@/lib/services/providers.service";
import ProviderDoctorsService from "@/lib/services/provider-doctors.service";
import ProviderDoctorsTable from "@/components/provider-doctors/ProviderDoctorsTable";
import ProviderDoctorFormModal from "@/components/provider-doctors/ProviderDoctorFormModal";
import ProviderDoctorViewModal from "@/components/provider-doctors/ProviderDoctorViewModal";
import toast from "react-hot-toast";

export default function ViewProviderPage() {
  const t = useTranslations("providers");
  const td = useTranslations("providerDoctors");
  const tc = useTranslations("common");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale, id } = useParams();

  // Main State
  const [provider, setProvider] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "info");

  // Doctors Tab State
  const [doctors, setDoctors] = useState([]);
  const [doctorsReports, setDoctorsReports] = useState({});
  const [doctorsMeta, setDoctorsMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [isDoctorsLoading, setIsDoctorsLoading] = useState(false);
  const [doctorSearch, setDoctorSearch] = useState("");

  // Modals State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // Fetch provider data
  const fetchProvider = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await ProvidersService.getProviderById(id);
      if (result.success && result.data) {
        setProvider(result.data);
      } else {
        toast.error(result.message || t("fetchError"));
        router.push(`/${locale}/admin/providers`);
      }
    } catch (error) {
      console.error("Error fetching provider:", error);
      toast.error(t("fetchError"));
      router.push(`/${locale}/admin/providers`);
    } finally {
      setIsLoading(false);
    }
  }, [id, locale, router, t]);

  // Fetch provider doctors
  const fetchDoctors = useCallback(async (page = 1) => {
    if (!provider || provider.type === "Doctor") return;

    setIsDoctorsLoading(true);
    try {
      const result = await ProviderDoctorsService.getProviderDoctors({
        provider_id: id,
        search: doctorSearch || undefined,
        page,
        per_page: 10,
      });
      if (result.success) {
        setDoctors(result.data);
        setDoctorsMeta(result.meta);
        setDoctorsReports(result.reports);
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
    } finally {
      setIsDoctorsLoading(false);
    }
  }, [id, provider, doctorSearch]);

  useEffect(() => {
    fetchProvider();
  }, [fetchProvider]);

  useEffect(() => {
    if (activeTab === "doctors" && provider && provider.type !== "Doctor") {
      fetchDoctors();
    }
  }, [activeTab, provider, fetchDoctors]);

  // Handle toggle status
  const handleToggleStatus = async () => {
    const loadingToast = toast.loading(t("updatingStatus"));
    try {
      const result = await ProvidersService.updateProviderStatus(id);
      toast.dismiss(loadingToast);
      if (result.success) {
        toast.success(result.message);
        fetchProvider();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(t("statusError"));
    }
  };

  // Doctor modal handlers
  const handleAddDoctor = () => {
    setSelectedDoctor(null);
    setIsFormModalOpen(true);
  };

  const handleEditDoctor = async (doctor) => {
    // Fetch full details (includes translations + schedules) before opening edit modal
    try {
      const result = await ProviderDoctorsService.getProviderDoctorById(doctor.id);
      if (result.success && result.data) {
        setSelectedDoctor(result.data);
      } else {
        setSelectedDoctor(doctor);
      }
    } catch {
      setSelectedDoctor(doctor);
    }
    setIsFormModalOpen(true);
  };

  const handleViewDoctor = async (doctor) => {
    // Fetch full details (includes translations + schedules) before opening view modal
    setIsViewModalOpen(true);
    setSelectedDoctor(doctor); // Show immediately with basic data
    try {
      const result = await ProviderDoctorsService.getProviderDoctorById(doctor.id);
      if (result.success && result.data) {
        setSelectedDoctor(result.data);
      }
    } catch {
      // Keep the basic doctor data if fetch fails
    }
  };

  const handleDoctorFormSuccess = () => {
    fetchDoctors();
  };

  // Helper functions
  const getTypeIcon = (type) => {
    switch (type) {
      case "Hospital": return Building2;
      case "Clinic": return Building2;
      case "Doctor": return Stethoscope;
      default: return Building2;
    }
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case "Hospital":
        return { color: "bg-blue-100 text-blue-700 border-blue-200", label: t("hospital") };
      case "Clinic":
        return { color: "bg-purple-100 text-purple-700 border-purple-200", label: t("clinic") };
      case "Doctor":
        return { color: "bg-emerald-100 text-emerald-700 border-emerald-200", label: t("doctor") };
      default:
        return { color: "bg-slate-100 text-slate-700 border-slate-200", label: type };
    }
  };

  // Show doctors tab only for Hospital/Clinic
  const showDoctorsTab = provider && (provider.type === "Hospital" || provider.type === "Clinic");

  // Tabs configuration
  const tabs = [
    { id: "info", label: t("basicInfo"), icon: FileText },
    ...(showDoctorsTab ? [{ id: "doctors", label: td("doctors"), icon: Stethoscope, count: doctorsMeta.total }] : []),
    { id: "bookings", label: t("bookings"), icon: Calendar, disabled: true },
  ];

  if (isLoading) {
    return (
      <DashboardLayout requiredUserType="admin">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-slate-500">{t("loading")}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!provider) {
    return (
      <DashboardLayout requiredUserType="admin">
        <div className="text-center py-16">
          <Building2 className="h-16 w-16 text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">{t("notFound")}</h3>
        </div>
      </DashboardLayout>
    );
  }

  const TypeIcon = getTypeIcon(provider.type);
  const typeBadge = getTypeBadge(provider.type);
  const arTranslation = provider.translations?.find(tr => tr.locale === "ar") || {};
  const enTranslation = provider.translations?.find(tr => tr.locale === "en") || {};

  return (
    <DashboardLayout requiredUserType="admin">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/80 rounded-2xl mb-6">
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,rgba(255,255,255,0.5))]" />
        <div className="relative px-6 py-8">
          {/* Back Button & Actions */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push(`/${locale}/admin/providers`)}
              className="h-10 w-10 bg-white/10 hover:bg-white/20 text-white"
            >
              <ArrowRight className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleToggleStatus}
                className="gap-2 bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                {provider.is_active ? (
                  <>
                    <XCircle className="h-4 w-4" />
                    {t("deactivate")}
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    {t("activate")}
                  </>
                )}
              </Button>
              <Button
                onClick={() => router.push(`/${locale}/admin/providers/edit/${id}`)}
                className="gap-2 bg-white text-primary hover:bg-white/90"
              >
                <Edit3 className="h-4 w-4" />
                {t("editProvider")}
              </Button>
            </div>
          </div>

          {/* Provider Info */}
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="relative">
              {provider.image ? (
                <img
                  src={provider.image}
                  alt={provider.name}
                  className="h-28 w-28 rounded-2xl object-cover ring-4 ring-white/20"
                />
              ) : (
                <div className="h-28 w-28 rounded-2xl bg-white/10 flex items-center justify-center ring-4 ring-white/20">
                  <TypeIcon className="h-14 w-14 text-white" />
                </div>
              )}
              {provider.is_active && (
                <div className="absolute -bottom-2 -end-2 bg-emerald-500 p-1.5 rounded-full ring-4 ring-primary">
                  <CheckCircle className="h-4 w-4 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 text-white">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold">{provider.name}</h1>
                <Badge className={`${typeBadge.color} border`}>
                  <TypeIcon className="h-3.5 w-3.5 me-1.5" />
                  {typeBadge.label}
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="flex items-center gap-2 text-white/80">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm truncate">{provider.email}</span>
                </div>
                <div className="flex items-center gap-2 text-white/80">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm" dir="ltr">{provider.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-white/80">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">{provider.experience_years} {t("yearsExperience")}</span>
                </div>
                <div className="flex items-center gap-2 text-white/80">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="text-sm">
                    {provider.ratings_avg_rating ? parseFloat(provider.ratings_avg_rating).toFixed(1) : "-"} ({provider.ratings_count || 0})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white">
              <div className="flex items-center gap-2 text-white/70 mb-2">
                <Calendar className="h-4 w-4" />
                <span className="text-xs">{t("bookings")}</span>
              </div>
              <div className="text-2xl font-bold">{provider.bookings_count || 0}</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white">
              <div className="flex items-center gap-2 text-white/70 mb-2">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs">{t("totalRevenue")}</span>
              </div>
              <div className="text-2xl font-bold">
                {provider.bookings_sum_total ? parseFloat(provider.bookings_sum_total).toLocaleString() : 0}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white">
              <div className="flex items-center gap-2 text-white/70 mb-2">
                <Star className="h-4 w-4" />
                <span className="text-xs">{t("rating")}</span>
              </div>
              <div className="text-2xl font-bold">
                {provider.ratings_avg_rating ? parseFloat(provider.ratings_avg_rating).toFixed(1) : "-"}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-white">
              <div className="flex items-center gap-2 text-white/70 mb-2">
                <Activity className="h-4 w-4" />
                <span className="text-xs">{t("thisMonth")}</span>
              </div>
              <div className="text-2xl font-bold">{provider.total_booking_revenue_this_month || 0}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl mb-6 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && setActiveTab(tab.id)}
            disabled={tab.disabled}
            className={`flex items-center gap-2 py-3 px-5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-white text-primary shadow-sm"
                : tab.disabled
                  ? "text-slate-400 cursor-not-allowed"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <Badge variant="secondary" className="h-5 px-1.5 text-xs">
                {tab.count}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "info" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Translations */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center">
                    <Globe className="h-5 w-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">{t("translations")}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Arabic */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary" className="h-6">AR</Badge>
                    <span className="font-medium text-slate-900">{t("arabic")}</span>
                  </div>
                  <div className="space-y-3 ps-8 bg-slate-50 p-4 rounded-xl">
                    <div>
                      <span className="text-xs text-slate-500">{t("name")}</span>
                      <p className="text-slate-900 font-medium">{arTranslation.name || "-"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500">{t("address")}</span>
                      <p className="text-slate-900">{arTranslation.address || "-"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500">{t("description")}</span>
                      <p className="text-slate-900">{arTranslation.description || "-"}</p>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* English */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary" className="h-6">EN</Badge>
                    <span className="font-medium text-slate-900">{t("english")}</span>
                  </div>
                  <div className="space-y-3 ps-8 bg-slate-50 p-4 rounded-xl" dir="ltr">
                    <div>
                      <span className="text-xs text-slate-500">Name</span>
                      <p className="text-slate-900 font-medium">{enTranslation.name || "-"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500">Address</span>
                      <p className="text-slate-900">{enTranslation.address || "-"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500">Description</span>
                      <p className="text-slate-900">{enTranslation.description || "-"}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Categories */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-purple-100 rounded-xl flex items-center justify-center">
                    <BookOpen className="h-5 w-5 text-purple-600" />
                  </div>
                  <CardTitle className="text-lg">{t("categories")}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {provider.categories && provider.categories.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {provider.categories.map(category => (
                      <Badge
                        key={category.id}
                        variant="secondary"
                        className="px-4 py-2 text-sm gap-2"
                      >
                        {category.image && (
                          <img src={category.image} alt={category.name} className="h-5 w-5 rounded" />
                        )}
                        {category.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500">{t("noCategories")}</p>
                )}
              </CardContent>
            </Card>

            {/* Working Schedule */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-cyan-100 rounded-xl flex items-center justify-center">
                    <Clock className="h-5 w-5 text-cyan-600" />
                  </div>
                  <CardTitle className="text-lg">{t("workingSchedule")}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {provider.schedules && provider.schedules.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {provider.schedules.map((schedule, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"
                      >
                        <span className="font-medium text-slate-900">{schedule.day}</span>
                        <span className="text-slate-600 text-sm">{schedule.hours}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500">{t("noSchedule")}</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Owner Info */}
            {provider.owner && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t("ownerInfo")}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                    <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{provider.owner.name}</p>
                      <p className="text-xs text-slate-500">{t("owner")}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm p-2 bg-slate-50 rounded-lg">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-600">{provider.owner.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm p-2 bg-slate-50 rounded-lg">
                      <Phone className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-600" dir="ltr">{provider.owner.phone}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Pricing (Doctor Only) */}
            {provider.type === "Doctor" && (
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    {t("pricing")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">{t("priceBeforeDiscount")}</span>
                    <span className="font-medium text-slate-400 line-through">
                      {provider.price_before_discount} {t("currency")}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600">{t("priceAfterDiscount")}</span>
                    <span className="font-bold text-primary text-xl">
                      {provider.price_after_discount} {t("currency")}
                    </span>
                  </div>
                  {provider.discount_percentage && provider.discount_percentage !== "0.00" && (
                    <Badge className="bg-rose-500 text-white w-full justify-center py-2">
                      {provider.discount_percentage}% {t("discount")}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Dates */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("dates")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-600">{t("createdAt")}</span>
                  <span className="text-slate-900 font-medium">{provider.created_at}</span>
                </div>
                <div className="flex items-center justify-between text-sm p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-600">{t("updatedAt")}</span>
                  <span className="text-slate-900 font-medium">{provider.updated_at}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Doctors Tab */}
      {activeTab === "doctors" && showDoctorsTab && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-blue-500 rounded-xl flex items-center justify-center">
                    <Users className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-blue-600">{td("totalDoctors")}</p>
                    <p className="text-2xl font-bold text-blue-900">{doctorsReports.total_doctors || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border-emerald-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-emerald-600">{td("activeDoctors")}</p>
                    <p className="text-2xl font-bold text-emerald-900">{doctorsReports.activeDoctors || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-purple-500 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-purple-600">{td("totalRevenue")}</p>
                    <p className="text-2xl font-bold text-purple-900">{doctorsReports.total_revenue || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-amber-500 rounded-xl flex items-center justify-center">
                    <Star className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-amber-600">{td("avgRating")}</p>
                    <p className="text-2xl font-bold text-amber-900">
                      {doctorsReports.average_rating?.value || "-"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Doctors Table Card */}
          <Card>
            <CardHeader className="border-b bg-slate-50/50">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Stethoscope className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    {td("doctors")}
                    <p className="text-sm font-normal text-slate-500 mt-0.5">
                      {td("manageDoctors")}
                    </p>
                  </div>
                </CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder={td("searchDoctors")}
                      value={doctorSearch}
                      onChange={(e) => setDoctorSearch(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && fetchDoctors()}
                      className="ps-9 w-64"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => fetchDoctors()}
                    disabled={isDoctorsLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${isDoctorsLoading ? "animate-spin" : ""}`} />
                  </Button>
                  <Button onClick={handleAddDoctor} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {td("addDoctor")}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isDoctorsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <ProviderDoctorsTable
                  doctors={doctors}
                  onEdit={handleEditDoctor}
                  onView={handleViewDoctor}
                  onRefresh={fetchDoctors}
                  locale={locale}
                />
              )}
            </CardContent>

            {/* Pagination */}
            {doctorsMeta.last_page > 1 && (
              <div className="flex items-center justify-between p-4 border-t">
                <span className="text-sm text-slate-500">
                  {td("showing")} {doctors.length} {td("of")} {doctorsMeta.total}
                </span>
                <div className="flex items-center gap-1">
                  {Array.from({ length: doctorsMeta.last_page }, (_, i) => (
                    <Button
                      key={i + 1}
                      variant={doctorsMeta.current_page === i + 1 ? "default" : "outline"}
                      size="sm"
                      onClick={() => fetchDoctors(i + 1)}
                      className="w-8 h-8 p-0"
                    >
                      {i + 1}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Bookings Tab (Coming Soon) */}
      {activeTab === "bookings" && (
        <Card>
          <CardContent className="py-16 text-center">
            <Calendar className="h-16 w-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">{t("comingSoon")}</h3>
            <p className="text-slate-500">{t("bookingsComingSoon")}</p>
          </CardContent>
        </Card>
      )}

      {/* Modals */}
      <ProviderDoctorFormModal
        open={isFormModalOpen}
        onOpenChange={setIsFormModalOpen}
        doctor={selectedDoctor}
        providerId={id}
        onSuccess={handleDoctorFormSuccess}
      />

      <ProviderDoctorViewModal
        open={isViewModalOpen}
        onOpenChange={setIsViewModalOpen}
        doctor={selectedDoctor}
        onEdit={handleEditDoctor}
      />
    </DashboardLayout>
  );
}
