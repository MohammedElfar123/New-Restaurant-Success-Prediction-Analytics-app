"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import RefundsService from "@/lib/services/refunds.service";
import {
  RefreshCw,
  Loader2,
  Banknote,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  AlertTriangle,
  Inbox,
} from "lucide-react";

/**
 * Admin Refunds queue.
 *
 * Two views, switchable by tab:
 *   - Pending Action: requires_refund events that finance must triage
 *   - All Refunds:    full refund history, filterable by status
 *
 * Three actions, each in its own dialog:
 *   - Create from a pending event (amount + reason)
 *   - Mark Processed once finance pushed it through Sadad portal
 *   - Mark Failed if Sadad rejected it
 *
 * The page is read-mostly and intentionally simple — no charts, no
 * bulk actions, no CSV export in v1. Finance lives in this view a few
 * times a week, not all day. Optimise for clarity over density.
 */
export default function RefundsPage() {
  const t = useTranslations("refunds");
  const locale = useLocale();
  const isRTL = locale === "ar";

  const [activeTab, setActiveTab] = useState("pending"); // "pending" | "all"
  const [statusFilter, setStatusFilter] = useState("");
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog state
  const [createForEvent, setCreateForEvent] = useState(null);
  const [processForRefund, setProcessForRefund] = useState(null);
  const [failForRefund, setFailForRefund] = useState(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const result =
        activeTab === "pending"
          ? await RefundsService.getPendingActions()
          : await RefundsService.getRefunds(
              statusFilter ? { status: statusFilter } : {}
            );

      if (result.success) {
        setItems(result.data || []);
      } else {
        toast.error(result.message || "Failed to load refunds");
        setItems([]);
      }
    } catch (e) {
      toast.error(e?.message || "Network error");
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatQar = (halalas) => {
    if (halalas === null || halalas === undefined) return "—";
    return `${(Number(halalas) / 100).toLocaleString(isRTL ? "ar-QA" : "en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} QAR`;
  };

  const formatDate = (iso) => {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return d.toLocaleString(isRTL ? "ar-QA" : "en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  const StatusBadge = ({ status }) => {
    const config = {
      pending: {
        className: "bg-amber-50 text-amber-700 border border-amber-200",
        icon: Clock,
      },
      sent_to_gateway: {
        className: "bg-blue-50 text-blue-700 border border-blue-200",
        icon: Send,
      },
      success: {
        className: "bg-emerald-50 text-emerald-700 border border-emerald-200",
        icon: CheckCircle2,
      },
      failed: {
        className: "bg-rose-50 text-rose-700 border border-rose-200",
        icon: XCircle,
      },
    };
    const cfg = config[status] || config.pending;
    const Icon = cfg.icon;
    return (
      <Badge className={`gap-1.5 text-xs ${cfg.className}`}>
        <Icon className="w-3 h-3" />
        {t(`status.${status}`)}
      </Badge>
    );
  };

  return (
    <DashboardLayout requiredUserType="admin">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="h-10 w-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Banknote className="h-5 w-5 text-amber-600" />
            </div>
            {t("title")}
          </h1>
          <p className="text-slate-500 mt-1">{t("subtitle")}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 p-0"
          onClick={fetchData}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden mb-4">
        <div className="border-b border-slate-200">
          <div className="flex items-center px-6">
            <button
              onClick={() => setActiveTab("pending")}
              className={`px-4 py-4 text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === "pending"
                  ? "text-primary border-b-2 border-primary"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Inbox className="w-4 h-4" />
              {t("tabs.pendingActions")}
            </button>
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-4 text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === "all"
                  ? "text-primary border-b-2 border-primary"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              {t("tabs.all")}
            </button>

            {/* Status filter is only meaningful for the All tab */}
            {activeTab === "all" && (
              <div className="ms-auto py-3 flex items-center gap-2">
                {["", "pending", "sent_to_gateway", "success", "failed"].map((s) => (
                  <button
                    key={s || "all"}
                    onClick={() => setStatusFilter(s)}
                    className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                      statusFilter === s
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {s ? t(`status.${s}`) : t("filters.all")}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="text-center py-16">
              <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
              <p className="text-slate-500">Loading...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle2 className="h-16 w-16 text-emerald-200 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                {activeTab === "pending"
                  ? t("empty.noPending")
                  : t("empty.noRefunds")}
              </h3>
              <p className="text-slate-500 max-w-md mx-auto">
                {activeTab === "pending"
                  ? t("empty.noPendingDesc")
                  : t("empty.noRefundsDesc")}
              </p>
            </div>
          ) : activeTab === "pending" ? (
            <PendingTable
              items={items}
              t={t}
              formatQar={formatQar}
              formatDate={formatDate}
              onCreate={(event) => setCreateForEvent(event)}
            />
          ) : (
            <AllRefundsTable
              items={items}
              t={t}
              formatQar={formatQar}
              formatDate={formatDate}
              StatusBadge={StatusBadge}
              onMarkProcessed={(refund) => setProcessForRefund(refund)}
              onMarkFailed={(refund) => setFailForRefund(refund)}
            />
          )}
        </div>
      </div>

      {/* Dialogs */}
      <CreateRefundDialog
        event={createForEvent}
        onClose={() => setCreateForEvent(null)}
        onCreated={() => {
          setCreateForEvent(null);
          fetchData();
        }}
        t={t}
      />
      <MarkProcessedDialog
        refund={processForRefund}
        onClose={() => setProcessForRefund(null)}
        onProcessed={() => {
          setProcessForRefund(null);
          fetchData();
        }}
        t={t}
      />
      <MarkFailedDialog
        refund={failForRefund}
        onClose={() => setFailForRefund(null)}
        onFailed={() => {
          setFailForRefund(null);
          fetchData();
        }}
        t={t}
      />
    </DashboardLayout>
  );
}

// ---------- subcomponents kept inline; the page is the only consumer

function PendingTable({ items, t, formatQar, formatDate, onCreate }) {
  return (
    <table className="w-full">
      <thead className="bg-slate-50/80 border-b border-slate-200">
        <tr>
          <th className="text-start px-6 py-3 text-xs font-semibold text-slate-600 uppercase">
            {t("table.transactionId")}
          </th>
          <th className="text-start px-4 py-3 text-xs font-semibold text-slate-600 uppercase">
            {t("table.amount")}
          </th>
          <th className="text-start px-4 py-3 text-xs font-semibold text-slate-600 uppercase">
            {t("table.occurredAt")}
          </th>
          <th className="text-end px-6 py-3 text-xs font-semibold text-slate-600 uppercase">
            {t("table.actions")}
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {items.map((event) => (
          <tr key={event.id} className="hover:bg-slate-50/40">
            <td className="px-6 py-3.5 text-sm font-medium text-slate-900">
              #{event.payment_transaction_id}
            </td>
            <td className="px-4 py-3.5 text-sm text-slate-700">
              {formatQar(event.transaction?.amount_halalas)}
            </td>
            <td className="px-4 py-3.5 text-sm text-slate-600">
              {formatDate(event.occurred_at)}
            </td>
            <td className="px-6 py-3.5 text-end">
              <Button
                size="sm"
                onClick={() => onCreate(event)}
                className="gap-1.5"
              >
                <Banknote className="w-3.5 h-3.5" />
                {t("actions.startRefund")}
              </Button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function AllRefundsTable({
  items,
  t,
  formatQar,
  formatDate,
  StatusBadge,
  onMarkProcessed,
  onMarkFailed,
}) {
  return (
    <table className="w-full">
      <thead className="bg-slate-50/80 border-b border-slate-200">
        <tr>
          <th className="text-start px-6 py-3 text-xs font-semibold text-slate-600 uppercase">
            {t("table.transactionId")}
          </th>
          <th className="text-start px-4 py-3 text-xs font-semibold text-slate-600 uppercase">
            {t("table.amount")}
          </th>
          <th className="text-start px-4 py-3 text-xs font-semibold text-slate-600 uppercase">
            {t("table.status")}
          </th>
          <th className="text-start px-4 py-3 text-xs font-semibold text-slate-600 uppercase">
            {t("table.gatewayRef")}
          </th>
          <th className="text-start px-4 py-3 text-xs font-semibold text-slate-600 uppercase">
            {t("table.createdAt")}
          </th>
          <th className="text-end px-6 py-3 text-xs font-semibold text-slate-600 uppercase">
            {t("table.actions")}
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {items.map((refund) => {
          const isOpen =
            refund.status === "pending" || refund.status === "sent_to_gateway";
          return (
            <tr key={refund.id} className="hover:bg-slate-50/40">
              <td className="px-6 py-3.5 text-sm font-medium text-slate-900">
                #{refund.payment_transaction_id}
              </td>
              <td className="px-4 py-3.5 text-sm text-slate-700">
                {formatQar(refund.amount_halalas)}
              </td>
              <td className="px-4 py-3.5">
                <StatusBadge status={refund.status} />
              </td>
              <td className="px-4 py-3.5 text-sm text-slate-600 font-mono">
                {refund.gateway_refund_ref || "—"}
              </td>
              <td className="px-4 py-3.5 text-sm text-slate-600">
                {formatDate(refund.created_at)}
              </td>
              <td className="px-6 py-3.5 text-end">
                {isOpen ? (
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onMarkProcessed(refund)}
                      className="gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      {t("actions.markProcessed")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onMarkFailed(refund)}
                      className="gap-1.5"
                    >
                      <XCircle className="w-3.5 h-3.5 text-rose-600" />
                      {t("actions.markFailed")}
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">
                    {refund.refunded_at && `✓ ${formatDate(refund.refunded_at)}`}
                  </span>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function CreateRefundDialog({ event, onClose, onCreated, t }) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (event) {
      const original = event.transaction?.amount_halalas;
      setAmount(original ? (original / 100).toFixed(2) : "");
      setReason("");
    }
  }, [event]);

  const open = !!event;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!event || !reason.trim() || !amount) return;
    setSubmitting(true);
    try {
      const halalas = Math.round(parseFloat(amount) * 100);
      const result = await RefundsService.createRefund({
        payment_transaction_id: event.payment_transaction_id,
        amount_halalas: halalas,
        reason: reason.trim(),
      });
      if (result.success) {
        toast.success(t("toasts.createSuccess"));
        onCreated();
      } else {
        toast.error(result.message || t("toasts.createError"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("createDialog.title")}</DialogTitle>
          <DialogDescription>{t("createDialog.subtitle")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-slate-50 rounded-lg p-3 text-sm">
            <div className="text-slate-500">{t("createDialog.transactionLabel")}</div>
            <div className="font-mono font-semibold text-slate-900">
              #{event?.payment_transaction_id}
            </div>
            {event?.transaction && (
              <div className="text-xs text-slate-500 mt-1">
                {t("createDialog.originalAmount")}{" "}
                <span className="font-semibold text-slate-700">
                  {(event.transaction.amount_halalas / 100).toFixed(2)} QAR
                </span>
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="amount">{t("createDialog.amountLabel")}</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              disabled={submitting}
            />
            <p className="text-xs text-slate-500 mt-1">{t("createDialog.amountHint")}</p>
          </div>
          <div>
            <Label htmlFor="reason">{t("createDialog.reasonLabel")}</Label>
            <Textarea
              id="reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("createDialog.reasonPlaceholder")}
              required
              disabled={submitting}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              {t("createDialog.cancel")}
            </Button>
            <Button type="submit" disabled={submitting || !reason.trim() || !amount}>
              {submitting && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
              {t("createDialog.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MarkProcessedDialog({ refund, onClose, onProcessed, t }) {
  const [ref, setRef] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (refund) setRef("");
  }, [refund]);

  const open = !!refund;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!refund || !ref.trim()) return;
    setSubmitting(true);
    try {
      const result = await RefundsService.markProcessed(refund.id, {
        gateway_refund_ref: ref.trim(),
      });
      if (result.success) {
        toast.success(t("toasts.processedSuccess"));
        onProcessed();
      } else {
        toast.error(result.message || t("toasts.processedError"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("processedDialog.title")}</DialogTitle>
          <DialogDescription>{t("processedDialog.subtitle")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="ref">{t("processedDialog.refLabel")}</Label>
            <Input
              id="ref"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
              placeholder={t("processedDialog.refPlaceholder")}
              required
              disabled={submitting}
            />
            <p className="text-xs text-slate-500 mt-1">{t("processedDialog.refHint")}</p>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              {t("processedDialog.cancel")}
            </Button>
            <Button type="submit" disabled={submitting || !ref.trim()}>
              {submitting && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
              {t("processedDialog.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MarkFailedDialog({ refund, onClose, onFailed, t }) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (refund) setReason("");
  }, [refund]);

  const open = !!refund;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!refund || !reason.trim()) return;
    setSubmitting(true);
    try {
      const result = await RefundsService.markFailed(refund.id, {
        failure_reason: reason.trim(),
      });
      if (result.success) {
        toast.success(t("toasts.failedSuccess"));
        onFailed();
      } else {
        toast.error(result.message || t("toasts.failedError"));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            {t("failedDialog.title")}
          </DialogTitle>
          <DialogDescription>{t("failedDialog.subtitle")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="failure-reason">{t("failedDialog.reasonLabel")}</Label>
            <Textarea
              id="failure-reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("failedDialog.reasonPlaceholder")}
              required
              disabled={submitting}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={submitting}
            >
              {t("failedDialog.cancel")}
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={submitting || !reason.trim()}
            >
              {submitting && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
              {t("failedDialog.submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
