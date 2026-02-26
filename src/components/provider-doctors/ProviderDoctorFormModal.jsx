"use client";

import { useState, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Stethoscope, Upload, X, Loader2, DollarSign, Clock, Globe,
  Image as ImageIcon, User, Briefcase
} from "lucide-react";
import toast from "react-hot-toast";
import ProviderDoctorsService from "@/lib/services/provider-doctors.service";

export default function ProviderDoctorFormModal({
  open,
  onOpenChange,
  doctor = null,
  providerId,
  onSuccess,
}) {
  const t = useTranslations("providerDoctors");
  const tc = useTranslations("common");
  const locale = useLocale();
  const isEdit = !!doctor;

  // Form state
  const [formData, setFormData] = useState({
    provider_id: providerId,
    category_id: "",
    is_active: true,
    experience_years: 1,
    price_before_discount: "",
    price_after_discount: "",
    discount_percentage: 0,
    ar_name: "",
    ar_short_description: "",
    en_name: "",
    en_short_description: "",
    schedules: ProviderDoctorsService.getDefaultSchedule(),
    image: null,
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      const result = await ProviderDoctorsService.getCategoriesDropdown();
      if (result.success) {
        setCategories(result.data);
      }
    };
    fetchCategories();
  }, []);

  // Populate form for edit
  useEffect(() => {
    if (isEdit && doctor) {
      const arTrans = doctor.translations?.find(t => t.locale === "ar") || {};
      const enTrans = doctor.translations?.find(t => t.locale === "en") || {};

      setFormData({
        provider_id: doctor.provider?.id || providerId,
        category_id: doctor.category?.id?.toString() || "",
        is_active: doctor.status,
        experience_years: doctor.experience_years || 1,
        price_before_discount: doctor.price_before_discount || "",
        price_after_discount: doctor.price_after_discount || "",
        discount_percentage: doctor.discount_percentage || 0,
        ar_name: arTrans.name || "",
        ar_short_description: arTrans.short_description || "",
        en_name: enTrans.name || "",
        en_short_description: enTrans.short_description || "",
        schedules: (() => {
          const apiSchedules = doctor.schedules || [];
          const workingDays = new Set(apiSchedules.map(s => s.day_of_week));
          return Array.from({ length: 7 }, (_, i) => {
            const existing = apiSchedules.find(s => s.day_of_week === i);
            return {
              day_of_week: i,
              open_time: existing ? (existing.open_time || "08:00").substring(0, 5) : "08:00",
              close_time: existing ? (existing.close_time || "17:00").substring(0, 5) : "17:00",
              is_working: workingDays.has(i),
            };
          });
        })(),
        image: null,
      });
      setImagePreview(doctor.image);
    } else {
      // Reset form for new doctor
      setFormData({
        provider_id: providerId,
        category_id: "",
        is_active: true,
        experience_years: 1,
        price_before_discount: "",
        price_after_discount: "",
        discount_percentage: 0,
        ar_name: "",
        ar_short_description: "",
        en_name: "",
        en_short_description: "",
        schedules: ProviderDoctorsService.getDefaultSchedule(),
        image: null,
      });
      setImagePreview(null);
    }
  }, [doctor, isEdit, providerId]);

  // Handle input change
  const handleChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };

      // Auto calculate discount percentage
      if (field === "price_before_discount" || field === "price_after_discount") {
        const before = parseFloat(field === "price_before_discount" ? value : prev.price_before_discount) || 0;
        const after = parseFloat(field === "price_after_discount" ? value : prev.price_after_discount) || 0;
        if (before > 0 && after > 0 && before >= after) {
          newData.discount_percentage = (((before - after) / before) * 100).toFixed(2);
        }
      }

      return newData;
    });
  };

  // Handle schedule change
  const handleScheduleChange = (dayIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      schedules: prev.schedules.map((s, i) =>
        i === dayIndex ? { ...s, [field]: value } : s
      ),
    }));
  };

  // Handle image change
  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, image: file }));
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // Remove image
  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: null }));
    setImagePreview(isEdit ? doctor?.image : null);
  };

  // Handle submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.category_id) {
      toast.error(t("categoryRequired"));
      return;
    }
    if (!formData.ar_name || !formData.en_name) {
      toast.error(t("nameRequired"));
      return;
    }
    if (!formData.price_before_discount || !formData.price_after_discount) {
      toast.error(t("priceRequired"));
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading(isEdit ? t("updating") : t("creating"));

    try {
      const submitData = ProviderDoctorsService.buildFormData(formData);

      const result = isEdit
        ? await ProviderDoctorsService.updateProviderDoctor(doctor.id, submitData)
        : await ProviderDoctorsService.createProviderDoctor(submitData);

      toast.dismiss(loadingToast);

      if (result.success) {
        toast.success(result.message);
        onSuccess?.();
        onOpenChange(false);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error(t("submitError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = [
    { id: "basic", label: t("basicInfo"), icon: User },
    { id: "translations", label: t("translations"), icon: Globe },
    { id: "pricing", label: t("pricing"), icon: DollarSign },
    { id: "schedule", label: t("schedule"), icon: Clock },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4 border-b">
          <DialogTitle className="flex items-center gap-3">
            <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Stethoscope className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span>{isEdit ? t("editDoctor") : t("addDoctor")}</span>
              {isEdit && (
                <p className="text-sm font-normal text-slate-500 mt-0.5">
                  {doctor?.name}
                </p>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Tabs Navigation */}
        <div className="flex-shrink-0 flex gap-1 p-1 bg-slate-100 rounded-xl mt-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-white text-primary shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto py-4 space-y-6">
          {/* Basic Info Tab */}
          {activeTab === "basic" && (
            <div className="space-y-6">
              {/* Image Upload */}
              <div className="flex items-start gap-4">
                <div className="relative">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-24 h-24 rounded-xl object-cover"
                      />
                      <button
                        type="button"
                        onClick={removeImage}
                        className="absolute -top-2 -end-2 bg-rose-500 text-white p-1 rounded-full hover:bg-rose-600 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-24 h-24 bg-slate-100 rounded-xl cursor-pointer hover:bg-slate-200 transition-colors">
                      <ImageIcon className="h-8 w-8 text-slate-400 mb-1" />
                      <span className="text-xs text-slate-500">{t("uploadImage")}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <div className="flex-1 space-y-4">
                  {/* Category */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">{t("specialty")} *</Label>
                    <Select
                      value={formData.category_id}
                      onValueChange={(value) => handleChange("category_id", value)}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder={t("selectSpecialty")} />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            <div className="flex items-center gap-2">
                              {cat.image && (
                                <img src={cat.image} alt="" className="w-5 h-5 rounded" />
                              )}
                              {cat.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Experience Years */}
                  <div>
                    <Label className="text-sm font-medium mb-2 block">{t("experienceYears")}</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.experience_years}
                      onChange={(e) => handleChange("experience_years", parseInt(e.target.value) || 0)}
                      className="h-11"
                    />
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <Label className="text-sm font-medium">{t("activeStatus")}</Label>
                  <p className="text-xs text-slate-500 mt-0.5">{t("activeStatusDesc")}</p>
                </div>
                <Switch
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleChange("is_active", checked)}
                />
              </div>
            </div>
          )}

          {/* Translations Tab */}
          {activeTab === "translations" && (
            <div className="space-y-6">
              {/* Arabic */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="h-6">AR</Badge>
                  <span className="font-medium text-slate-900">{t("arabic")}</span>
                </div>
                <div className="space-y-3 ps-8">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">{t("name")} *</Label>
                    <Input
                      value={formData.ar_name}
                      onChange={(e) => handleChange("ar_name", e.target.value)}
                      placeholder={t("arabicNamePlaceholder")}
                      className="h-11"
                      dir="rtl"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2 block">{t("shortDescription")}</Label>
                    <Textarea
                      value={formData.ar_short_description}
                      onChange={(e) => handleChange("ar_short_description", e.target.value)}
                      placeholder={t("arabicDescPlaceholder")}
                      rows={3}
                      dir="rtl"
                    />
                  </div>
                </div>
              </div>

              {/* English */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="h-6">EN</Badge>
                  <span className="font-medium text-slate-900">{t("english")}</span>
                </div>
                <div className="space-y-3 ps-8" dir="ltr">
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Name *</Label>
                    <Input
                      value={formData.en_name}
                      onChange={(e) => handleChange("en_name", e.target.value)}
                      placeholder="Dr. Ahmed Ali"
                      className="h-11"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium mb-2 block">Short Description</Label>
                    <Textarea
                      value={formData.en_short_description}
                      onChange={(e) => handleChange("en_short_description", e.target.value)}
                      placeholder="Specialized doctor providing medical consultations..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Pricing Tab */}
          {activeTab === "pricing" && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium mb-2 block">{t("priceBeforeDiscount")} *</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price_before_discount}
                      onChange={(e) => handleChange("price_before_discount", e.target.value)}
                      className="h-11 ps-10"
                      placeholder="200"
                    />
                    <DollarSign className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium mb-2 block">{t("priceAfterDiscount")} *</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price_after_discount}
                      onChange={(e) => handleChange("price_after_discount", e.target.value)}
                      className="h-11 ps-10"
                      placeholder="150"
                    />
                    <DollarSign className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Discount Preview */}
              {parseFloat(formData.discount_percentage) > 0 && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-rose-700">{t("discountPercentage")}</span>
                    <Badge className="bg-rose-500 text-white">
                      {parseFloat(formData.discount_percentage).toFixed(0)}% {t("off")}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Schedule Tab */}
          {activeTab === "schedule" && (
            <div className="space-y-3">
              <p className="text-sm text-slate-500 mb-4">{t("scheduleDesc")}</p>
              {formData.schedules.map((schedule, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${
                    schedule.is_working !== false
                      ? "bg-white border-slate-200"
                      : "bg-slate-50 border-slate-100"
                  }`}
                >
                  <Switch
                    checked={schedule.is_working !== false}
                    onCheckedChange={(checked) => handleScheduleChange(index, "is_working", checked)}
                  />
                  <span className={`w-20 text-sm font-medium flex-shrink-0 ${
                    schedule.is_working !== false ? "text-slate-900" : "text-slate-400"
                  }`}>
                    {ProviderDoctorsService.getDayName(index, locale)}
                  </span>
                  {schedule.is_working !== false ? (
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs text-slate-500 mb-1 block">{t("openTime")}</Label>
                        <Input
                          type="time"
                          value={schedule.open_time}
                          onChange={(e) => handleScheduleChange(index, "open_time", e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div>
                        <Label className="text-xs text-slate-500 mb-1 block">{t("closeTime")}</Label>
                        <Input
                          type="time"
                          value={schedule.close_time}
                          onChange={(e) => handleScheduleChange(index, "close_time", e.target.value)}
                          className="h-9"
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400 flex-1">
                      {locale === "ar" ? "يوم إجازة" : "Day off"}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="flex-shrink-0 flex items-center justify-end gap-3 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {tc("cancel")}
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin me-2" />
                {tc("saving")}
              </>
            ) : (
              isEdit ? tc("saveChanges") : tc("add")
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
