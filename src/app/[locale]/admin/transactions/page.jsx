"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import TransactionsService from "@/lib/services/transactions.service";
import {
  RefreshCw,
  Loader2,
  CreditCard,
  Clock,
  CheckCircle2,
  XCircle,
  Send,
  AlertCircle,
  Eye,
  Search,
  Calendar,
  Receipt,
  TrendingUp,
} from "lucide-react";

/**
 * Admin Sadad Transactions Viewer.
 *
 * Read-only surface. Two pieces:
 *   1. Reconciliation widget at the top — pick a date, see totals by
 *      status. This is what finance compares against Sadad's daily
 *      report.
 *   2. Filterable list below — search, status filter, date range.
 *      Each row opens a detail modal with the full event log.
 *
 * No writes. Refunds happen on the dedicated /admin/refunds page.
 */
export default function TransactionsPage() {
  const t = useTranslations("transactions");
  const locale = useLocale();
  const isRTL = locale === "ar";

  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter state
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Detail modal
  const [selectedTxId, setSelectedTxId] = useState(null);

  // Reconciliation widget
  const [reconDate, setReconDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [reconData, setReconData] = useState(null);
  const [reconLoading, setReconLoading] = useState(false);

  const fetchList = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;

      const result = await TransactionsService.list(params);
      if (result.success) setItems(result.data || []);
      else {
        toast.error(result.message || "Failed");
        setItems([]);
      }
    } catch (e) {
      toast.error(e?.message || "Network error");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, search, fromDate, toDate]);

  const fetchReconciliation = useCallback(async () => {
    if (!reconDate) return;
    setReconLoading(true);
    try {
      const result = await TransactionsService.reconciliation(reconDate);
      if (result.success) setReconData(result.data);
      else setReconData(null);
    } finally {
      setReconLoading(false);
    }
  }, [reconDate]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    fetchReconciliation();
  }, [fetchReconciliation]);

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
      return new Date(iso).toLocaleString(isRTL ? "ar-QA" : "en-US", {
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
    const cfg = {
      initiated: { className: "bg-slate-50 text-slate-700 border-slate-200", icon: Clock },
      sent_to_gateway: { className: "bg-blue-50 text-blue-700 border-blue-200", icon: Send },
      success: { className: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
      failed: { className: "bg-rose-50 text-rose-700 border-rose-200", icon: XCircle },
      expired: { className: "bg-amber-50 text-amber-700 border-amber-200", icon: AlertCircle },
      cancelled: { className: "bg-slate-50 text-slate-500 border-slate-200", icon: XCircle },
    }[status] || { className: "bg-slate-50 text-slate-500 border-slate-200", icon: Clock };
    const Icon = cfg.icon;
    return (
      <Badge className={`gap-1 text-xs border ${cfg.className}`}>
        <Icon className="w-3 h-3" />
        {t(`status.${status}`)}
      </Badge>
    );
  };

  const resetFilters = () => {
    setStatusFilter("");
    setSearch("");
    setFromDate("");
    setToDate("");
  };

  return (
    <DashboardLayout requiredUserType="admin">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
            <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-blue-600" />
            </div>
            {t("title")}
          </h1>
          <p className="text-slate-500 mt-1">{t("subtitle")}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 p-0"
          onClick={fetchList}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Reconciliation widget */}
      <Card className="border-slate-200 mb-6">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                {t("reconciliation.title")}
              </CardTitle>
              <p className="text-sm text-slate-500 mt-1">{t("reconciliation.subtitle")}</p>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="recon-date" className="text-xs text-slate-500">
                {t("reconciliation.selectDate")}
              </Label>
              <Input
                id="recon-date"
                type="date"
                value={reconDate}
                onChange={(e) => setReconDate(e.target.value)}
                className="w-44 h-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {reconLoading ? (
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t("reconciliation.loading")}
            </div>
          ) : !reconData ? (
            <p className="text-sm text-slate-400">{t("reconciliation.noData")}</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs text-slate-500">{t("reconciliation.totalCount")}</div>
                <div className="text-2xl font-bold text-slate-900 mt-1">
                  {reconData.grand_total?.count ?? 0}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  {formatQar(reconData.grand_total?.total_halalas ?? 0)}
                </div>
              </div>
              {Object.entries(reconData.by_status || {}).map(([status, data]) => (
                <div key={status} className="bg-slate-50 rounded-lg p-3">
                  <div className="text-xs text-slate-500">{t(`status.${status}`)}</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">{data.count}</div>
                  <div className="text-xs text-slate-500 mt-1">
                    {formatQar(data.total_halalas)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="border-slate-200 mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <div className="md:col-span-2">
              <Label className="text-xs text-slate-500 mb-1.5">{t("filters.search")}</Label>
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  className="ps-10 h-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="P12345678"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs text-slate-500 mb-1.5">{t("filters.fromDate")}</Label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-9"
              />
            </div>
            <div>
              <Label className="text-xs text-slate-500 mb-1.5">{t("filters.toDate")}</Label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-9"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={fetchList} className="h-9 flex-1">
                {t("filters.apply")}
              </Button>
              <Button variant="outline" onClick={resetFilters} className="h-9">
                {t("filters.reset")}
              </Button>
            </div>
          </div>

          {/* Status chips */}
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
            {["", "success", "failed", "expired", "cancelled", "initiated", "sent_to_gateway"].map((s) => (
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
        </CardContent>
      </Card>

      {/* List */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="text-center py-16">
              <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
              <p className="text-slate-500">Loading...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16">
              <Receipt className="h-16 w-16 text-slate-200 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">
                {t("empty.noTransactions")}
              </h3>
              <p className="text-slate-500">{t("empty.noTransactionsDesc")}</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="text-start px-6 py-3 text-xs font-semibold text-slate-600 uppercase">
                    {t("table.id")}
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-semibold text-slate-600 uppercase">
                    {t("table.orderRef")}
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-semibold text-slate-600 uppercase">
                    {t("table.amount")}
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-semibold text-slate-600 uppercase">
                    {t("table.status")}
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-semibold text-slate-600 uppercase">
                    {t("table.method")}
                  </th>
                  <th className="text-start px-4 py-3 text-xs font-semibold text-slate-600 uppercase">
                    {t("table.initiatedAt")}
                  </th>
                  <th className="text-end px-6 py-3 text-xs font-semibold text-slate-600 uppercase">
                    {t("table.actions")}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/40">
                    <td className="px-6 py-3.5 text-sm font-medium text-slate-900">#{tx.id}</td>
                    <td className="px-4 py-3.5 text-sm font-mono text-slate-700">
                      {tx.gateway_order_id || "—"}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-700 font-semibold">
                      {formatQar(tx.amount_halalas)}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={tx.status} />
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">
                      {tx.gateway_payment_method || "—"}
                    </td>
                    <td className="px-4 py-3.5 text-sm text-slate-600">
                      {formatDate(tx.initiated_at)}
                    </td>
                    <td className="px-6 py-3.5 text-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedTxId(tx.id)}
                        className="gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {t("actions.view")}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Detail modal */}
      <TransactionDetailModal
        txId={selectedTxId}
        onClose={() => setSelectedTxId(null)}
        t={t}
        formatQar={formatQar}
        formatDate={formatDate}
        StatusBadge={StatusBadge}
      />
    </DashboardLayout>
  );
}

function TransactionDetailModal({ txId, onClose, t, formatQar, formatDate, StatusBadge }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!txId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const result = await TransactionsService.show(txId);
      if (!cancelled) {
        setData(result.success ? result.data : null);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [txId]);

  const open = !!txId;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && (setData(null), onClose())}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("detail.title")}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          </div>
        ) : !data ? (
          <p className="text-sm text-slate-400 py-8 text-center">—</p>
        ) : (
          <div className="space-y-5">
            {/* Transaction */}
            <DetailSection title={t("detail.section.transaction")}>
              <DetailRow label={t("detail.fields.gateway")} value={data.transaction?.gateway} mono />
              <DetailRow label={t("detail.fields.orderRef")} value={data.transaction?.gateway_order_id} mono />
              <DetailRow label={t("detail.fields.txRef")} value={data.transaction?.gateway_transaction_ref} mono />
              <DetailRow label={t("detail.fields.method")} value={data.transaction?.gateway_payment_method} />
              <DetailRow label={t("detail.fields.amount")} value={formatQar(data.transaction?.amount_halalas)} />
              <DetailRow label={t("detail.fields.currency")} value={data.transaction?.currency} />
              <DetailRow label={t("detail.fields.status")} value={<StatusBadge status={data.transaction?.status} />} raw />
              <DetailRow label={t("detail.fields.initiatedAt")} value={formatDate(data.transaction?.initiated_at)} />
              <DetailRow label={t("detail.fields.completedAt")} value={formatDate(data.transaction?.completed_at)} />
              <DetailRow label={t("detail.fields.expiresAt")} value={formatDate(data.transaction?.expires_at)} />
              <DetailRow label={t("detail.fields.idempotencyKey")} value={data.transaction?.idempotency_key} mono />
              {data.transaction?.failure_reason && (
                <DetailRow label={t("detail.fields.failureReason")} value={data.transaction.failure_reason} />
              )}
            </DetailSection>

            {/* Booking */}
            <DetailSection title={t("detail.section.booking")}>
              {data.booking ? (
                <>
                  <DetailRow label={t("detail.fields.bookingNumber")} value={data.booking.invoice_number} mono />
                  <DetailRow label={t("detail.fields.bookingDate")} value={data.booking.date} />
                  <DetailRow label={t("detail.fields.bookingTime")} value={data.booking.time} />
                  <DetailRow label={t("detail.fields.bookingStatus")} value={data.booking.status} />
                  <DetailRow label={t("detail.fields.paymentStatus")} value={data.booking.payment_status} />
                  {data.booking.user && (
                    <>
                      <DetailRow label={t("detail.fields.patient")} value={data.booking.user.name} />
                      <DetailRow label={t("detail.fields.phone")} value={data.booking.user.phone} mono />
                      <DetailRow label={t("detail.fields.email")} value={data.booking.user.email} />
                    </>
                  )}
                </>
              ) : (
                <p className="text-sm text-slate-400">{t("detail.noBooking")}</p>
              )}
            </DetailSection>

            {/* Events */}
            <DetailSection title={t("detail.section.events")}>
              {data.events?.length ? (
                <div className="space-y-2">
                  {data.events.map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 text-sm border-s-2 border-primary/30 ps-3 py-1"
                    >
                      <div className="flex-1">
                        <div className="font-medium text-slate-900">{event.event_type}</div>
                        <div className="text-xs text-slate-500">
                          {formatDate(event.occurred_at)} · {event.source}
                          {event.actor && ` · ${event.actor}`}
                        </div>
                        {event.payload && Object.keys(event.payload).length > 0 && (
                          <pre className="text-xs bg-slate-50 rounded p-2 mt-1 overflow-x-auto">
                            {JSON.stringify(event.payload, null, 2)}
                          </pre>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-400">{t("detail.noEvents")}</p>
              )}
            </DetailSection>

            <div className="pt-2 flex justify-end">
              <Button variant="outline" onClick={onClose}>
                {t("detail.close")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function DetailSection({ title, children }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-slate-500 uppercase mb-2">{title}</h3>
      <div className="bg-slate-50/50 rounded-lg p-3 space-y-1.5">{children}</div>
    </div>
  );
}

function DetailRow({ label, value, mono = false, raw = false }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="grid grid-cols-3 gap-2 text-sm">
      <div className="text-slate-500">{label}</div>
      <div className={`col-span-2 ${mono ? "font-mono text-xs" : ""} text-slate-800 break-all`}>
        {raw ? value : <span>{value}</span>}
      </div>
    </div>
  );
}
