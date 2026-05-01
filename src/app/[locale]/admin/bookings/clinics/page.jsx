"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { usePermissions, PERMISSIONS } from "@/hooks/usePermissions";
import BookingsService from "@/lib/services/bookings.service";
import BookingStatusModal from "@/components/modals/BookingStatusModal";
import {
  Search,
  Eye,
  MoreVertical,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  User,
  Stethoscope,
  Building2,
  CalendarCheck,
  CalendarX,
  CalendarClock,
  Phone,
  RefreshCw,
  Loader2,
  Activity,
  UserCheck,
  UserX,
  CheckCircle2,
  CreditCard,
  Banknote,
} from "lucide-react";

// Status icon mapping
const StatusIcons = {
  pending: Clock,
  confirmed: CheckCircle,
  approved: CheckCircle,
  checkedin: UserCheck,
  inprogress: Activity,
  completed: CheckCircle2,
  cancelled: XCircle,
  noshow: UserX,
  no_show: UserX,
  rescheduled: RefreshCw,
};

// Payment method icons
const PaymentIcons = {
  cash: Banknote,
  card: CreditCard,
  online: CreditCard,
};

export default function ClinicBookingsPage() {
  const t = useTranslations("bookings");
  const tCommon = useTranslations("common");
  const tSidebar = useTranslations("sidebar");
  const { locale } = useParams();
  const router = useRouter();
  const { hasPermission } = usePermissions();

  // Permission checks
  const canView = hasPermission(PERMISSIONS.BOOKINGS_VIEW);
  const canEdit = hasPermission(PERMISSIONS.BOOKINGS_EDIT);

  // State
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 10 });

  // Modal state
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  const itemsPerPage = 10;
  const dropdownRef = useRef(null);

  // All filtered bookings (for frontend pagination)
  const [allFilteredBookings, setAllFilteredBookings] = useState([]);

  // Fetch ALL bookings and filter by Clinic type on frontend
  const fetchBookings = useCallback(async () => {
    setLoading(true);

    // Fetch all bookings (large per_page to get all)
    const params = {
      page: 1,
      per_page: 1000, // Get all bookings
    };

    if (searchQuery) {
      params.search = searchQuery;
    }

    if (statusFilter !== "all") {
      params.status = statusFilter;
    }

    const result = await BookingsService.getBookings(params);

    if (result.success) {
      // Filter on frontend to ensure only Clinic type bookings are shown
      const filteredData = result.data.filter(
        (booking) => booking.provider?.type === "Clinic"
      );

      // Sort by ID descending (newest bookings first - higher ID = newer booking)
      filteredData.sort((a, b) => {
        return (b.id || 0) - (a.id || 0); // Descending (newest first)
      });

      setAllFilteredBookings(filteredData);

      // Calculate frontend pagination
      const totalFiltered = filteredData.length;
      const lastPage = Math.ceil(totalFiltered / itemsPerPage) || 1;

      // Get current page items
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const currentPageItems = filteredData.slice(startIndex, endIndex);

      setBookings(currentPageItems);
      setMeta({
        current_page: currentPage,
        last_page: lastPage,
        total: totalFiltered,
        per_page: itemsPerPage,
      });
    }

    setLoading(false);
  }, [currentPage, searchQuery, statusFilter]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

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

  const toggleDropdown = (e, bookingId) => {
    e.stopPropagation();
    setOpenDropdown(openDropdown === bookingId ? null : bookingId);
  };

  const handleViewBooking = (booking) => {
    setOpenDropdown(null);
    router.push(`/${locale}/admin/bookings/clinics/${booking.id}`);
  };

  const handleChangeStatus = (booking) => {
    setSelectedBooking(booking);
    setStatusModalOpen(true);
    setOpenDropdown(null);
  };

  const handleStatusUpdated = () => {
    fetchBookings();
    setStatusModalOpen(false);
    setSelectedBooking(null);
  };

  const getStatusIcon = (status) => {
    const normalizedStatus = status?.toLowerCase()?.replace("_", "");
    const Icon = StatusIcons[normalizedStatus] || StatusIcons[status?.toLowerCase()] || Calendar;
    return <Icon className="h-3.5 w-3.5 me-1.5" />;
  };

  const getPaymentIcon = (method) => {
    const Icon = PaymentIcons[method?.toLowerCase()] || CreditCard;
    return <Icon className="h-3.5 w-3.5 me-1.5" />;
  };

  // Calculate stats from bookings
  // Stats computed from the full filtered set (allFilteredBookings), NOT current-page slice
  const stats = {
    total: meta.total,
    pending: allFilteredBookings.filter((b) => b.status?.toLowerCase() === "pending").length,
    completed: allFilteredBookings.filter((b) => b.status?.toLowerCase() === "completed").length,
    cancelled: allFilteredBookings.filter((b) => b.status?.toLowerCase() === "cancelled").length,
  };

  // Get translated status
  const getStatusLabel = (status) => {
    if (!status) return "-";
    const key = status.toLowerCase().replace("_", "");
    return t(key) || BookingsService.capitalizeStatus(status);
  };

  // Get translated payment method
  const getPaymentLabel = (method) => {
    if (!method) return "-";
    return t(method.toLowerCase()) || BookingsService.capitalizeStatus(method);
  };

  return (
    <DashboardLayout requiredUserType="admin">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Building2 className="h-5 w-5 text-purple-600" />
            </div>
            {tSidebar("clinicBookings")}
          </h1>
          <p className="text-slate-600 mt-1">
            {t("subtitle")}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchBookings}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          {tCommon("refresh")}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">
                {t("totalBookings")}
              </CardTitle>
              <div className="h-10 w-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {meta.total.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {t("allBookings")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">
                {t("pending")}
              </CardTitle>
              <div className="h-10 w-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <CalendarClock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {stats.pending}
            </div>
            <p className="text-xs text-amber-600 mt-1">
              {t("awaitingApproval")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">
                {t("completed")}
              </CardTitle>
              <div className="h-10 w-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <CalendarCheck className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {stats.completed}
            </div>
            <p className="text-xs text-emerald-600 mt-1">
              {t("successfulBookings")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">
                {t("cancelled")}
              </CardTitle>
              <div className="h-10 w-10 bg-rose-50 rounded-lg flex items-center justify-center">
                <CalendarX className="h-5 w-5 text-rose-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {stats.cancelled}
            </div>
            <p className="text-xs text-rose-600 mt-1">
              {t("cancelledBookings")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Search */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Tabs Header */}
        <div className="border-b border-slate-200">
          <div className="flex items-center justify-between px-6">
            <div className="flex items-center gap-0">
              {[
                { key: "all", label: tCommon("all"), icon: Calendar },
                { key: "pending", label: t("pending"), icon: Clock },
                { key: "confirmed", label: t("confirmed"), icon: CheckCircle },
                { key: "completed", label: t("completed"), icon: CheckCircle2 },
                { key: "cancelled", label: t("cancelled"), icon: XCircle },
              ].map((tab) => {
                const TabIcon = tab.icon;
                const isActive = statusFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setStatusFilter(tab.key);
                      setCurrentPage(1);
                    }}
                    className={`relative px-4 py-4 text-sm font-medium transition-colors flex items-center gap-2 ${
                      isActive
                        ? "text-primary"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <TabIcon className="h-4 w-4" />
                    {tab.label}
                    {isActive && (
                      <span className="absolute bottom-0 start-0 end-0 h-0.5 bg-primary rounded-t-full" />
                    )}
                  </button>
                );
              })}
            </div>
            <div className="relative py-3">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder={tCommon("search")}
                className="ps-10 w-64 h-9"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
          </div>
        </div>

        {/* Table - Clinic bookings show both clinic (provider) and doctor (provider_doctor) columns */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
              <p className="text-slate-500">{tCommon("loading")}</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500 font-medium">
                {t("noBookings")}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="py-4 px-4 text-sm font-semibold text-slate-700 text-start w-16">
                    #
                  </th>
                  <th className="py-4 px-4 text-sm font-semibold text-slate-700 text-start">
                    {t("customer")}
                  </th>
                  <th className="py-4 px-4 text-sm font-semibold text-slate-700 text-start">
                    {t("clinic")}
                  </th>
                  <th className="py-4 px-4 text-sm font-semibold text-slate-700 text-start">
                    {t("doctor")}
                  </th>
                  <th className="py-4 px-4 text-sm font-semibold text-slate-700 text-start">
                    {t("dateTime")}
                  </th>
                  <th className="py-4 px-4 text-sm font-semibold text-slate-700 text-start">
                    {t("fee")}
                  </th>
                  <th className="py-4 px-4 text-sm font-semibold text-slate-700 text-start">
                    {t("payment")}
                  </th>
                  <th className="py-4 px-4 text-sm font-semibold text-slate-700 text-start">
                    {t("status")}
                  </th>
                  <th className="py-4 px-4 text-sm font-semibold text-slate-700 text-start">
                    {tCommon("actions")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking, index) => (
                  <tr
                    key={booking.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-all"
                  >
                    <td className="py-4 px-4">
                      <div className="text-sm font-medium text-slate-500">
                        #{(currentPage - 1) * itemsPerPage + index + 1}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-slate-400" />
                          <div className="font-medium text-slate-900">
                            {booking.customer?.name || "-"}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Phone className="h-3 w-3 text-slate-400" />
                          {booking.customer?.phone || "-"}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {/* Clinic info from provider */}
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3 w-3 text-purple-500" />
                        <span className="text-sm font-medium text-slate-900">
                          {booking.provider?.name || "-"}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {/* Doctor info from provider_doctor */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Stethoscope className="h-3 w-3 text-emerald-500" />
                          <div className="font-medium text-slate-900">
                            {booking.provider_doctor?.name || "-"}
                          </div>
                        </div>
                        {booking.category_name && (
                          <Badge className="bg-purple-50 text-purple-700 hover:bg-purple-50 border-purple-200 font-medium text-xs">
                            {booking.category_name}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-sm text-slate-700">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          {BookingsService.formatDate(booking.data_at, locale)}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="h-3 w-3 text-slate-400" />
                          {BookingsService.formatTime(booking.time, booking.data_at)}
                        </div>
                        <div className="text-xs text-primary font-medium">
                          {booking.created_at || "-"}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm font-medium text-slate-900">
                        {BookingsService.formatCurrency(booking.total)}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge
                        className={`${BookingsService.getPaymentMethodBadgeColor(
                          booking.payment_method
                        )} font-medium`}
                      >
                        {getPaymentIcon(booking.payment_method)}
                        {getPaymentLabel(booking.payment_method)}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <Badge
                        className={`${BookingsService.getStatusBadgeColor(
                          booking.status
                        )} font-medium`}
                      >
                        {getStatusIcon(booking.status)}
                        {getStatusLabel(booking.status)}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 relative" ref={openDropdown === booking.id ? dropdownRef : null}>
                        <div className="relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={(e) => toggleDropdown(e, booking.id)}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>

                          {openDropdown === booking.id && (
                            <div className="absolute end-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                              {canView && (
                                <button
                                  className="w-full px-3 py-2 text-start text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                  onClick={() => handleViewBooking(booking)}
                                >
                                  <Eye className="h-4 w-4" />
                                  {t("viewDetails")}
                                </button>
                              )}
                              {canEdit &&
                                BookingsService.getAllowedTransitions(booking.status)
                                  .length > 0 && (
                                  <button
                                    className="w-full px-3 py-2 text-start text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                                    onClick={() => handleChangeStatus(booking)}
                                  >
                                    <RefreshCw className="h-4 w-4" />
                                    {t("changeStatus")}
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
        {meta.last_page > 1 && (
          <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 border-t border-slate-200 gap-4">
            <div className="text-sm text-slate-600">
              {tCommon("showing")} {((currentPage - 1) * itemsPerPage) + 1} {tCommon("to")} {Math.min(currentPage * itemsPerPage, meta.total)} {tCommon("of")} {meta.total.toLocaleString()} {t("bookings")}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                {tCommon("previous")}
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
                    className={
                      currentPage === pageNum
                        ? "bg-primary text-white border-primary"
                        : ""
                    }
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
                onClick={() => setCurrentPage((p) => Math.min(meta.last_page, p + 1))}
              >
                {tCommon("next")}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Status Modal */}
      <BookingStatusModal
        open={statusModalOpen}
        onClose={() => {
          setStatusModalOpen(false);
          setSelectedBooking(null);
        }}
        booking={selectedBooking}
        onStatusUpdated={handleStatusUpdated}
      />
    </DashboardLayout>
  );
}
