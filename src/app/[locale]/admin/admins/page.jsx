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
  AdminViewModal,
  DeleteConfirmModal,
  RestoreConfirmModal,
} from "@/components/admins/AdminModals";
import {
  Search, Trash2, Eye, MoreVertical, UserCog, Plus,
  UserCheck, UserX, Mail, Phone, CheckCircle, XCircle, Loader2,
  RefreshCw, Shield, Users, Archive, Edit3
} from "lucide-react";
import AdminsService from "@/lib/services/admins.service";
import toast from "react-hot-toast";

export default function AdminsPage() {
  const t = useTranslations("admins");
  const tc = useTranslations("common");
  const router = useRouter();
  const { locale } = useParams();

  // State
  const [admins, setAdmins] = useState([]);
  const [deletedAdmins, setDeletedAdmins] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState("active"); // "active" | "deleted"
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    deleted: 0,
  });

  // Modal states
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [adminToRestore, setAdminToRestore] = useState(null);

  // Fetch admins from API
  const fetchAdmins = useCallback(async (search = searchQuery) => {
    setIsLoading(true);
    try {
      const [adminsResult, deletedResult] = await Promise.all([
        AdminsService.getAdmins({ search: search || undefined }),
        AdminsService.getDeletedAdmins({ search: search || undefined }),
      ]);

      if (adminsResult.success) {
        const adminsList = adminsResult.data || [];

        // Fetch permissions count for each admin
        const adminsWithPermissions = await Promise.all(
          adminsList.map(async (admin) => {
            try {
              const detailResult = await AdminsService.getAdminById(admin.id);
              if (detailResult.success && detailResult.data?.permissions) {
                return {
                  ...admin,
                  permissions_count: detailResult.data.permissions.length,
                };
              }
            } catch (e) {
              console.error("Error fetching admin details:", e);
            }
            return admin;
          })
        );

        setAdmins(adminsWithPermissions);

        // Calculate stats
        const activeCount = adminsWithPermissions.filter(a => a.status).length;
        const inactiveCount = adminsWithPermissions.filter(a => !a.status).length;

        setStats(prev => ({
          ...prev,
          total: adminsWithPermissions.length,
          active: activeCount,
          inactive: inactiveCount,
        }));
      } else {
        toast.error(adminsResult.message);
      }

      if (deletedResult.success) {
        const deletedList = deletedResult.data || [];
        setDeletedAdmins(deletedList);
        setStats(prev => ({
          ...prev,
          deleted: deletedList.length,
        }));
      }
    } catch (error) {
      console.error("Error fetching admins:", error);
      toast.error(t("fetchError"));
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, t]);

  // Initial fetch
  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  // Search with debounce
  const searchTimerRef = useRef(null);
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      // searchQuery change will trigger fetchAdmins via useCallback deps
    }, 500);

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
  }, [searchQuery]);

  // Handle view details
  const handleViewDetails = async (adminId) => {
    setOpenDropdown(null);
    setIsLoadingDetails(true);
    setIsViewModalOpen(true);

    try {
      const result = await AdminsService.getAdminById(adminId);
      if (result.success) {
        setSelectedAdmin(result.data);
      } else {
        toast.error(result.message || t("fetchError"));
        setIsViewModalOpen(false);
      }
    } catch (error) {
      console.error("View details error:", error);
      toast.error(t("fetchError"));
      setIsViewModalOpen(false);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Handle add admin - navigate to add page
  const handleAddAdmin = () => {
    router.push(`/${locale}/admin/admins/add`);
  };

  // Handle edit admin - navigate to edit page
  const handleEditAdmin = (admin) => {
    setIsViewModalOpen(false);
    setOpenDropdown(null);
    router.push(`/${locale}/admin/admins/edit/${admin.id}`);
  };

  // Handle toggle status
  const handleToggleStatus = async (adminId) => {
    setOpenDropdown(null);
    setIsViewModalOpen(false);
    const loadingToast = toast.loading(t("updatingStatus"));
    try {
      const result = await AdminsService.updateAdminStatus(adminId);
      toast.dismiss(loadingToast);
      if (result.success) {
        toast.success(result.message);
        fetchAdmins(searchQuery);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      console.error("Toggle status error:", error);
      toast.error(t("statusError"));
    }
  };

  // Handle delete click
  const handleDeleteClick = (admin) => {
    setOpenDropdown(null);
    setAdminToDelete(admin);
    setIsDeleteModalOpen(true);
  };

  // Confirm delete
  const handleConfirmDelete = async () => {
    if (!adminToDelete) return;

    setIsSubmitting(true);
    try {
      const result = await AdminsService.deleteAdmin(adminToDelete.id);
      if (result.success) {
        toast.success(result.message);
        setIsDeleteModalOpen(false);
        setIsViewModalOpen(false);
        setAdminToDelete(null);
        fetchAdmins(searchQuery);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(t("deleteError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle restore click
  const handleRestoreClick = (admin) => {
    setOpenDropdown(null);
    setAdminToRestore(admin);
    setIsRestoreModalOpen(true);
  };

  // Confirm restore
  const handleConfirmRestore = async () => {
    if (!adminToRestore) return;

    setIsSubmitting(true);
    try {
      const result = await AdminsService.restoreAdmin(adminToRestore.id);
      if (result.success) {
        toast.success(result.message);
        setIsRestoreModalOpen(false);
        setAdminToRestore(null);
        fetchAdmins(searchQuery);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Restore error:", error);
      toast.error(t("restoreError"));
    } finally {
      setIsSubmitting(false);
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

  const toggleDropdown = (adminId) => {
    setOpenDropdown(openDropdown === adminId ? null : adminId);
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

  // Get current list based on view mode
  const currentList = viewMode === "active" ? admins : deletedAdmins;

  return (
    <DashboardLayout requiredUserType="admin">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
          <p className="text-slate-500 mt-1">{t("subtitle")}</p>
        </div>
        <Button onClick={handleAddAdmin} className="gap-2 h-10">
          <Plus className="w-4 h-4" />
          {t("addAdmin")}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">{t("totalAdmins")}</CardTitle>
              <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <UserCog className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.total}
            </div>
            <p className="text-xs text-slate-500 mt-1">{t("allAdmins")}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">{t("activeAdmins")}</CardTitle>
              <div className="h-10 w-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.active}
            </div>
            <p className="text-xs text-emerald-600 mt-1">
              {stats.total > 0 ? Math.round((stats.active / stats.total) * 100) : 0}% {t("ofTotal")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">{t("inactiveAdmins")}</CardTitle>
              <div className="h-10 w-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <UserX className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.inactive}
            </div>
            <p className="text-xs text-amber-600 mt-1">
              {t("needsActivation")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">{t("deletedAdmins")}</CardTitle>
              <div className="h-10 w-10 bg-rose-50 rounded-lg flex items-center justify-center">
                <Archive className="h-5 w-5 text-rose-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.deleted}
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
                  {currentList.length}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => fetchAdmins(searchQuery)}
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
                  <p className="text-slate-500">{t("loading")}</p>
                </div>
              </div>
            ) : currentList.length === 0 ? (
              <div className="text-center py-16">
                <UserCog className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  {viewMode === "active" ? t("noAdmins") : t("noDeletedAdmins")}
                </h3>
                <p className="text-slate-500">
                  {viewMode === "active" ? t("noAdminsDesc") : t("noDeletedAdminsDesc")}
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="py-3.5 px-6 text-sm font-semibold text-slate-600 text-start w-16">#</th>
                    <th className="py-3.5 px-6 text-sm font-semibold text-slate-600 text-start">{t("admin")}</th>
                    <th className="py-3.5 px-6 text-sm font-semibold text-slate-600 text-start">{t("contact")}</th>
                    <th className="py-3.5 px-6 text-sm font-semibold text-slate-600 text-start">{t("permissions")}</th>
                    <th className="py-3.5 px-6 text-sm font-semibold text-slate-600 text-start">{t("dateCreated")}</th>
                    <th className="py-3.5 px-6 text-sm font-semibold text-slate-600 text-start">{t("status")}</th>
                    <th className="py-3.5 px-6 text-sm font-semibold text-slate-600 text-start w-20">{t("actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {currentList.map((admin, index) => (
                    <tr
                      key={admin.id}
                      className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-4 px-6">
                        <span className="text-sm text-slate-500 font-medium">
                          {index + 1}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <button
                          onClick={() => handleViewDetails(admin.id)}
                          className="flex items-center gap-3 text-right hover:opacity-80 transition-opacity"
                        >
                          {admin.image ? (
                            <img
                              src={admin.image}
                              alt={admin.name}
                              className="h-10 w-10 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 bg-gradient-to-br from-slate-700 to-slate-600 rounded-xl flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">
                                {getInitials(admin.name)}
                              </span>
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-slate-900">{admin.name}</div>
                          </div>
                        </button>
                      </td>
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-sm text-slate-600">
                            <Mail className="h-3.5 w-3.5 text-slate-400" />
                            <span className="truncate max-w-[150px]">{admin.email || "-"}</span>
                          </div>
                          {admin.phone && (
                            <div className="flex items-center gap-1.5 text-sm text-slate-600">
                              <Phone className="h-3.5 w-3.5 text-slate-400" />
                              <span dir="ltr">{admin.phone}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-1.5">
                          <Shield className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium text-slate-700">
                            {admin.permissions_count || admin.permissions?.length || 0}
                          </span>
                          <span className="text-sm text-slate-500">{t("permissionsLabel")}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-slate-600">
                          {admin.created_at}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        {viewMode === "active" ? (
                          admin.status ? (
                            <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-200 gap-1">
                              <CheckCircle className="h-3 w-3" />
                              {t("active")}
                            </Badge>
                          ) : (
                            <Badge className="bg-rose-50 text-rose-700 hover:bg-rose-50 border border-rose-200 gap-1">
                              <XCircle className="h-3 w-3" />
                              {t("inactive")}
                            </Badge>
                          )
                        ) : (
                          <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 border border-slate-200 gap-1">
                            <Archive className="h-3 w-3" />
                            {t("deleted")}
                          </Badge>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex justify-center">
                          <div className="relative" ref={openDropdown === admin.id ? dropdownRef : null}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-slate-100"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                toggleDropdown(admin.id);
                              }}
                            >
                              <MoreVertical className="h-4 w-4 text-slate-500" />
                            </Button>

                            {openDropdown === admin.id && (
                              <div
                                className="absolute end-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {viewMode === "active" ? (
                                  <>
                                    <button
                                      className="w-full px-3 py-2 text-start text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                                      onClick={() => handleViewDetails(admin.id)}
                                    >
                                      <Eye className="h-4 w-4 text-slate-400" />
                                      {t("viewDetails")}
                                    </button>
                                    <button
                                      className="w-full px-3 py-2 text-start text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                                      onClick={() => handleEditAdmin(admin)}
                                    >
                                      <Edit3 className="h-4 w-4 text-slate-400" />
                                      {t("editAdmin")}
                                    </button>
                                    <button
                                      className="w-full px-3 py-2 text-start text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                                      onClick={() => handleToggleStatus(admin.id)}
                                    >
                                      {admin.status ? (
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
                                    <div className="border-t border-slate-100 my-1" />
                                    <button
                                      className="w-full px-3 py-2 text-start text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition-colors"
                                      onClick={() => handleDeleteClick(admin)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                      {t("deleteAdmin")}
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    className="w-full px-3 py-2 text-start text-sm text-emerald-600 hover:bg-emerald-50 flex items-center gap-2 transition-colors"
                                    onClick={() => handleRestoreClick(admin)}
                                  >
                                    <RefreshCw className="h-4 w-4" />
                                    {t("restoreAdmin")}
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
        </CardContent>
      </Card>

      {/* View Admin Details Modal */}
      <AdminViewModal
        isOpen={isViewModalOpen}
        onClose={() => {
          setIsViewModalOpen(false);
          setSelectedAdmin(null);
        }}
        admin={selectedAdmin}
        isLoading={isLoadingDetails}
        onEdit={handleEditAdmin}
        onToggleStatus={handleToggleStatus}
        onDelete={(id) => {
          const admin = admins.find(a => a.id === id);
          if (admin) handleDeleteClick(admin);
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setAdminToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        adminName={adminToDelete?.name}
        isDeleting={isSubmitting}
      />

      {/* Restore Confirmation Modal */}
      <RestoreConfirmModal
        isOpen={isRestoreModalOpen}
        onClose={() => {
          setIsRestoreModalOpen(false);
          setAdminToRestore(null);
        }}
        onConfirm={handleConfirmRestore}
        adminName={adminToRestore?.name}
        isRestoring={isSubmitting}
      />
    </DashboardLayout>
  );
}
