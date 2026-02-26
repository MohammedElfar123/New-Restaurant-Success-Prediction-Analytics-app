"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowRight, Building2, Stethoscope, User, Mail, Phone, Key, Upload,
  Eye, EyeOff, Loader2, Save, Image as ImageIcon, MapPin, Clock,
  DollarSign, Calendar, Check, X, Globe, Languages
} from "lucide-react";
import ProvidersService from "@/lib/services/providers.service";
import toast from "react-hot-toast";

// Days of week mapping
const DAYS_OF_WEEK = [
  { value: 0, ar: "الأحد", en: "Sunday" },
  { value: 1, ar: "الاثنين", en: "Monday" },
  { value: 2, ar: "الثلاثاء", en: "Tuesday" },
  { value: 3, ar: "الأربعاء", en: "Wednesday" },
  { value: 4, ar: "الخميس", en: "Thursday" },
  { value: 5, ar: "الجمعة", en: "Friday" },
  { value: 6, ar: "السبت", en: "Saturday" },
];

// Day name to day_of_week mapping
const DAY_NAME_TO_NUMBER = {
  "الأحد": 0, "Sunday": 0,
  "الاثنين": 1, "Monday": 1,
  "الثلاثاء": 2, "Tuesday": 2,
  "الأربعاء": 3, "Wednesday": 3,
  "الخميس": 4, "Thursday": 4,
  "الجمعة": 5, "Friday": 5,
  "السبت": 6, "Saturday": 6,
};

