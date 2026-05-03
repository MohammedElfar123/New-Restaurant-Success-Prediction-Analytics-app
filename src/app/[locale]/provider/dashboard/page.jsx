"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import ProviderBookingsService from "@/lib/services/provider-bookings.service";
import ProviderDoctorsService from "@/lib/services/provider-doctors.service";
import ProviderTeamService from "@/lib/services/provider-team.service";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Stethoscope,
  Building2,
  Heart,
  CalendarCheck,
  CalendarClock,
  CalendarX,
  Users,
  Clock,
  TrendingUp,
  Activity,
  Calendar,
  User,
  Phone,
  Loader2,
  RefreshCw,
  CheckCircle,
  CheckCircle2,
  XCircle,
  Mail,
  UserCog,
  FileText,
  CreditCard,
  Banknote,
  Wallet,
  MoreVertical,
  Eye,
} from "lucide-react";

export default function ProviderDashboardPage() {
  const locale = useLocale();
  const router = useRouter();
  const t = useTranslations("common");
  const { user, userType, providerType: storedProviderType } = useAuthStore();
  const isRTL = locale === "ar";
  const [isLoading, setIsLoading] = useState(true);

  const providerType = storedProviderType || user?.provider?.type || user?.type || "Provider";
  const isDoctor = providerType === "Doctor";

  const getIcon = () => {
    if (providerType === "Doctor") return Stethoscope;
    if (providerType === "Hospital") return Building2;
    if (providerType === "Clinic") return Building2;
    return Heart;
  };

  const getProviderLabel = () => {
    if (providerType === "Doctor") return isRTL ? "طبيب" : "Doctor";
    if (providerType === "Hospital") return isRTL ? "مستشفى" : "Hospital";
    if (providerType === "Clinic") return isRTL ? "عيادة" : "Clinic";
    return isRTL ? "مقدم خدمة" : "Provider";
  };

  const ProviderIcon = getIcon();

  // Dashboard stats
  const [stats, setStats] = useState({
    totalBookings: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    totalDoctors: 0,
    totalAdmins: 0,
  });

  // Recent bookings
  const [recentBookings, setRecentBookings] = useState([]);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch bookings (all), doctors (for clinic/hospital), and admins in parallel
      const promises = [
        ProviderBookingsService.getBookings({ per_page: 1000 }),
      ];

      // Only fetch doctors for Clinic/Hospital providers
      if (!isDoctor) {
        promises.push(ProviderDoctorsService.getProviderDoctors({ per_page: 1 }));
        promises.push(ProviderTeamService.getAdmins());
      }

      const results = await Promise.all(promises);

      // Bookings
      const bookingsResult = results[0];
      if (bookingsResult.success) {
        const bookings = bookingsResult.data;
        const pending = bookings.filter((b) => b.status === "pending").length;
        const confirmed = bookings.filter((b) => b.status === "confirmed").length;
        const completed = bookings.filter((b) => b.status === "completed").length;
        const cancelled = bookings.filter((b) => b.status === "cancelled").length;

        setStats((prev) => ({
          ...prev,
          totalBookings: bookings.length,
          pendingBookings: pending,
          confirmedBookings: confirmed,
          completedBookings: completed,
          cancelledBookings: cancelled,
        }));

        // Recent bookings (last 5, sorted by newest first)
        const sorted = [...bookings].sort((a, b) => {
          const dateA = new Date(a.data_at || a.date || 0);
          const dateB = new Date(b.data_at || b.date || 0);
          return dateB - dateA;
        });
        setRecentBookings(sorted.slice(0, 5));
      }

      // Doctors (for Clinic/Hospital)
      if (!isDoctor && results[1]?.success) {
        setStats((prev) => ({
          ...prev,
          totalDoctors: results[1].meta?.total || results[1].data?.length || 0,
        }));
      }

      // Admins
      if (!isDoctor && results[2]?.success) {
        setStats((prev) => ({
          ...prev,
          totalAdmins: results[2].data?.length || 0,
        }));
      }
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isDoctor]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Status icons
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
      <div data-tour="welcome" className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="h-10 w-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <ProviderIcon className="h-5 w-5 text-emerald-600" />
            </div>
            {isRTL ? "مرحبا" : "Welcome"}, {user?.name || "Provider"}
          </h1>
          <p className="text-slate-500 mt-1">
            {isRTL
              ? "نظرة عامة على نشاطك وإحصائياتك"
              : "Overview of your activity and statistics"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-200 gap-1.5 text-xs px-3 py-1.5">
            <Activity className="h-3.5 w-3.5" />
            {getProviderLabel()} {isRTL ? "لوحة التحكم" : "Dashboard"}
          </Badge>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={fetchDashboardData} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div data-tour="dashboard-stats" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">
                {isRTL ? "إجمالي الحجوزات" : "Total Bookings"}
              </CardTitle>
              <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <CalendarCheck className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.totalBookings}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isRTL ? "جميع الحجوزات" : "All bookings"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">
                {isRTL ? "مكتمل" : "Completed"}
              </CardTitle>
              <div className="h-10 w-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.completedBookings}
            </div>
            <p className="text-xs text-emerald-600 mt-1">
              {isRTL ? "حجوزات مكتملة" : "Completed appointments"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">
                {isDoctor
                  ? (isRTL ? "مؤكد" : "Confirmed")
                  : (isRTL ? "الأطباء" : "Doctors")}
              </CardTitle>
              <div className="h-10 w-10 bg-purple-50 rounded-lg flex items-center justify-center">
                {isDoctor
                  ? <CalendarCheck className="h-5 w-5 text-purple-600" />
                  : <Stethoscope className="h-5 w-5 text-purple-600" />
                }
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (isDoctor ? stats.confirmedBookings : stats.totalDoctors)}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isDoctor
                ? (isRTL ? "حجوزات مؤكدة" : "Confirmed bookings")
                : (isRTL ? "الأطباء المسجلين" : "Registered doctors")}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">
                {isRTL ? "معلق" : "Pending"}
              </CardTitle>
              <div className="h-10 w-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <CalendarClock className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.pendingBookings}
            </div>
            <p className="text-xs text-amber-600 mt-1">
              {isRTL ? "بانتظار الموافقة" : "Awaiting approval"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings Table + Quick Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div data-tour="dashboard-recent-bookings" className="lg:col-span-2">
          <Card className="border-slate-200 shadow-sm">
            <CardContent className="p-0">
              <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="text-sm font-semibold text-slate-900">
                      {isRTL ? "آخر الحجوزات" : "Recent Bookings"}
                    </h3>
                    <Badge variant="secondary" className="bg-slate-200 text-slate-700">
                      {recentBookings.length}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                {isLoading ? (
                  <div className="text-center py-12">
                    <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
                    <p className="text-slate-500">{isRTL ? "جاري التحميل..." : "Loading..."}</p>
                  </div>
                ) : recentBookings.length === 0 ? (
                  <div className="text-center py-16">
                    <Calendar className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-slate-900 mb-2">
                      {isRTL ? "لا توجد حجوزات بعد" : "No bookings yet"}
                    </h3>
                    <p className="text-slate-500">
                      {isRTL ? "سيتم عرض آخر الحجوزات هنا" : "Recent bookings will appear here"}
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
                      </tr>
                    </thead>
                    <tbody>
                      {recentBookings.map((booking, index) => {
                        const statusBadge = getStatusBadge(booking.status);
                        const paymentBadge = getPaymentBadge(booking.payment_method);
                        const doctor = ProviderBookingsService.getProviderDoctor(booking.provider_doctor);
                        const customer = booking.customer || booking.client;

                        return (
                          <tr key={booking.id} className="border-b border-slate-100 hover:bg-slate-50 transition-all cursor-pointer" onClick={() => router.push(`/${locale}/provider/bookings/${booking.id}`)}>
                            <td className="py-4 px-4">
                              <div className="text-sm font-medium text-slate-500">#{index + 1}</div>
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
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Info Sidebar */}
        <div className="space-y-6">
          {/* Provider Info Card */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {isRTL ? "معلومات المنشأة" : "Provider Info"}
                </CardTitle>
                <div className="h-10 w-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <ProviderIcon className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50">
                  <User className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs text-slate-500">{isRTL ? "الاسم" : "Name"}</div>
                    <div className="text-sm font-medium text-slate-900 truncate">{user?.name || "—"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50">
                  <Mail className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs text-slate-500">{isRTL ? "البريد" : "Email"}</div>
                    <div className="text-sm font-medium text-slate-900 truncate">{user?.email || "—"}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50">
                  <Phone className="h-4 w-4 text-slate-400 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs text-slate-500">{isRTL ? "الهاتف" : "Phone"}</div>
                    <div className="text-sm font-medium text-slate-900 truncate" dir="ltr">{user?.phone || "—"}</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats Card */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600">
                  {isRTL ? "ملخص الحجوزات" : "Bookings Summary"}
                </CardTitle>
                <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50/50">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm text-slate-700">{isRTL ? "مكتمل" : "Completed"}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : stats.completedBookings}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-blue-50/50">
                  <div className="flex items-center gap-2">
                    <CalendarCheck className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-slate-700">{isRTL ? "مؤكد" : "Confirmed"}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : stats.confirmedBookings}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-50/50">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-amber-600" />
                    <span className="text-sm text-slate-700">{isRTL ? "معلق" : "Pending"}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : stats.pendingBookings}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-rose-50/50">
                  <div className="flex items-center gap-2">
                    <CalendarX className="h-4 w-4 text-rose-600" />
                    <span className="text-sm text-slate-700">{isRTL ? "ملغي" : "Cancelled"}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : stats.cancelledBookings}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Team Stats (for Clinic/Hospital only) */}
          {!isDoctor && (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-slate-600">
                    {isRTL ? "الفريق" : "Team"}
                  </CardTitle>
                  <div className="h-10 w-10 bg-purple-50 rounded-lg flex items-center justify-center">
                    <UserCog className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-teal-50/50">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4 text-teal-600" />
                      <span className="text-sm text-slate-700">{isRTL ? "الأطباء" : "Doctors"}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : stats.totalDoctors}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-slate-500" />
                      <span className="text-sm text-slate-700">{isRTL ? "المشرفين" : "Admins"}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">
                      {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : stats.totalAdmins}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
