"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Search,
  Bell,
  Send,
  CheckCircle,
  Loader2,
  Upload,
  X,
  Users,
  Languages,
  ImagePlus,
  RefreshCw,
  BellRing,
  MoreVertical,
  Eye,
  Trash2,
  Clock,
  User,
  Phone,
  Hash,
  MessageSquare,
  Globe,
} from "lucide-react";
import toast from "react-hot-toast";
import NotificationsService from "@/lib/services/notifications.service";
import { usePermissions, PERMISSIONS } from "@/hooks/usePermissions";

export default function NotificationsPage() {
  const t = useTranslations("notifications");
  const tc = useTranslations("common");
  const locale = useLocale();

  // Permissions
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission(PERMISSIONS.NOTIFICATIONS_CREATE);

  // State
  const [notifications, setNotifications] = useState([]);
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0, per_page: 10 });
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const dropdownRef = useRef(null);
  const itemsPerPage = 10;

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = { page: currentPage, count_paginate: itemsPerPage };
      if (searchQuery) params.search = searchQuery;

      const result = await NotificationsService.getNotifications(params);
      if (result.success) {
        setNotifications(result.data);
        setMeta(result.meta);
      } else {
        toast.error(result.message || tc("errorFetchingData"));
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error(tc("errorFetchingData"));
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, searchQuery, tc, itemsPerPage]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

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

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get translation field from translations array
  const getTranslation = (translations, field, preferredLocale) => {
    if (!translations || !Array.isArray(translations)) return "";
    const trans = translations.find((t) => t.locale === preferredLocale);
    if (trans) return trans[field] || "";
    const fallback = translations[0];
    return fallback?.[field] || "";
  };

  const handleView = (notif) => {
    setOpenDropdown(null);
    setSelectedNotif(notif);
    setViewModalOpen(true);
  };

  const handleSendSuccess = () => {
    setShowSendDialog(false);
    fetchNotifications();
  };

  const toggleDropdown = (id) => {
    setOpenDropdown(openDropdown === id ? null : id);
  };

  // Stats from meta
  const totalNotifications = meta.total || 0;
  const currentPageNotifs = notifications.length;

  return (
    <DashboardLayout requiredUserType="admin">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{t("title")}</h1>
          <p className="text-slate-500 mt-1">{t("subtitle")}</p>
        </div>
        {canCreate && (
          <Button className="gap-2 h-10" onClick={() => setShowSendDialog(true)}>
            <Send className="w-4 h-4" />
            {t("sendNotification")}
          </Button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">
                {t("totalSent")}
              </CardTitle>
              <div className="h-10 w-10 bg-indigo-50 rounded-lg flex items-center justify-center">
                <Send className="h-5 w-5 text-indigo-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : totalNotifications}
            </div>
            <p className="text-xs text-slate-500 mt-1">{t("allNotifications")}</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">
                {t("currentPageLabel")}
              </CardTitle>
              <div className="h-10 w-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                <Bell className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : currentPageNotifs}
            </div>
            <p className="text-xs text-emerald-600 mt-1">
              {t("page")} {meta.current_page} {t("of")} {meta.last_page}
            </p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-600">
                {t("totalPages")}
              </CardTitle>
              <div className="h-10 w-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <Hash className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-900">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : meta.last_page}
            </div>
            <p className="text-xs text-purple-600 mt-1">
              {itemsPerPage} {t("perPage")}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-0">
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <h3 className="font-semibold text-slate-900">{t("allNotifications")}</h3>
                <Badge variant="secondary" className="bg-slate-200 text-slate-700">
                  {meta.total || 0}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={fetchNotifications}
                  disabled={isLoading}
                  className="h-8 w-8 p-0"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder={t("searchPlaceholder")}
                    className="ps-10 w-72 h-10 bg-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-visible">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-slate-500">{tc("loading")}</p>
                </div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-16">
                <BellRing className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">{t("noNotifications")}</h3>
                <p className="text-slate-500">{t("noNotificationsHint")}</p>
              </div>
            ) : (
              <table className="w-full table-fixed">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/80">
                    <th className="py-3.5 px-3 text-sm font-semibold text-slate-600 text-center w-[50px]">#</th>
                    <th className="py-3.5 px-4 text-sm font-semibold text-slate-600 text-start w-[40%]">
                      {t("titleAndMessage")}
                    </th>
                    <th className="py-3.5 px-4 text-sm font-semibold text-slate-600 text-start w-[20%]">
                      {t("sentBy")}
                    </th>
                    <th className="py-3.5 px-4 text-sm font-semibold text-slate-600 text-center w-[20%]">
                      {t("date")}
                    </th>
                    <th className="py-3.5 px-3 text-sm font-semibold text-slate-600 text-center w-[60px]">
                      {tc("actions")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {notifications.map((notif, index) => {
                    const titlePrimary = getTranslation(notif.translations, "title", locale);
                    const titleSecondary = getTranslation(notif.translations, "title", locale === "ar" ? "en" : "ar");
                    const bodyPrimary = getTranslation(notif.translations, "body", locale);

                    return (
                      <tr
                        key={notif.id}
                        className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                      >
                        {/* # */}
                        <td className="py-3.5 px-3 text-center w-[50px]">
                          <span className="text-sm text-slate-500 font-medium">
                            {(currentPage - 1) * itemsPerPage + index + 1}
                          </span>
                        </td>

                        {/* Title & Message */}
                        <td className="py-3.5 px-4 text-start w-[40%]">
                          <button
                            onClick={() => handleView(notif)}
                            className="hover:opacity-80 transition-opacity text-start w-full"
                          >
                            <div className="flex items-start gap-3">
                              <div className="h-9 w-9 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                <Bell className="h-4 w-4 text-primary" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-medium text-slate-900 line-clamp-1">
                                  {titlePrimary}
                                </div>
                                {titleSecondary && (
                                  <div
                                    className="text-xs text-slate-400 line-clamp-1 mt-0.5"
                                    dir={locale === "ar" ? "ltr" : "rtl"}
                                  >
                                    {titleSecondary}
                                  </div>
                                )}
                                {bodyPrimary && (
                                  <div className="text-xs text-slate-500 line-clamp-1 mt-1">
                                    <MessageSquare className="h-3 w-3 inline-block me-1 text-slate-400" />
                                    {bodyPrimary}
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                        </td>

                        {/* Sent By */}
                        <td className="py-3.5 px-4 text-start w-[20%]">
                          {notif.createdBy ? (
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center flex-shrink-0">
                                <User className="h-3.5 w-3.5 text-slate-600" />
                              </div>
                              <span className="text-sm text-slate-700 truncate font-medium">
                                {notif.createdBy.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">-</span>
                          )}
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 text-center w-[20%]">
                          <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border border-emerald-200 gap-1 text-xs mb-1.5">
                            <CheckCircle className="h-3 w-3" />
                            {t("sent")}
                          </Badge>
                          <div className="flex items-center justify-center gap-1 text-xs text-slate-500">
                            <Clock className="h-3 w-3 text-slate-400" />
                            {notif.created_at}
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-3 text-center w-[60px]">
                          <div className="flex justify-center">
                            <div className="relative" ref={openDropdown === notif.id ? dropdownRef : null}>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 hover:bg-slate-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleDropdown(notif.id);
                                }}
                              >
                                <MoreVertical className="h-4 w-4 text-slate-500" />
                              </Button>

                              {openDropdown === notif.id && (
                                <div
                                  className="absolute end-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    className="w-full px-3 py-2 text-start text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                                    onClick={() => handleView(notif)}
                                  >
                                    <Eye className="h-4 w-4 text-slate-400" />
                                    {tc("view")}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {meta.last_page > 1 && (
            <div className="flex flex-col md:flex-row items-center justify-between px-6 py-4 border-t border-slate-200 gap-4">
              <div className="text-sm text-slate-500">
                {t("page")} {meta.current_page} {t("of")} {meta.last_page} ({meta.total} {t("notification")})
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1 || isLoading}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="h-9"
                >
                  {tc("previous")}
                </Button>

                {Array.from({ length: Math.min(5, meta.last_page) }, (_, i) => {
                  let pageNum;
                  if (meta.last_page <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= meta.last_page - 2) {
                    pageNum = meta.last_page - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <Button
                      key={pageNum}
                      variant="outline"
                      size="sm"
                      disabled={isLoading}
                      className={`h-9 w-9 p-0 ${
                        currentPage === pageNum
                          ? "bg-primary text-white border-primary hover:bg-primary/90 hover:text-white"
                          : ""
                      }`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}

                {meta.last_page > 5 && currentPage < meta.last_page - 2 && (
                  <>
                    <span className="text-slate-400 px-1">...</span>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isLoading}
                      className="h-9 w-9 p-0"
                      onClick={() => setCurrentPage(meta.last_page)}
                    >
                      {meta.last_page}
                    </Button>
                  </>
                )}

                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === meta.last_page || isLoading}
                  onClick={() => setCurrentPage((p) => Math.min(meta.last_page, p + 1))}
                  className="h-9"
                >
                  {tc("next")}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Notification Modal */}
      {selectedNotif && (
        <NotificationViewModal
          open={viewModalOpen}
          onOpenChange={setViewModalOpen}
          notification={selectedNotif}
        />
      )}

      {/* Send Notification Dialog */}
      <SendNotificationDialog
        open={showSendDialog}
        onOpenChange={setShowSendDialog}
        onSuccess={handleSendSuccess}
      />
    </DashboardLayout>
  );
}

// ============================================================
// View Notification Modal
// ============================================================
function NotificationViewModal({ open, onOpenChange, notification }) {
  const t = useTranslations("notifications");
  const tc = useTranslations("common");

  if (!notification) return null;

  const getTranslation = (translations, field, locale) => {
    if (!translations || !Array.isArray(translations)) return "";
    const trans = translations.find((t) => t.locale === locale);
    return trans?.[field] || "";
  };

  const arTitle = getTranslation(notification.translations, "title", "ar");
  const enTitle = getTranslation(notification.translations, "title", "en");
  const arBody = getTranslation(notification.translations, "body", "ar");
  const enBody = getTranslation(notification.translations, "body", "en");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 px-6 py-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
          <DialogTitle className="flex items-center gap-3 text-lg">
            <div className="p-2 rounded-lg bg-primary/10">
              <Eye className="h-5 w-5 text-primary" />
            </div>
            {t("notificationDetails")}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Arabic Content */}
          <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100" dir="rtl">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-900">العربية</span>
            </div>
            <div className="space-y-2 bg-white rounded-lg p-3">
              <div>
                <Label className="text-xs text-slate-500">{t("arTitle")}</Label>
                <p className="text-sm font-medium text-slate-900 mt-0.5">{arTitle || "-"}</p>
              </div>
              <div>
                <Label className="text-xs text-slate-500">{t("arBody")}</Label>
                <p className="text-sm text-slate-700 mt-0.5 leading-relaxed">{arBody || "-"}</p>
              </div>
            </div>
          </div>

          {/* English Content */}
          <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100" dir="ltr">
            <div className="flex items-center gap-2 mb-3">
              <Globe className="h-4 w-4 text-emerald-600" />
              <span className="text-sm font-semibold text-emerald-900">English</span>
            </div>
            <div className="space-y-2 bg-white rounded-lg p-3">
              <div>
                <Label className="text-xs text-slate-500">{t("enTitle")}</Label>
                <p className="text-sm font-medium text-slate-900 mt-0.5">{enTitle || "-"}</p>
              </div>
              <div>
                <Label className="text-xs text-slate-500">{t("enBody")}</Label>
                <p className="text-sm text-slate-700 mt-0.5 leading-relaxed">{enBody || "-"}</p>
              </div>
            </div>
          </div>

          {/* Meta Info */}
          <div className="p-4 bg-slate-50 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">{t("sentBy")}</span>
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">
                  {notification.createdBy?.name || "-"}
                </span>
              </div>
            </div>
            <div className="border-t border-slate-200" />
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">{t("date")}</span>
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-sm font-medium text-slate-700">
                  {notification.created_at}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 px-6 py-4 border-t bg-slate-50/80">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            {tc("close")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// Send Notification Dialog
// ============================================================
function SendNotificationDialog({ open, onOpenChange, onSuccess }) {
  const t = useTranslations("notifications");
  const tc = useTranslations("common");
  const locale = useLocale();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    ar_title: "",
    en_title: "",
    ar_body: "",
    en_body: "",
    for_all: true,
    user_ids: [],
    image: null,
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [activeTab, setActiveTab] = useState("ar");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // User search
  const [userSearch, setUserSearch] = useState("");
  const [users, setUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const userSearchTimeoutRef = useRef(null);

  // Reset form on open
  useEffect(() => {
    if (open) {
      setFormData({ ar_title: "", en_title: "", ar_body: "", en_body: "", for_all: true, user_ids: [], image: null });
      setImagePreview(null);
      setActiveTab("ar");
      setUserSearch("");
      setUsers([]);
    }
  }, [open]);

  // Search users
  const searchUsers = async (search) => {
    setIsLoadingUsers(true);
    try {
      const result = await NotificationsService.getUsersForNotify(search);
      if (result.success) setUsers(result.data);
    } catch (error) {
      console.error("Error searching users:", error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const handleUserSearchChange = (value) => {
    setUserSearch(value);
    if (userSearchTimeoutRef.current) clearTimeout(userSearchTimeoutRef.current);
    userSearchTimeoutRef.current = setTimeout(() => searchUsers(value), 400);
  };

  // Load users when switching to specific
  useEffect(() => {
    if (!formData.for_all && users.length === 0) searchUsers("");
  }, [formData.for_all]);

  const toggleUser = (userId) => {
    setFormData((prev) => ({
      ...prev,
      user_ids: prev.user_ids.includes(userId)
        ? prev.user_ids.filter((id) => id !== userId)
        : [...prev.user_ids, userId],
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error(t("invalidImageType")); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error(t("imageTooLarge")); return; }
    setFormData((prev) => ({ ...prev, image: file }));
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setFormData((prev) => ({ ...prev, image: null }));
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.ar_title.trim() || !formData.ar_body.trim()) {
      toast.error(t("arRequired"));
      setActiveTab("ar");
      return;
    }
    if (!formData.en_title.trim() || !formData.en_body.trim()) {
      toast.error(t("enRequired"));
      setActiveTab("en");
      return;
    }
    if (!formData.for_all && formData.user_ids.length === 0) {
      toast.error(t("selectUsersRequired"));
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await NotificationsService.storeNotification({
        ar_title: formData.ar_title,
        en_title: formData.en_title,
        ar_body: formData.ar_body,
        en_body: formData.en_body,
        for_all: formData.for_all ? 1 : 0,
        user_ids: formData.for_all ? [] : formData.user_ids,
        image: formData.image,
      });

      if (result.success) {
        toast.success(t("sendSuccess"));
        onSuccess?.();
      } else {
        toast.error(result.message || t("sendError"));
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error(t("sendError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if AR tab is filled
  const arFilled = formData.ar_title.trim() && formData.ar_body.trim();
  const enFilled = formData.en_title.trim() && formData.en_body.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="flex-shrink-0 px-6 py-4 border-b bg-gradient-to-r from-primary/5 to-transparent">
          <DialogTitle className="flex items-center gap-3 text-lg">
            <div className="p-2 rounded-lg bg-primary/10">
              <Send className="h-5 w-5 text-primary" />
            </div>
            {t("sendNotification")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Content Section with Language Tabs */}
            <div className="space-y-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Languages className="h-4 w-4 text-blue-600" />
                  <Label className="text-sm font-semibold text-blue-900">
                    {t("notificationContent")}
                  </Label>
                </div>

                <div className="flex gap-1 p-1 bg-white rounded-lg shadow-sm">
                  <Button
                    type="button"
                    variant={activeTab === "ar" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab("ar")}
                    className={`h-8 px-3 gap-1.5 ${activeTab === "ar" ? "shadow-sm" : ""}`}
                  >
                    {arFilled && <CheckCircle className="h-3 w-3" />}
                    العربية
                  </Button>
                  <Button
                    type="button"
                    variant={activeTab === "en" ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab("en")}
                    className={`h-8 px-3 gap-1.5 ${activeTab === "en" ? "shadow-sm" : ""}`}
                  >
                    {enFilled && <CheckCircle className="h-3 w-3" />}
                    English
                  </Button>
                </div>
              </div>

              {activeTab === "ar" && (
                <div className="space-y-3 p-4 bg-white rounded-lg" dir="rtl">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">{t("arTitle")} *</Label>
                    <Input
                      value={formData.ar_title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, ar_title: e.target.value }))}
                      placeholder={t("arTitlePlaceholder")}
                      className="text-right"
                      maxLength={100}
                    />
                    <p className="text-[10px] text-slate-400 text-left" dir="ltr">
                      {formData.ar_title.length}/100
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">{t("arBody")} *</Label>
                    <textarea
                      value={formData.ar_body}
                      onChange={(e) => setFormData((prev) => ({ ...prev, ar_body: e.target.value }))}
                      placeholder={t("arBodyPlaceholder")}
                      className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm text-right resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                      maxLength={255}
                    />
                    <p className="text-[10px] text-slate-400 text-left" dir="ltr">
                      {formData.ar_body.length}/255
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "en" && (
                <div className="space-y-3 p-4 bg-white rounded-lg" dir="ltr">
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">{t("enTitle")} *</Label>
                    <Input
                      value={formData.en_title}
                      onChange={(e) => setFormData((prev) => ({ ...prev, en_title: e.target.value }))}
                      placeholder={t("enTitlePlaceholder")}
                      maxLength={100}
                    />
                    <p className="text-[10px] text-slate-400 text-right">
                      {formData.en_title.length}/100
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">{t("enBody")} *</Label>
                    <textarea
                      value={formData.en_body}
                      onChange={(e) => setFormData((prev) => ({ ...prev, en_body: e.target.value }))}
                      placeholder={t("enBodyPlaceholder")}
                      className="w-full min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                      maxLength={255}
                    />
                    <p className="text-[10px] text-slate-400 text-right">
                      {formData.en_body.length}/255
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Image Upload Section */}
            <div className="space-y-3 p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-2">
                <ImagePlus className="h-4 w-4 text-primary" />
                <Label className="text-sm font-semibold">
                  {t("uploadImage")}
                </Label>
                <Badge variant="secondary" className="bg-slate-200 text-slate-600 text-[10px]">
                  {t("imageOptional")}
                </Badge>
              </div>

              <div className="flex gap-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative w-44 h-24 rounded-xl overflow-hidden border-2 border-dashed transition-all cursor-pointer group
                    ${imagePreview
                      ? "border-primary/30 bg-primary/5"
                      : "border-slate-200 bg-white hover:border-primary/50 hover:bg-primary/5"
                    }`}
                >
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Upload className="h-5 w-5 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-1.5">
                      <Upload className="h-6 w-6 text-slate-300 group-hover:text-primary transition-colors" />
                      <span className="text-[10px] text-slate-400 group-hover:text-primary transition-colors">
                        {t("clickToUpload")}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {t("uploadImage")}
                  </Button>
                  {imagePreview && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={handleRemoveImage}
                      className="gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                    >
                      <X className="h-4 w-4" />
                      {t("removeImage")}
                    </Button>
                  )}
                  <p className="text-xs text-slate-500">{t("imageHint")}</p>
                </div>
              </div>
            </div>

            {/* Target Audience Section */}
            <div className="space-y-4 p-4 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl border border-purple-100">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-purple-600" />
                <Label className="text-sm font-semibold text-purple-900">{t("targetAudience")}</Label>
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={formData.for_all ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormData((prev) => ({ ...prev, for_all: true, user_ids: [] }))}
                  className={`gap-2 ${formData.for_all ? "" : "bg-white hover:bg-white/80"}`}
                >
                  <Users className="h-3.5 w-3.5" />
                  {t("allUsers")}
                </Button>
                <Button
                  type="button"
                  variant={!formData.for_all ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFormData((prev) => ({ ...prev, for_all: false }))}
                  className={`gap-2 ${!formData.for_all ? "" : "bg-white hover:bg-white/80"}`}
                >
                  <User className="h-3.5 w-3.5" />
                  {t("specificUsers")}
                </Button>
              </div>

              {!formData.for_all && (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute start-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      placeholder={t("searchUsers")}
                      className="ps-10 bg-white"
                      value={userSearch}
                      onChange={(e) => handleUserSearchChange(e.target.value)}
                    />
                  </div>

                  {formData.user_ids.length > 0 && (
                    <Badge className="bg-primary/10 text-primary border-primary/20 gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {formData.user_ids.length} {t("usersSelected")}
                    </Badge>
                  )}

                  <div className="max-h-44 overflow-y-auto bg-white rounded-lg border border-purple-100 shadow-sm">
                    {isLoadingUsers ? (
                      <div className="flex items-center justify-center py-6">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      </div>
                    ) : users.length === 0 ? (
                      <div className="text-center py-6">
                        <Users className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                        <p className="text-sm text-slate-400">{t("noUsersFound")}</p>
                      </div>
                    ) : (
                      users.map((user) => (
                        <label
                          key={user.id}
                          className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer border-b border-slate-50 last:border-0 transition-colors
                            ${formData.user_ids.includes(user.id) ? "bg-primary/5" : "hover:bg-slate-50"}`}
                        >
                          <input
                            type="checkbox"
                            checked={formData.user_ids.includes(user.id)}
                            onChange={() => toggleUser(user.id)}
                            className="rounded border-slate-300 text-primary focus:ring-primary"
                          />
                          <div className="h-8 w-8 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="h-3.5 w-3.5 text-slate-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-700 truncate">
                              {user.name}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-slate-400">
                              <Phone className="h-3 w-3" />
                              {user.phone}
                            </div>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex-shrink-0 px-6 py-4 border-t bg-slate-50/80 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              {tc("cancel")}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("sending")}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  {t("sendNotification")}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
