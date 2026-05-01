"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search, Plus, Eye, Edit3, MoreVertical, Stethoscope,
  CheckCircle, XCircle, Loader2, RefreshCw, Star, Award,
  Mail, Phone, Building2 as BuildingIcon
} from "lucide-react";
import ProviderDoctorsService from "@/lib/services/provider-doctors.service";
import toast from "react-hot-toast";

export default function DoctorsPage() {
  const tc = useTranslations("common");
  const router = useRouter();
  const { locale } = useParams();
  const isRTL = locale === "ar";

  // State
  const [doctors, setDoctors] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [reports, setReports] = useState({});
  const [openDropdown, setOpenDropdown] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const dropdownRef = useRef(null);

  const fetchDoctors = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page: currentPage,
        per_page: 10,
      };

      if (searchQuery) params.search = searchQuery;
      if (statusFilter !== "all") params.status = statusFilter;

      const result = await ProviderDoctorsService.getProviderDoctors(params);

      if (result.success) {
        setDoctors(result.data || []);
        setMeta(result.meta);
        setReports(result.reports);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
      toast.error(isRTL ? "تعذر جلب البيانات" : "Failed to fetch doctors");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, statusFilter, isRTL]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  // Debounce search → reset to page 1
  const searchTimerRef = useRef(null);
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      if (currentPage !== 1) setCurrentPage(1);
    }, 500);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = (doctorId) => {
    setOpenDropdown(openDropdown === doctorId ? null : doctorId);
  };

  const handleViewDetails = (doctor) => {
    setOpenDropdown(null);
    // Provider doctors live under their parent provider profile.
    if (doctor.provider_id) {
      router.push(`/${locale}/admin/providers/${doctor.provider_id}/doctors/${doctor.id}`);
    }
  };

  const handleEditDoctor = (doctor) => {
    setOpenDropdown(null);
    if (doctor.provider_id) {
      router.push(`/${locale}/admin/providers/${doctor.provider_id}/doctors/${doctor.id}/edit`);
    }
  };

  const handleToggleStatus = async (doctorId) => {
    setOpenDropdown(null);
    const loadingToast = toast.loading(isRTL ? "جاري التحديث..." : "Updating...");
    try {
      const result = await ProviderDoctorsService.toggleDoctorStatus(doctorId);
      toast.dismiss(loadingToast);
      if (result.success) {
        toast.success(result.message);
        fetchDoctors();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("Toggle status error:", error);
      toast.error(isRTL ? "تعذر تحديث الحالة" : "Failed to update status");
    }
  };

  const getInitials = (name) => {
    if (!name) return "??";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatPrice = (price) => {
    if (!price || price === "0.00") return "-";
    return `${parseFloat(price).toLocaleString()} ${isRTL ? "ر.ق" : "QAR"}`;
  };

  return (
    <DashboardLayout requiredUserType="admin">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isRTL ? "إدارة الأطباء" : "Doctors Management"}
          </h1>
          <p className="text-slate-500 mt-1">
            {isRTL ? "إدارة جميع الأطباء التابعين للمستشفيات والعيادات" : "Manage all doctors across hospitals and clinics"}
          </p>
        </div>
        <Button
          onClick={() => router.push(`/${locale}/admin/providers`)}
          className="gap-2 h-10 bg-primary hover:bg-primary/90"
        >
          <Plus className="w-4 h-4" />
          {isRTL ? "إضافة طبيب" : "Add Doctor"}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">
                {isRTL ? "إجمالي الأطباء" : "Total Doctors"}
              </CardTitle>
              <div className="h-9 w-9 bg-purple-50 rounded-lg flex items-center justify-center">
                <Stethoscope className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {isLoading
                ? <Loader2 className="h-5 w-5 animate-spin" />
                : (reports.total_provider_doctors ?? reports.total_doctors ?? meta.total ?? 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">
                {isRTL ? "الأطباء النشطون" : "Active Doctors"}
              </CardTitle>
              <div className="h-9 w-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {isLoading
                ? <Loader2 className="h-5 w-5 animate-spin" />
                : (reports.active_provider_doctors ?? reports.activeDoctors ?? 0)}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">
                {isRTL ? "متوسط التقييم" : "Average Rating"}
              </CardTitle>
              <div className="h-9 w-9 bg-amber-50 rounded-lg flex items-center justify-center">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1">
              <span className="text-2xl font-bold text-slate-900">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (reports.average_rating?.value || 0)}
              </span>
              <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {reports.average_rating?.total || 0} {isRTL ? "تقييم" : "reviews"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-0">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="all">{tc("all")}</option>
                  <option value="active">{tc("active")}</option>
                  <option value="inactive">{tc("inactive")}</option>
                </select>

                <Badge variant="secondary" className="bg-slate-200 text-slate-700">
                  {meta.total} {isRTL ? "طبيب" : "doctors"}
                </Badge>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchDoctors}
                  disabled={isLoading}
                  className="h-8 w-8 p-0"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              <div className="relative w-full lg:w-auto">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder={isRTL ? "ابحث..." : "Search..."}
                  className="pr-10 w-full lg:w-72 h-10 bg-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-visible">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-slate-500">{isRTL ? "جاري التحميل..." : "Loading..."}</p>
                </div>
              </div>
            ) : doctors.length === 0 ? (
              <div className="text-center py-16">
                <Stethoscope className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  {isRTL ? "لا يوجد أطباء" : "No doctors found"}
                </h3>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="py-3.5 px-6 text-sm font-semibold text-slate-600 text-start w-16">#</th>
                    <th className="py-3.5 px-6 text-sm font-semibold text-slate-600 text-start">{isRTL ? "الطبيب" : "Doctor"}</th>
                    <th className="py-3.5 px-6 text-sm font-semibold text-slate-600 text-start">{isRTL ? "التخصص" : "Specialty"}</th>
                    <th className="py-3.5 px-6 text-sm font-semibold text-slate-600 text-start">{isRTL ? "المرفق" : "Provider"}</th>
                    <th className="py-3.5 px-6 text-sm font-semibold text-slate-600 text-start">{isRTL ? "الخبرة" : "Experience"}</th>
                    <th className="py-3.5 px-6 text-sm font-semibold text-slate-600 text-start">{isRTL ? "السعر" : "Fee"}</th>
                    <th className="py-3.5 px-6 text-sm font-semibold text-slate-600 text-start">{isRTL ? "التقييم" : "Rating"}</th>
                    <th className="py-3.5 px-6 text-sm font-semibold text-slate-600 text-start">{isRTL ? "الحالة" : "Status"}</th>
                    <th className="py-3.5 px-6 text-sm font-semibold text-slate-600 text-start w-20">{tc("actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((doctor, index) => {
                    const categoryName = doctor.category?.name || doctor.first_category?.name || "-";
                    const providerName = doctor.provider?.name || "-";
                    const isActive = doctor.status === true || doctor.status === "active" || doctor.is_active === 1 || doctor.is_active === true;
                    return (
                      <tr
                        key={doctor.id}
                        className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <span className="text-sm text-slate-500 font-medium">
                            {(currentPage - 1) * 10 + index + 1}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <button
                            onClick={() => handleViewDetails(doctor)}
                            className="flex items-center gap-3 text-start hover:opacity-80 transition-opacity"
                          >
                            {doctor.image ? (
                              <img
                                src={doctor.image}
                                alt={doctor.name}
                                className="h-10 w-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                                <span className="text-white font-semibold text-sm">
                                  {getInitials(doctor.name)}
                                </span>
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-slate-900">{doctor.name}</div>
                              {doctor.email && (
                                <div className="text-xs text-slate-500 flex items-center gap-1">
                                  <Mail className="h-3 w-3" />
                                  <span className="truncate max-w-[140px]">{doctor.email}</span>
                                </div>
                              )}
                            </div>
                          </button>
                        </td>
                        <td className="py-4 px-6">
                          <Badge className="bg-purple-50 text-purple-700 hover:bg-purple-50 border-purple-200 font-medium">
                            {categoryName}
                          </Badge>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1.5 text-sm text-slate-700">
                            <BuildingIcon className="h-3.5 w-3.5 text-slate-400" />
                            <span className="truncate max-w-[160px]">{providerName}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1.5 text-sm text-slate-700">
                            <Award className="h-3.5 w-3.5 text-slate-400" />
                            {doctor.experience_years ? `${doctor.experience_years} ${isRTL ? "سنة" : "yrs"}` : "-"}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm font-medium text-slate-900">
                            {formatPrice(doctor.price_after_discount)}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                            <span className="font-medium text-slate-900">
                              {doctor.ratings_avg_rating ? parseFloat(doctor.ratings_avg_rating).toFixed(1) : "-"}
                            </span>
                            <span className="text-xs text-slate-500">
                              ({doctor.ratings_count || 0})
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {isActive ? (
                            <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-200 gap-1">
                              <CheckCircle className="h-3 w-3" />
                              {tc("active")}
                            </Badge>
                          ) : (
                            <Badge className="bg-rose-50 text-rose-700 hover:bg-rose-50 border border-rose-200 gap-1">
                              <XCircle className="h-3 w-3" />
                              {tc("inactive")}
                            </Badge>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex justify-center">
                            <div className="relative" ref={openDropdown === doctor.id ? dropdownRef : null}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-slate-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleDropdown(doctor.id);
                                }}
                              >
                                <MoreVertical className="h-4 w-4 text-slate-500" />
                              </Button>

                              {openDropdown === doctor.id && (
                                <div
                                  className="absolute end-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    className="w-full px-3 py-2 text-start text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                                    onClick={() => handleViewDetails(doctor)}
                                  >
                                    <Eye className="h-4 w-4 text-slate-400" />
                                    {isRTL ? "عرض التفاصيل" : "View Details"}
                                  </button>
                                  <button
                                    className="w-full px-3 py-2 text-start text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                                    onClick={() => handleEditDoctor(doctor)}
                                  >
                                    <Edit3 className="h-4 w-4 text-slate-400" />
                                    {isRTL ? "تعديل" : "Edit"}
                                  </button>
                                  <div className="border-t border-slate-100 my-1" />
                                  <button
                                    className="w-full px-3 py-2 text-start text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                                    onClick={() => handleToggleStatus(doctor.id)}
                                  >
                                    {isActive ? (
                                      <>
                                        <XCircle className="h-4 w-4 text-amber-500" />
                                        {isRTL ? "تعطيل" : "Deactivate"}
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                                        {isRTL ? "تفعيل" : "Activate"}
                                      </>
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {meta.last_page > 1 && (
            <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 border-t border-slate-200 gap-4">
              <div className="text-sm text-slate-600">
                {isRTL ? "عرض" : "Showing"} {((currentPage - 1) * 10) + 1} - {Math.min(currentPage * 10, meta.total)} {isRTL ? "من" : "of"} {meta.total}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  {tc("previous")}
                </Button>

                {Array.from({ length: Math.min(5, meta.last_page) }, (_, i) => {
                  let pageNum;
                  if (meta.last_page <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= meta.last_page - 2) {
                    pageNum = meta.last_page - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant="outline"
                      size="sm"
                      className={currentPage === pageNum ? "bg-primary text-white border-primary" : ""}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}

                {meta.last_page > 5 && currentPage < meta.last_page - 2 && (
                  <>
                    <span className="text-slate-400">...</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(meta.last_page)}
                    >
                      {meta.last_page}
                    </Button>
                  </>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === meta.last_page}
                  onClick={() => setCurrentPage(p => Math.min(meta.last_page, p + 1))}
                >
                  {tc("next")}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
