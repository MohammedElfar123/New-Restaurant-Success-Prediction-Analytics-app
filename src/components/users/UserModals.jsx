"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalFooter,
  VisuallyHidden,
} from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  User, Mail, Phone, Calendar, Clock,
  CheckCircle, XCircle, Loader2, Trash2, Shield,
  CalendarDays, Receipt, TrendingUp, Activity, UserCog,
  Globe, RefreshCw
} from "lucide-react";

// ============================================
// VIEW USER DETAILS MODAL
// ============================================
export function UserViewModal({
  isOpen,
  onClose,
  customer,
  isLoading,
  onToggleStatus,
  onDelete,
}) {
  const t = useTranslations("users.modal");
  const [activeTab, setActiveTab] = useState("overview");

  const getInitials = (name) => {
    if (!name) return "??";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const tabs = [
    { id: "overview", label: t("overview"), icon: User },
    { id: "bookings", label: t("bookingsTab"), icon: CalendarDays },
    { id: "activity", label: t("activity"), icon: Activity },
  ];

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent className="max-w-3xl max-h-[90vh] overflow-hidden p-0">
        <VisuallyHidden>
          <ModalTitle>{t("viewTitle")}</ModalTitle>
        </VisuallyHidden>
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
              <p className="text-slate-500">{t("loading")}</p>
            </div>
          </div>
        ) : customer?.customer ? (
          <>
            {/* Header Section */}
            <div className="bg-gradient-to-r from-primary to-primary/80 px-6 py-8 text-white relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full translate-x-1/3 translate-y-1/3" />
              </div>

              <div className="relative flex items-start gap-5">
                {/* Avatar */}
                <div className="relative">
                  {customer.customer.image ? (
                    <img
                      src={customer.customer.image}
                      alt={customer.customer.name}
                      className="h-24 w-24 rounded-2xl object-cover border-4 border-white/30 shadow-xl"
                    />
                  ) : (
                    <div className="h-24 w-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-4 border-white/30 shadow-xl">
                      <span className="text-white font-bold text-3xl">
                        {getInitials(customer.customer.name)}
                      </span>
                    </div>
                  )}
                  {/* Status Indicator */}
                  <div className={`absolute -bottom-1 -right-1 h-6 w-6 rounded-full border-3 border-white flex items-center justify-center ${customer.customer.status ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                    {customer.customer.status ? (
                      <CheckCircle className="h-3.5 w-3.5 text-white" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 text-white" />
                    )}
                  </div>
                </div>

                {/* User Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold">{customer.customer.name}</h2>
                    <Badge className={`${customer.customer.status ? 'bg-emerald-500/20 text-emerald-100 border-emerald-400/30' : 'bg-rose-500/20 text-rose-100 border-rose-400/30'}`}>
                      {customer.customer.status ? t("active") : t("inactive")}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-white/80 text-sm">
                    {customer.customer.email && (
                      <div className="flex items-center gap-1.5">
                        <Mail className="h-4 w-4" />
                        <span>{customer.customer.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-4 w-4" />
                      <span dir="ltr">{customer.customer.phone}</span>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="flex items-center gap-6 mt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{customer.totals?.bookings_count ?? customer.customer?.bookings_count ?? 0}</div>
                      <div className="text-xs text-white/70">{t("booking")}</div>
                    </div>
                    <div className="w-px h-8 bg-white/20" />
                    <div className="text-center">
                      <div className="text-2xl font-bold">{customer.totals?.completed_bookings ?? customer.customer?.completed_bookings ?? 0}</div>
                      <div className="text-xs text-white/70">{t("completed")}</div>
                    </div>
                    <div className="w-px h-8 bg-white/20" />
                    <div className="text-center">
                      <div className="text-2xl font-bold">{parseFloat(customer.totals?.total_spent ?? customer.customer?.bookings_sum_total ?? 0).toFixed(0)}</div>
                      <div className="text-xs text-white/70">QAR</div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    className={`border-0 gap-2 ${customer.customer.status ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-100' : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-100'}`}
                    onClick={() => onToggleStatus?.(customer.customer.id)}
                  >
                    {customer.customer.status ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                    {customer.customer.status ? t("deactivate") : t("activate")}
                  </Button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200 bg-slate-50/50">
              <div className="flex gap-1 px-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all relative ${
                      activeTab === tab.id
                        ? "text-primary"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                    {activeTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="p-6 overflow-y-auto max-h-[400px]">
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Personal Information */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      {t("personalInfo")}
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <InfoCard
                        icon={User}
                        label={t("fullName")}
                        value={customer.customer.name}
                      />
                      <InfoCard
                        icon={Shield}
                        label={t("gender")}
                        value={customer.customer.gender === "male" ? "Male" : "Female"}
                      />
                      <InfoCard
                        icon={Mail}
                        label={t("email")}
                        value={customer.customer.email || t("notSpecified")}
                      />
                      <InfoCard
                        icon={Phone}
                        label={t("phone")}
                        value={customer.customer.phone}
                        dir="ltr"
                      />
                      {customer.customer.birth_date && (
                        <InfoCard
                          icon={Calendar}
                          label={t("birthDate")}
                          value={customer.customer.birth_date}
                        />
                      )}
                      {customer.customer.country?.name && (
                        <InfoCard
                          icon={Globe}
                          label={t("country")}
                          value={customer.customer.country.name}
                        />
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Account Information */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <UserCog className="h-4 w-4 text-primary" />
                      {t("accountInfo")}
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <InfoCard
                        icon={Clock}
                        label={t("registrationDate")}
                        value={customer.customer.created_at}
                      />
                      {customer.customer.updated_at && (
                        <InfoCard
                          icon={Activity}
                          label={t("lastActivity")}
                          value={customer.customer.updated_at}
                        />
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Statistics */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      {t("statistics")}
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <StatCard
                        icon={CalendarDays}
                        label={t("totalBookings")}
                        value={customer.totals?.bookings_count ?? customer.customer?.bookings_count ?? 0}
                        color="blue"
                      />
                      <StatCard
                        icon={CheckCircle}
                        label={t("completedBookings")}
                        value={customer.totals?.completed_bookings ?? customer.customer?.completed_bookings ?? 0}
                        color="emerald"
                      />
                      <StatCard
                        icon={Receipt}
                        label={t("totalPayments")}
                        value={`${parseFloat(customer.totals?.total_spent ?? customer.customer?.bookings_sum_total ?? 0).toFixed(2)} QAR`}
                        color="pink"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "bookings" && (
                <div className="text-center py-12">
                  <CalendarDays className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">{t("bookingsHistory")}</h3>
                  <p className="text-slate-500">{t("bookingsHistoryDesc")}</p>
                </div>
              )}

              {activeTab === "activity" && (
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-900 mb-2">{t("activityLog")}</h3>
                  <p className="text-slate-500">{t("activityLogDesc")}</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-slate-200 px-6 py-4 bg-slate-50/50 flex items-center justify-between">
              <Button
                variant="outline"
                className="text-rose-600 border-rose-200 hover:bg-rose-50 gap-2"
                onClick={() => onDelete?.(customer.customer.id)}
              >
                <Trash2 className="h-4 w-4" />
                {t("delete")}
              </Button>
              <Button variant="outline" onClick={onClose}>
                {t("close")}
              </Button>
            </div>
          </>
        ) : null}
      </ModalContent>
    </Modal>
  );
}

// ============================================
// ADD/EDIT USER MODAL
// ============================================
export function UserFormModal({
  isOpen,
  onClose,
  mode = "add", // "add" | "edit"
  initialData = null,
  onSubmit,
  isSubmitting = false,
}) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
    gender: initialData?.gender || "male",
    birth_date: initialData?.birth_date || "",
    country_id: initialData?.country_id || "",
  });

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "الاسم مطلوب";
    }
    if (!formData.phone.trim()) {
      newErrors.phone = "رقم الهاتف مطلوب";
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "البريد الإلكتروني غير صالح";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit?.(formData);
    }
  };

  const isEdit = mode === "edit";

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent className="max-w-xl">
        {/* Header */}
        <ModalHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${isEdit ? 'bg-amber-100' : 'bg-primary/10'}`}>
              {isEdit ? (
                <Edit className="h-6 w-6 text-amber-600" />
              ) : (
                <User className="h-6 w-6 text-primary" />
              )}
            </div>
            <div>
              <ModalTitle className="text-xl">
                {isEdit ? "تعديل بيانات المستخدم" : "إضافة مستخدم جديد"}
              </ModalTitle>
              <ModalDescription>
                {isEdit ? "قم بتحديث بيانات المستخدم" : "أدخل بيانات المستخدم الجديد"}
              </ModalDescription>
            </div>
          </div>
        </ModalHeader>

        <form onSubmit={handleSubmit}>
          <div className="px-6 py-4 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Personal Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <User className="h-4 w-4 text-primary" />
                المعلومات الشخصية
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Name */}
                <div className="col-span-2">
                  <Label htmlFor="name" className="text-slate-700 mb-2 block">
                    الاسم الكامل <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    placeholder="أدخل الاسم الكامل"
                    className={`h-11 ${errors.name ? 'border-rose-500 focus:ring-rose-500' : ''}`}
                  />
                  {errors.name && (
                    <p className="text-rose-500 text-xs mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <Label htmlFor="email" className="text-slate-700 mb-2 block">
                    البريد الإلكتروني
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="example@email.com"
                    className={`h-11 ${errors.email ? 'border-rose-500 focus:ring-rose-500' : ''}`}
                    dir="ltr"
                  />
                  {errors.email && (
                    <p className="text-rose-500 text-xs mt-1">{errors.email}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <Label htmlFor="phone" className="text-slate-700 mb-2 block">
                    رقم الهاتف <span className="text-rose-500">*</span>
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                    placeholder="+974 XXXX XXXX"
                    className={`h-11 ${errors.phone ? 'border-rose-500 focus:ring-rose-500' : ''}`}
                    dir="ltr"
                  />
                  {errors.phone && (
                    <p className="text-rose-500 text-xs mt-1">{errors.phone}</p>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Additional Information Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <Shield className="h-4 w-4 text-primary" />
                معلومات إضافية
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Gender */}
                <div>
                  <Label htmlFor="gender" className="text-slate-700 mb-2 block">
                    الجنس
                  </Label>
                  <div className="flex gap-3">
                    <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${formData.gender === 'male' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-200 hover:border-slate-300'}`}>
                      <input
                        type="radio"
                        name="gender"
                        value="male"
                        checked={formData.gender === "male"}
                        onChange={(e) => handleChange("gender", e.target.value)}
                        className="sr-only"
                      />
                      <User className="h-4 w-4" />
                      <span className="text-sm font-medium">ذكر</span>
                    </label>
                    <label className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${formData.gender === 'female' ? 'border-pink-500 bg-pink-50 text-pink-600' : 'border-slate-200 hover:border-slate-300'}`}>
                      <input
                        type="radio"
                        name="gender"
                        value="female"
                        checked={formData.gender === "female"}
                        onChange={(e) => handleChange("gender", e.target.value)}
                        className="sr-only"
                      />
                      <User className="h-4 w-4" />
                      <span className="text-sm font-medium">أنثى</span>
                    </label>
                  </div>
                </div>

                {/* Birth Date */}
                <div>
                  <Label htmlFor="birth_date" className="text-slate-700 mb-2 block">
                    تاريخ الميلاد
                  </Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={formData.birth_date}
                    onChange={(e) => handleChange("birth_date", e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <ModalFooter className="border-t border-slate-200 px-6 py-4 bg-slate-50/50">
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="min-w-[120px] gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : isEdit ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  حفظ التعديلات
                </>
              ) : (
                <>
                  <User className="h-4 w-4" />
                  إضافة المستخدم
                </>
              )}
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}

// ============================================
// HELPER COMPONENTS
// ============================================
function InfoCard({ icon: Icon, label, value, dir }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100">
      <div className="h-9 w-9 rounded-lg bg-white flex items-center justify-center shadow-sm">
        <Icon className="h-4 w-4 text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 mb-0.5">{label}</p>
        <p className="text-sm font-medium text-slate-900 truncate" dir={dir}>
          {value}
        </p>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    pink: "bg-pink-50 text-pink-600 border-pink-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
  };

  return (
    <div className={`p-4 rounded-xl border ${colors[color]} text-center`}>
      <Icon className="h-5 w-5 mx-auto mb-2 opacity-80" />
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-xs opacity-80">{label}</div>
    </div>
  );
}

// ============================================
// DELETE CONFIRMATION MODAL
// ============================================
export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  userName,
  isDeleting = false,
}) {
  const t = useTranslations("users.modal");

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent className="max-w-md">
        <VisuallyHidden>
          <ModalTitle>{t("deleteTitle")}</ModalTitle>
        </VisuallyHidden>
        <div className="p-6 text-center">
          <div className="h-16 w-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 className="h-8 w-8 text-rose-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            {t("deleteTitle")}
          </h3>
          <p className="text-slate-500 mb-6">
            {t("deleteConfirm")} <span className="font-semibold text-slate-700">{userName}</span>?
            <br />
            <span className="text-sm text-rose-500">{t("deleteWarning")}</span>
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={onClose} className="min-w-[100px]">
              {t("cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              disabled={isDeleting}
              className="min-w-[100px] gap-2"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("deleting")}
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  {t("delete")}
                </>
              )}
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}

// ============================================
// RESTORE CONFIRMATION MODAL
// ============================================
export function RestoreConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  userName,
  isRestoring = false,
}) {
  const t = useTranslations("users.modal");

  return (
    <Modal open={isOpen} onOpenChange={onClose}>
      <ModalContent className="max-w-md">
        <VisuallyHidden>
          <ModalTitle>{t("restoreTitle")}</ModalTitle>
        </VisuallyHidden>
        <div className="p-6 text-center">
          <div className="h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <RefreshCw className="h-8 w-8 text-emerald-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            {t("restoreTitle")}
          </h3>
          <p className="text-slate-500 mb-6">
            {t("restoreConfirm")} <span className="font-semibold text-slate-700">{userName}</span>?
            <br />
            <span className="text-sm text-emerald-600">{t("restoreHint")}</span>
          </p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={onClose} className="min-w-[100px]">
              {t("cancel")}
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isRestoring}
              className="min-w-[100px] gap-2 bg-emerald-600 hover:bg-emerald-700"
            >
              {isRestoring ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("restoring")}
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  {t("restore")}
                </>
              )}
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
