"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useAuthStore } from "@/stores/authStore";
import ProviderTeamService from "@/lib/services/provider-team.service";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  UserCog,
  Search,
  Plus,
  Shield,
  UserCheck,
  Users,
  RefreshCw,
  MoreVertical,
  Eye,
  Loader2,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  Archive,
  Key,
  Trash2,
  RotateCcw,
  ToggleLeft,
  ToggleRight,
  X,
  Save,
  EyeOff,
  Lock,
} from "lucide-react";
import toast from "react-hot-toast";

export default function ProviderTeamPage() {
  const locale = useLocale();
  const t = useTranslations("common");
  const { user } = useAuthStore();
  const isRTL = locale === "ar";

  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [allAdmins, setAllAdmins] = useState([]);
  const [deletedAdmins, setDeletedAdmins] = useState([]);
  const [viewMode, setViewMode] = useState("active");
  const [openDropdown, setOpenDropdown] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [restoreLoading, setRestoreLoading] = useState(null);
  const dropdownRef = useRef(null);

  // Create/Edit modal state
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [allPermissions, setAllPermissions] = useState({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: "",
    is_active: true,
    permissions: [],
    image: null,
  });

  // View details modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsAdmin, setDetailsAdmin] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Stats
  const stats = {
    total: allAdmins.length,
    active: allAdmins.filter((a) => a.is_active == true || a.status == true).length,
    inactive: allAdmins.filter((a) => !(a.is_active == true || a.status == true)).length,
    deleted: deletedAdmins.length,
  };

  // Filtered admins based on search
  const filteredAdmins = (viewMode === "active" ? allAdmins : deletedAdmins).filter((admin) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      admin.name?.toLowerCase().includes(q) ||
      admin.email?.toLowerCase().includes(q) ||
      admin.phone?.includes(q)
    );
  });

  // Fetch admins
  const fetchAdmins = useCallback(async () => {
    setIsLoading(true);
    try {
      const [activeResult, deletedResult] = await Promise.all([
        ProviderTeamService.getAdmins(),
        ProviderTeamService.getDeletedAdmins(),
      ]);

      if (activeResult.success) {
        setAllAdmins(activeResult.data);
      }
      if (deletedResult.success) {
        setDeletedAdmins(deletedResult.data);
      }
    } catch (error) {
      console.error("Error fetching admins:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Toggle admin status
  const handleToggleStatus = async (adminId, currentStatus) => {
    setStatusUpdating(adminId);
    setOpenDropdown(null);
    try {
      const result = await ProviderTeamService.toggleAdminStatus(adminId, currentStatus);
      if (result.success) {
        toast.success(isRTL ? "تم تحديث الحالة" : "Status updated");
        fetchAdmins();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error(isRTL ? "حدث خطأ" : "An error occurred");
    } finally {
      setStatusUpdating(null);
    }
  };

  // Delete admin (soft)
  const handleDelete = async (adminId) => {
    setDeleteLoading(adminId);
    setOpenDropdown(null);
    try {
      const result = await ProviderTeamService.deleteAdmin(adminId);
      if (result.success) {
        toast.success(isRTL ? "تم حذف المشرف" : "Admin deleted");
        fetchAdmins();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error(isRTL ? "حدث خطأ" : "An error occurred");
    } finally {
      setDeleteLoading(null);
    }
  };

  // Restore deleted admin
  const handleRestore = async (adminId) => {
    setRestoreLoading(adminId);
    try {
      const result = await ProviderTeamService.restoreAdmin(adminId);
      if (result.success) {
        toast.success(isRTL ? "تم استعادة المشرف" : "Admin restored");
        fetchAdmins();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error(isRTL ? "حدث خطأ" : "An error occurred");
    } finally {
      setRestoreLoading(null);
    }
  };

  // Open view details
  const handleViewDetails = async (adminId) => {
    setOpenDropdown(null);
    setDetailsLoading(true);
    setShowDetailsModal(true);
    try {
      const result = await ProviderTeamService.getAdminById(adminId);
      if (result.success) {
        setDetailsAdmin(result.data);
      } else {
        toast.error(result.message);
        setShowDetailsModal(false);
      }
    } catch {
      toast.error(isRTL ? "حدث خطأ" : "An error occurred");
      setShowDetailsModal(false);
    } finally {
      setDetailsLoading(false);
    }
  };

  // Open create modal
  const handleOpenCreate = async () => {
    setEditingAdmin(null);
    setFormData({
      name: "",
      email: "",
      phone: "",
      password: "",
      password_confirmation: "",
      is_active: true,
      permissions: [],
      image: null,
    });
    setShowModal(true);
    // Load permissions
    const permResult = await ProviderTeamService.getAllPermissions();
    if (permResult.success) {
      setAllPermissions(permResult.data?.structured || {});
    }
  };

  // Open edit modal - fetch full admin details first for permissions
  const handleOpenEdit = async (admin) => {
    setOpenDropdown(null);
    setModalLoading(true);
    setShowModal(true);

    try {
      // Fetch admin details (includes permissions) and all permissions in parallel
      const [detailResult, permResult] = await Promise.all([
        ProviderTeamService.getAdminById(admin.id),
        ProviderTeamService.getAllPermissions(),
      ]);

      const adminData = detailResult.success ? detailResult.data : admin;
      setEditingAdmin(adminData);

      // Extract full permission names from the admin's permissions
      // API returns: [{ id: 1, name: "bookings.bookings.view" }, ...]
      const adminPermissions = adminData.permissions?.map((p) => {
        if (typeof p === "object" && p !== null) return p.name || p.id;
        return p;
      }) || [];

      setFormData({
        name: adminData.name || "",
        email: adminData.email || "",
        phone: adminData.phone || "",
        password: "",
        password_confirmation: "",
        is_active: adminData.is_active === 1 || adminData.is_active === true || adminData.status === true,
        permissions: adminPermissions,
        image: null,
      });

      if (permResult.success) {
        setAllPermissions(permResult.data?.structured || {});
      }
    } catch {
      toast.error(isRTL ? "حدث خطأ في تحميل البيانات" : "Error loading data");
    } finally {
      setModalLoading(false);
    }
  };

  // Submit create/edit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error(isRTL ? "جميع الحقول مطلوبة" : "All fields are required");
      return;
    }
    if (!editingAdmin && (!formData.password || !formData.password_confirmation)) {
      toast.error(isRTL ? "كلمة المرور مطلوبة" : "Password is required");
      return;
    }
    if (formData.password && formData.password !== formData.password_confirmation) {
      toast.error(isRTL ? "كلمة المرور غير متطابقة" : "Passwords do not match");
      return;
    }
    if (!formData.permissions || formData.permissions.length === 0) {
      toast.error(isRTL ? "يجب اختيار صلاحية واحدة على الأقل" : "Please select at least one permission");
      return;
    }

    setModalLoading(true);
    try {
      let result;
      if (editingAdmin) {
        result = await ProviderTeamService.updateAdmin(editingAdmin.id, formData);
      } else {
        result = await ProviderTeamService.createAdmin(formData);
      }

      if (result.success) {
        toast.success(
          editingAdmin
            ? (isRTL ? "تم تحديث المشرف" : "Admin updated")
            : (isRTL ? "تم إنشاء المشرف" : "Admin created")
        );
        setShowModal(false);
        fetchAdmins();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error(isRTL ? "حدث خطأ" : "An error occurred");
    } finally {
      setModalLoading(false);
    }
  };

  // Toggle permission in form
  const togglePermission = (permKey) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permKey)
        ? prev.permissions.filter((p) => p !== permKey)
        : [...prev.permissions, permKey],
    }));
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return "—";
    try {
      return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return date;
    }
  };

  return (
    <DashboardLayout requiredUserType="provider">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="h-10 w-10 bg-slate-200 rounded-lg flex items-center justify-center">
              <UserCog className="h-5 w-5 text-slate-600" />
            </div>
            {isRTL ? "إدارة الفريق" : "Team Management"}
          </h1>
          <p className="text-slate-500 mt-1">
            {isRTL ? "إدارة المشرفين والصلاحيات" : "Manage admins and permissions"}
          </p>
        </div>
        <Button className="gap-2 h-10" onClick={handleOpenCreate}>
          <Plus className="w-4 h-4" />
          {isRTL ? "إضافة مشرف" : "Add Admin"}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">
                {isRTL ? "إجمالي المشرفين" : "Total Admins"}
              </CardTitle>
              <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.total}
            </div>
            <p className="text-xs text-slate-500 mt-1">{isRTL ? "جميع المشرفين" : "All admins"}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">
                {isRTL ? "نشط" : "Active Admins"}
              </CardTitle>
              <div className="h-10 w-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.active}
            </div>
            <p className="text-xs text-emerald-600 mt-1">{isRTL ? "مشرفين نشطين" : "Currently active"}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">
                {isRTL ? "غير نشط" : "Inactive Admins"}
              </CardTitle>
              <div className="h-10 w-10 bg-pink-50 rounded-lg flex items-center justify-center">
                <UserCog className="h-5 w-5 text-pink-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.inactive}
            </div>
            <p className="text-xs text-slate-500 mt-1">{isRTL ? "يحتاج تفعيل" : "Needs activation"}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">
                {isRTL ? "المحذوفين" : "Deleted Admins"}
              </CardTitle>
              <div className="h-10 w-10 bg-rose-50 rounded-lg flex items-center justify-center">
                <Archive className="h-5 w-5 text-rose-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.deleted}
            </div>
            <p className="text-xs text-rose-600 mt-1">{isRTL ? "يمكن استعادتهم" : "Can be restored"}</p>
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
                <div className="flex items-center bg-white rounded-lg border border-slate-200 p-1">
                  <button
                    onClick={() => setViewMode("active")}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      viewMode === "active"
                        ? "bg-primary text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {isRTL ? "المشرفين النشطين" : "Active Admins"}
                  </button>
                  <button
                    onClick={() => setViewMode("deleted")}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      viewMode === "deleted"
                        ? "bg-rose-500 text-white"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {isRTL ? "المحذوفين" : "Deleted"} ({stats.deleted})
                  </button>
                </div>
                <Badge variant="secondary" className="bg-slate-200 text-slate-700">
                  {filteredAdmins.length}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isLoading}
                  className="h-8 w-8 p-0"
                  onClick={fetchAdmins}
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder={isRTL ? "بحث بالاسم أو البريد أو الهاتف..." : "Search by name, email, or phone..."}
                    className="ps-10 w-72 h-10 bg-white"
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
                  <p className="text-slate-500">{isRTL ? "جاري تحميل البيانات..." : "Loading data..."}</p>
                </div>
              </div>
            ) : filteredAdmins.length === 0 ? (
              <div className="text-center py-16">
                <UserCog className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  {viewMode === "deleted"
                    ? (isRTL ? "لا يوجد مشرفين محذوفين" : "No deleted admins")
                    : (isRTL ? "لا يوجد مشرفين بعد" : "No admins yet")}
                </h3>
                <p className="text-slate-500">
                  {viewMode === "deleted"
                    ? (isRTL ? "المشرفين المحذوفين سيظهرون هنا" : "Deleted admins will appear here")
                    : (isRTL ? "أضف مشرفين جدد لإدارة المنشأة" : "Add admins to manage your facility")}
                </p>
              </div>
            ) : (
              <table className="w-full table-fixed">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="py-3.5 px-4 text-sm font-semibold text-slate-600 text-center w-[50px]">#</th>
                    <th className="py-3.5 px-4 text-sm font-semibold text-slate-600 text-start w-[18%]">
                      {isRTL ? "المشرف" : "Admin"}
                    </th>
                    <th className="py-3.5 px-4 text-sm font-semibold text-slate-600 text-start w-[20%]">
                      {isRTL ? "التواصل" : "Contact"}
                    </th>
                    <th className="py-3.5 px-4 text-sm font-semibold text-slate-600 text-center w-[15%]">
                      {isRTL ? "الصلاحيات" : "Permissions"}
                    </th>
                    <th className="py-3.5 px-4 text-sm font-semibold text-slate-600 text-center w-[16%]">
                      {isRTL ? "تاريخ الإنشاء" : "Date Created"}
                    </th>
                    <th className="py-3.5 px-4 text-sm font-semibold text-slate-600 text-center w-[10%]">
                      {isRTL ? "الحالة" : "Status"}
                    </th>
                    <th className="py-3.5 px-4 text-sm font-semibold text-slate-600 text-center w-[80px]">
                      {isRTL ? "إجراءات" : "Actions"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdmins.map((admin, index) => (
                    <tr
                      key={admin.id}
                      className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm text-slate-500 font-medium">{index + 1}</span>
                      </td>
                      <td className="py-3 px-4 text-start">
                        <div className="flex items-center gap-3">
                          {admin.image ? (
                            <img
                              src={admin.image}
                              alt={admin.name}
                              className="h-10 w-10 rounded-xl object-cover flex-shrink-0"
                            />
                          ) : (
                            <div className="h-10 w-10 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-semibold text-sm">
                                {admin.name?.[0]?.toUpperCase() || "?"}
                              </span>
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-medium text-slate-900 truncate">{admin.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-sm text-slate-600">
                            <Mail className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{admin.email || "—"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-slate-600">
                            <Phone className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                            <span dir="ltr" className="truncate">{admin.phone || "—"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Key className="h-3.5 w-3.5 text-primary" />
                          <span className="text-sm text-slate-600">
                            {admin.permissions?.length || admin.permissions_count || 0} {isRTL ? "صلاحية" : "perms"}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="text-sm text-slate-600">{formatDate(admin.created_at)}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {statusUpdating === admin.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mx-auto text-primary" />
                        ) : admin.is_active == true || admin.status == true ? (
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
                      </td>
                      <td className="py-3 px-4 text-center relative">
                        {viewMode === "deleted" ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                            onClick={() => handleRestore(admin.id)}
                            disabled={restoreLoading === admin.id}
                          >
                            {restoreLoading === admin.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RotateCcw className="h-3.5 w-3.5" />
                            )}
                            {isRTL ? "استعادة" : "Restore"}
                          </Button>
                        ) : (
                          <div ref={openDropdown === admin.id ? dropdownRef : null}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-slate-100"
                              onClick={() => setOpenDropdown(openDropdown === admin.id ? null : admin.id)}
                            >
                              <MoreVertical className="h-4 w-4 text-slate-500" />
                            </Button>

                            {openDropdown === admin.id && (
                              <div className={`absolute z-50 top-full mt-1 ${isRTL ? "left-4" : "right-4"} bg-white border border-slate-200 rounded-xl shadow-lg py-2 min-w-[180px]`}>
                                <button
                                  onClick={() => handleViewDetails(admin.id)}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                  <Eye className="h-4 w-4 text-blue-500" />
                                  {isRTL ? "عرض التفاصيل" : "View Details"}
                                </button>
                                <button
                                  onClick={() => handleOpenEdit(admin)}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                  <UserCog className="h-4 w-4 text-amber-500" />
                                  {isRTL ? "تعديل" : "Edit"}
                                </button>
                                <button
                                  onClick={() => handleToggleStatus(admin.id, admin.is_active == true || admin.status == true)}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                  {admin.is_active == true || admin.status == true ? (
                                    <>
                                      <ToggleLeft className="h-4 w-4 text-amber-500" />
                                      {isRTL ? "تعطيل" : "Deactivate"}
                                    </>
                                  ) : (
                                    <>
                                      <ToggleRight className="h-4 w-4 text-emerald-500" />
                                      {isRTL ? "تفعيل" : "Activate"}
                                    </>
                                  )}
                                </button>
                                <div className="border-t border-slate-100 my-1" />
                                <button
                                  onClick={() => handleDelete(admin.id)}
                                  disabled={deleteLoading === admin.id}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                                >
                                  {deleteLoading === admin.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-4 w-4" />
                                  )}
                                  {isRTL ? "حذف" : "Delete"}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
              <h3 className="text-lg font-bold text-slate-900">
                {editingAdmin
                  ? (isRTL ? "تعديل المشرف" : "Edit Admin")
                  : (isRTL ? "إضافة مشرف جديد" : "Add New Admin")}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    {isRTL ? "الاسم" : "Name"} *
                  </Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                    placeholder={isRTL ? "اسم المشرف" : "Admin name"}
                    className="h-10 bg-white"
                    disabled={modalLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    {isRTL ? "البريد الإلكتروني" : "Email"} *
                  </Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                    placeholder="admin@example.com"
                    className="h-10 bg-white"
                    disabled={modalLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  {isRTL ? "رقم الهاتف" : "Phone"} *
                </Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+974 XXXX XXXX"
                  className="h-10 bg-white"
                  dir="ltr"
                  disabled={modalLoading}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    {isRTL ? "كلمة المرور" : "Password"} {!editingAdmin && "*"}
                  </Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData((p) => ({ ...p, password: e.target.value }))}
                    placeholder="••••••••"
                    className="h-10 bg-white"
                    disabled={modalLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    {isRTL ? "تأكيد كلمة المرور" : "Confirm Password"} {!editingAdmin && "*"}
                  </Label>
                  <Input
                    type="password"
                    value={formData.password_confirmation}
                    onChange={(e) => setFormData((p) => ({ ...p, password_confirmation: e.target.value }))}
                    placeholder="••••••••"
                    className="h-10 bg-white"
                    disabled={modalLoading}
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-slate-700">
                    {isRTL ? "حساب نشط" : "Active Account"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData((p) => ({ ...p, is_active: !p.is_active }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${
                    formData.is_active ? "bg-emerald-500" : "bg-slate-300"
                  }`}
                >
                  <div
                    className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                    style={{
                      [isRTL ? "right" : "left"]: formData.is_active ? "22px" : "2px",
                    }}
                  />
                </button>
              </div>

              {/* Permissions */}
              {Object.keys(allPermissions).length > 0 && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Key className="h-4 w-4 text-primary" />
                    {isRTL ? "الصلاحيات" : "Permissions"}
                    <span className="text-xs text-slate-400">
                      ({formData.permissions.length} {isRTL ? "محدد" : "selected"})
                    </span>
                  </Label>
                  <div className="space-y-4 max-h-72 overflow-y-auto p-4 rounded-xl bg-slate-50 border border-slate-100">
                    {Object.entries(allPermissions).map(([module, entities]) => (
                      <div key={module} className="space-y-2">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          {module.replace(/_/g, " ")}
                        </h4>
                        {Object.entries(entities).map(([entity, { label, actions }]) => (
                          <div key={entity} className="flex flex-wrap items-center gap-2 ps-2">
                            <span className="text-xs font-medium text-slate-600 min-w-[100px]">
                              {entity.replace(/_/g, " ")}
                            </span>
                            {actions.map(({ name: permName, action }) => {
                              const isSelected = formData.permissions.includes(permName);
                              const actionColors = {
                                view: isSelected ? "bg-blue-500 text-white" : "bg-white text-blue-600 border-blue-200 hover:border-blue-400",
                                create: isSelected ? "bg-emerald-500 text-white" : "bg-white text-emerald-600 border-emerald-200 hover:border-emerald-400",
                                edit: isSelected ? "bg-amber-500 text-white" : "bg-white text-amber-600 border-amber-200 hover:border-amber-400",
                                delete: isSelected ? "bg-rose-500 text-white" : "bg-white text-rose-600 border-rose-200 hover:border-rose-400",
                                special: isSelected ? "bg-purple-500 text-white" : "bg-white text-purple-600 border-purple-200 hover:border-purple-400",
                              };
                              const actionLabels = {
                                view: isRTL ? "عرض" : "View",
                                create: isRTL ? "إنشاء" : "Create",
                                edit: isRTL ? "تعديل" : "Edit",
                                delete: isRTL ? "حذف" : "Delete",
                                special: isRTL ? "كامل" : "Full",
                              };
                              return (
                                <button
                                  key={permName}
                                  type="button"
                                  onClick={() => togglePermission(permName)}
                                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors border ${actionColors[action] || (isSelected ? "bg-primary text-white" : "bg-white text-slate-600 border-slate-200")}`}
                                >
                                  {actionLabels[action] || action}
                                </button>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Image Upload */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-slate-700">
                  {isRTL ? "الصورة الشخصية" : "Profile Image"} ({isRTL ? "اختياري" : "optional"})
                </Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData((p) => ({ ...p, image: e.target.files?.[0] || null }))}
                  className="h-10 bg-white"
                  disabled={modalLoading}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1 h-10 gap-2" disabled={modalLoading}>
                  {modalLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {editingAdmin
                    ? (isRTL ? "تحديث" : "Update")
                    : (isRTL ? "إنشاء" : "Create")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-10"
                  onClick={() => setShowModal(false)}
                  disabled={modalLoading}
                >
                  {isRTL ? "إلغاء" : "Cancel"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-y-auto mx-4">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
              <h3 className="text-lg font-bold text-slate-900">
                {isRTL ? "تفاصيل المشرف" : "Admin Details"}
              </h3>
              <button
                onClick={() => { setShowDetailsModal(false); setDetailsAdmin(null); }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6">
              {detailsLoading ? (
                <div className="text-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
                  <p className="text-sm text-slate-500">{isRTL ? "جاري التحميل..." : "Loading..."}</p>
                </div>
              ) : detailsAdmin ? (
                <div className="space-y-4">
                  {/* Admin Info */}
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-100">
                    {detailsAdmin.image ? (
                      <img src={detailsAdmin.image} alt={detailsAdmin.name} className="h-14 w-14 rounded-xl object-cover" />
                    ) : (
                      <div className="h-14 w-14 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {detailsAdmin.name?.[0]?.toUpperCase() || "?"}
                        </span>
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-slate-900">{detailsAdmin.name}</h4>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Mail className="h-3.5 w-3.5" />
                        {detailsAdmin.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Phone className="h-3.5 w-3.5" />
                        <span dir="ltr">{detailsAdmin.phone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-sm font-medium text-slate-700">
                      {isRTL ? "الحالة" : "Status"}
                    </span>
                    {detailsAdmin.is_active == true || detailsAdmin.status == true ? (
                      <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200 gap-1 text-xs">
                        <CheckCircle className="h-3 w-3" />
                        {isRTL ? "نشط" : "Active"}
                      </Badge>
                    ) : (
                      <Badge className="bg-rose-50 text-rose-700 border border-rose-200 gap-1 text-xs">
                        <XCircle className="h-3 w-3" />
                        {isRTL ? "غير نشط" : "Inactive"}
                      </Badge>
                    )}
                  </div>

                  {/* Permissions */}
                  {detailsAdmin.permissions && detailsAdmin.permissions.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Key className="h-4 w-4 text-primary" />
                        {isRTL ? "الصلاحيات" : "Permissions"} ({detailsAdmin.permissions.length})
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {detailsAdmin.permissions.map((perm, i) => (
                          <Badge
                            key={i}
                            variant="secondary"
                            className="bg-blue-50 text-blue-700 border border-blue-200 text-xs"
                          >
                            {ProviderTeamService.formatPermissionName(
                              typeof perm === "string" ? perm : perm.name,
                              isRTL
                            )}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Created At */}
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-sm font-medium text-slate-700">
                      {isRTL ? "تاريخ الإنشاء" : "Created At"}
                    </span>
                    <span className="text-sm text-slate-600">{formatDate(detailsAdmin.created_at)}</span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
