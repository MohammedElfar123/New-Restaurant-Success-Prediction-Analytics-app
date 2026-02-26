"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Search, Plus, Eye, MoreVertical, Building2, Stethoscope,
  CheckCircle, XCircle, Loader2, RefreshCw, Star, Users,
  DollarSign, TrendingUp, Edit3, MapPin, Mail, Phone, Clock
} from "lucide-react";
import ProvidersService from "@/lib/services/providers.service";
import toast from "react-hot-toast";

export default function ProvidersPage() {
  const t = useTranslations("providers");
  const tc = useTranslations("common");
  const router = useRouter();
  const { locale } = useParams();

  // State
  const [providers, setProviders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [reports, setReports] = useState({});
  const [openDropdown, setOpenDropdown] = useState(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const dropdownRef = useRef(null);

  // Fetch providers
  const fetchProviders = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page: currentPage,
        per_page: 10,
      };

      if (searchQuery) params.search = searchQuery;
      if (typeFilter !== "all") params.type = typeFilter;
      if (statusFilter !== "all") params.status = statusFilter;

      const result = await ProvidersService.getProviders(params);

      if (result.success) {
        setProviders(result.data || []);
        setMeta(result.meta);
        setReports(result.reports);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Error fetching providers:", error);
      toast.error(t("fetchError"));
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, typeFilter, statusFilter, t]);

  // Initial fetch and on filter/page change
  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  // Search with debounce
  const searchTimerRef = useRef(null);
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      }
    }, 500);

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Handle view details
  const handleViewDetails = (providerId) => {
    setOpenDropdown(null);
    router.push(`/${locale}/admin/providers/${providerId}`);
  };

  // Handle add provider
  const handleAddProvider = () => {
    router.push(`/${locale}/admin/providers/add`);
  };

  // Handle edit provider
  const handleEditProvider = (provider) => {
    setOpenDropdown(null);
    router.push(`/${locale}/admin/providers/edit/${provider.id}`);
  };

  // Handle toggle status
  const handleToggleStatus = async (providerId) => {
    setOpenDropdown(null);
    const loadingToast = toast.loading(t("updatingStatus"));
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
      toast.error(t("statusError"));
    }
  };

  const toggleDropdown = (providerId) => {
    setOpenDropdown(openDropdown === providerId ? null : providerId);
  };

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

  // Get type badge style
  const getTypeBadge = (type) => {
    switch (type) {
      case "Hospital":
        return { icon: Building2, color: "bg-blue-100 text-blue-700 border-blue-200", label: t("hospital") };
      case "Clinic":
        return { icon: Building2, color: "bg-purple-100 text-purple-700 border-purple-200", label: t("clinic") };
      case "Doctor":
        return { icon: Stethoscope, color: "bg-emerald-100 text-emerald-700 border-emerald-200", label: t("doctor") };
      default:
        return { icon: Building2, color: "bg-slate-100 text-slate-700 border-slate-200", label: type };
    }
  };

  // Format price
  const formatPrice = (price) => {
    if (!price || price === "0.00") return "-";
    return `${parseFloat(price).toLocaleString()} ${t("currency")}`;
  };

  return (
    <DashboardLayout requiredUserType="admin">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
          <p className="text-slate-500 mt-1">{t("subtitle")}</p>
        </div>
        <Button onClick={handleAddProvider} className="gap-2 h-10">
          <Plus className="w-4 h-4" />
          {t("addProvider")}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">{t("totalProviders")}</CardTitle>
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
              <CardTitle className="text-sm font-medium text-slate-600">{t("pendingProviders")}</CardTitle>
              <div className="h-9 w-9 bg-amber-50 rounded-lg flex items-center justify-center">
                <Clock className="h-4 w-4 text-amber-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : reports.pending_providers || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">{t("activeProviders")}</CardTitle>
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
              <CardTitle className="text-sm font-medium text-slate-600">{t("totalRevenue")}</CardTitle>
              <div className="h-9 w-9 bg-pink-50 rounded-lg flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-pink-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : reports.total_revenue || 0}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{t("thisMonth")}: {reports.revenue_this_month || 0}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">{t("avgRating")}</CardTitle>
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
            <p className="text-xs text-slate-500 mt-0.5">{reports.average_rating?.total || 0} {t("reviews")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-0">
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                {/* Type Filter */}
                <div className="flex items-center bg-white rounded-lg border border-slate-200 p-1">
                  {["all", "Hospital", "Clinic", "Doctor"].map((type) => (
                    <button
                      key={type}
                      onClick={() => { setTypeFilter(type); setCurrentPage(1); }}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        typeFilter === type
                          ? "bg-primary text-white"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {type === "all" ? tc("all") : t(type.toLowerCase())}
                    </button>
                  ))}
                </div>

                {/* Status Filter */}
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                  className="h-9 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="all">{tc("all")} {t("statuses")}</option>
                  <option value="active">{tc("active")}</option>
                  <option value="inactive">{tc("inactive")}</option>
                </select>

                <Badge variant="secondary" className="bg-slate-200 text-slate-700">
                  {meta.total} {t("provider")}
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
                  placeholder={t("searchPlaceholder")}
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
                  <p className="text-slate-500">{t("loading")}</p>
                </div>
              </div>
            ) : providers.length === 0 ? (
              <div className="text-center py-16">
                <Building2 className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">{t("noProviders")}</h3>
                <p className="text-slate-500">{t("noProvidersDesc")}</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="py-3.5 px-6 text-sm font-semibold text-slate-600 text-start w-16">#</th>
                    <th className="py-3.5 px-6 text-sm font-semibold text-slate-600 text-start">{t("provider")}</th>
                    <th className="py-3.5 px-6 text-sm font-semibold text-slate-600 text-start">{t("type")}</th>
                    <th className="py-3.5 px-6 text-sm font-semibold text-slate-600 text-start">{t("contact")}</th>
                    <th className="py-3.5 px-6 text-sm font-semibold text-slate-600 text-start">{t("statistics")}</th>
                    <th className="py-3.5 px-6 text-sm font-semibold text-slate-600 text-start">{t("rating")}</th>
                    <th className="py-3.5 px-6 text-sm font-semibold text-slate-600 text-start">{t("status")}</th>
                    <th className="py-3.5 px-6 text-sm font-semibold text-slate-600 text-start w-20">{tc("actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {providers.map((provider, index) => {
                    const typeBadge = getTypeBadge(provider.type);
                    const TypeIcon = typeBadge.icon;

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
                            className="flex items-center gap-3 text-right hover:opacity-80 transition-opacity"
                          >
                            {provider.image ? (
                              <img
                                src={provider.image}
                                alt={provider.name}
                                className="h-10 w-10 rounded-xl object-cover"
                              />
                            ) : (
                              <div className="h-10 w-10 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center">
                                <TypeIcon className="h-5 w-5 text-white" />
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
                            <TypeIcon className="h-3 w-3" />
                            {typeBadge.label}
                          </Badge>
                        </td>
                        <td className="py-4 px-6">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-sm text-slate-600">
                              <Mail className="h-3.5 w-3.5 text-slate-400" />
                              <span className="truncate max-w-[120px]">{provider.email || "-"}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm text-slate-600">
                              <Phone className="h-3.5 w-3.5 text-slate-400" />
                              <span dir="ltr">{provider.phone || "-"}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="space-y-1">
                            {provider.type !== "Doctor" && (
                              <div className="flex items-center gap-1.5 text-sm text-slate-600">
                                <Stethoscope className="h-3.5 w-3.5 text-slate-400" />
                                <span>{provider.provider_doctor_count || 0} {t("doctors")}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5 text-sm text-slate-600">
                              <Users className="h-3.5 w-3.5 text-slate-400" />
                              <span>{provider.bookings_count || 0} {t("bookings")}</span>
                            </div>
                            {provider.type === "Doctor" && provider.price_after_discount !== "0.00" && (
                              <div className="text-xs text-primary font-medium">
                                {formatPrice(provider.price_after_discount)}
                              </div>
                            )}
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
                                    {t("viewDetails")}
                                  </button>
                                  <button
                                    className="w-full px-3 py-2 text-start text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                                    onClick={() => handleEditProvider(provider)}
                                  >
                                    <Edit3 className="h-4 w-4 text-slate-400" />
                                    {t("editProvider")}
                                  </button>
                                  <div className="border-t border-slate-100 my-1" />
                                  <button
                                    className="w-full px-3 py-2 text-start text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                                    onClick={() => handleToggleStatus(provider.id)}
                                  >
                                    {provider.status ? (
                                      <>
                                        <XCircle className="h-4 w-4 text-amber-500" />
                                        {t("deactivate")}
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                                        {t("activate")}
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
                {t("showing")} {((currentPage - 1) * 10) + 1} - {Math.min(currentPage * 10, meta.total)} {t("of")} {meta.total}
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
