"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import BookingsService from "@/lib/services/bookings.service";
import {
  RefreshCw,
  Loader2,
  ArrowRight,
  CheckCircle,
  XCircle,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  UserX,
} from "lucide-react";

// Status icon mapping (lowercase to match API values)
const StatusIcons = {
  pending: Clock,
  confirmed: CheckCircle,
  completed: CheckCircle2,
  cancelled: XCircle,
  expired: AlertCircle,
  no_show: UserX,
  provider_no_show: UserX,
};

export default function BookingStatusModal({ open, onClose, booking, onStatusUpdated }) {
  const t = useTranslations("bookings");
  const tCommon = useTranslations("common");

  const [selectedStatus, setSelectedStatus] = useState("");
  const [selectedReason, setSelectedReason] = useState("");
  const [cancellationReasons, setCancellationReasons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingReasons, setLoadingReasons] = useState(false);
  const [error, setError] = useState("");

  // Get allowed transitions
  const allowedTransitions = booking
    ? BookingsService.getAllowedTransitions(booking.status)
    : [];

  // Check if selected status requires a cancellation reason
  const requiresReason = selectedStatus === "cancelled";

  useEffect(() => {
    if (open) {
      setSelectedStatus("");
      setSelectedReason("");
      setError("");
    }
  }, [open]);

  useEffect(() => {
    if (requiresReason && cancellationReasons.length === 0) {
      fetchCancellationReasons();
    }
  }, [requiresReason]);

  const fetchCancellationReasons = async () => {
    setLoadingReasons(true);
    const result = await BookingsService.getCancellationReasons();
    if (result.success) {
      setCancellationReasons(result.data);
    }
    setLoadingReasons(false);
  };

  const handleSubmit = async () => {
    if (!selectedStatus) {
      setError(t("selectStatusError") || "Please select a status");
      return;
    }

    if (requiresReason && !selectedReason) {
      setError(t("selectReasonError") || "Please select a cancellation reason");
      return;
    }

    setLoading(true);
    setError("");

    const result = await BookingsService.updateBookingStatus(
      booking.id,
      selectedStatus,
      requiresReason ? parseInt(selectedReason) : null
    );

    if (result.success) {
      onStatusUpdated();
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  const getStatusIcon = (status) => {
    const Icon = StatusIcons[status] || Clock;
    return <Icon className="h-4 w-4" />;
  };

  if (!booking) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            {t("changeStatus") || "Change Status"}
          </DialogTitle>
          <DialogDescription>
            {t("changeStatusDesc") || "Update the booking status"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Status */}
          <div className="space-y-2">
            <Label className="text-sm text-slate-500">
              {t("currentStatus") || "Current Status"}
            </Label>
            <div className="flex items-center gap-2">
              <Badge
                className={`${BookingsService.getStatusBadgeColor(booking.status)} px-3 py-1.5`}
              >
                {getStatusIcon(booking.status)}
                <span className="ms-1.5">{t(booking.status?.toLowerCase()) || booking.status}</span>
              </Badge>
              <ArrowRight className="h-4 w-4 text-slate-400" />
              {selectedStatus ? (
                <Badge
                  className={`${BookingsService.getStatusBadgeColor(selectedStatus)} px-3 py-1.5`}
                >
                  {getStatusIcon(selectedStatus)}
                  <span className="ms-1.5">{t(selectedStatus?.toLowerCase()) || selectedStatus}</span>
                </Badge>
              ) : (
                <span className="text-sm text-slate-400">
                  {t("selectNew") || "Select new status"}
                </span>
              )}
            </div>
          </div>

          {/* New Status Selection */}
          <div className="space-y-2">
            <Label>{t("newStatus") || "New Status"}</Label>
            {allowedTransitions.length > 0 ? (
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder={t("selectStatus") || "Select status"} />
                </SelectTrigger>
                <SelectContent>
                  {allowedTransitions.map((status) => (
                    <SelectItem key={status} value={status}>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(status)}
                        <span>{t(status?.toLowerCase()) || status}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="bg-slate-50 p-4 rounded-lg text-center">
                <p className="text-sm text-slate-500">
                  {t("noTransitionsAvailable") || "No status transitions available"}
                </p>
              </div>
            )}
          </div>

          {/* Cancellation Reason */}
          {requiresReason && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                {t("cancellationReason") || "Cancellation Reason"}
                <span className="text-rose-500">*</span>
              </Label>
              {loadingReasons ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                </div>
              ) : (
                <Select value={selectedReason} onValueChange={setSelectedReason}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectReason") || "Select reason"} />
                  </SelectTrigger>
                  <SelectContent>
                    {cancellationReasons.map((reason) => (
                      <SelectItem key={reason.id} value={reason.id.toString()}>
                        {reason.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <p className="text-xs text-slate-500">
                {t("reasonRequired") || "A reason is required when cancelling or marking as no-show"}
              </p>
            </div>
          )}

          {/* Warning for destructive actions */}
          {selectedStatus === "cancelled" && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-rose-700 text-sm">
                    {t("warningTitle") || "Warning"}
                  </p>
                  <p className="text-xs text-rose-600 mt-1">
                    {t("cancelWarning") ||
                      "This action cannot be undone. The booking will be permanently cancelled."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-rose-50 border border-rose-200 rounded-lg p-3">
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {tCommon("cancel") || "Cancel"}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !selectedStatus || allowedTransitions.length === 0}
            className={
              selectedStatus === "cancelled"
                ? "bg-rose-600 hover:bg-rose-700"
                : ""
            }
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin me-2" />
                {t("updating") || "Updating..."}
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 me-2" />
                {t("updateStatus") || "Update Status"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
