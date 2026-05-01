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
  Search, Plus, Eye, Edit3, MoreVertical, Building2,
  CheckCircle, XCircle, Loader2, RefreshCw, Star, Users,
  Mail, Phone, Stethoscope
} from "lucide-react";
import ProvidersService from "@/lib/services/providers.service";
import toast from "react-hot-toast";

export default function HospitalsPage() {
  const tc = useTranslations("common");
  const router = useRouter();
  const { locale } = useParams();
  const isRTL = locale === "ar";

  // State
  const [providers, setProviders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [reports, setReports] = useState({});
  const [openDropdown, setOpenDropdown] = useState(null);
  const [typeFilter, setTypeFilter] = useState("all"); // all | Hospital | Clinic
  const [statusFilter, setStatusFilter] = useState("all");
  const dropdownRef = useRef(null);

  // Fetch hospitals + clinics
  const fetchProviders = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page: currentPage,
        per_page: 10,
      };

      if (searchQuery) params.search = searchQuery;
      if (statusFilter !== "all") params.status = statusFilter;

      // Restrict to Hospital + Clinic types only.
      if (typeFilter === "all") {
        params.array_type = ["Hospital", "Clinic"];
      } else {
        params.type = typeFilter;
      }

      const result = await ProvidersService.getProviders(params);

      if (result.success) {
        setProviders(result.data || []);
        setMeta(result.meta);
        setReports(result.reports);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error fetching hospitals/clinics:", error);
      toast.error(isRTL ? "تعذر جلب البيانات" : "Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, typeFilter, statusFilter, isRTL]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

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

  const toggleDropdown = (providerId) => {
    setOpenDropdown(openDropdown === providerId ? null : providerId);
  };

  const handleViewDetails = (providerId) => {
    setOpenDropdown(null);
    router.push(`/${locale}/admin/providers/${providerId}`);
  };

  const handleEditProvider = (provider) => {
    setOpenDropdown(null);
    router.push(`/${locale}/admin/providers/edit/${provider.id}`);
  };

  const handleAddProvider = () => {
    router.push(`/${locale}/admin/providers/add`);
  };

  const handleToggleStatus = async (providerId) => {
    setOpenDropdown(null);
    const loadingToast = toast.loading(isRTL ? "جاري التحديث..." : "Updating...");
    try {
      const result = await ProvidersService.updateProviderStatus(providerId);
      toast.dismiss(loadingToast);
      if (result.success) {
        toast.success(result.message);
        fetchProviders();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("Toggle status error:", error);
      toast.error(isRTL ? "تعذر تحديث الحالة" : "Failed to update status");
    }
  };

  const getTypeBadge = (type) => {
    if (type === "Hospital") {
      return {
        color: "bg-blue-100 text-blue-700 border-blue-200",
        label: isRTL ? "مستشفى" : "Hospital",
      };
    }
    return {
      color: "bg-purple-100 text-purple-700 border-purple-200",
      label: isRTL ? "عيادة" : "Clinic",
    };
  };

  return (
    <DashboardLayout requiredUserType="admin">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isRTL ? "المستشفيات والعيادات" : "Hospitals & Clinics"}
          </h1>
          <p className="text-slate-500 mt-1">
            {isRTL ? "إدارة جميع المستشفيات والعيادات المسجلة" : "Manage all registered hospitals and clinics"}
          </p>
        </div>
        <Button onClick={handleAddProvider} className="gap-2 h-10 bg-primary hover:bg-primary/90">
          <Plus className="w-4 h-4" />
          {isRTL ? "إضافة مزود" : "Add Provider"}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">
                {isRTL ? "إجمالي المرافق" : "Total Facilities"}
              </CardTitle>
              <div className="h-9 w-9 bg-blue-50 rounded-lg flex items-center justify-center">
                <Building2 className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : reports.total_providers || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">
                {isRTL ? "النشطة" : "Active"}
              </CardTitle>
              <div className="h-9 w-9 bg-emerald-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : reports.activeProviders || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">
                {isRTL ? "الإيراد" : "Revenue"}
              </CardTitle>
              <div className="h-9 w-9 bg-pink-50 rounded-lg flex items-center justify-center">
                <Users className="h-4 w-4 text-pink-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : reports.total_revenue || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">
                {isRTL ? "متوسط التقييم" : "Avg Rating"}
              </CardTitle>
              <div className="h-9 w-9 bg-amber-50 rounded-lg flex items-center justify-center">
                <Star className="h-4 w-4 text-amber-500" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-1">
              <span className="text-2xl font-bold text-slate-900">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : reports.average_rating?.value || 0}
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
                {/* Type Filter */}
                <div className="flex items-center bg-white rounded-lg border border-slate-200 p-1">
                  {["all", "Hospital", "Clinic"].map((type) => (
                    <button
                      key={type}
                      onClick={() => { setTypeFilter(type); setCurrentPage(1); }}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        typeFilter === type
                          ? "bg-primary text-white"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {type === "all"
                        ? tc("all")
                        : type === "Hospital"
                          ? (isRTL ? "مستشفى" : "Hospital")
                          : (isRTL ? "عيادة" : "Clinic")}
                    </button>
                  ))}
                </div>

                {/* Status Filter */}
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
                  {meta.total} {isRTL ? "مرفق" : "facilities"}
                </Badge>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchProviders}
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
            ) : providers.length === 0 ? (
              <div className="text-center py-16">
                <Building2 className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  {isRTL ? "لا توجد بيانات" : "No facilities found"}
                </h3>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="py-3.5 px-6 text-sm font-semibold text-slate-600 text-start w-16">#</th>
                    <th className="py-3.5 px-6 text-sm font-semibold text-slate-600 text-start">{isRTL ? "الاسم" : "Name"}</th>
                    <th className="py-3.5 px-6 text-sm font-semibold text-slate-600 text-start">{isRTL ? "النوع" : "Type"}</th>
                    <th className="py-3.5 px-6 text-sm font-semibold text-slate-600 text-start">{isRTL ? "التواصل" : "Contact"}</th>
                    <th className="py-3.5 px-6 text-sm font-semibold text-slate-600 text-start">{isRTL ? "الأطباء" : "Doctors"}</th>
                    <th className="py-3.5 px-6 text-sm font-semibold text-slate-600 text-start">{isRTL ? "التقييم" : "Rating"}</th>
                    <th className="py-3.5 px-6 text-sm font-semibold text-slate-600 text-start">{isRTL ? "الحالة" : "Status"}</th>
                    <th className="py-3.5 px-6 text-sm font-semibold text-slate-600 text-start w-20">{tc("actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {providers.map((provider, index) => {
                    const typeBadge = getTypeBadge(provider.type);
                    return (
                      <tr
                        key={provider.id}
                        className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <span className="text-sm text-slate-500 font-medium">
                            {(currentPage - 1) * 10 + index + 1}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <button
                            onClick={() => handleViewDetails(provider.id)}
                            className="flex items-center gap-3 text-start hover:opacity-80 transition-opacity"
                          >
                            {provider.image ? (
                              <img
                                src={provider.image}
                                alt={provider.name}
                                className="h-10 w-10 rounded-xl object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                                <Building2 className="h-5 w-5 text-white" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-slate-900">{provider.name}</div>
                              {provider.first_category && (
                                <div className="text-xs text-slate-500">{provider.first_category.name}</div>
                              )}
                            </div>
                          </button>
                        </td>
                        <td className="py-4 px-6">
                          <Badge className={`${typeBadge.color} border gap-1`}>
                            <Building2 className="h-3 w-3" />
                            {typeBadge.label}
                          </Badge>
                        </td>
                        <td className="py-4 px-6">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-sm text-slate-600">
                              <Mail className="h-3.5 w-3.5 text-slate-400" />
                              <span className="truncate max-w-[140px]">{provider.email || "-"}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm text-slate-600">
                              <Phone className="h-3.5 w-3.5 text-slate-400" />
                              <span dir="ltr">{provider.phone || "-"}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1.5 text-sm text-slate-600">
                            <Stethoscope className="h-3.5 w-3.5 text-slate-400" />
                            <span>{provider.provider_doctor_count || 0}</span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                            <span className="font-medium text-slate-900">
                              {provider.ratings_avg_rating ? parseFloat(provider.ratings_avg_rating).toFixed(1) : "-"}
                            </span>
                            <span className="text-xs text-slate-500">
                              ({provider.ratings_count || 0})
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          {provider.status ? (
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
                            <div className="relative" ref={openDropdown === provider.id ? dropdownRef : null}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-slate-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleDropdown(provider.id);
                                }}
                              >
                                <MoreVertical className="h-4 w-4 text-slate-500" />
                              </Button>

                              {openDropdown === provider.id && (
                                <div
                                  className="absolute end-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    className="w-full px-3 py-2 text-start text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                                    onClick={() => handleViewDetails(provider.id)}
                                  >
                                    <Eye className="h-4 w-4 text-slate-400" />
                                    {isRTL ? "عرض التفاصيل" : "View Details"}
                                  </button>
                                  <button
                                    className="w-full px-3 py-2 text-start text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                                    onClick={() => handleEditProvider(provider)}
                                  >
                                    <Edit3 className="h-4 w-4 text-slate-400" />
                                    {isRTL ? "تعديل" : "Edit"}
                                  </button>
                                  <div className="border-t border-slate-100 my-1" />
                                  <button
                                    className="w-full px-3 py-2 text-start text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                                    onClick={() => handleToggleStatus(provider.id)}
                                  >
                                    {provider.status ? (
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
