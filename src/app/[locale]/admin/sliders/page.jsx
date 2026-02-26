"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Image as ImageIcon, Plus, Search, MoreVertical, Eye, Edit3,
  Trash2, Building2, Stethoscope, User, ExternalLink, Calendar,
  Loader2, Link2, CheckCircle, XCircle, RefreshCw, ImageOff
} from "lucide-react";
import toast from "react-hot-toast";
import SlidersService from "@/lib/services/sliders.service";
import SliderFormModal from "@/components/sliders/SliderFormModal";
import SliderViewModal from "@/components/sliders/SliderViewModal";
import SliderDeleteModal from "@/components/sliders/SliderDeleteModal";
import { usePermissions, PERMISSIONS } from "@/hooks/usePermissions";

export default function SlidersPage() {
  const t = useTranslations("sliders");
  const tc = useTranslations("common");
  const locale = useLocale();

  // Permissions
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(PERMISSIONS.SLIDERS_CREATE);
  const canEdit = hasPermission(PERMISSIONS.SLIDERS_EDIT);
  const canDelete = hasPermission(PERMISSIONS.SLIDERS_DELETE);

  // State
  const [sliders, setSliders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);
  const itemsPerPage = 10;

  // Modals
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedSlider, setSelectedSlider] = useState(null);

  // Fetch sliders
  const fetchSliders = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {
        page: currentPage,
        per_page: itemsPerPage,
      };
      if (searchQuery) params.search = searchQuery;

      const result = await SlidersService.getSliders(params);

      if (result.success) {
        setSliders(result.data);
        setMeta(result.meta);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(tc("errorFetchingData"));
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, tc, itemsPerPage]);

  // Fetch on page/search change
  useEffect(() => {
    fetchSliders();
  }, [fetchSliders]);

  // Search debounce — reset to page 1
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

  // Handle status toggle
  const handleToggleStatus = async (slider) => {
    setOpenDropdown(null);
    const loadingToast = toast.loading(tc("loading"));
    try {
      const result = await SlidersService.toggleSliderStatus(slider.id);
      toast.dismiss(loadingToast);
      if (result.success) {
        toast.success(tc("statusUpdated"));
        fetchSliders(currentPage, searchQuery);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(tc("errorUpdatingStatus"));
    }
  };

  // Handle add new
  const handleAdd = () => {
    setSelectedSlider(null);
    setFormModalOpen(true);
  };

  // Handle edit
  const handleEdit = (slider) => {
    setOpenDropdown(null);
    setSelectedSlider(slider);
    setFormModalOpen(true);
  };

  // Handle view
  const handleView = (slider) => {
    setOpenDropdown(null);
    setSelectedSlider(slider);
    setViewModalOpen(true);
  };

  // Handle delete click
  const handleDeleteClick = (slider) => {
    setOpenDropdown(null);
    setSelectedSlider(slider);
    setDeleteModalOpen(true);
  };

  const toggleDropdown = (sliderId) => {
    setOpenDropdown(openDropdown === sliderId ? null : sliderId);
  };

  // Get type icon component
  const getTypeIcon = (type) => {
    switch (type) {
      case "Hospital": return <Building2 className="h-3.5 w-3.5" />;
      case "Clinic": return <Stethoscope className="h-3.5 w-3.5" />;
      case "Doctor": return <User className="h-3.5 w-3.5" />;
      case "URL":
      case "ULR": return <ExternalLink className="h-3.5 w-3.5" />;
      default: return <ImageIcon className="h-3.5 w-3.5" />;
    }
  };

  // Get type badge style
  const getTypeBadgeStyle = (type) => {
    switch (type) {
      case "Hospital": return "bg-blue-50 text-blue-700 border-blue-200";
      case "Clinic": return "bg-purple-50 text-purple-700 border-purple-200";
      case "Doctor": return "bg-teal-50 text-teal-700 border-teal-200";
      case "URL":
      case "ULR": return "bg-orange-50 text-orange-700 border-orange-200";
      default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  // Calculate stats
  const totalSliders = meta.total || 0;
  const activeSliders = sliders.filter(s => s.status).length;

  return (
    <DashboardLayout requiredUserType="admin">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
          <p className="text-slate-500 mt-1">{t("subtitle")}</p>
        </div>
{canCreate && (
          <Button className="gap-2 h-10" onClick={handleAdd}>
            <Plus className="w-4 h-4" />
            {t("addSlider")}
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">{t("totalSliders")}</CardTitle>
              <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                <ImageIcon className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalSliders}
            </div>
            <p className="text-xs text-slate-500 mt-1">{t("allSliders")}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">{t("activeSliders")}</CardTitle>
              <div className="h-10 w-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : activeSliders}
            </div>
            <p className="text-xs text-emerald-600 mt-1">
              {totalSliders > 0 ? Math.round((activeSliders / totalSliders) * 100) : 0}% {t("ofTotal")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">{t("inactiveSliders")}</CardTitle>
              <div className="h-10 w-10 bg-rose-50 rounded-lg flex items-center justify-center">
                <XCircle className="h-5 w-5 text-rose-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalSliders - activeSliders}
            </div>
            <p className="text-xs text-rose-600 mt-1">
              {totalSliders > 0 ? Math.round(((totalSliders - activeSliders) / totalSliders) * 100) : 0}% {t("ofTotal")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-0">
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-slate-900">{t("allSliders")}</h3>
                <Badge variant="secondary" className="bg-slate-200 text-slate-700">
                  {meta.total || 0}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchSliders(currentPage, searchQuery)}
                  disabled={isLoading}
                  className="h-8 w-8 p-0"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder={t("searchPlaceholder")}
                    className="pr-10 w-72 h-10 bg-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-visible">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-slate-500">{tc("loading")}</p>
                </div>
              </div>
            ) : sliders.length === 0 ? (
              <div className="text-center py-16">
                <ImageOff className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">{t("noSliders")}</h3>
                <p className="text-slate-500">{t("noSlidersHint")}</p>
              </div>
            ) : (
              <table className="w-full table-fixed">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="py-3.5 px-3 text-sm font-semibold text-slate-600 text-center w-[50px]">#</th>
                    <th className="py-3.5 px-3 text-sm font-semibold text-slate-600 text-center w-[90px]">{t("image")}</th>
                    <th className="py-3.5 px-3 text-sm font-semibold text-slate-600 text-start w-[15%]">{t("titleColumn")}</th>
                    <th className="py-3.5 px-3 text-sm font-semibold text-slate-600 text-center w-[100px]">{t("type")}</th>
                    <th className="py-3.5 px-3 text-sm font-semibold text-slate-600 text-start w-[15%]">{t("link")}</th>
                    <th className="py-3.5 px-3 text-sm font-semibold text-slate-600 text-center w-[60px]">{t("sort")}</th>
                    <th className="py-3.5 px-3 text-sm font-semibold text-slate-600 text-start w-[14%]">{t("dateRange")}</th>
                    <th className="py-3.5 px-3 text-sm font-semibold text-slate-600 text-center w-[90px]">{tc("status")}</th>
                    <th className="py-3.5 px-3 text-sm font-semibold text-slate-600 text-center w-[60px]">{tc("actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {sliders.map((slider, index) => (
                    <tr
                      key={slider.id}
                      className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                    >
                      {/* # */}
                      <td className="py-3 px-3 text-center w-[50px]">
                        <span className="text-sm text-slate-500 font-medium">
                          {(currentPage - 1) * itemsPerPage + index + 1}
                        </span>
                      </td>
                      {/* Image */}
                      <td className="py-3 px-3 text-center w-[90px]">
                        <div className="w-16 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 mx-auto">
                          {slider.image ? (
                            <img
                              src={slider.image}
                              alt={slider.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <ImageIcon className="h-4 w-4 text-slate-400" />
                            </div>
                          )}
                        </div>
                      </td>
                      {/* Title */}
                      <td className="py-3 px-3 text-start w-[15%]">
                        <button
                          onClick={() => handleView(slider)}
                          className="hover:opacity-80 transition-opacity text-start w-full"
                        >
                          <div className="font-medium text-slate-900 line-clamp-1 truncate">
                            {slider.title}
                          </div>
                        </button>
                      </td>
                      {/* Type */}
                      <td className="py-3 px-3 text-center w-[100px]">
                        <Badge className={`gap-1 border text-xs ${getTypeBadgeStyle(slider.type)}`}>
                          {getTypeIcon(slider.type)}
                          {t(`type${slider.type}`)}
                        </Badge>
                      </td>
                      {/* Link */}
                      <td className="py-3 px-3 text-start w-[15%]">
                        {slider.type === "None" ? (
                          <span className="text-slate-400 text-sm">-</span>
                        ) : (slider.type === "URL" || slider.type === "ULR") ? (
                          <a
                            href={slider.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline inline-flex items-center gap-1 text-sm truncate max-w-full"
                          >
                            <Link2 className="h-3.5 w-3.5 flex-shrink-0" />
                            <span className="truncate">{t("externalLink")}</span>
                          </a>
                        ) : slider.typeModel ? (
                          <div className="flex items-center gap-2">
                            {slider.typeModel.image && (
                              <img
                                src={slider.typeModel.image}
                                alt=""
                                className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                              />
                            )}
                            <span className="text-sm text-slate-700 line-clamp-1 truncate">
                              {slider.typeModel.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-sm">-</span>
                        )}
                      </td>
                      {/* Sort */}
                      <td className="py-3 px-3 text-center w-[60px]">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-700 text-xs">
                          {slider.sort}
                        </Badge>
                      </td>
                      {/* Date Range */}
                      <td className="py-3 px-3 text-start w-[14%]">
                        {slider.start_at || slider.end_at ? (
                          <div className="text-xs text-slate-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-slate-400 flex-shrink-0" />
                              <span className="truncate">{slider.start_at || "-"}</span>
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5 ps-4 truncate">
                              {t("until")} {slider.end_at || "-"}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-sm">-</span>
                        )}
                      </td>
                      {/* Status */}
                      <td className="py-3 px-3 text-center w-[90px]">
                        {slider.status ? (
                          <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-200 gap-1 text-xs">
                            <CheckCircle className="h-3 w-3" />
                            {tc("active")}
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-50 text-rose-700 hover:bg-rose-50 border border-rose-200 gap-1 text-xs">
                            <XCircle className="h-3 w-3" />
                            {tc("inactive")}
                          </Badge>
                        )}
                      </td>
                      {/* Actions */}
                      <td className="py-3 px-3 text-center w-[60px]">
                        <div className="flex justify-center">
                          <div className="relative" ref={openDropdown === slider.id ? dropdownRef : null}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-slate-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleDropdown(slider.id);
                              }}
                            >
                              <MoreVertical className="h-4 w-4 text-slate-500" />
                            </Button>

                            {openDropdown === slider.id && (
                              <div
                                className="absolute end-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  className="w-full px-3 py-2 text-start text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                                  onClick={() => handleView(slider)}
                                >
                                  <Eye className="h-4 w-4 text-slate-400" />
                                  {tc("view")}
                                </button>
                                {canEdit && (
                                  <button
                                    className="w-full px-3 py-2 text-start text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                                    onClick={() => handleEdit(slider)}
                                  >
                                    <Edit3 className="h-4 w-4 text-slate-400" />
                                    {tc("edit")}
                                  </button>
                                )}
                                {canEdit && (
                                  <button
                                    className="w-full px-3 py-2 text-start text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                                    onClick={() => handleToggleStatus(slider)}
                                  >
                                    {slider.status ? (
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
                                )}
                                {canDelete && (
                                  <>
                                    <div className="border-t border-slate-100 my-1" />
                                    <button
                                      className="w-full px-3 py-2 text-start text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                                      onClick={() => handleDeleteClick(slider)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      {tc("delete")}
                                    </button>
                                  </>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {meta.last_page > 1 && (
            <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 border-t border-slate-200 gap-4">
              <div className="text-sm text-slate-500">
                {t("page")} {meta.current_page} {t("of")} {meta.last_page} ({meta.total} {t("slider")})
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1 || isLoading}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="h-9"
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
                      disabled={isLoading}
                      className={`h-9 w-9 p-0 ${
                        currentPage === pageNum
                          ? "bg-primary text-white border-primary hover:bg-primary/90 hover:text-white"
                          : ""
                      }`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}

                {meta.last_page > 5 && currentPage < meta.last_page - 2 && (
                  <>
                    <span className="text-slate-400 px-1">...</span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isLoading}
                      className="h-9 w-9 p-0"
                      onClick={() => setCurrentPage(meta.last_page)}
                    >
                      {meta.last_page}
                    </Button>
                  </>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === meta.last_page || isLoading}
                  onClick={() => setCurrentPage((p) => Math.min(meta.last_page, p + 1))}
                  className="h-9"
                >
                  {tc("next")}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <SliderFormModal
        open={formModalOpen}
        onOpenChange={setFormModalOpen}
        slider={selectedSlider}
        onSuccess={() => fetchSliders(currentPage, searchQuery)}
      />

      <SliderViewModal
        open={viewModalOpen}
        onOpenChange={setViewModalOpen}
        slider={selectedSlider}
        onEdit={handleEdit}
      />

      <SliderDeleteModal
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        slider={selectedSlider}
        onSuccess={() => fetchSliders(currentPage, searchQuery)}
      />
    </DashboardLayout>
  );
}
