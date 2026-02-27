"use client";

import { useTranslations, useLocale } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Stethoscope, Star, Calendar, DollarSign, Clock, CheckCircle,
  XCircle, Globe, Edit3, Briefcase, TrendingUp
} from "lucide-react";
import ProviderDoctorsService from "@/lib/services/provider-doctors.service";

export default function ProviderDoctorViewModal({
  open,
  onOpenChange,
  doctor,
  onEdit,
}) {
  const t = useTranslations("providerDoctors");
  const tc = useTranslations("common");
  const locale = useLocale();

  if (!doctor) return null;

  const arTrans = doctor.translations?.find(t => t.locale === "ar") || {};
  const enTrans = doctor.translations?.find(t => t.locale === "en") || {};

  const renderStars = (rating, count) => {
    if (!rating) return <span className="text-slate-400">-</span>;
    const ratingNum = parseFloat(rating);
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${
                i < Math.floor(ratingNum)
                  ? "fill-amber-400 text-amber-400"
                  : "fill-slate-200 text-slate-200"
              }`}
            />
          ))}
        </div>
        <span className="font-semibold">{ratingNum.toFixed(1)}</span>
        <span className="text-slate-500 text-sm">({count || 0} {t("reviews")})</span>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {doctor.image ? (
                <img
                  src={doctor.image}
                  alt={doctor.name}
                  className="w-20 h-20 rounded-xl object-cover"
                />
              ) : (
                <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
                  <Stethoscope className="h-10 w-10 text-white" />
                </div>
              )}
              <div>
                <DialogTitle className="text-xl">{doctor.name}</DialogTitle>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="secondary" className="gap-1.5">
                    {doctor.category?.image && (
                      <img src={doctor.category.image} alt="" className="w-4 h-4 rounded" />
                    )}
                    {doctor.category?.name}
                  </Badge>
                  {doctor.status ? (
                    <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle className="h-3 w-3 me-1" />
                      {tc("active")}
                    </Badge>
                  ) : (
                    <Badge className="bg-rose-50 text-rose-700 border border-rose-200">
                      <XCircle className="h-3 w-3 me-1" />
                      {tc("inactive")}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onEdit?.(doctor);
              }}
              className="gap-2"
            >
              <Edit3 className="h-4 w-4" />
              {tc("edit")}
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 text-slate-500 mb-2">
                <Briefcase className="h-4 w-4" />
                <span className="text-xs">{t("experience")}</span>
              </div>
              <div className="text-xl font-bold text-slate-900">
                {doctor.experience_years}
                <span className="text-sm font-normal text-slate-500 ms-1">{t("years")}</span>
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 text-slate-500 mb-2">
                <Calendar className="h-4 w-4" />
                <span className="text-xs">{t("bookings")}</span>
              </div>
              <div className="text-xl font-bold text-slate-900">{doctor.bookings_count || 0}</div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 text-slate-500 mb-2">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs">{locale === "ar" ? "الإيراد المكتسب" : "Earned Revenue"}</span>
              </div>
              <div className="text-xl font-bold text-primary">
                {parseFloat(doctor.bookings_completed_sum || doctor.bookings_sum_total || 0).toLocaleString()}
              </div>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center gap-1.5 text-slate-500 mb-2">
                <Star className="h-4 w-4" />
                <span className="text-xs">{t("rating")}</span>
              </div>
              <div className="text-xl font-bold text-amber-500">
                {doctor.ratings_avg_rating ? parseFloat(doctor.ratings_avg_rating).toFixed(1) : "-"}
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl p-4">
            <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              {t("consultationPrice")}
            </h4>
            <div className="flex items-center gap-4">
              <div>
                <span className="text-3xl font-bold text-primary">
                  {doctor.price_after_discount}
                </span>
                <span className="text-slate-500 ms-1">{t("currency")}</span>
              </div>
              {parseFloat(doctor.price_before_discount) > parseFloat(doctor.price_after_discount) && (
                <>
                  <span className="text-lg text-slate-400 line-through">
                    {doctor.price_before_discount}
                  </span>
                  <Badge className="bg-rose-500 text-white">
                    -{Math.round(parseFloat(doctor.discount_percentage))}%
                  </Badge>
                </>
              )}
            </div>
          </div>

          {/* Translations */}
          <div className="space-y-4">
            <h4 className="font-semibold text-slate-900 flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-500" />
              {t("translations")}
            </h4>

            {/* Arabic */}
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary" className="h-6">AR</Badge>
                <span className="font-medium">{t("arabic")}</span>
              </div>
              <div className="space-y-2 ps-8">
                <div>
                  <span className="text-xs text-slate-500">{t("name")}</span>
                  <p className="text-slate-900">{arTrans.name || "-"}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">{t("description")}</span>
                  <p className="text-slate-900">{arTrans.short_description || "-"}</p>
                </div>
              </div>
            </div>

            {/* English */}
            <div className="bg-slate-50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary" className="h-6">EN</Badge>
                <span className="font-medium">{t("english")}</span>
              </div>
              <div className="space-y-2 ps-8" dir="ltr">
                <div>
                  <span className="text-xs text-slate-500">Name</span>
                  <p className="text-slate-900">{enTrans.name || "-"}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Description</span>
                  <p className="text-slate-900">{enTrans.short_description || "-"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Schedule */}
          {doctor.schedules && doctor.schedules.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                <Clock className="h-5 w-5 text-cyan-500" />
                {t("workingSchedule")}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {doctor.schedules.map((schedule, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <span className="font-medium text-slate-700">
                      {ProviderDoctorsService.getDayName(schedule.day_of_week || index, locale)}
                    </span>
                    <span className="text-slate-500 text-sm">
                      {(schedule.open_time || "").substring(0, 5)} - {(schedule.close_time || "").substring(0, 5)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="flex items-center justify-between text-sm text-slate-500 pt-4 border-t">
            <span>{t("createdAt")}: {doctor.created_at}</span>
            <span>{t("updatedAt")}: {doctor.updated_at}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
