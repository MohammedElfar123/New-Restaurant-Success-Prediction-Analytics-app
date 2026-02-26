"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  XCircle,
  CheckCircle2,
  Clock,
  Banknote,
  CreditCard,
  Stethoscope,
  Building2,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  Loader2,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import apiClient from "@/lib/api/client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export default function AdminStatisticsPage() {
  const { locale } = useParams();
  const t = useTranslations("dashboard");
  const isRTL = locale === "ar";

  const fallbackData = {
    revenue: { total: 0, today: 0, pending: 0, lost: 0 },
    bookings: { total: 0, completed: 0, pending: 0, confirmed: 0, cancelled: 0, cancellation_rate: 0 },
    revenue_by_type: [],
    top_providers: [],
    payment_methods: [],
  };

  const [loading, setLoading] = useState(true);
  const [apiData, setApiData] = useState(null);

  // Fetch statistics from backend API
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/reports/statistics");
      if (response.data?.status === "success") {
        setApiData(response.data.data);
      } else {
        setApiData(fallbackData);
      }
    } catch (err) {
      console.error("[Statistics] API error:", err);
      setApiData(fallbackData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Transform API data for charts
  const stats = useMemo(() => {
    if (!apiData) return null;

    const { revenue, bookings, revenue_by_type, top_providers, payment_methods } = apiData;

    const typeColors = { Doctor: "#22C55E", Clinic: "#3B82F6", Hospital: "#8B5CF6" };
    const typeLabels = {
      Doctor: isRTL ? "دكتور" : "Doctor",
      Clinic: isRTL ? "عيادة" : "Clinic",
      Hospital: isRTL ? "مستشفى" : "Hospital",
    };

    const methodColors = { cash: "#22C55E", online: "#8B5CF6", card: "#3B82F6" };
    const methodLabels = {
      cash: isRTL ? "كاش" : "Cash",
      online: isRTL ? "أونلاين" : "Online",
      card: isRTL ? "بطاقة" : "Card",
    };

    // Bookings by status for pie chart
    const statusData = [
      { name: isRTL ? "معلق" : "Pending", value: bookings.pending, color: "#F59E0B" },
      { name: isRTL ? "مؤكد" : "Confirmed", value: bookings.confirmed, color: "#3B82F6" },
      { name: isRTL ? "مكتمل" : "Completed", value: bookings.completed, color: "#22C55E" },
      { name: isRTL ? "ملغي" : "Cancelled", value: bookings.cancelled, color: "#EF4444" },
    ];

    // Revenue by type for bar chart — ensure all 3 types present
    const typeMap = {};
    (revenue_by_type || []).forEach((item) => { typeMap[item.type] = item; });
    const revenueByTypeData = ["Doctor", "Clinic", "Hospital"].map((type) => ({
      name: typeLabels[type],
      revenue: typeMap[type]?.revenue || 0,
      bookings: typeMap[type]?.bookings || 0,
      color: typeColors[type],
    }));

    // Payment methods for pie chart
    const paymentData = (payment_methods || [])
      .filter((pm) => pm.count > 0)
      .map((pm) => ({
        name: methodLabels[pm.method] || pm.method,
        value: pm.count,
        color: methodColors[pm.method] || "#94A3B8",
      }));

    return {
      totalRevenue: revenue.total,
      todayRevenue: revenue.today,
      pendingRevenue: revenue.pending,
      lostRevenue: revenue.lost,
      cancellationRate: bookings.cancellation_rate,
      total: bookings.total,
      completedCount: bookings.completed,
      pendingCount: bookings.pending,
      confirmedCount: bookings.confirmed,
      cancelledCount: bookings.cancelled,
      statusData,
      topProviders: top_providers || [],
      paymentData,
      revenueByTypeData,
    };
  }, [apiData, isRTL]);

  const formatCurrency = (amount) => {
    return `${parseFloat(amount).toLocaleString()} QAR`;
  };

  // Custom tooltip for charts
  const CustomBarTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border border-slate-200">
          <p className="text-sm font-semibold text-slate-900">
            {payload[0].payload.name}
          </p>
          <p className="text-sm text-emerald-600">
            {isRTL ? "الإيراد" : "Revenue"}: {formatCurrency(payload[0].value)}
          </p>
          <p className="text-sm text-slate-500">
            {isRTL ? "الحجوزات" : "Bookings"}: {payload[0].payload.bookings}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border border-slate-200">
          <p className="text-sm font-semibold text-slate-900">
            {payload[0].name}
          </p>
          <p className="text-sm" style={{ color: payload[0].payload.color }}>
            {payload[0].value}{" "}
            {isRTL ? "حجز" : payload[0].value === 1 ? "booking" : "bookings"}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <DashboardLayout requiredUserType="admin">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">
              {isRTL ? "جاري تحميل الإحصائيات..." : "Loading statistics..."}
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!stats) {
    return (
      <DashboardLayout requiredUserType="admin">
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-muted-foreground">
            {isRTL ? "لا توجد بيانات" : "No data available"}
          </p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredUserType="admin">
      {/* Page Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {isRTL ? "إحصائيات المنصة" : "Platform Statistics"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {isRTL
                ? "نظرة شاملة على أداء المنصة والإيرادات"
                : "Overview of platform performance and revenue"}
            </p>
          </div>
        </div>
      </div>

      {/* Main Revenue Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Revenue (Earned) */}
        <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-sm hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {isRTL ? "إجمالي الإيرادات" : "Total Revenue"}
                </p>
                <h3 className="text-2xl font-bold text-foreground mb-1">
                  {formatCurrency(stats.totalRevenue)}
                </h3>
                <p className="text-xs text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  {stats.completedCount}{" "}
                  {isRTL ? "حجز مكتمل" : "completed bookings"}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Revenue */}
        <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-sm hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {isRTL ? "إيراد اليوم" : "Today's Revenue"}
                </p>
                <h3 className="text-2xl font-bold text-foreground mb-1">
                  {formatCurrency(stats.todayRevenue)}
                </h3>
                <p className="text-xs text-blue-600 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {isRTL ? "الحجوزات المكتملة اليوم" : "Completed today"}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Bookings */}
        <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-sm hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {isRTL ? "إجمالي الحجوزات" : "Total Bookings"}
                </p>
                <h3 className="text-2xl font-bold text-foreground mb-1">
                  {stats.total}
                </h3>
                <p className="text-xs text-purple-600 flex items-center gap-1">
                  <Activity className="h-3 w-3" />
                  {stats.completedCount} {isRTL ? "مكتمل" : "completed"}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cancellation Rate */}
        <Card className="hover:shadow-lg transition-all duration-300 border-0 shadow-sm hover:-translate-y-1">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {isRTL ? "معدل الإلغاء" : "Cancellation Rate"}
                </p>
                <h3 className="text-2xl font-bold text-foreground mb-1">
                  {stats.cancellationRate}%
                </h3>
                <p className="text-xs text-rose-600 flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  {stats.cancelledCount} {isRTL ? "حجز ملغي" : "cancelled"} /{" "}
                  {stats.total} {isRTL ? "إجمالي" : "total"}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-rose-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Earned */}
        <Card className="border-0 shadow-sm border-s-4 border-s-emerald-500">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {isRTL ? "إيراد مكتسب" : "Earned Revenue"}
                </p>
                <p className="text-lg font-bold text-emerald-600">
                  {formatCurrency(stats.totalRevenue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending */}
        <Card className="border-0 shadow-sm border-s-4 border-s-amber-500">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {isRTL ? "إيراد معلق" : "Pending Revenue"}
                </p>
                <p className="text-lg font-bold text-amber-600">
                  {formatCurrency(stats.pendingRevenue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lost */}
        <Card className="border-0 shadow-sm border-s-4 border-s-rose-500">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-rose-50 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {isRTL ? "إيراد ضائع" : "Lost Revenue"}
                </p>
                <p className="text-lg font-bold text-rose-600">
                  {formatCurrency(stats.lostRevenue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue by Provider Type */}
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg font-semibold">
                {isRTL
                  ? "الإيرادات حسب النوع"
                  : "Revenue by Provider Type"}
              </CardTitle>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {isRTL
                ? "مقارنة الإيرادات بين الدكاترة والعيادات والمستشفيات"
                : "Revenue comparison between doctors, clinics, and hospitals"}
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.revenueByTypeData} barGap={8}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  stroke="#94a3b8"
                  style={{ fontSize: "13px" }}
                />
                <YAxis
                  stroke="#94a3b8"
                  style={{ fontSize: "12px" }}
                  tickFormatter={(v) =>
                    v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v
                  }
                />
                <Tooltip content={<CustomBarTooltip />} />
                <Bar dataKey="revenue" radius={[8, 8, 0, 0]} barSize={60}>
                  {stats.revenueByTypeData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bookings by Status - Pie Chart */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg font-semibold">
                {isRTL ? "الحجوزات حسب الحالة" : "Bookings by Status"}
              </CardTitle>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {stats.total} {isRTL ? "حجز إجمالي" : "total bookings"}
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={stats.statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {stats.statusData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span className="text-xs text-slate-600">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Providers by Revenue */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <CardTitle className="text-lg font-semibold">
                {isRTL
                  ? "أعلى مقدمي الخدمة إيراداً"
                  : "Top Providers by Revenue"}
              </CardTitle>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {isRTL
                ? "بناءً على الحجوزات المكتملة"
                : "Based on completed bookings"}
            </p>
          </CardHeader>
          <CardContent>
            {stats.topProviders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                {isRTL ? "لا توجد بيانات" : "No data available"}
              </p>
            ) : (
              <div className="space-y-3">
                {stats.topProviders.map((provider, index) => (
                  <div
                    key={provider.id}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-all duration-200"
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                        index === 0
                          ? "bg-emerald-500 text-white"
                          : index === 1
                          ? "bg-blue-100 text-blue-700"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      #{index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {provider.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {provider.type === "Doctor" && (
                          <Stethoscope className="h-3 w-3 text-emerald-500" />
                        )}
                        {provider.type === "Clinic" && (
                          <Building2 className="h-3 w-3 text-blue-500" />
                        )}
                        {provider.type === "Hospital" && (
                          <Building2 className="h-3 w-3 text-purple-500" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {provider.type} · {provider.bookings}{" "}
                          {isRTL ? "حجز" : "bookings"}
                        </span>
                      </div>
                    </div>
                    <div className="text-end">
                      <p className="text-sm font-semibold text-emerald-600">
                        {formatCurrency(provider.revenue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Methods & Summary */}
        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-lg font-semibold">
                {isRTL ? "طرق الدفع" : "Payment Methods"}
              </CardTitle>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {isRTL ? "توزيع الحجوزات حسب طريقة الدفع" : "Booking distribution by payment method"}
            </p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={stats.paymentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {stats.paymentData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => (
                    <span className="text-xs text-slate-600">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Summary Table */}
            <div className="mt-4 space-y-2 border-t pt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {isRTL ? "إجمالي الحجوزات" : "Total Bookings"}
                </span>
                <span className="font-semibold">{stats.total}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-emerald-600">
                  {isRTL ? "مكتملة" : "Completed"}
                </span>
                <span className="font-semibold text-emerald-600">
                  {stats.completedCount}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-amber-600">
                  {isRTL ? "معلقة + مؤكدة" : "Pending + Confirmed"}
                </span>
                <span className="font-semibold text-amber-600">
                  {stats.pendingCount + stats.confirmedCount}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-rose-600">
                  {isRTL ? "ملغية" : "Cancelled"}
                </span>
                <span className="font-semibold text-rose-600">
                  {stats.cancelledCount}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