export default function EditProviderPage() {
  const t = useTranslations("providers");
  const tc = useTranslations("common");
  const router = useRouter();
  const { locale, id } = useParams();

  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    type: "Hospital",
    lat: "25.2854",
    lng: "51.5310",
    is_active: 1,
    experience_years: "",
    email: "",
    phone: "",
    // Pricing (Doctor only)
    price_before_discount: "",
    price_after_discount: "",
    discount_percentage: "",
    // Arabic translations
    ar_name: "",
    ar_address: "",
    ar_description: "",
    // English translations
    en_name: "",
    en_address: "",
    en_description: "",
    // Owner info
    owner_name: "",
    owner_email: "",
    owner_phone: "",
    owner_password: "",
  });

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [schedules, setSchedules] = useState(
    DAYS_OF_WEEK.map(day => ({
      day_of_week: day.value,
      open_time: "08:00",
      close_time: "17:00",
      is_working: false,
    }))
  );

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [currentImage, setCurrentImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState("ar");

  // Fetch provider data and categories
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch categories and provider data in parallel
        const [categoriesResult, providerResult] = await Promise.all([
          ProvidersService.getCategoriesDropdown(),
          ProvidersService.getProviderForUpdate(id),
        ]);

        if (categoriesResult.success || categoriesResult.status === "success") {
          setCategories(categoriesResult.data || []);
        }
        setIsLoadingCategories(false);

        if (providerResult.success && providerResult.data) {
          const provider = providerResult.data;

          // Get translations
          const arTranslation = provider.translations?.find(t => t.locale === "ar") || {};
          const enTranslation = provider.translations?.find(t => t.locale === "en") || {};

          // Set form data
          setFormData({
            type: provider.type || "Hospital",
            lat: provider.lat || "25.2854",
            lng: provider.lng || "51.5310",
            is_active: provider.is_active ? 1 : 0,
            experience_years: provider.experience_years || "",
            email: provider.email || "",
            phone: provider.phone || "",
            price_before_discount: provider.price_before_discount || "",
            price_after_discount: provider.price_after_discount || "",
            discount_percentage: provider.discount_percentage || "",
            ar_name: arTranslation.name || "",
            ar_address: arTranslation.address || "",
            ar_description: arTranslation.description || "",
            en_name: enTranslation.name || "",
            en_address: enTranslation.address || "",
            en_description: enTranslation.description || "",
            owner_name: provider.owner?.name || "",
            owner_email: provider.owner?.email || "",
            owner_phone: provider.owner?.phone || "",
            owner_password: "",
          });

          // Set current image
          if (provider.image) {
            setCurrentImage(provider.image);
            setImagePreview(provider.image);
          }

          // Set categories
          if (provider.categories) {
            setSelectedCategories(provider.categories.map(c => c.id));
          }

          // Set schedules
          if (provider.schedules && provider.schedules.length > 0) {
            const newSchedules = DAYS_OF_WEEK.map(day => {
              // Find schedule for this day
              const schedule = provider.schedules.find(s => {
                const dayNumber = DAY_NAME_TO_NUMBER[s.day];
                return dayNumber === day.value;
              });

              if (schedule) {
                // Parse hours "9:00 AM - 5:00 PM" format
                const [openTime, closeTime] = schedule.hours.split(" - ");
                return {
                  day_of_week: day.value,
                  open_time: convertTo24Hour(openTime),
                  close_time: convertTo24Hour(closeTime),
                  is_working: true,
                };
              }

              return {
                day_of_week: day.value,
                open_time: "08:00",
                close_time: "17:00",
                is_working: false,
              };
            });
            setSchedules(newSchedules);
          }
        } else {
          toast.error(providerResult.message || t("fetchError"));
          router.push(`/${locale}/admin/providers`);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error(t("fetchError"));
        router.push(`/${locale}/admin/providers`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Convert 12-hour to 24-hour format
  const convertTo24Hour = (time12h) => {
    if (!time12h) return "08:00";

    const match = time12h.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return "08:00";

    let [_, hours, minutes, period] = match;
    hours = parseInt(hours);

    if (period.toUpperCase() === "PM" && hours !== 12) {
      hours += 12;
    } else if (period.toUpperCase() === "AM" && hours === 12) {
      hours = 0;
    }

    return `${hours.toString().padStart(2, "0")}:${minutes}`;
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScheduleChange = (dayIndex, field, value) => {
    setSchedules(prev => prev.map((schedule, idx) =>
      idx === dayIndex ? { ...schedule, [field]: value } : schedule
    ));
  };

  const toggleCategory = (categoryId) => {
    // Doctor can only have one category, Hospital/Clinic can have multiple
    if (formData.type === "Doctor") {
      // Single select for Doctor
      setSelectedCategories(prev =>
        prev.includes(categoryId) ? [] : [categoryId]
      );
    } else {
      // Multi select for Hospital/Clinic
      setSelectedCategories(prev =>
        prev.includes(categoryId)
          ? prev.filter(id => id !== categoryId)
          : [...prev, categoryId]
      );
    }
  };

  // Clear extra categories when switching to Doctor type
  useEffect(() => {
    if (formData.type === "Doctor" && selectedCategories.length > 1) {
      // Keep only the first selected category for Doctor
      setSelectedCategories(prev => prev.slice(0, 1));
    }
  }, [formData.type]);

  const validateForm = () => {
    const newErrors = {};

    // Basic validation
    if (!formData.ar_name.trim()) newErrors.ar_name = t("validation.nameRequired");
    if (!formData.en_name.trim()) newErrors.en_name = t("validation.nameRequired");
    if (!formData.ar_address.trim()) newErrors.ar_address = t("validation.addressRequired");
    if (!formData.en_address.trim()) newErrors.en_address = t("validation.addressRequired");
    if (!formData.email.trim()) {
      newErrors.email = t("validation.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t("validation.invalidEmail");
    }
    if (!formData.phone.trim()) newErrors.phone = t("validation.phoneRequired");
    if (!formData.experience_years) newErrors.experience_years = t("validation.experienceRequired");

    // Owner validation (password optional on edit)
    if (!formData.owner_name.trim()) newErrors.owner_name = t("validation.ownerNameRequired");
    if (!formData.owner_email.trim()) {
      newErrors.owner_email = t("validation.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.owner_email)) {
      newErrors.owner_email = t("validation.invalidEmail");
    }
    if (!formData.owner_phone.trim()) newErrors.owner_phone = t("validation.phoneRequired");
    // Password is optional on edit, but if provided must be at least 6 chars
    if (formData.owner_password && formData.owner_password.length < 6) {
      newErrors.owner_password = t("validation.passwordMin");
    }

    // Categories validation
    if (selectedCategories.length === 0) {
      newErrors.categories = t("validation.categoriesRequired");
    }

    // Pricing validation for Doctor type
    if (formData.type === "Doctor") {
      if (!formData.price_before_discount) newErrors.price_before_discount = t("validation.priceRequired");
      if (!formData.price_after_discount) newErrors.price_after_discount = t("validation.priceRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error(t("validation.fixErrors"));
      return;
    }

    setIsSubmitting(true);
    try {
      const submitData = new FormData();

      // Basic info
      submitData.append("type", formData.type);
      submitData.append("lat", formData.lat);
      submitData.append("lng", formData.lng);
      submitData.append("is_active", formData.is_active);
      submitData.append("experience_years", formData.experience_years);
      submitData.append("email", formData.email);
      submitData.append("phone", formData.phone);

      // Pricing (Doctor only)
      if (formData.type === "Doctor") {
        submitData.append("price_before_discount", formData.price_before_discount);
        submitData.append("price_after_discount", formData.price_after_discount);
        submitData.append("discount_percentage", formData.discount_percentage || "0");
      }

      // Arabic translations
      submitData.append("ar[name]", formData.ar_name);
      submitData.append("ar[address]", formData.ar_address);
      submitData.append("ar[description]", formData.ar_description);

      // English translations
      submitData.append("en[name]", formData.en_name);
      submitData.append("en[address]", formData.en_address);
      submitData.append("en[description]", formData.en_description);

      // Owner info
      submitData.append("owner[name]", formData.owner_name);
      submitData.append("owner[email]", formData.owner_email);
      submitData.append("owner[phone]", formData.owner_phone);
      // Backend requires password even on update - send provided or default
      submitData.append("owner[password]", formData.owner_password || "12345678");

      // Categories
      selectedCategories.forEach(catId => {
        submitData.append("category_id[]", catId);
      });

      // Schedules (all days, working or not)
      let scheduleIndex = 0;
      schedules.forEach((schedule) => {
        if (schedule.is_working) {
          submitData.append(`schedules[${scheduleIndex}][day_of_week]`, schedule.day_of_week);
          submitData.append(`schedules[${scheduleIndex}][open_time]`, schedule.open_time);
          submitData.append(`schedules[${scheduleIndex}][close_time]`, schedule.close_time);
          scheduleIndex++;
        }
      });

      // Image (only if new image selected)
      if (imageFile) {
        submitData.append("image", imageFile);
      }

      const result = await ProvidersService.updateProvider(id, submitData);

      if (result.success) {
        toast.success(result.message || t("updateSuccess"));
        router.push(`/${locale}/admin/providers`);
      } else {
        toast.error(result.message || t("updateError"));
      }
    } catch (error) {
      console.error("Submit error:", error);
      toast.error(t("updateError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case "Hospital": return Building2;
      case "Clinic": return Building2;
      case "Doctor": return Stethoscope;
      default: return Building2;
    }
  };

  const TypeIcon = getTypeIcon(formData.type);

  if (isLoading) {
    return (
      <DashboardLayout requiredUserType="admin">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-slate-500">{t("loading")}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredUserType="admin">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/${locale}/admin/providers`)}
            className="h-10 w-10"
          >
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t("editProvider")}</h1>
            <p className="text-slate-500 mt-1">{t("editProviderDesc")}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form - Left Side */}
          <div className="lg:col-span-2 space-y-6">
            {/* Provider Type */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{t("providerType")}</CardTitle>
                    <CardDescription>{t("providerTypeDesc")}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {["Hospital", "Clinic", "Doctor"].map(type => {
                    const Icon = getTypeIcon(type);
                    const isSelected = formData.type === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => handleChange("type", type)}
                        className={`p-4 rounded-xl border-2 transition-all text-center ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-slate-200 hover:border-slate-300"
                        }`}
                      >
                        <Icon className={`h-8 w-8 mx-auto mb-2 ${isSelected ? "text-primary" : "text-slate-400"}`} />
                        <span className={`font-medium ${isSelected ? "text-primary" : "text-slate-600"}`}>
                          {t(type.toLowerCase())}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Translations */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Languages className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{t("translations")}</CardTitle>
                      <CardDescription>{t("translationsDesc")}</CardDescription>
                    </div>
                  </div>
                  {/* Language Tabs */}
                  <div className="flex items-center bg-slate-100 rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => setActiveTab("ar")}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        activeTab === "ar" ? "bg-white text-primary shadow-sm" : "text-slate-600"
                      }`}
                    >
                      العربية
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("en")}
                      className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        activeTab === "en" ? "bg-white text-primary shadow-sm" : "text-slate-600"
                      }`}
                    >
                      English
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeTab === "ar" ? (
                  <>
                    <div>
                      <Label className="text-slate-700 mb-2 block">
                        {t("providerNameAr")} <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        value={formData.ar_name}
                        onChange={(e) => handleChange("ar_name", e.target.value)}
                        placeholder={t("placeholders.nameAr")}
                        className={`h-11 ${errors.ar_name ? "border-rose-500" : ""}`}
                      />
                      {errors.ar_name && <p className="text-rose-500 text-xs mt-1">{errors.ar_name}</p>}
                    </div>
                    <div>
                      <Label className="text-slate-700 mb-2 block">
                        {t("addressAr")} <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        value={formData.ar_address}
                        onChange={(e) => handleChange("ar_address", e.target.value)}
                        placeholder={t("placeholders.addressAr")}
                        className={`h-11 ${errors.ar_address ? "border-rose-500" : ""}`}
                      />
                      {errors.ar_address && <p className="text-rose-500 text-xs mt-1">{errors.ar_address}</p>}
                    </div>
                    <div>
                      <Label className="text-slate-700 mb-2 block">{t("descriptionAr")}</Label>
                      <Textarea
                        value={formData.ar_description}
                        onChange={(e) => handleChange("ar_description", e.target.value)}
                        placeholder={t("placeholders.descriptionAr")}
                        rows={3}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label className="text-slate-700 mb-2 block">
                        {t("providerNameEn")} <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        value={formData.en_name}
                        onChange={(e) => handleChange("en_name", e.target.value)}
                        placeholder={t("placeholders.nameEn")}
                        className={`h-11 ${errors.en_name ? "border-rose-500" : ""}`}
                        dir="ltr"
                      />
                      {errors.en_name && <p className="text-rose-500 text-xs mt-1">{errors.en_name}</p>}
                    </div>
                    <div>
                      <Label className="text-slate-700 mb-2 block">
                        {t("addressEn")} <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        value={formData.en_address}
                        onChange={(e) => handleChange("en_address", e.target.value)}
                        placeholder={t("placeholders.addressEn")}
                        className={`h-11 ${errors.en_address ? "border-rose-500" : ""}`}
                        dir="ltr"
                      />
                      {errors.en_address && <p className="text-rose-500 text-xs mt-1">{errors.en_address}</p>}
                    </div>
                    <div>
                      <Label className="text-slate-700 mb-2 block">{t("descriptionEn")}</Label>
                      <Textarea
                        value={formData.en_description}
                        onChange={(e) => handleChange("en_description", e.target.value)}
                        placeholder={t("placeholders.descriptionEn")}
                        rows={3}
                        dir="ltr"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Basic Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                    <User className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{t("basicInfo")}</CardTitle>
                    <CardDescription>{t("basicInfoDesc")}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Image Upload */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="h-20 w-20 rounded-xl object-cover border-2 border-slate-200"
                      />
                    ) : (
                      <div className="h-20 w-20 rounded-xl bg-slate-100 flex items-center justify-center border-2 border-dashed border-slate-300">
                        <ImageIcon className="h-8 w-8 text-slate-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="image" className="cursor-pointer">
                      <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                        <Upload className="h-4 w-4" />
                        <span className="text-sm">{t("changeImage")}</span>
                      </div>
                    </Label>
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <p className="text-xs text-slate-500 mt-1">{t("imageHint")}</p>
                  </div>
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-700 mb-2 block">
                      {tc("email")} <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      placeholder={t("placeholders.email")}
                      className={`h-11 ${errors.email ? "border-rose-500" : ""}`}
                      dir="ltr"
                    />
                    {errors.email && <p className="text-rose-500 text-xs mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <Label className="text-slate-700 mb-2 block">
                      {tc("phone")} <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      placeholder={t("placeholders.phone")}
                      className={`h-11 ${errors.phone ? "border-rose-500" : ""}`}
                      dir="ltr"
                    />
                    {errors.phone && <p className="text-rose-500 text-xs mt-1">{errors.phone}</p>}
                  </div>

                  <div>
                    <Label className="text-slate-700 mb-2 block">
                      {t("experienceYears")} <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.experience_years}
                      onChange={(e) => handleChange("experience_years", e.target.value)}
                      placeholder="0"
                      className={`h-11 ${errors.experience_years ? "border-rose-500" : ""}`}
                    />
                    {errors.experience_years && <p className="text-rose-500 text-xs mt-1">{errors.experience_years}</p>}
                  </div>

                  <div>
                    <Label className="text-slate-700 mb-2 block">{t("status")}</Label>
                    <div className="flex items-center gap-3 h-11 px-3 border rounded-lg bg-slate-50">
                      <Switch
                        checked={formData.is_active === 1}
                        onCheckedChange={(checked) => handleChange("is_active", checked ? 1 : 0)}
                      />
                      <span className="text-sm text-slate-600">
                        {formData.is_active === 1 ? tc("active") : tc("inactive")}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Pricing (Doctor Only) */}
            {formData.type === "Doctor" && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-pink-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="h-5 w-5 text-pink-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{t("pricing")}</CardTitle>
                      <CardDescription>{t("pricingDesc")}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-slate-700 mb-2 block">
                        {t("priceBeforeDiscount")} <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price_before_discount}
                        onChange={(e) => handleChange("price_before_discount", e.target.value)}
                        placeholder="0.00"
                        className={`h-11 ${errors.price_before_discount ? "border-rose-500" : ""}`}
                      />
                      {errors.price_before_discount && <p className="text-rose-500 text-xs mt-1">{errors.price_before_discount}</p>}
                    </div>

                    <div>
                      <Label className="text-slate-700 mb-2 block">
                        {t("priceAfterDiscount")} <span className="text-rose-500">*</span>
                      </Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.price_after_discount}
                        onChange={(e) => handleChange("price_after_discount", e.target.value)}
                        placeholder="0.00"
                        className={`h-11 ${errors.price_after_discount ? "border-rose-500" : ""}`}
                      />
                      {errors.price_after_discount && <p className="text-rose-500 text-xs mt-1">{errors.price_after_discount}</p>}
                    </div>

                    <div>
                      <Label className="text-slate-700 mb-2 block">{t("discountPercentage")}</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.discount_percentage}
                        onChange={(e) => handleChange("discount_percentage", e.target.value)}
                        placeholder="0"
                        className="h-11"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Categories */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Globe className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">
                      {t("categories")} <span className="text-rose-500">*</span>
                    </CardTitle>
                    <CardDescription>
                      {formData.type === "Doctor"
                        ? (locale === "ar" ? "اختر تخصص واحد للطبيب" : "Select one specialty for the doctor")
                        : (locale === "ar" ? "يمكنك اختيار أكثر من تصنيف" : "You can select multiple categories")}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {errors.categories && (
                  <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg">
                    <p className="text-rose-600 text-sm">{errors.categories}</p>
                  </div>
                )}

                {/* Selection hint badge */}
                <div className="mb-4 flex items-center gap-2">
                  <Badge variant={formData.type === "Doctor" ? "secondary" : "outline"} className="text-xs">
                    {formData.type === "Doctor"
                      ? (locale === "ar" ? "اختيار فردي" : "Single Select")
                      : (locale === "ar" ? "اختيار متعدد" : "Multi Select")}
                  </Badge>
                  {selectedCategories.length > 0 && (
                    <span className="text-sm text-slate-500">
                      {locale === "ar"
                        ? `تم اختيار ${selectedCategories.length}`
                        : `${selectedCategories.length} selected`}
                    </span>
                  )}
                </div>

                {isLoadingCategories ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : categories.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    {locale === "ar" ? "لا توجد تصنيفات متاحة" : "No categories available"}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {categories.map(category => {
                      const isSelected = selectedCategories.includes(category.id);
                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => toggleCategory(category.id)}
                          className={`p-3 rounded-xl border-2 text-sm font-medium transition-all text-start ${
                            isSelected
                              ? "border-primary bg-primary/10 text-primary shadow-sm"
                              : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {category.image ? (
                              <img
                                src={category.image}
                                alt={category.name}
                                className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                isSelected ? "bg-primary/20" : "bg-slate-100"
                              }`}>
                                <ImageIcon className={`h-5 w-5 ${isSelected ? "text-primary" : "text-slate-400"}`} />
                              </div>
                            )}
                            <div className="flex items-center gap-2 min-w-0">
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                                isSelected ? "border-primary bg-primary" : "border-slate-300"
                              }`}>
                                {isSelected && <Check className="h-3 w-3 text-white" />}
                              </div>
                              <span className="truncate">{category.name}</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Owner Information */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Key className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{t("ownerInfo")}</CardTitle>
                    <CardDescription>{t("ownerInfoDesc")}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-700 mb-2 block">
                      {t("ownerName")} <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      value={formData.owner_name}
                      onChange={(e) => handleChange("owner_name", e.target.value)}
                      placeholder={t("placeholders.ownerName")}
                      className={`h-11 ${errors.owner_name ? "border-rose-500" : ""}`}
                    />
                    {errors.owner_name && <p className="text-rose-500 text-xs mt-1">{errors.owner_name}</p>}
                  </div>

                  <div>
                    <Label className="text-slate-700 mb-2 block">
                      {t("ownerEmail")} <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      type="email"
                      value={formData.owner_email}
                      onChange={(e) => handleChange("owner_email", e.target.value)}
                      placeholder={t("placeholders.ownerEmail")}
                      className={`h-11 ${errors.owner_email ? "border-rose-500" : ""}`}
                      dir="ltr"
                    />
                    {errors.owner_email && <p className="text-rose-500 text-xs mt-1">{errors.owner_email}</p>}
                  </div>

                  <div>
                    <Label className="text-slate-700 mb-2 block">
                      {t("ownerPhone")} <span className="text-rose-500">*</span>
                    </Label>
                    <Input
                      value={formData.owner_phone}
                      onChange={(e) => handleChange("owner_phone", e.target.value)}
                      placeholder={t("placeholders.ownerPhone")}
                      className={`h-11 ${errors.owner_phone ? "border-rose-500" : ""}`}
                      dir="ltr"
                    />
                    {errors.owner_phone && <p className="text-rose-500 text-xs mt-1">{errors.owner_phone}</p>}
                  </div>

                  <div>
                    <Label className="text-slate-700 mb-2 block">
                      {t("ownerPassword")}
                      <span className="text-xs text-slate-400 ms-2">({t("passwordHint")})</span>
                    </Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={formData.owner_password}
                        onChange={(e) => handleChange("owner_password", e.target.value)}
                        placeholder="••••••••"
                        className={`h-11 pe-10 ${errors.owner_password ? "border-rose-500" : ""}`}
                        dir="ltr"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.owner_password && <p className="text-rose-500 text-xs mt-1">{errors.owner_password}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Working Schedule */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                    <Clock className="h-5 w-5 text-cyan-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{t("workingSchedule")}</CardTitle>
                    <CardDescription>{t("workingScheduleDesc")}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {schedules.map((schedule, index) => {
                    const day = DAYS_OF_WEEK.find(d => d.value === schedule.day_of_week);
                    return (
                      <div
                        key={schedule.day_of_week}
                        className={`flex items-center gap-4 p-3 rounded-lg border ${
                          schedule.is_working ? "bg-white border-slate-200" : "bg-slate-50 border-slate-100"
                        }`}
                      >
                        <Switch
                          checked={schedule.is_working}
                          onCheckedChange={(checked) => handleScheduleChange(index, "is_working", checked)}
                        />
                        <span className={`w-24 font-medium ${schedule.is_working ? "text-slate-900" : "text-slate-400"}`}>
                          {locale === "ar" ? day.ar : day.en}
                        </span>
                        {schedule.is_working && (
                          <>
                            <Input
                              type="time"
                              value={schedule.open_time}
                              onChange={(e) => handleScheduleChange(index, "open_time", e.target.value)}
                              className="w-32 h-9"
                            />
                            <span className="text-slate-400">-</span>
                            <Input
                              type="time"
                              value={schedule.close_time}
                              onChange={(e) => handleScheduleChange(index, "close_time", e.target.value)}
                              className="w-32 h-9"
                            />
                          </>
                        )}
                        {!schedule.is_working && (
                          <span className="text-sm text-slate-400">{t("dayOff")}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Right Side */}
          <div className="space-y-6">
            {/* Summary Card */}
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">{t("summary")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Preview */}
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="h-12 w-12 rounded-lg object-cover" />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-slate-200 flex items-center justify-center">
                      <TypeIcon className="h-6 w-6 text-slate-400" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-slate-900">
                      {formData.ar_name || formData.en_name || t("noName")}
                    </p>
                    <p className="text-sm text-slate-500">{t(formData.type.toLowerCase())}</p>
                  </div>
                </div>

                <Separator />

                {/* Info Items */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{t("status")}</span>
                    <Badge className={formData.is_active === 1 ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}>
                      {formData.is_active === 1 ? tc("active") : tc("inactive")}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{t("categories")}</span>
                    <Badge variant="secondary">{selectedCategories.length}</Badge>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{t("workingDays")}</span>
                    <Badge variant="secondary">{schedules.filter(s => s.is_working).length}</Badge>
                  </div>

                  {formData.type === "Doctor" && formData.price_after_discount && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-600">{t("price")}</span>
                      <span className="font-medium text-primary">{formData.price_after_discount} {t("currency")}</span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Actions */}
                <div className="space-y-2">
                  <Button type="submit" disabled={isSubmitting} className="w-full gap-2">
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {tc("saving")}
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        {t("saveChanges")}
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={() => router.push(`/${locale}/admin/providers`)}
                  >
                    {tc("cancel")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </DashboardLayout>
  );
}
