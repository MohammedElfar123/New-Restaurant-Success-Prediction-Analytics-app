"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import ProviderBookingsService from "@/lib/services/provider-bookings.service";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Search,
  Clock,
  User,
  Phone,
  CalendarCheck,
  CalendarClock,
  CalendarX,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  MoreVertical,
  Eye,
  Stethoscope,
  Download,
  FileText,
  CreditCard,
  Banknote,
  Wallet,
  Tag,
} from "lucide-react";
import toast from "react-hot-toast";

// Status icon mapping
const StatusIcons = {
  pending: Clock,
  confirmed: CheckCircle,
  completed: CheckCircle2,
  cancelled: XCircle,
};

// Payment method icons
const PaymentIcons = {
  cash: Banknote,
  card: CreditCard,
  online: CreditCard,
  wallet: Wallet,
};

export default function ProviderBookingsPage() {
  const locale = useLocale();
  const router = useRouter();
  const { user } = useAuthStore();
  const isRTL = locale === "ar";

  // List state
  const [bookings, setBookings] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reports from API
  const [reports, setReports] = useState(null);

  // Stats (calculated from data)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
  });

  // Dropdown & actions
  const [openDropdown, setOpenDropdown] = useState(null);
  const [exporting, setExporting] = useState(false);
  const dropdownRef = useRef(null);


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

  // Fetch bookings
  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await ProviderBookingsService.getBookings({
        per_page: 1000,
        page: 1,
      });

      if (result.success) {
        const items = result.data || [];

        // Sort by ID descending (newest first)
        items.sort((a, b) => (b.id || 0) - (a.id || 0));

        setAllBookings(items);

        // Use reports from API if available, otherwise calculate from current page
        if (result.reports) {
          setReports(result.reports);
        }

        // Prefer API-level totals (consistent across pagination); fall back to page-only counts
        const r = result.reports || {};
        setStats({
          total: r.total_bookings ?? items.length,
          pending: r.pending_bookings ?? items.filter((b) => b.status === "pending").length,
          confirmed: r.confirmed_bookings ?? items.filter((b) => b.status === "confirmed").length,
          completed: r.completed_bookings ?? items.filter((b) => b.status === "completed").length,
          cancelled: r.cancelled_bookings ?? items.filter((b) => b.status === "cancelled").length,
        });
      } else {
        setAllBookings([]);
        setStats({ total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0 });
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Filter bookings by status and search (frontend filtering + pagination)
  useEffect(() => {
    let filtered = [...allBookings];

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((b) => b.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((b) => {
        const clientName = (b.customer?.name || b.client?.name || "").toLowerCase();
        const clientPhone = (b.customer?.phone || b.client?.phone || "").toLowerCase();
        const invoiceNumber = (b.invoice_number || "").toLowerCase();
        const doctorName = (ProviderBookingsService.getProviderDoctor(b.provider_doctor)?.name || "").toLowerCase();
        return (
          clientName.includes(query) ||
          clientPhone.includes(query) ||
          invoiceNumber.includes(query) ||
          doctorName.includes(query)
        );
      });
    }

    // Apply pagination
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    setBookings(filtered.slice(startIndex, endIndex));

    // Update meta for pagination display
    const totalFiltered = filtered.length;
    const lastPage = Math.ceil(totalFiltered / itemsPerPage) || 1;
    setMeta({
      current_page: currentPage,
      last_page: lastPage,
      total: totalFiltered,
    });
  }, [allBookings, statusFilter, searchQuery, currentPage]);

  // Pagination meta
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });

  // Navigate to booking detail page
  const handleViewBooking = (booking) => {
    setOpenDropdown(null);
    router.push(`/${locale}/provider/bookings/${booking.id}`);
  };

  // Export bookings
  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await ProviderBookingsService.exportBookings();
      if (result.success && result.data?.url) {
        window.open(result.data.url, "_blank");
        toast.success(isRTL ? "تم تصدير الحجوزات" : "Bookings exported successfully");
      } else {
        toast.error(result.message || (isRTL ? "فشل التصدير" : "Export failed"));
      }
    } catch {
      toast.error(isRTL ? "حدث خطأ" : "An error occurred");
    } finally {
      setExporting(false);
    }
  };

  // Helper: get status badge
  const getStatusBadge = (status) => {
    const Icon = StatusIcons[status] || Clock;
    const config = {
      pending: { className: "bg-amber-50 text-amber-700 hover:bg-amber-50 border border-amber-200", label: isRTL ? "معلق" : "Pending" },
      confirmed: { className: "bg-blue-50 text-blue-700 hover:bg-blue-50 border border-blue-200", label: isRTL ? "مؤكد" : "Confirmed" },
      completed: { className: "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-200", label: isRTL ? "مكتمل" : "Completed" },
      cancelled: { className: "bg-rose-50 text-rose-700 hover:bg-rose-50 border border-rose-200", label: isRTL ? "ملغي" : "Cancelled" },
    };
    const c = config[status] || config.pending;
    return { ...c, icon: <Icon className="h-3.5 w-3.5" /> };
  };

  // Helper: get payment badge
  const getPaymentBadge = (method) => {
    const Icon = PaymentIcons[method] || CreditCard;
    const config = {
      cash: { className: "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-200", label: isRTL ? "نقدي" : "Cash" },
      card: { className: "bg-blue-50 text-blue-700 hover:bg-blue-50 border border-blue-200", label: isRTL ? "بطاقة" : "Card" },
      online: { className: "bg-purple-50 text-purple-700 hover:bg-purple-50 border border-purple-200", label: isRTL ? "أونلاين" : "Online" },
      wallet: { className: "bg-amber-50 text-amber-700 hover:bg-amber-50 border border-amber-200", label: isRTL ? "محفظة" : "Wallet" },
    };
    const c = config[method] || { className: "bg-slate-100 text-slate-600 border border-slate-200", label: method || "—" };
    return { ...c, icon: <Icon className="h-3.5 w-3.5 me-1.5" /> };
  };

  return (
    <DashboardLayout requiredUserType="provider">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <CalendarCheck className="h-5 w-5 text-blue-600" />
            </div>
            {isRTL ? "الحجوزات" : "Bookings"}
          </h1>
          <p className="text-slate-500 mt-1">
            {isRTL ? "إدارة ومتابعة جميع الحجوزات" : "Manage and track all bookings"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={exporting} onClick={handleExport} className="gap-2">
            {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            {isRTL ? "تصدير" : "Export"}
          </Button>
          <Button variant="outline" size="sm" disabled={isLoading} onClick={fetchBookings} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
            {isRTL ? "تحديث" : "Refresh"}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {[
          { key: "total", label: isRTL ? "إجمالي الحجوزات" : "Total Bookings", value: stats.total, sub: isRTL ? "جميع الحجوزات" : "All bookings", icon: CalendarCheck, iconBg: "bg-emerald-50", iconColor: "text-emerald-600", subColor: "text-slate-500" },
          { key: "pending", label: isRTL ? "معلق" : "Pending", value: stats.pending, sub: isRTL ? "بانتظار الموافقة" : "Awaiting approval", icon: CalendarClock, iconBg: "bg-amber-50", iconColor: "text-amber-600", subColor: "text-amber-600" },
          { key: "completed", label: isRTL ? "مكتمل" : "Completed", value: stats.completed, sub: isRTL ? "حجوزات ناجحة" : "Successful bookings", icon: CalendarCheck, iconBg: "bg-emerald-50", iconColor: "text-emerald-600", subColor: "text-emerald-600" },
          { key: "cancelled", label: isRTL ? "ملغي" : "Cancelled", value: stats.cancelled, sub: isRTL ? "حجوزات ملغية" : "Cancelled bookings", icon: CalendarX, iconBg: "bg-rose-50", iconColor: "text-rose-600", subColor: "text-rose-600" },
        ].map((card) => {
          const CardIcon = card.icon;
          return (
            <Card key={card.key} className="border-slate-200 hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-600">{card.label}</CardTitle>
                  <div className={`h-10 w-10 ${card.iconBg} rounded-lg flex items-center justify-center`}>
                    <CardIcon className={`h-5 w-5 ${card.iconColor}`} />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-slate-900">
                  {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : card.value}
                </div>
                <p className={`text-xs ${card.subColor} mt-1`}>{card.sub}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Reports Banner (from API) */}
      {reports && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: isRTL ? "حجوزات اليوم" : "Today's Bookings", value: reports.today_bookings?.value || 0, extra: reports.today_bookings?.active_now > 0 ? (isRTL ? `${reports.today_bookings.active_now} نشط الآن` : `${reports.today_bookings.active_now} active now`) : null, color: "text-blue-600", bg: "bg-blue-50" },
            { label: isRTL ? "القادمة" : "Upcoming", value: reports.upcoming || 0, color: "text-purple-600", bg: "bg-purple-50" },
            { label: isRTL ? "إيراد اليوم" : "Today's Revenue", value: `${reports.revenue_today?.value || 0} QAR`, extra: reports.revenue_today?.change ? `${reports.revenue_today.change > 0 ? "+" : ""}${reports.revenue_today.change}%` : null, color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: isRTL ? "إجمالي الحجوزات" : "Total Bookings", value: reports.total_bookings || 0, color: "text-slate-600", bg: "bg-slate-50" },
          ].map((r, i) => (
            <div key={i} className={`${r.bg} rounded-xl p-4 border border-slate-100`}>
              <p className="text-xs text-slate-500 mb-1">{r.label}</p>
              <p className={`text-xl font-bold ${r.color}`}>{r.value}</p>
              {r.extra && <p className="text-xs text-slate-500 mt-0.5">{r.extra}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Tabs and Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {/* Tabs Header */}
        <div className="border-b border-slate-200">
          <div className="flex items-center justify-between px-6">
            <div className="flex items-center gap-0 overflow-x-auto">
              {[
                { key: "all", label: isRTL ? "الكل" : "All", icon: Calendar, count: stats.total },
                { key: "pending", label: isRTL ? "معلق" : "Pending", icon: Clock, count: stats.pending },
                { key: "confirmed", label: isRTL ? "مؤكد" : "Confirmed", icon: CheckCircle, count: stats.confirmed },
                { key: "completed", label: isRTL ? "مكتمل" : "Completed", icon: CheckCircle2, count: stats.completed },
                { key: "cancelled", label: isRTL ? "ملغي" : "Cancelled", icon: XCircle, count: stats.cancelled },
              ].map((tab) => {
                const TabIcon = tab.icon;
                const isActive = statusFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => { setStatusFilter(tab.key); setCurrentPage(1); }}
                    className={`relative px-4 py-4 text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap ${isActive ? "text-primary" : "text-slate-500 hover:text-slate-700"}`}
                  >
                    <TabIcon className="h-4 w-4" />
                    {tab.label}
                    {tab.count > 0 && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${isActive ? "bg-primary/10 text-primary" : "bg-slate-100 text-slate-500"}`}>
                        {tab.count}
                      </span>
                    )}
                    {isActive && <span className="absolute bottom-0 start-0 end-0 h-0.5 bg-primary rounded-t-full" />}
                  </button>
                );
              })}
            </div>
            <div className="relative py-3">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder={isRTL ? "بحث بالاسم، الهاتف، الفاتورة..." : "Search name, phone, invoice..."}
                className="ps-10 w-64 h-9"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
              <p className="text-slate-500">{isRTL ? "جاري التحميل..." : "Loading..."}</p>
            </div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-16">
              <CalendarCheck className="h-16 w-16 text-slate-200 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                {statusFilter !== "all"
                  ? (isRTL ? `لا توجد حجوزات ${getStatusBadge(statusFilter).label}` : `No ${getStatusBadge(statusFilter).label.toLowerCase()} bookings`)
                  : (isRTL ? "لا توجد حجوزات بعد" : "No bookings yet")}
              </h3>
              <p className="text-slate-500">
                {isRTL ? "ستظهر الحجوزات هنا عند قيام العملاء بالحجز" : "Bookings will appear here when customers book appointments"}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="py-4 px-4 text-sm font-semibold text-slate-700 text-start w-16">#</th>
                  <th className="py-4 px-4 text-sm font-semibold text-slate-700 text-start">{isRTL ? "رقم الفاتورة" : "Invoice"}</th>
                  <th className="py-4 px-4 text-sm font-semibold text-slate-700 text-start">{isRTL ? "العميل" : "Customer"}</th>
                  <th className="py-4 px-4 text-sm font-semibold text-slate-700 text-start">{isRTL ? "الدكتور" : "Doctor"}</th>
                  <th className="py-4 px-4 text-sm font-semibold text-slate-700 text-start">{isRTL ? "التاريخ والوقت" : "Date & Time"}</th>
                  <th className="py-4 px-4 text-sm font-semibold text-slate-700 text-start">{isRTL ? "المبلغ" : "Fee"}</th>
                  <th className="py-4 px-4 text-sm font-semibold text-slate-700 text-start">{isRTL ? "الدفع" : "Payment"}</th>
                  <th className="py-4 px-4 text-sm font-semibold text-slate-700 text-start">{isRTL ? "الحالة" : "Status"}</th>
                  <th className="py-4 px-4 text-sm font-semibold text-slate-700 text-start w-[80px]">{isRTL ? "إجراءات" : "Actions"}</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking, index) => {
                  const statusBadge = getStatusBadge(booking.status);
                  const paymentBadge = getPaymentBadge(booking.payment_method);
                  const doctor = ProviderBookingsService.getProviderDoctor(booking.provider_doctor);
                  const customer = booking.customer || booking.client;
                  const allowedTransitions = ProviderBookingsService.getAllowedTransitions(booking.status);

                  return (
                    <tr key={booking.id} className="border-b border-slate-100 hover:bg-slate-50 transition-all">
                      <td className="py-4 px-4">
                        <div className="text-sm font-medium text-slate-500">
                          #{(currentPage - 1) * itemsPerPage + index + 1}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-slate-400" />
                          <span className="text-sm font-medium text-primary">{booking.invoice_number || "—"}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="h-3 w-3 text-slate-400" />
                            <div className="font-medium text-slate-900 text-sm">{customer?.name || "—"}</div>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Phone className="h-3 w-3 text-slate-400" />
                            <span dir="ltr">{customer?.phone || "—"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {doctor ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Stethoscope className="h-3 w-3 text-emerald-500" />
                              <div className="font-medium text-slate-900 text-sm">{doctor.name}</div>
                            </div>
                            {booking.category_name && (
                              <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200 text-xs">
                                {booking.category_name}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="text-sm text-slate-500">—</span>
                            {booking.category_name && (
                              <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200 text-xs">
                                {booking.category_name}
                              </Badge>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 text-sm text-slate-700">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            {ProviderBookingsService.formatDate(booking.data_at || booking.booking_date)}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Clock className="h-3 w-3 text-slate-400" />
                            {ProviderBookingsService.formatTime(booking.time || booking.booking_time)}
                          </div>
                          <div className="text-xs text-primary font-medium">{booking.created_at || ""}</div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="text-sm font-semibold text-slate-900">
                          {ProviderBookingsService.formatCurrency(booking.total || booking.total_price)}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={`${paymentBadge.className} font-medium`}>
                          {paymentBadge.icon}
                          {paymentBadge.label}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className={`${statusBadge.className} gap-1 text-xs font-medium`}>
                          {statusBadge.icon}
                          {statusBadge.label}
                        </Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="relative" ref={openDropdown === booking.id ? dropdownRef : null}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => setOpenDropdown(openDropdown === booking.id ? null : booking.id)}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>

                          {openDropdown === booking.id && (
                            <div className={`absolute z-50 top-full mt-1 ${isRTL ? "left-0" : "right-0"} bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[180px]`}>
                              <button
                                onClick={() => handleViewBooking(booking)}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                              >
                                <Eye className="h-4 w-4" />
                                {isRTL ? "عرض التفاصيل" : "View Details"}
                              </button>
                              {allowedTransitions.length > 0 && (
                                <button
                                  onClick={() => handleViewBooking(booking)}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                                >
                                  <RefreshCw className="h-4 w-4" />
                                  {isRTL ? "تغيير الحالة" : "Change Status"}
                                </button>
                              )}
                            </div>
                          )}
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
              {isRTL ? "عرض" : "Showing"} {((currentPage - 1) * itemsPerPage) + 1} {isRTL ? "إلى" : "to"} {Math.min(currentPage * itemsPerPage, meta.total)} {isRTL ? "من" : "of"} {meta.total} {isRTL ? "حجز" : "bookings"}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}>
                {isRTL ? "السابق" : "Previous"}
              </Button>
              {Array.from({ length: Math.min(5, meta.last_page) }, (_, i) => {
                let pageNum;
                if (meta.last_page <= 5) pageNum = i + 1;
                else if (currentPage <= 3) pageNum = i + 1;
                else if (currentPage >= meta.last_page - 2) pageNum = meta.last_page - 4 + i;
                else pageNum = currentPage - 2 + i;
                return (
                  <Button key={pageNum} variant="outline" size="sm" className={currentPage === pageNum ? "bg-primary text-white border-primary" : ""} onClick={() => setCurrentPage(pageNum)}>
                    {pageNum}
                  </Button>
                );
              })}
              {meta.last_page > 5 && currentPage < meta.last_page - 2 && (
                <>
                  <span className="text-slate-400">...</span>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(meta.last_page)}>{meta.last_page}</Button>
                </>
              )}
              <Button variant="outline" size="sm" disabled={currentPage === meta.last_page} onClick={() => setCurrentPage((p) => Math.min(meta.last_page, p + 1))}>
                {isRTL ? "التالي" : "Next"}
              </Button>
            </div>
          </div>
        )}
      </div>

    </DashboardLayout>
  );
}
