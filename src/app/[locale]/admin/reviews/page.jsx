"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Star,
  MessageSquare,
  ThumbsUp,
  TrendingUp,
  AlertCircle,
} from "lucide-react";

// TODO(backend): there is no admin-level "all reviews" endpoint yet.
// The backend currently exposes only per-provider/per-doctor public ratings:
//   GET /api/v1/providers/{providerId}/ratings
//   GET /api/v1/providers/doctors/{providerDoctorId}/ratings
// We need a new admin endpoint that aggregates ratings across the platform with
// search/filter/pagination + reports, e.g.:
//   GET /api/v1/dashboard/ratings?type=provider|provider_doctor&rating=5&search=...
// Returning { items, meta, reports: { total, average_rating, breakdown_by_stars } }.
// Once that is in place, wire this page to a new ratings.service.js the same way
// hospitals/doctors pages use ProvidersService / ProviderDoctorsService.

export default function ReviewsPage() {
  const tc = useTranslations("common");
  const { locale } = useParams();
  const isRTL = locale === "ar";

  const [searchQuery, setSearchQuery] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");

  // Empty placeholder state until backend endpoint exists.
  const reviews = [];
  const totalReviews = 0;
  const avgRating = "0.0";
  const fiveStarReviews = 0;
  const satisfactionRate = 0;

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
            <div className="text-3xl font-bold text-slate-900">{totalReviews.toLocaleString()}</div>
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
            <div className="text-3xl font-bold text-slate-900">{avgRating}</div>
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
            <div className="text-3xl font-bold text-slate-900">{fiveStarReviews.toLocaleString()}</div>
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
            <div className="text-3xl font-bold text-slate-900">{satisfactionRate}%</div>
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
                {isRTL ? "كل المراجعات" : "All Reviews"} ({reviews.length})
              </h3>
              <div className="flex items-center gap-3 w-full md:w-auto">
                {/* Rating Filter */}
                <div className="flex items-center gap-2">
                  {["all", "5", "4", "3"].map((r) => (
                    <Button
                      key={r}
                      variant={ratingFilter === r ? "default" : "outline"}
                      size="sm"
                      onClick={() => setRatingFilter(r)}
                      className="h-9 gap-1"
                    >
                      {r !== "all" && <Star className="w-3 h-3 fill-current" />}
                      {r === "all" ? tc("all") : r === "3" ? "≤3" : r}
                    </Button>
                  ))}
                </div>
                <div className="relative flex-1 md:flex-initial">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder={isRTL ? "ابحث..." : "Search..."}
                    className="pr-10 w-full md:w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Empty / pending-backend state */}
          <div className="text-center py-20 px-6">
            <div className="mx-auto h-16 w-16 bg-amber-50 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              {isRTL ? "في انتظار الواجهة الخلفية" : "Pending backend endpoint"}
            </h3>
            <p className="text-sm text-slate-500 max-w-md mx-auto">
              {isRTL
                ? "لا تتوفر حالياً واجهة برمجية لعرض كل التقييمات على مستوى المنصة. يجب إضافة نقطة وصول إدارية تجمع تقييمات المزودين والأطباء قبل ربط هذه الصفحة."
                : "There is no admin endpoint yet to list ratings across the entire platform. A new endpoint aggregating provider + provider-doctor ratings needs to be added before this page can be wired up."}
            </p>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
