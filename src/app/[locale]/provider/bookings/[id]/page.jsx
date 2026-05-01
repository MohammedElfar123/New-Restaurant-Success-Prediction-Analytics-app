"use client";

import { useState, useEffect } from "react";
import { useLocale } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import ProviderBookingsService from "@/lib/services/provider-bookings.service";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  Stethoscope,
  CreditCard,
  Banknote,
  Receipt,
  CheckCircle,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Loader2,
  Hash,
  CalendarDays,
  CalendarCheck,
  Timer,
  Wallet,
  UserX,
  Tag,
} from "lucide-react";
import toast from "react-hot-toast";

// Status icons
const StatusIcons = {
  pending: Clock,
  confirmed: CheckCircle,
  completed: CheckCircle2,
  cancelled: XCircle,
};

// Payment icons
const PaymentIcons = {
  cash: Banknote,
  card: CreditCard,
  online: CreditCard,
  wallet: Wallet,
};

export default function ProviderBookingDetailsPage() {
  const locale = useLocale();
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const isRTL = locale === "ar";

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  // Status change modal
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState("");

  // Cancellation reason
  const [cancellationReasons, setCancellationReasons] = useState([]);
  const [selectedReasonId, setSelectedReasonId] = useState("");

  // Fetch booking
  useEffect(() => {
    const fetchBooking = async () => {
      setLoading(true);
      const result = await ProviderBookingsService.getBookingById(id);
      if (result.success) {
        setBooking(result.data);
      }
      setLoading(false);
    };

    if (id) {
      fetchBooking();
    }
  }, [id]);

  // Fetch cancellation reasons once (used in modal when status === cancelled)
  useEffect(() => {
    const fetchReasons = async () => {
      const result = await ProviderBookingsService.getCancellationReasons();
      if (result.success) {
        setCancellationReasons(result.data);
      }
    };
    fetchReasons();
  }, []);

  // Hours remaining until the appointment (negative if in the past).
  // The backend rejects cancellations within 12 hours; show that constraint in the UI.
  const hoursUntilAppointment = (() => {
    if (!booking?.date || !booking?.time) return null;
    const dt = new Date(`${booking.date}T${booking.time}`);
    if (Number.isNaN(dt.getTime())) return null;
    return (dt.getTime() - Date.now()) / (1000 * 60 * 60);
  })();
  const isWithinCancelWindow =
    hoursUntilAppointment !== null && hoursUntilAppointment <= 12;

  // Handle status update
  const handleSubmitStatus = async () => {
    if (!selectedStatus) {
      setStatusError(isRTL ? "يرجى اختيار الحالة" : "Please select a status");
      return;
    }
    if (selectedStatus === "cancelled" && !selectedReasonId) {
      setStatusError(isRTL ? "يرجى اختيار سبب الإلغاء" : "Please select a cancellation reason");
      return;
    }
    if (selectedStatus === "cancelled" && isWithinCancelWindow) {
      setStatusError(
        isRTL
          ? "لا يمكن إلغاء الحجز قبل 12 ساعة من الموعد"
          : "Booking cannot be cancelled less than 12 hours before the appointment"
      );
      return;
    }

    setStatusLoading(true);
    setStatusError("");

    const result = await ProviderBookingsService.updateBookingStatus(
      booking.id,
      selectedStatus,
      selectedStatus === "cancelled" ? Number(selectedReasonId) : null
    );

    if (result.success) {
      toast.success(result.message || (isRTL ? "تم تحديث حالة الحجز" : "Booking status updated"));
      setStatusModalOpen(false);
      // Refresh booking data
      const refreshed = await ProviderBookingsService.getBookingById(id);
      if (refreshed.success) {
        setBooking(refreshed.data);
      }
    } else {
      setStatusError(result.message || (isRTL ? "فشل تحديث الحالة" : "Failed to update status"));
    }
    setStatusLoading(false);
  };

  const openStatusModal = () => {
    setSelectedStatus("");
    setSelectedReasonId("");
    setStatusError("");
    setStatusModalOpen(true);
  };

  // Helpers
  const getStatusIcon = (status) => {
    const Icon = StatusIcons[status?.toLowerCase()] || Clock;
    return <Icon className="h-5 w-5" />;
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { className: "bg-amber-50 text-amber-700 hover:bg-amber-50 border border-amber-200", label: isRTL ? "معلق" : "Pending" },
      confirmed: { className: "bg-blue-50 text-blue-700 hover:bg-blue-50 border border-blue-200", label: isRTL ? "مؤكد" : "Confirmed" },
      completed: { className: "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-200", label: isRTL ? "مكتمل" : "Completed" },
      cancelled: { className: "bg-rose-50 text-rose-700 hover:bg-rose-50 border border-rose-200", label: isRTL ? "ملغي" : "Cancelled" },
    };
    return config[status] || config.pending;
  };

  const getPaymentIcon = (method) => {
    const Icon = PaymentIcons[method?.toLowerCase()] || CreditCard;
    return <Icon className="h-5 w-5" />;
  };

  const getPaymentBadge = (method) => {
    const config = {
      cash: { className: "bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-200", label: isRTL ? "نقدي" : "Cash" },
      card: { className: "bg-blue-50 text-blue-700 hover:bg-blue-50 border border-blue-200", label: isRTL ? "بطاقة" : "Card" },
      online: { className: "bg-purple-50 text-purple-700 hover:bg-purple-50 border border-purple-200", label: isRTL ? "أونلاين" : "Online" },
      wallet: { className: "bg-amber-50 text-amber-700 hover:bg-amber-50 border border-amber-200", label: isRTL ? "محفظة" : "Wallet" },
    };
    return config[method] || { className: "bg-slate-100 text-slate-600 border border-slate-200", label: method || "—" };
  };

  // Loading state
  if (loading) {
    return (
      <DashboardLayout requiredUserType="provider">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
            <p className="text-slate-500">{isRTL ? "جاري التحميل..." : "Loading..."}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Not found state
  if (!booking) {
    return (
      <DashboardLayout requiredUserType="provider">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <AlertCircle className="h-16 w-16 text-slate-300 mb-4" />
          <h2 className="text-xl font-semibold text-slate-700 mb-2">
            {isRTL ? "لم يتم العثور على الحجز" : "Booking not found"}
          </h2>
          <Button
            variant="outline"
            onClick={() => router.push(`/${locale}/provider/bookings`)}
            className="gap-2 mt-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {isRTL ? "رجوع" : "Back"}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const customer = booking.customer || booking.client;
  const doctor = ProviderBookingsService.getProviderDoctor(booking.provider_doctor);
  const canChangeStatus = ProviderBookingsService.getAllowedTransitions(booking.status).length > 0;

  return (
    <DashboardLayout requiredUserType="provider">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/${locale}/provider/bookings`)}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <CalendarCheck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {isRTL ? "تفاصيل الحجز" : "Booking Details"}
                </h1>
                <p className="text-slate-500 text-sm flex items-center gap-2 mt-0.5">
                  <Hash className="h-3.5 w-3.5" />
                  {booking.invoice_number || `BK-${String(booking.id).padStart(5, "0")}`}
                </p>
              </div>
            </div>
          </div>
          <Badge
            className={`${getStatusBadge(booking.status).className} font-medium px-3 py-1`}
          >
            {getStatusIcon(booking.status)}
            <span className="ms-1.5">{getStatusBadge(booking.status).label}</span>
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          {canChangeStatus && (
            <Button onClick={openStatusModal} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              {isRTL ? "تغيير الحالة" : "Change Status"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <Card className="border-slate-200 overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-200 pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                {isRTL ? "معلومات العميل" : "Customer Information"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {customer ? (
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {customer.image ? (
                      <img
                        src={customer.image}
                        alt={customer.name}
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {customer.name}
                    </h3>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="h-4 w-4 text-slate-400" />
                        <span dir="ltr">{customer.phone || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail className="h-4 w-4 text-slate-400" />
                        <span>{customer.email || "—"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-slate-500">
                  <UserX className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  <p>{isRTL ? "لا توجد بيانات عميل" : "No customer data available"}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Appointment Details */}
          <Card className="border-slate-200 overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-200 pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                {isRTL ? "تفاصيل الموعد" : "Appointment Details"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">{isRTL ? "التاريخ" : "Date"}</p>
                      <p className="text-base font-medium text-slate-900">
                        {ProviderBookingsService.formatDate(booking.date || booking.data_at || booking.booking_date)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">{isRTL ? "الوقت" : "Time"}</p>
                      <p className="text-base font-medium text-slate-900">
                        {ProviderBookingsService.formatTime(booking.time || booking.booking_time)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Tag className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">{isRTL ? "التخصص" : "Category"}</p>
                      <Badge className="mt-1 bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200">
                        {booking.category?.name || booking.category_name || "—"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Timer className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">
                        {booking.period ? (isRTL ? "الفترة" : "Period") : (isRTL ? "تاريخ الإنشاء" : "Created")}
                      </p>
                      <p className="text-base font-medium text-slate-900">
                        {booking.period
                          ? ProviderBookingsService.getPeriodLabel(booking.period, isRTL)
                          : (booking.created_at || "—")}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          {booking.timeline && booking.timeline.length > 0 && (
            <Card className="border-slate-200 overflow-hidden">
              <CardHeader className="bg-slate-50 border-b border-slate-200 pb-4">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Timer className="h-5 w-5 text-primary" />
                  {isRTL ? "سجل التغييرات" : "Status Timeline"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {booking.timeline.map((entry, i) => {
                    const entryStatus = entry.status?.toLowerCase();
                    const EntryIcon = StatusIcons[entryStatus] || Clock;
                    return (
                      <div key={i} className="flex items-start gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 ${entryStatus === "cancelled" ? "bg-rose-100" : entryStatus === "completed" ? "bg-emerald-100" : entryStatus === "confirmed" ? "bg-blue-100" : "bg-amber-100"}`}>
                          <EntryIcon className={`h-5 w-5 ${entryStatus === "cancelled" ? "text-rose-600" : entryStatus === "completed" ? "text-emerald-600" : entryStatus === "confirmed" ? "text-blue-600" : "text-amber-600"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-base font-medium text-slate-900">{entry.status}</p>
                          <p className="text-sm text-slate-500">
                            {entry.readable || entry.time}
                            {entry.changed_by && (
                              <span className="ms-2">
                                — {entry.changed_by.name} ({entry.changed_by.type})
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cancellation Info */}
          {booking.status === "cancelled" && booking.cancellation_reason && (
            <Card className="border-rose-200 bg-rose-50/30 overflow-hidden">
              <CardHeader className="bg-rose-50 border-b border-rose-200 pb-4">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-rose-700">
                  <AlertCircle className="h-5 w-5" />
                  {isRTL ? "سبب الإلغاء" : "Cancellation Reason"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-rose-700">{booking.cancellation_reason}</p>
                {booking.cancelled_by && (
                  <p className="text-sm text-rose-600 mt-2">
                    {isRTL ? "تم الإلغاء بواسطة" : "Cancelled by"}: {booking.cancelled_by.name} ({booking.cancelled_by_type})
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Doctor Info */}
          {doctor && (
            <Card className="border-slate-200 overflow-hidden">
              <CardHeader className="bg-emerald-50 border-b border-emerald-200 pb-4">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-emerald-700">
                  <Stethoscope className="h-5 w-5" />
                  {isRTL ? "الطبيب" : "Doctor"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {booking.provider_doctor.image ? (
                      <img
                        src={booking.provider_doctor.image}
                        alt={booking.provider_doctor.name}
                        className="h-14 w-14 object-cover rounded-full"
                      />
                    ) : (
                      <Stethoscope className="h-7 w-7 text-emerald-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-slate-900">
                      {booking.provider_doctor.name}
                    </p>
                    {(booking.category?.name || booking.category_name) && (
                      <Badge className="mt-2 bg-blue-50 text-blue-700 hover:bg-blue-50 border-blue-200">
                        {booking.category?.name || booking.category_name}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Details */}
          <Card className="border-slate-200 overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-200 pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Wallet className="h-5 w-5 text-primary" />
                {isRTL ? "تفاصيل الدفع" : "Payment Details"}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">{isRTL ? "رسوم الاستشارة" : "Consultation Fee"}</span>
                  <span className="font-medium text-slate-900">
                    {ProviderBookingsService.formatCurrency(booking.subtotal)}
                  </span>
                </div>
                {booking.fee_services && parseFloat(booking.fee_services) > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{isRTL ? "رسوم الخدمة" : "Service Fee"}</span>
                    <span className="font-medium text-slate-900">
                      {ProviderBookingsService.formatCurrency(booking.fee_services)}
                    </span>
                  </div>
                )}
                <div className="border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{isRTL ? "الإجمالي" : "Total"}</span>
                    <span className="text-lg font-bold text-primary">
                      {ProviderBookingsService.formatCurrency(booking.total || booking.total_price)}
                    </span>
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{isRTL ? "طريقة الدفع" : "Payment"}</span>
                    {(() => {
                      const pb = getPaymentBadge(booking.payment_method);
                      return (
                        <Badge className={`${pb.className} font-medium`}>
                          {getPaymentIcon(booking.payment_method)}
                          <span className="ms-1.5">{pb.label}</span>
                        </Badge>
                      );
                    })()}
                  </div>
                  {booking.payment_status && (
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-slate-500">{isRTL ? "حالة الدفع" : "Pay Status"}</span>
                      <Badge className={`${ProviderBookingsService.getPayStatusBadgeColor(booking.payment_status)} font-medium border`}>
                        {ProviderBookingsService.getPayStatusLabel(booking.payment_status, isRTL)}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Booking ID Card */}
          <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-white">
            <CardContent className="p-6">
              <div className="text-center">
                <div className="h-14 w-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Receipt className="h-7 w-7 text-primary" />
                </div>
                <p className="text-sm text-slate-500">{isRTL ? "رقم الحجز" : "Booking ID"}</p>
                <p className="text-xl font-bold text-slate-900 mt-1">
                  #{booking.id}
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {booking.invoice_number}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ========== STATUS CHANGE MODAL ========== */}
      <Dialog open={statusModalOpen} onOpenChange={() => { setStatusModalOpen(false); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-primary" />
              {isRTL ? "تغيير الحالة" : "Change Status"}
            </DialogTitle>
            <DialogDescription>
              {isRTL ? "تحديث حالة الحجز" : "Update the booking status"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Current -> New Status */}
            <div className="space-y-2">
              <Label className="text-sm text-slate-500">{isRTL ? "الحالة الحالية" : "Current Status"}</Label>
              <div className="flex items-center gap-2">
                <Badge className={`${getStatusBadge(booking.status).className} px-3 py-1.5`}>
                  {getStatusIcon(booking.status)}
                  <span className="ms-1.5">{getStatusBadge(booking.status).label}</span>
                </Badge>
                <span className="text-slate-400 mx-1">&rarr;</span>
                {selectedStatus ? (
                  <Badge className={`${getStatusBadge(selectedStatus).className} px-3 py-1.5`}>
                    {getStatusIcon(selectedStatus)}
                    <span className="ms-1.5">{getStatusBadge(selectedStatus).label}</span>
                  </Badge>
                ) : (
                  <span className="text-sm text-slate-400">{isRTL ? "اختر الحالة الجديدة" : "Select new status"}</span>
                )}
              </div>
            </div>

            {/* Status Select */}
            <div className="space-y-2">
              <Label>{isRTL ? "الحالة الجديدة" : "New Status"}</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder={isRTL ? "اختر الحالة" : "Select status"} />
                </SelectTrigger>
                <SelectContent>
                  {ProviderBookingsService.getAllowedTransitions(booking.status).map((status) => {
                    const Icon = StatusIcons[status] || Clock;
                    return (
                      <SelectItem key={status} value={status}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span>{getStatusBadge(status).label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Cancellation reason picker (required when cancelling) */}
            {selectedStatus === "cancelled" && (
              <div className="space-y-2">
                <Label htmlFor="reason">
                  {isRTL ? "سبب الإلغاء" : "Cancellation Reason"}
                  <span className="text-rose-600 ms-1">*</span>
                </Label>
                <Select value={selectedReasonId} onValueChange={setSelectedReasonId}>
                  <SelectTrigger id="reason">
                    <SelectValue
                      placeholder={
                        cancellationReasons.length === 0
                          ? (isRTL ? "جاري التحميل..." : "Loading...")
                          : (isRTL ? "اختر سبباً" : "Choose a reason")
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {cancellationReasons.map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>
                        {r.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* 12-hour rule warning — backend rejects cancellations within 12h */}
            {selectedStatus === "cancelled" && isWithinCancelWindow && (
              <div className="bg-rose-50 border border-rose-300 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-rose-700 text-sm">
                      {isRTL ? "لا يمكن الإلغاء" : "Cancellation blocked"}
                    </p>
                    <p className="text-xs text-rose-600 mt-1">
                      {isRTL
                        ? "تبقى أقل من 12 ساعة على الموعد. سياسة الإلغاء لا تسمح بإلغاء حجز خلال هذه الفترة."
                        : "Less than 12 hours remain before the appointment. Cancellations within this window are not permitted."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Warning */}
            {selectedStatus === "cancelled" && !isWithinCancelWindow && (
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-rose-700 text-sm">{isRTL ? "تحذير" : "Warning"}</p>
                    <p className="text-xs text-rose-600 mt-1">
                      {isRTL ? "لا يمكن التراجع عن هذا الإجراء. سيتم إلغاء الحجز نهائيا." : "This action cannot be undone. The booking will be permanently cancelled."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error */}
            {statusError && (
              <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
                <p className="text-sm text-rose-700">{statusError}</p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusModalOpen(false)} disabled={statusLoading}>
              {isRTL ? "إلغاء" : "Cancel"}
            </Button>
            <Button
              onClick={handleSubmitStatus}
              disabled={
                statusLoading ||
                !selectedStatus ||
                (selectedStatus === "cancelled" &&
                  (!selectedReasonId || isWithinCancelWindow))
              }
              className={selectedStatus === "cancelled" ? "bg-rose-600 hover:bg-rose-700" : ""}
            >
              {statusLoading ? (
                <><Loader2 className="h-4 w-4 animate-spin me-2" />{isRTL ? "جاري التحديث..." : "Updating..."}</>
              ) : (
                <><RefreshCw className="h-4 w-4 me-2" />{isRTL ? "تحديث الحالة" : "Update Status"}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
