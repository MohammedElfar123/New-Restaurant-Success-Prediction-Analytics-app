"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import BookingsService from "@/lib/services/bookings.service";
import BookingStatusModal from "@/components/modals/BookingStatusModal";
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  Building2,
  Stethoscope,
  CreditCard,
  Banknote,
  Receipt,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Loader2,
  Hash,
  CalendarDays,
  Timer,
  Wallet,
  UserX,
  CheckCircle2,
  Tag,
} from "lucide-react";

// Status icons
const StatusIcons = {
  pending: Clock,
  confirmed: CheckCircle,
  completed: CheckCircle2,
  cancelled: XCircle,
  no_show: UserX,
  noshow: UserX,
  provider_no_show: UserX,
  providernoshow: UserX,
  expired: AlertCircle,
};

// Payment icons
const PaymentIcons = {
  cash: Banknote,
  card: CreditCard,
  online: CreditCard,
};

export default function ClinicBookingDetailsPage() {
  const t = useTranslations("bookings");
  const tCommon = useTranslations("common");
  const tSidebar = useTranslations("sidebar");
  const { locale, id } = useParams();
  const router = useRouter();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  useEffect(() => {
    const fetchBooking = async () => {
      setLoading(true);
      const result = await BookingsService.getBookingById(id);
      if (result.success) {
        setBooking(result.data);
      }
      setLoading(false);
    };

    if (id) {
      fetchBooking();
    }
  }, [id]);

  const handleStatusUpdated = async () => {
    setStatusModalOpen(false);
    const result = await BookingsService.getBookingById(id);
    if (result.success) {
      setBooking(result.data);
    }
  };

  const getStatusIcon = (status) => {
    const Icon = StatusIcons[status?.toLowerCase()] || Clock;
    return <Icon className="h-5 w-5" />;
  };

  const getPaymentIcon = (method) => {
    const Icon = PaymentIcons[method?.toLowerCase()] || CreditCard;
    return <Icon className="h-5 w-5" />;
  };

  const getStatusLabel = (status, apiLabel = null) => {
    if (apiLabel) return apiLabel;
    if (!status) return "-";
    const lower = status.toLowerCase();
    const collapsed = lower.replace(/_/g, "");
    return t(lower) || t(collapsed) || BookingsService.capitalizeStatus(status);
  };

  const getPaymentLabel = (method) => {
    if (!method) return "-";
    return t(method.toLowerCase()) || BookingsService.capitalizeStatus(method);
  };

  if (loading) {
    return (
      <DashboardLayout requiredUserType="admin">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
            <p className="text-slate-500">{tCommon("loading")}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!booking) {
    return (
      <DashboardLayout requiredUserType="admin">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <AlertCircle className="h-16 w-16 text-slate-300 mb-4" />
          <h2 className="text-xl font-semibold text-slate-700 mb-2">
            {t("bookingNotFound")}
          </h2>
          <Button
            variant="outline"
            onClick={() => router.push(`/${locale}/admin/bookings/clinics`)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {tCommon("back")}
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const canChangeStatus = BookingsService.getAllowedTransitions(booking.status).length > 0;

  return (
    <DashboardLayout requiredUserType="admin">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/${locale}/admin/bookings/clinics`)}
            className="rounded-full"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Building2 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {t("bookingDetails")}
                </h1>
                <p className="text-slate-500 text-sm flex items-center gap-2 mt-0.5">
                  <Hash className="h-3.5 w-3.5" />
                  {booking.invoice_number || `BK-${String(booking.id).padStart(5, "0")}`}
                </p>
              </div>
            </div>
          </div>
          <Badge
            className={`${BookingsService.getStatusBadgeColor(booking.status)} font-medium px-3 py-1`}
          >
            {getStatusIcon(booking.status)}
            <span className="ms-1.5">{getStatusLabel(booking.status, booking.status_label)}</span>
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          {canChangeStatus && (
            <Button
              onClick={() => setStatusModalOpen(true)}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              {t("changeStatus")}
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
                {t("customerInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {booking.customer ? (
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center flex-shrink-0">
                    {booking.customer.image ? (
                      <img
                        src={booking.customer.image}
                        alt={booking.customer.name}
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    ) : (
                      <User className="h-8 w-8 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {booking.customer.name}
                    </h3>
                    <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Phone className="h-4 w-4 text-slate-400" />
                        <span>{booking.customer.phone || "-"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Mail className="h-4 w-4 text-slate-400" />
                        <span>{booking.customer.email || "-"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 text-slate-500">
                  <UserX className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                  <p>{t("noCustomerData") || "No customer data available"}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Appointment Details */}
          <Card className="border-slate-200 overflow-hidden">
            <CardHeader className="bg-slate-50 border-b border-slate-200 pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                {t("appointmentInfo")}
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
                      <p className="text-sm text-slate-500">{t("date")}</p>
                      <p className="text-base font-medium text-slate-900">
                        {BookingsService.formatDate(booking.date || booking.data_at, locale)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">{t("time")}</p>
                      <p className="text-base font-medium text-slate-900">
                        {booking.time || "-"}
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
                      <p className="text-sm text-slate-500">{t("type")}</p>
                      <Badge className="mt-1 bg-purple-50 text-purple-700 hover:bg-purple-50 border-purple-200">
                        {booking.category?.name || booking.category_name || "-"}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Timer className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">{t("createdAt") || "Created"}</p>
                      <p className="text-base font-medium text-slate-900">
                        {booking.created_at || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cancellation Info */}
          {(booking.status === "cancelled" || booking.status === "no_show") && booking.cancellation_reason && (
            <Card className="border-rose-200 bg-rose-50/30 overflow-hidden">
              <CardHeader className="bg-rose-50 border-b border-rose-200 pb-4">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-rose-700">
                  <AlertCircle className="h-5 w-5" />
                  {t("cancellationReason")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-rose-700">{booking.cancellation_reason}</p>
                {booking.cancelled_by && (
                  <p className="text-sm text-rose-600 mt-2">
                    {t("cancelledBy") || "Cancelled by"}: {booking.cancelled_by.name} ({booking.cancelled_by_type})
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Clinic Info */}
          <Card className="border-slate-200 overflow-hidden">
            <CardHeader className="bg-purple-50 border-b border-purple-200 pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-purple-700">
                <Building2 className="h-5 w-5" />
                {t("clinic")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 bg-gradient-to-br from-purple-100 to-purple-50 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {booking.provider?.image ? (
                    <img
                      src={booking.provider.image}
                      alt={booking.provider.name}
                      className="h-14 w-14 object-cover"
                    />
                  ) : (
                    <Building2 className="h-7 w-7 text-purple-600" />
                  )}
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-900">
                    {booking.provider?.name || "-"}
                  </p>
                  <Badge variant="outline" className="mt-1.5 text-xs">
                    {booking.provider?.type}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Doctor Info */}
          {booking.provider_doctor && (
            <Card className="border-slate-200 overflow-hidden">
              <CardHeader className="bg-emerald-50 border-b border-emerald-200 pb-4">
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-emerald-700">
                  <Stethoscope className="h-5 w-5" />
                  {t("doctor")}
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
                    <Badge className="mt-2 bg-purple-50 text-purple-700 hover:bg-purple-50 border-purple-200">
                      {booking.category?.name || booking.category_name}
                    </Badge>
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
                {t("paymentInfo")}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">{t("consultationFee")}</span>
                  <span className="font-medium text-slate-900">
                    {BookingsService.formatCurrency(booking.subtotal)}
                  </span>
                </div>
                {booking.fee_services && parseFloat(booking.fee_services) > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{t("serviceFee") || "Service Fee"}</span>
                    <span className="font-medium text-slate-900">
                      {BookingsService.formatCurrency(booking.fee_services)}
                    </span>
                  </div>
                )}
                <div className="border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">{t("total")}</span>
                    <span className="text-lg font-bold text-primary">
                      {BookingsService.formatCurrency(booking.total)}
                    </span>
                  </div>
                </div>
                <div className="border-t border-slate-100 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{t("payment")}</span>
                    <Badge
                      className={`${BookingsService.getPaymentMethodBadgeColor(
                        booking.payment_method
                      )} font-medium`}
                    >
                      {getPaymentIcon(booking.payment_method)}
                      <span className="ms-1.5">{getPaymentLabel(booking.payment_method)}</span>
                    </Badge>
                  </div>
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
                <p className="text-sm text-slate-500">{t("bookingId") || "Booking ID"}</p>
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

      {/* Status Modal */}
      <BookingStatusModal
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        booking={booking}
        onStatusUpdated={handleStatusUpdated}
      />
    </DashboardLayout>
  );
}
