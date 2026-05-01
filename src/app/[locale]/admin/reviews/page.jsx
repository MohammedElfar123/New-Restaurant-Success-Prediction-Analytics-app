"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Star,
  MessageSquare,
  ThumbsUp,
  TrendingUp,
  Loader2,
  RefreshCw,
  Building2,
  Stethoscope,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import RatingsService from "@/lib/services/ratings.service";
import toast from "react-hot-toast";

export default function ReviewsPage() {
  const tc = useTranslations("common");
  const { locale } = useParams();
  const isRTL = locale === "ar";

  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [reports, setReports] = useState({
    total: 0,
    average_rating: 0,
    breakdown_by_stars: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = { page: currentPage, per_page: 10 };
      if (searchQuery) params.search = searchQuery;
      if (ratingFilter !== "all") params.rating = ratingFilter;
      if (typeFilter !== "all") params.type = typeFilter;

      const result = await RatingsService.getRatings(params);
      if (result.success) {
        setItems(result.data || []);
        setMeta(result.meta);
        setReports(result.reports);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
      toast.error(isRTL ? "تعذر تحميل التقييمات" : "Failed to load reviews");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, ratingFilter, typeFilter, isRTL]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  // Search debounce
  const searchTimerRef = useRef(null);
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      if (currentPage !== 1) setCurrentPage(1);
    }, 500);
    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  const fiveStarCount = reports.breakdown_by_stars?.[5] || 0;
  const fourPlusCount = (reports.breakdown_by_stars?.[4] || 0) + fiveStarCount;
  const satisfactionRate =
    reports.total > 0 ? Math.round((fourPlusCount / reports.total) * 100) : 0;

  const renderStars = (rating) => {
    const r = Number(rating) || 0;
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`h-3.5 w-3.5 ${
              s <= Math.floor(r)
                ? "fill-amber-400 text-amber-400"
                : "text-slate-300"
            }`}
          />
        ))}
        <span className="text-xs text-slate-600 ms-1.5">{r.toFixed(1)}</span>
      </div>
    );
  };

  const formatDate = (iso) => {
    if (!iso) return "-";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(isRTL ? "ar-EG" : "en-GB", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return iso;
    }
  };

  return (
    <DashboardLayout requiredUserType="admin">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {isRTL ? "التقييمات والمراجعات" : "Reviews & Ratings"}
          </h1>
          <p className="text-slate-500 mt-1">
            {isRTL ? "إدارة مراجعات وتعليقات المرضى" : "Manage all patient reviews and feedback"}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchReviews}
          disabled={isLoading}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          {isRTL ? "تحديث" : "Refresh"}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">
                {isRTL ? "إجمالي المراجعات" : "Total Reviews"}
              </CardTitle>
              <div className="h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : reports.total.toLocaleString()}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {isRTL ? "كل تعليقات المرضى" : "All patient feedback"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">
                {isRTL ? "متوسط التقييم" : "Average Rating"}
              </CardTitle>
              <div className="h-10 w-10 bg-amber-50 rounded-lg flex items-center justify-center">
                <Star className="h-5 w-5 text-amber-600 fill-amber-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (reports.average_rating || 0).toFixed(2)}
            </div>
            <p className="text-xs text-slate-500 mt-1">{isRTL ? "من 5 نجوم" : "Out of 5 stars"}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">
                {isRTL ? "تقييمات 5 نجوم" : "5-Star Reviews"}
              </CardTitle>
              <div className="h-10 w-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <ThumbsUp className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : fiveStarCount.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">
                {isRTL ? "نسبة الرضا" : "Satisfaction Rate"}
              </CardTitle>
              <div className="h-10 w-10 bg-green-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : `${satisfactionRate}%`}
            </div>
            <p className="text-xs text-slate-500 mt-1">{isRTL ? "تقييمات 4 نجوم وأكثر" : "4+ star ratings"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card className="border-slate-200">
        <CardContent className="p-0">
          <div className="px-6 py-4 border-b border-slate-200">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <h3 className="font-semibold text-slate-900">
                {isRTL ? "كل المراجعات" : "All Reviews"} ({meta.total})
              </h3>
              <div className="flex items-center gap-3 w-full md:w-auto flex-wrap">
                {/* Type Filter */}
                <div className="flex items-center gap-2">
                  {["all", "provider", "provider_doctor"].map((t) => (
                    <Button
                      key={t}
                      variant={typeFilter === t ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setTypeFilter(t);
                        setCurrentPage(1);
                      }}
                      className="h-9 gap-1"
                    >
                      {t === "all"
                        ? tc("all")
                        : t === "provider"
                        ? isRTL ? "مقدمو الخدمة" : "Providers"
                        : isRTL ? "الأطباء" : "Doctors"}
                    </Button>
                  ))}
                </div>
                {/* Rating Filter */}
                <div className="flex items-center gap-2">
                  {["all", "5", "4", "3", "2", "1"].map((r) => (
                    <Button
                      key={r}
                      variant={ratingFilter === r ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setRatingFilter(r);
                        setCurrentPage(1);
                      }}
                      className="h-9 gap-1"
                    >
                      {r !== "all" && <Star className="w-3 h-3 fill-current" />}
                      {r === "all" ? tc("all") : r}
                    </Button>
                  ))}
                </div>
                <div className="relative flex-1 md:flex-initial">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder={isRTL ? "ابحث في التعليقات..." : "Search comments..."}
                    className="pr-10 w-full md:w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Reviews list */}
          {isLoading ? (
            <div className="text-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400 mx-auto" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20 px-6">
              <div className="mx-auto h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                <MessageSquare className="h-8 w-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                {isRTL ? "لا توجد مراجعات" : "No reviews found"}
              </h3>
              <p className="text-sm text-slate-500">
                {isRTL ? "لا توجد مراجعات تطابق المعايير الحالية" : "No reviews match the current filters"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {items.map((r) => (
                <div key={`${r.entity_type}-${r.id}`} className="px-6 py-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <Badge
                          variant="secondary"
                          className={
                            r.entity_type === "provider"
                              ? "bg-blue-50 text-blue-700 border border-blue-200"
                              : "bg-violet-50 text-violet-700 border border-violet-200"
                          }
                        >
                          {r.entity_type === "provider" ? (
                            <Building2 className="h-3 w-3 me-1" />
                          ) : (
                            <Stethoscope className="h-3 w-3 me-1" />
                          )}
                          {r.entity_type === "provider"
                            ? isRTL ? "مقدم خدمة" : "Provider"
                            : isRTL ? "طبيب" : "Doctor"}
                        </Badge>
                        <span className="font-medium text-slate-900 truncate">{r.entity_name || `#${r.entity_id}`}</span>
                      </div>
                      <p className="text-sm text-slate-700 mb-2 leading-relaxed">
                        {r.comment || (
                          <span className="text-slate-400 italic">
                            {isRTL ? "لا يوجد تعليق" : "No comment"}
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>
                          {isRTL ? "بواسطة" : "by"} <span className="text-slate-700 font-medium">{r.user_name || `#${r.user_id}`}</span>
                        </span>
                        <span>•</span>
                        <span>{formatDate(r.created_at)}</span>
                        {r.booking_id && (
                          <>
                            <span>•</span>
                            <span>
                              {isRTL ? "حجز" : "Booking"} #{r.booking_id}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0">{renderStars(r.rating)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {meta.last_page > 1 && (
            <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
              <p className="text-sm text-slate-600">
                {isRTL
                  ? `عرض ${(meta.current_page - 1) * 10 + 1} إلى ${Math.min(meta.current_page * 10, meta.total)} من ${meta.total}`
                  : `Showing ${(meta.current_page - 1) * 10 + 1} to ${Math.min(meta.current_page * 10, meta.total)} of ${meta.total}`}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={meta.current_page <= 1 || isLoading}
                >
                  {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                  {tc("previous")}
                </Button>
                <Badge variant="outline" className="px-3 py-1">
                  {meta.current_page} / {meta.last_page}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(meta.last_page, p + 1))}
                  disabled={meta.current_page >= meta.last_page || isLoading}
                >
                  {tc("next")}
                  {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
