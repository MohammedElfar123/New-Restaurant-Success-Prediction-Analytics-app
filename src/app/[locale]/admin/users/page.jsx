"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  UserViewModal,
  DeleteConfirmModal,
  RestoreConfirmModal,
} from "@/components/users/UserModals";
import {
  Search, Trash2, Eye, Download, MoreVertical, Users,
  UserCheck, UserPlus, Mail, Phone, CheckCircle, XCircle, Loader2,
  RefreshCw, Archive
} from "lucide-react";
import CustomersService from "@/lib/services/customers.service";
import toast from "react-hot-toast";

export default function UsersPage() {
  const t = useTranslations("users");
  const tc = useTranslations("common");

  // State
  const [customers, setCustomers] = useState([]);
  const [deletedCustomers, setDeletedCustomers] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [deletedMeta, setDeletedMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [reports, setReports] = useState({ total_users: "0", active_users: { value: "0", percentage: 0 }, new_this_month: { value: "0", growth: 0 } });
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deletedPage, setDeletedPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState("active"); // "active" | "deleted"
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);
  const itemsPerPage = 10;

  // Modal states
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState(null);
  const [customerToRestore, setCustomerToRestore] = useState(null);

  // Fetch customers from API
  const fetchCustomers = useCallback(async (page = currentPage, search = searchQuery) => {
    setIsLoading(true);
    try {
      const [activeResult, deletedResult] = await Promise.all([
        CustomersService.getCustomers({
          page,
          per_page: itemsPerPage,
          search: search || undefined,
        }),
        CustomersService.getDeletedCustomers({
          page: deletedPage,
          per_page: itemsPerPage,
          search: search || undefined,
        }),
      ]);

      if (activeResult.success) {
        setCustomers(activeResult.data.items || []);
        setMeta(activeResult.data.meta || { current_page: 1, last_page: 1, total: 0 });
        setReports(activeResult.data.reports || { total_users: "0", active_users: { value: "0", percentage: 0 }, new_this_month: { value: "0", growth: 0 } });
      } else {
        toast.error(activeResult.message);
      }

      if (deletedResult.success) {
        setDeletedCustomers(deletedResult.data.items || []);
        setDeletedMeta(deletedResult.data.meta || { current_page: 1, last_page: 1, total: 0 });
      }
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("حدث خطأ أثناء جلب البيانات");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, deletedPage, searchQuery, itemsPerPage]);

  // Initial fetch and on page change
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Search with debounce
  const searchTimerRef = useRef(null);
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setCurrentPage(1);
      setDeletedPage(1);
    }, 500);

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Handle status toggle
  const handleToggleStatus = async (customerId) => {
    setOpenDropdown(null);
    setIsViewModalOpen(false);
    const loadingToast = toast.loading("جاري تحديث الحالة...");
    try {
      const result = await CustomersService.updateCustomerStatus(customerId);
      toast.dismiss(loadingToast);
      if (result.success) {
        toast.success(result.message || "تم تحديث الحالة بنجاح");
        fetchCustomers(currentPage, searchQuery);
      } else {
        toast.error(result.message || "فشل تحديث الحالة");
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("Toggle status error:", error);
      toast.error("حدث خطأ أثناء تحديث الحالة");
    }
  };

  // Handle delete - show confirmation modal
  const handleDeleteClick = (customer) => {
    setOpenDropdown(null);
    setCustomerToDelete(customer);
    setIsDeleteModalOpen(true);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!customerToDelete) return;

    setIsSubmitting(true);
    try {
      const result = await CustomersService.deleteCustomer(customerToDelete.id);
      if (result.success) {
        toast.success(result.message || "تم الحذف بنجاح");
        setIsDeleteModalOpen(false);
        setIsViewModalOpen(false);
        setCustomerToDelete(null);
        fetchCustomers(currentPage, searchQuery);
      } else {
        toast.error(result.message || "فشل الحذف");
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("حدث خطأ أثناء الحذف");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle restore click
  const handleRestoreClick = (customer) => {
    setOpenDropdown(null);
    setCustomerToRestore(customer);
    setIsRestoreModalOpen(true);
  };

  // Confirm restore
  const handleConfirmRestore = async () => {
    if (!customerToRestore) return;

    setIsSubmitting(true);
    try {
      const result = await CustomersService.restoreCustomer(customerToRestore.id);
      if (result.success) {
        toast.success(result.message || "تم استعادة المستخدم بنجاح");
        setIsRestoreModalOpen(false);
        setCustomerToRestore(null);
        fetchCustomers(currentPage, searchQuery);
      } else {
        toast.error(result.message || "فشل استعادة المستخدم");
      }
    } catch (error) {
      console.error("Restore error:", error);
      toast.error("حدث خطأ أثناء استعادة المستخدم");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle view details - open modal
  const handleViewDetails = async (customerId) => {
    setOpenDropdown(null);
    setIsLoadingDetails(true);
    setIsViewModalOpen(true);

    try {
      const result = await CustomersService.getCustomerById(customerId);
      if (result.success) {
        setSelectedCustomer(result.data);
      } else {
        toast.error(result.message || "فشل جلب التفاصيل");
        setIsViewModalOpen(false);
      }
    } catch (error) {
      console.error("View details error:", error);
      toast.error("حدث خطأ أثناء جلب التفاصيل");
      setIsViewModalOpen(false);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Handle export
  const handleExport = async () => {
    const loadingToast = toast.loading("جاري تصدير البيانات...");
    try {
      const result = await CustomersService.exportCustomers({ search: searchQuery });
      toast.dismiss(loadingToast);
      if (result.success && result.data?.url) {
        window.open(result.data.url, "_blank");
        toast.success("تم تصدير البيانات بنجاح");
      } else {
        toast.error(result.message || "فشل التصدير");
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("Export error:", error);
      toast.error("حدث خطأ أثناء التصدير");
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

  const toggleDropdown = (userId) => {
    setOpenDropdown(openDropdown === userId ? null : userId);
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

  // Get current list and pagination based on view mode
  const currentList = viewMode === "active" ? customers : deletedCustomers;
  const currentMeta = viewMode === "active" ? meta : deletedMeta;
  const activePage = viewMode === "active" ? currentPage : deletedPage;
  const setActivePage = viewMode === "active" ? setCurrentPage : setDeletedPage;

  return (
    <DashboardLayout requiredUserType="admin">
      {/* Page Header */}
      <div data-tour="admin-welcome" className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
          <p className="text-slate-500 mt-1">{t("subtitle")}</p>
        </div>
        <Button variant="outline" className="gap-2 h-10" onClick={handleExport}>
          <Download className="w-4 h-4" />
          {t("exportUsers")}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">{t("totalUsers")}</CardTitle>
              <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : parseInt(reports.total_users || meta.total || 0).toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 mt-1">{t("allRegistered")}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">{t("activeUsers")}</CardTitle>
              <div className="h-10 w-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : parseInt(reports.active_users?.value || 0).toLocaleString()}
            </div>
            <p className="text-xs text-emerald-600 mt-1">
              {reports.active_users?.percentage || 0}% {t("ofTotal")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">{t("newThisMonth")}</CardTitle>
              <div className="h-10 w-10 bg-pink-50 rounded-lg flex items-center justify-center">
                <UserPlus className="h-5 w-5 text-pink-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : parseInt(reports.new_this_month?.value || 0).toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {reports.new_this_month?.growth > 0 ? (
                <span className="text-emerald-600">+{reports.new_this_month.growth}%</span>
              ) : (
                t("noGrowth")
              )}{" "}
              {t("fromLastMonth")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">{t("deletedUsers")}</CardTitle>
              <div className="h-10 w-10 bg-rose-50 rounded-lg flex items-center justify-center">
                <Archive className="h-5 w-5 text-rose-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (deletedMeta.total || 0)}
            </div>
            <p className="text-xs text-rose-600 mt-1">
              {t("canRestore")}
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
                {/* View Mode Toggle */}
                <div className="flex items-center bg-white rounded-lg border border-slate-200 p-1">
                  <button
                    onClick={() => setViewMode("active")}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      viewMode === "active"
                        ? "bg-primary text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {t("activeTab")}
                  </button>
                  <button
                    onClick={() => setViewMode("deleted")}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      viewMode === "deleted"
                        ? "bg-rose-500 text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {t("deletedTab")}
                  </button>
                </div>
                <Badge variant="secondary" className="bg-slate-200 text-slate-700">
                  {currentMeta.total || currentList.length || 0}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchCustomers(currentPage, searchQuery)}
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
                  <p className="text-slate-500">{t("loadingData")}</p>
                </div>
              </div>
            ) : currentList.length === 0 ? (
              <div className="text-center py-16">
                <Users className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  {viewMode === "active" ? t("noUsers") : t("noDeletedUsers")}
                </h3>
                <p className="text-slate-500">
                  {viewMode === "active" ? t("noUsersFound") : t("noDeletedUsersDesc")}
                </p>
              </div>
            ) : (
              <table className="w-full table-fixed">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="py-3.5 px-4 text-sm font-semibold text-slate-600 text-center w-[50px]">#</th>
                    <th className="py-3.5 px-4 text-sm font-semibold text-slate-600 text-start w-[18%]">{t("user")}</th>
                    <th className="py-3.5 px-4 text-sm font-semibold text-slate-600 text-start w-[18%]">{t("contact")}</th>
                    <th className="py-3.5 px-4 text-sm font-semibold text-slate-600 text-center w-[12%]">{t("bookings")}</th>
                    <th className="py-3.5 px-4 text-sm font-semibold text-slate-600 text-center w-[16%]">
                      {viewMode === "active" ? t("dateJoined") : t("dateDeleted")}
                    </th>
                    <th className="py-3.5 px-4 text-sm font-semibold text-slate-600 text-center w-[10%]">{t("status")}</th>
                    <th className="py-3.5 px-4 text-sm font-semibold text-slate-600 text-center w-[60px]">{t("actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {currentList.map((customer, index) => (
                    <tr
                      key={customer.id}
                      className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-center w-[50px]">
                        <span className="text-sm text-slate-500 font-medium">
                          {(activePage - 1) * itemsPerPage + index + 1}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-start w-[18%]">
                        <div className="flex items-center gap-3">
                          {customer.image ? (
                            <img
                              src={customer.image}
                              alt={customer.name}
                              className="h-10 w-10 rounded-xl object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="h-10 w-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-semibold text-sm">
                                {getInitials(customer.name)}
                              </span>
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-medium text-slate-900 truncate">{customer.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-start w-[18%]">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-sm text-slate-600">
                            <Mail className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{customer.email || "-"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-slate-600">
                            <Phone className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                            <span dir="ltr" className="truncate">{customer.phone}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center w-[12%]">
                        <div className="text-sm">
                          <span className="font-semibold text-slate-900">{customer.bookings_count || 0}</span>
                          <span className="text-slate-500"> {t("booking")}</span>
                          <div className="text-xs text-slate-500">
                            {parseFloat(customer.bookings_sum_total || 0).toFixed(0)} QAR
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center w-[16%]">
                        <div className="text-sm text-slate-600">
                          {viewMode === "active" ? customer.created_at : (customer.deleted_at || customer.created_at)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center w-[10%]">
                        {viewMode === "active" ? (
                          customer.status ? (
                            <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-200 gap-1 text-xs">
                              <CheckCircle className="h-3 w-3" />
                              {t("active")}
                            </Badge>
                          ) : (
                            <Badge className="bg-rose-50 text-rose-700 hover:bg-rose-50 border border-rose-200 gap-1 text-xs">
                              <XCircle className="h-3 w-3" />
                              {t("inactive")}
                            </Badge>
                          )
                        ) : (
                          <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 border border-slate-200 gap-1 text-xs">
                            <Archive className="h-3 w-3" />
                            {t("deleted")}
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center w-[60px]">
                        <div className="flex justify-center">
                          <div className="relative" ref={openDropdown === customer.id ? dropdownRef : null}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-slate-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                toggleDropdown(customer.id);
                              }}
                            >
                              <MoreVertical className="h-4 w-4 text-slate-500" />
                            </Button>

                            {openDropdown === customer.id && (
                              <div
                                className="absolute end-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {viewMode === "active" ? (
                                  <>
                                    <button
                                      className="w-full px-3 py-2 text-start text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                                      onClick={() => handleViewDetails(customer.id)}
                                    >
                                      <Eye className="h-4 w-4 text-slate-400" />
                                      {t("viewDetails")}
                                    </button>
                                    <button
                                      className="w-full px-3 py-2 text-start text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                                      onClick={() => handleToggleStatus(customer.id)}
                                    >
                                      {customer.status ? (
                                        <>
                                          <XCircle className="h-4 w-4 text-amber-500" />
                                          {t("deactivateAccount")}
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                                          {t("activateAccount")}
                                        </>
                                      )}
                                    </button>
                                    <div className="border-t border-slate-100 my-1" />
                                    <button
                                      className="w-full px-3 py-2 text-start text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                                      onClick={() => handleDeleteClick(customer)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      {t("deleteUser")}
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    className="w-full px-3 py-2 text-start text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 transition-colors"
                                    onClick={() => handleRestoreClick(customer)}
                                  >
                                    <RefreshCw className="h-4 w-4" />
                                    {t("restoreUser")}
                                  </button>
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
          {currentMeta.last_page > 1 && (
            <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 border-t border-slate-200 gap-4">
              <div className="text-sm text-slate-500">
                {t("page")} {currentMeta.current_page} {t("of")} {currentMeta.last_page} ({currentMeta.total} {t("userCount")})
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={activePage === 1 || isLoading}
                  onClick={() => setActivePage((p) => Math.max(1, p - 1))}
                  className="h-9"
                >
                  {t("prev")}
                </Button>

                {Array.from({ length: Math.min(5, currentMeta.last_page) }, (_, i) => {
                  let pageNum;
                  if (currentMeta.last_page <= 5) {
                    pageNum = i + 1;
                  } else if (activePage <= 3) {
                    pageNum = i + 1;
                  } else if (activePage >= currentMeta.last_page - 2) {
                    pageNum = currentMeta.last_page - 4 + i;
                  } else {
                    pageNum = activePage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant="outline"
                      size="sm"
                      disabled={isLoading}
                      className={`h-9 w-9 p-0 ${
                        activePage === pageNum
                          ? "bg-primary text-white border-primary hover:bg-primary/90 hover:text-white"
                          : ""
                      }`}
                      onClick={() => setActivePage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}

                {currentMeta.last_page > 5 && activePage < currentMeta.last_page - 2 && (
                  <>
                    <span className="text-slate-400 px-1">...</span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isLoading}
                      className="h-9 w-9 p-0"
                      onClick={() => setActivePage(currentMeta.last_page)}
                    >
                      {currentMeta.last_page}
                    </Button>
                  </>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  disabled={activePage === currentMeta.last_page || isLoading}
                  onClick={() => setActivePage((p) => Math.min(currentMeta.last_page, p + 1))}
                  className="h-9"
                >
                  {t("nextPage")}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View User Details Modal */}
      <UserViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedCustomer(null);
        }}
        customer={selectedCustomer}
        isLoading={isLoadingDetails}
        onToggleStatus={handleToggleStatus}
        onDelete={(id) => {
          const customer = customers.find(c => c.id === id);
          if (customer) handleDeleteClick(customer);
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setCustomerToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        userName={customerToDelete?.name}
        isDeleting={isSubmitting}
      />

      {/* Restore Confirmation Modal */}
      <RestoreConfirmModal
        isOpen={isRestoreModalOpen}
        onClose={() => {
          setIsRestoreModalOpen(false);
          setCustomerToRestore(null);
        }}
        onConfirm={handleConfirmRestore}
        userName={customerToRestore?.name}
        isRestoring={isSubmitting}
      />
    </DashboardLayout>
  );
}
