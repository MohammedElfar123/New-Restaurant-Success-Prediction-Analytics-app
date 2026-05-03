"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import ProviderDoctorsService from "@/lib/services/provider-doctors.service";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Stethoscope,
  Search,
  Plus,
  UserCheck,
  UserX,
  Users,
  RefreshCw,
  MoreVertical,
  Eye,
  Loader2,
  Mail,
  Phone,
  CheckCircle,
  XCircle,
  Star,
  Archive,
  Download,
  X,
  Save,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Clock,
  DollarSign,
  FileText,
  Pencil,
} from "lucide-react";
import toast from "react-hot-toast";

export default function ProviderDoctorsPage() {
  const locale = useLocale();
  const t = useTranslations("common");
  const router = useRouter();
  const { user } = useAuthStore();
  const isRTL = locale === "ar";

  // Helper: check doctor active status
  // API returns "status" field (boolean true/false), fallback to is_active for compatibility
  const isDoctorActive = (doctor) => {
    const v = doctor?.status ?? doctor?.is_active;
    return v === 1 || v === true || v === "1" || v === "active";
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [allDoctors, setAllDoctors] = useState([]);
  const [viewMode, setViewMode] = useState("all");
  const [openDropdown, setOpenDropdown] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [categories, setCategories] = useState([]);
  const dropdownRef = useRef(null);

  // Stats from API reports
  const [reports, setReports] = useState({});

  // Create modal state
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
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

  // Pagination
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });

  // Computed stats — API reports: total_doctors, activeDoctors, pending_doctors
  const stats = {
    total: reports.total_doctors || reports.total || allDoctors.length,
    active: reports.activeDoctors ?? reports.active ?? allDoctors.filter((d) => isDoctorActive(d)).length,
    inactive: reports.pending_doctors ?? reports.inactive ?? allDoctors.filter((d) => !isDoctorActive(d)).length,
    specialties: categories.length,
  };

  // Filtered doctors
  const filteredDoctors = allDoctors.filter((doctor) => {
    // Filter by view mode
    if (viewMode === "active" && !isDoctorActive(doctor)) return false;
    if (viewMode === "inactive" && isDoctorActive(doctor)) return false;
    // viewMode === "all" => no status filter

    // Filter by search
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const name = doctor.name || doctor.translations?.find((t) => t.locale === locale)?.name || "";
    const email = doctor.email || "";
    const phone = doctor.phone || "";
    const category = doctor.category?.name || "";
    return (
      name.toLowerCase().includes(q) ||
      email.toLowerCase().includes(q) ||
      phone.includes(q) ||
      category.toLowerCase().includes(q)
    );
  });

  // Fetch doctors
  const fetchDoctors = useCallback(async () => {
    setIsLoading(true);
    try {
      const [doctorsResult, catResult] = await Promise.all([
        ProviderDoctorsService.getProviderDoctors({ per_page: 1000 }),
        ProviderDoctorsService.getCategoriesDropdown(),
      ]);

      if (doctorsResult.success) {
        setAllDoctors(doctorsResult.data);
        setMeta(doctorsResult.meta);
        if (doctorsResult.reports) setReports(doctorsResult.reports);
      }
      if (catResult.success) {
        setCategories(catResult.data);
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  // Close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get doctor name based on locale
  const getDoctorName = (doctor) => {
    if (doctor.name) return doctor.name;
    if (doctor.translations) {
      const tr = doctor.translations.find((t) => t.locale === locale);
      return tr?.name || doctor.translations[0]?.name || "—";
    }
    return "—";
  };

  // Toggle status
  const handleToggleStatus = async (doctorId) => {
    setStatusUpdating(doctorId);
    setOpenDropdown(null);
    try {
      const result = await ProviderDoctorsService.toggleDoctorStatus(doctorId);
      if (result.success) {
        toast.success(isRTL ? "تم تحديث الحالة" : "Status updated");
        fetchDoctors();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error(isRTL ? "حدث خطأ" : "An error occurred");
    } finally {
      setStatusUpdating(null);
    }
  };

  // Export
  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await ProviderDoctorsService.exportDoctors();
      if (result.success && result.data?.url) {
        window.open(result.data.url, "_blank");
        toast.success(isRTL ? "تم تصدير البيانات" : "Data exported");
      } else {
        toast.error(result.message || (isRTL ? "فشل التصدير" : "Export failed"));
      }
    } catch {
      toast.error(isRTL ? "حدث خطأ" : "An error occurred");
    } finally {
      setExporting(false);
    }
  };

  // View details - navigate to dedicated page
  const handleViewDetails = (doctorId) => {
    setOpenDropdown(null);
    router.push(`/${locale}/provider/doctors/${doctorId}`);
  };

  // Delete doctor (with confirm)
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, name }
  const [deleting, setDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const result = await ProviderDoctorsService.deleteProviderDoctor(deleteTarget.id);
      if (result.success) {
        toast.success(result.message || (isRTL ? "تم حذف الدكتور" : "Doctor deleted"));
        setDeleteTarget(null);
        fetchDoctors();
      } else {
        toast.error(result.message || (isRTL ? "فشل الحذف" : "Delete failed"));
      }
    } catch {
      toast.error(isRTL ? "حدث خطأ" : "An error occurred");
    } finally {
      setDeleting(false);
    }
  };

  // Open create modal
  const handleOpenCreate = () => {
    setFormData({
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
    setShowModal(true);
  };

  // Navigate to edit page
  const handleOpenEdit = (doctor) => {
    setOpenDropdown(null);
    router.push(`/${locale}/provider/doctors/${doctor.id}/edit`);
  };

  // Submit form (create only)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.ar_name && !formData.en_name) {
      toast.error(isRTL ? "الاسم مطلوب" : "Name is required");
      return;
    }

    setModalLoading(true);
    try {
      const builtFormData = ProviderDoctorsService.buildFormData(formData);
      const result = await ProviderDoctorsService.createProviderDoctor(builtFormData);

      if (result.success) {
        // Cache schedules for the new doctor
        if (result.data?.id) {
          try {
            localStorage.setItem(`doctor_schedules_${result.data.id}`, JSON.stringify(formData.schedules));
          } catch { /* ignore */ }
        }
        toast.success(isRTL ? "تم إضافة الطبيب" : "Doctor added");
        setShowModal(false);
        fetchDoctors();
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error(isRTL ? "حدث خطأ" : "An error occurred");
    } finally {
      setModalLoading(false);
    }
  };

  // Update schedule
  const updateSchedule = (dayIndex, field, value) => {
    setFormData((prev) => ({
      ...prev,
      schedules: prev.schedules.map((s) =>
        s.day_of_week === dayIndex ? { ...s, [field]: value } : s
      ),
    }));
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return "—";
    try {
      return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
    } catch { return date; }
  };

  return (
    <DashboardLayout requiredUserType="provider">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="h-10 w-10 bg-teal-100 rounded-lg flex items-center justify-center">
              <Stethoscope className="h-5 w-5 text-teal-600" />
            </div>
            {isRTL ? "الأطباء" : "Doctors Management"}
          </h1>
          <p className="text-slate-500 mt-1">
            {isRTL ? "إدارة أطباء المنشأة" : "Manage your facility's doctors"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="gap-2 h-10"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isRTL ? "تصدير" : "Export"}
          </Button>
          <Button data-tour="doctors-add" className="gap-2 h-10" onClick={handleOpenCreate}>
            <Plus className="w-4 h-4" />
            {isRTL ? "إضافة طبيب" : "Add Doctor"}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">
                {isRTL ? "إجمالي الأطباء" : "Total Doctors"}
              </CardTitle>
              <div className="h-10 w-10 bg-teal-50 rounded-lg flex items-center justify-center">
                <Stethoscope className="h-5 w-5 text-teal-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.total}
            </div>
            <p className="text-xs text-slate-500 mt-1">{isRTL ? "جميع الأطباء" : "All registered"}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">
                {isRTL ? "نشط" : "Active Doctors"}
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
            <p className="text-xs text-emerald-600 mt-1">{isRTL ? "أطباء نشطين" : "Currently active"}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">
                {isRTL ? "غير نشط" : "Inactive Doctors"}
              </CardTitle>
              <div className="h-10 w-10 bg-pink-50 rounded-lg flex items-center justify-center">
                <UserX className="h-5 w-5 text-pink-600" />
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
                {isRTL ? "التخصصات" : "Specialties"}
              </CardTitle>
              <div className="h-10 w-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <Star className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.specialties}
            </div>
            <p className="text-xs text-slate-500 mt-1">{isRTL ? "تخصص طبي" : "Medical specialties"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Table Card */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-0">
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-white rounded-lg border border-slate-200 p-1">
                  <button
                    onClick={() => setViewMode("all")}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      viewMode === "all" ? "bg-primary text-white" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {isRTL ? "الكل" : "All"}
                  </button>
                  <button
                    onClick={() => setViewMode("active")}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      viewMode === "active" ? "bg-emerald-500 text-white" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {isRTL ? "نشط" : "Active"}
                  </button>
                  <button
                    onClick={() => setViewMode("inactive")}
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      viewMode === "inactive" ? "bg-rose-500 text-white" : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {isRTL ? "غير نشط" : "Inactive"}
                  </button>
                </div>
                <Badge variant="secondary" className="bg-slate-200 text-slate-700">
                  {filteredDoctors.length}
                </Badge>
                <Button variant="ghost" size="sm" disabled={isLoading} className="h-8 w-8 p-0" onClick={fetchDoctors}>
                  <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder={isRTL ? "بحث بالاسم أو التخصص..." : "Search by name or specialty..."}
                    className="ps-10 w-72 h-10 bg-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div data-tour="doctors-table" className="overflow-visible">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-slate-500">{isRTL ? "جاري تحميل البيانات..." : "Loading data..."}</p>
                </div>
              </div>
            ) : filteredDoctors.length === 0 ? (
              <div className="text-center py-16">
                <Stethoscope className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">
                  {isRTL ? "لا يوجد أطباء" : "No doctors found"}
                </h3>
                <p className="text-slate-500">
                  {isRTL ? "أضف أطباء جدد لمنشأتك" : "Add doctors to your facility"}
                </p>
              </div>
            ) : (
              <table className="w-full table-fixed">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="py-3.5 px-4 text-sm font-semibold text-slate-600 text-center w-[50px]">#</th>
                    <th className="py-3.5 px-4 text-sm font-semibold text-slate-600 text-start w-[20%]">
                      {isRTL ? "الطبيب" : "Doctor"}
                    </th>
                    <th className="py-3.5 px-4 text-sm font-semibold text-slate-600 text-center w-[15%]">
                      {isRTL ? "التخصص" : "Specialty"}
                    </th>
                    <th className="py-3.5 px-4 text-sm font-semibold text-slate-600 text-center w-[12%]">
                      {isRTL ? "الخبرة" : "Experience"}
                    </th>
                    <th className="py-3.5 px-4 text-sm font-semibold text-slate-600 text-center w-[15%]">
                      {isRTL ? "السعر" : "Price"}
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
                  {filteredDoctors.map((doctor, index) => (
                    <tr key={doctor.id} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm text-slate-500 font-medium">{index + 1}</span>
                      </td>
                      <td className="py-3 px-4 text-start">
                        <div className="flex items-center gap-3">
                          {doctor.image ? (
                            <img src={doctor.image} alt={getDoctorName(doctor)} className="h-10 w-10 rounded-xl object-cover flex-shrink-0" />
                          ) : (
                            <div className="h-10 w-10 bg-gradient-to-br from-teal-500 to-teal-600 rounded-xl flex items-center justify-center flex-shrink-0">
                              <Stethoscope className="h-5 w-5 text-white" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-medium text-slate-900 truncate">{getDoctorName(doctor)}</div>
                            {doctor.email && (
                              <div className="flex items-center gap-1 text-xs text-slate-500">
                                <Mail className="h-3 w-3" />
                                <span className="truncate">{doctor.email}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Badge className="bg-teal-50 text-teal-700 hover:bg-teal-50 border border-teal-200 font-medium text-xs">
                          {doctor.category?.name || "—"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-sm text-slate-600">
                          {doctor.experience_years ? `${doctor.experience_years} ${isRTL ? "سنة" : "yrs"}` : "—"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {doctor.price_after_discount && doctor.price_after_discount !== "0.00" ? (
                          <div>
                            <span className="text-sm font-semibold text-slate-900">
                              {parseFloat(doctor.price_after_discount).toFixed(0)} QAR
                            </span>
                            {doctor.price_before_discount && doctor.price_before_discount !== doctor.price_after_discount && (
                              <span className="text-xs text-slate-400 line-through ms-1">
                                {parseFloat(doctor.price_before_discount).toFixed(0)}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {statusUpdating === doctor.id ? (
                          <Loader2 className="h-4 w-4 animate-spin mx-auto text-primary" />
                        ) : isDoctorActive(doctor) ? (
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
                        <div ref={openDropdown === doctor.id ? dropdownRef : null}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-slate-100"
                            onClick={() => setOpenDropdown(openDropdown === doctor.id ? null : doctor.id)}
                          >
                            <MoreVertical className="h-4 w-4 text-slate-500" />
                          </Button>

                          {openDropdown === doctor.id && (
                            <div className={`absolute z-50 top-full mt-1 ${isRTL ? "left-4" : "right-4"} bg-white border border-slate-200 rounded-xl shadow-lg py-2 min-w-[180px]`}>
                              <button
                                onClick={() => handleViewDetails(doctor.id)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                              >
                                <Eye className="h-4 w-4 text-blue-500" />
                                {isRTL ? "عرض التفاصيل" : "View Details"}
                              </button>
                              <button
                                onClick={() => handleOpenEdit(doctor)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                              >
                                <Pencil className="h-4 w-4 text-amber-500" />
                                {isRTL ? "تعديل" : "Edit"}
                              </button>
                              <button
                                onClick={() => handleToggleStatus(doctor.id)}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                              >
                                {isDoctorActive(doctor) ? (
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
                                onClick={() => {
                                  setOpenDropdown(null);
                                  setDeleteTarget({ id: doctor.id, name: doctor.name });
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                                {isRTL ? "حذف" : "Delete"}
                              </button>
                            </div>
                          )}
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

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-5 flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="h-6 w-6 text-rose-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  {isRTL ? "تأكيد حذف الطبيب" : "Delete Doctor"}
                </h3>
                <p className="text-sm text-slate-600">
                  {isRTL
                    ? `هل أنت متأكد من حذف "${deleteTarget.name}"؟ لن يتم حذف الحجوزات السابقة، لكن لن يكون متاحاً للحجوزات الجديدة.`
                    : `Are you sure you want to delete "${deleteTarget.name}"? Past bookings will remain, but the doctor will not appear in new booking flows.`}
                </p>
              </div>
            </div>
            <div className="px-6 pb-5 flex gap-3 justify-end border-t border-slate-100 pt-4">
              <Button
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                {isRTL ? "إلغاء" : "Cancel"}
              </Button>
              <Button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="bg-rose-600 hover:bg-rose-700"
              >
                {deleting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin me-2" />
                    {isRTL ? "جاري الحذف..." : "Deleting..."}
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 me-2" />
                    {isRTL ? "تأكيد الحذف" : "Confirm Delete"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Create Doctor Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto mx-4">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white rounded-t-2xl z-10">
              <h3 className="text-lg font-bold text-slate-900">
                {isRTL ? "إضافة طبيب جديد" : "Add New Doctor"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Arabic/English Names */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  {isRTL ? "معلومات الطبيب" : "Doctor Information"}
                </h4>
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
                      disabled={modalLoading}
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
                      disabled={modalLoading}
                    />
                  </div>
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
                    className="w-full h-20 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    dir="rtl"
                    disabled={modalLoading}
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
                    className="w-full h-20 px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    dir="ltr"
                    disabled={modalLoading}
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
                    disabled={modalLoading}
                  >
                    <option value="">{isRTL ? "اختر التخصص" : "Select specialty"}</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
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
                    disabled={modalLoading}
                  />
                </div>
              </div>

              {/* Pricing */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  {isRTL ? "التسعير" : "Pricing"}
                </h4>
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
                      disabled={modalLoading}
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
                      disabled={modalLoading}
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
                      disabled={modalLoading}
                    />
                  </div>
                </div>
              </div>

              {/* Working Schedule */}
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  {isRTL ? "أوقات العمل" : "Working Schedule"}
                </h4>
                <div className="space-y-2 max-h-56 overflow-y-auto p-3 rounded-xl bg-slate-50 border border-slate-100">
                  {formData.schedules.map((schedule) => (
                    <div key={schedule.day_of_week} className="flex items-center gap-3 p-2 rounded-lg bg-white border border-slate-100">
                      <span className="text-sm font-medium text-slate-700 w-24 flex-shrink-0">
                        {ProviderDoctorsService.getDayName(schedule.day_of_week, locale)}
                      </span>
                      <Input
                        type="time"
                        value={schedule.open_time}
                        onChange={(e) => updateSchedule(schedule.day_of_week, "open_time", e.target.value)}
                        className="h-8 text-sm bg-white flex-1"
                        disabled={modalLoading}
                      />
                      <span className="text-xs text-slate-400">{isRTL ? "إلى" : "to"}</span>
                      <Input
                        type="time"
                        value={schedule.close_time}
                        onChange={(e) => updateSchedule(schedule.day_of_week, "close_time", e.target.value)}
                        className="h-8 text-sm bg-white flex-1"
                        disabled={modalLoading}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Active Toggle + Image */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-sm font-medium text-slate-700">
                    {isRTL ? "طبيب نشط" : "Active Doctor"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setFormData((p) => ({ ...p, is_active: !p.is_active }))}
                    className={`relative w-11 h-6 rounded-full transition-colors ${formData.is_active ? "bg-emerald-500" : "bg-slate-300"}`}
                  >
                    <div
                      className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all"
                      style={{ [isRTL ? "right" : "left"]: formData.is_active ? "22px" : "2px" }}
                    />
                  </button>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">
                    {isRTL ? "صورة الطبيب" : "Doctor Image"}
                  </Label>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFormData((p) => ({ ...p, image: e.target.files?.[0] || null }))}
                    className="h-10 bg-white"
                    disabled={modalLoading}
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="submit" className="flex-1 h-10 gap-2" disabled={modalLoading}>
                  {modalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {isRTL ? "إضافة" : "Add"}
                </Button>
                <Button type="button" variant="outline" className="h-10" onClick={() => setShowModal(false)} disabled={modalLoading}>
                  {isRTL ? "إلغاء" : "Cancel"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}
