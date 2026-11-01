import React, { useEffect, useState } from "react";
import {
  Bell,
  Check,
  X,
  Clock,
  UserCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Layers,
  Sparkles,
  RefreshCw,
  CheckCheck,
  ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import notificationService from "../../backend/notification.js";

const unwrap = (res) => {
  if (res?.data !== undefined) return res.data;
  return res;
};

const formatTimeAgo = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";

  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

const parseRoundNames = (metadata) => {
  if (!metadata?.roundNames) return [];
  try {
    const parsed = JSON.parse(metadata.roundNames);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const Reminders = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("ALL"); // 'ALL' | 'PENDING' | 'JUDGES' | 'UNREAD'
  const [actionLoading, setActionLoading] = useState({}); // { [notifId]: 'ACCEPT' | 'DECLINE' }
  const [toast, setToast] = useState(null); // { type: 'success' | 'error', message: string }

  const showToast = (message, type = "success") => {
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const fetchNotifications = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await notificationService.getNotifications({ limit: 50 });
      const data = unwrap(res);
      setNotifications(data?.notifications || []);
      setUnreadCount(data?.unreadCount || 0);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      showToast(
        err.response?.data?.message || "Failed to load notifications",
        "error"
      );
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleRespond = async (notificationId, action) => {
    setActionLoading((prev) => ({ ...prev, [notificationId]: action }));
    try {
      await notificationService.respondToInvite(notificationId, action);

      // Update in local state immediately
      setNotifications((prev) =>
        prev.map((n) => {
          if (n._id === notificationId) {
            return {
              ...n,
              actionStatus: action === "ACCEPT" ? "ACCEPTED" : "DECLINED",
              read: true,
            };
          }
          return n;
        })
      );

      setUnreadCount((prev) => Math.max(0, prev - 1));

      if (action === "ACCEPT") {
        showToast(
          "Judge invitation accepted! You are now a judge for this hackathon. The organizer has been notified.",
          "success"
        );
      } else {
        showToast(
          "Judge invitation declined. The organizer has been notified.",
          "success"
        );
      }
    } catch (err) {
      showToast(
        err.response?.data?.message ||
          err.message ||
          `Failed to ${action.toLowerCase()} invitation`,
        "error"
      );
    } finally {
      setActionLoading((prev) => ({ ...prev, [notificationId]: null }));
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Mark read error:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      showToast("All notifications marked as read.", "success");
    } catch (err) {
      showToast("Failed to mark all as read", "error");
    }
  };

  // Filter calculations
  const pendingInvitesCount = notifications.filter(
    (n) => n.actionStatus === "PENDING"
  ).length;

  const judgeInvitesCount = notifications.filter(
    (n) => n.type === "JUDGE_INVITE" || n.type === "JUDGE_ASSIGNED"
  ).length;

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === "PENDING") {
      return n.actionStatus === "PENDING";
    }
    if (activeTab === "JUDGES") {
      return n.type === "JUDGE_INVITE" || n.type === "JUDGE_ASSIGNED";
    }
    if (activeTab === "UNREAD") {
      return !n.read;
    }
    return true; // 'ALL'
  });

  return (
    <div className="pt-16 pl-16 sm:pl-20 pr-4 sm:pr-10 pb-16 font-space max-w-5xl mx-auto">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl text-sm transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ${
            toast.type === "success"
              ? "bg-darker-blue text-white border border-white/20"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={18} className="text-light-green shrink-0" />
          ) : (
            <AlertCircle size={18} className="shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-bold text-darker-blue">
              Reminders & Notifications
            </h1>
            {unreadCount > 0 && (
              <span className="bg-darker-blue text-white text-xs font-semibold px-2.5 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Manage your hackathon invitations, judge requests, and live event alerts.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-300 text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition cursor-pointer"
            >
              <CheckCheck size={14} /> Mark all as read
            </button>
          )}

          <button
            onClick={() => fetchNotifications(false)}
            className="p-2 rounded-full border border-gray-300 bg-white hover:bg-gray-50 transition cursor-pointer text-gray-700"
            title="Refresh notifications"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 pb-3">
        <button
          onClick={() => setActiveTab("ALL")}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
            activeTab === "ALL"
              ? "bg-darker-blue text-white"
              : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
          }`}
        >
          All ({notifications.length})
        </button>

        <button
          onClick={() => setActiveTab("PENDING")}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
            activeTab === "PENDING"
              ? "bg-darker-blue text-white"
              : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
          }`}
        >
          <span>Pending Actions</span>
          {pendingInvitesCount > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === "PENDING"
                  ? "bg-light-green text-dark-green"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {pendingInvitesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("JUDGES")}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
            activeTab === "JUDGES"
              ? "bg-darker-blue text-white"
              : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
          }`}
        >
          <span>Judge Invites</span>
          {judgeInvitesCount > 0 && (
            <span className="text-[10px] opacity-75">({judgeInvitesCount})</span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("UNREAD")}
          className={`px-4 py-1.5 rounded-full text-xs font-semibold transition cursor-pointer ${
            activeTab === "UNREAD"
              ? "bg-darker-blue text-white"
              : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-100"
          }`}
        >
          Unread ({unreadCount})
        </button>
      </div>

      {/* Notifications List */}
      {loading ? (
        <div className="py-20 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-3 border-darker-blue border-r-transparent mb-3" />
          <p className="text-gray-500 text-sm">Loading your notifications...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="rounded-3xl border border-gray-200 bg-white/70 backdrop-blur-md p-12 text-center shadow-xs">
          <div className="mx-auto w-14 h-14 rounded-full bg-navbar-bg/40 flex items-center justify-center text-darker-blue mb-3">
            <Bell size={24} />
          </div>
          <h3 className="text-lg font-semibold text-darker-blue">
            No notifications found
          </h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
            {activeTab === "PENDING"
              ? "You're all caught up! There are no pending invitations requiring your response."
              : activeTab === "JUDGES"
              ? "No judge invitation requests or updates at this time."
              : activeTab === "UNREAD"
              ? "You have read all your notifications."
              : "Your inbox is clear. Event reminders and team notifications will appear here."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotifications.map((notif) => {
            const isJudgeInvite = notif.type === "JUDGE_INVITE";
            const isJudgeAssigned = notif.type === "JUDGE_ASSIGNED";
            const isTeamInvite = notif.type === "TEAM_INVITE";
            const isPending = notif.actionStatus === "PENDING";
            const isAccepted = notif.actionStatus === "ACCEPTED";
            const isDeclined = notif.actionStatus === "DECLINED";

            const meta = notif.metadata || {};
            const assignedRounds = parseRoundNames(meta);
            const isSpecificRounds = meta.accessType === "SPECIFIC_ROUNDS";

            const isLoadingAccept = actionLoading[notif._id] === "ACCEPT";
            const isLoadingDecline = actionLoading[notif._id] === "DECLINE";
            const isAnyLoading = isLoadingAccept || isLoadingDecline;

            return (
              <div
                key={notif._id}
                onClick={() => {
                  if (!notif.read && !isPending) {
                    handleMarkAsRead(notif._id);
                  }
                }}
                className={`rounded-2xl border transition-all duration-200 p-5 shadow-xs ${
                  !notif.read
                    ? "bg-white border-darker-blue/30 shadow-md ring-1 ring-darker-blue/10"
                    : "bg-white/80 border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon Avatar */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isJudgeInvite
                        ? "bg-navbar-bg/60 text-darker-blue"
                        : isJudgeAssigned
                        ? "bg-light-green text-dark-green"
                        : isTeamInvite
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {isJudgeInvite ? (
                      <UserCheck size={20} />
                    ) : isJudgeAssigned ? (
                      <CheckCircle2 size={20} />
                    ) : (
                      <Bell size={20} />
                    )}
                  </div>

                  {/* Main Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                            isJudgeInvite
                              ? "bg-darker-blue text-white"
                              : isJudgeAssigned
                              ? "bg-dark-green text-white"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {isJudgeInvite
                            ? "Judge Invitation"
                            : isJudgeAssigned
                            ? "Judge Response"
                            : notif.type.replace(/_/g, " ")}
                        </span>

                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-darker-blue" />
                        )}
                      </div>

                      <span className="text-xs text-gray-600 flex items-center gap-1 font-alef">
                        <Clock size={12} /> {formatTimeAgo(notif.createdAt)}
                      </span>
                    </div>

                    <h3 className="text-base font-semibold text-darker-blue">
                      {notif.title}
                    </h3>

                    <p className="text-sm text-gray-700 mt-1 leading-relaxed">
                      {notif.message}
                    </p>

                    {/* Judge Invite Specific Details */}
                    {isJudgeInvite && (
                      <div className="mt-3.5 rounded-xl border border-gray-200 bg-default-bg/60 p-3.5 text-xs text-gray-700 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-semibold text-darker-blue text-sm">
                            {meta.hackathonName || "Hackathon Event"}
                          </span>

                          <span className="bg-white px-2.5 py-1 rounded-full border border-gray-200 text-gray-600 font-medium">
                            {isSpecificRounds
                              ? "Specific Rounds Evaluation"
                              : "Full Evaluation Access"}
                          </span>
                        </div>

                        {isSpecificRounds && assignedRounds.length > 0 && (
                          <div className="pt-1">
                            <span className="text-gray-500 font-medium block mb-1">
                              Assigned Rounds:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {assignedRounds.map((rName, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-gray-200 text-gray-800"
                                >
                                  <Layers size={11} className="text-gray-500" />
                                  {rName}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Bar */}
                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      {isPending ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleRespond(notif._id, "ACCEPT")}
                            disabled={isAnyLoading}
                            className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-darker-blue text-white text-xs font-semibold hover:bg-dark-blue transition shadow-sm disabled:opacity-60 cursor-pointer"
                          >
                            <Check size={14} />
                            {isLoadingAccept
                              ? "Accepting..."
                              : "Accept Invitation"}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleRespond(notif._id, "DECLINE")}
                            disabled={isAnyLoading}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-gray-300 text-gray-700 text-xs font-semibold hover:bg-gray-100 transition disabled:opacity-60 cursor-pointer"
                          >
                            <X size={14} />
                            {isLoadingDecline ? "Declining..." : "Decline"}
                          </button>
                        </>
                      ) : isAccepted ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-light-green text-dark-green text-xs font-semibold border border-dark-green/20">
                            <CheckCircle2 size={14} />
                            Accepted
                          </span>
                          <span className="text-xs text-gray-500 font-alef">
                            You are an active judge for this hackathon.
                          </span>
                        </div>
                      ) : isDeclined ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold border border-gray-200">
                            <XCircle size={14} />
                            Declined
                          </span>
                        </div>
                      ) : null}

                      {/* Organizer acknowledgment message */}
                      {isJudgeAssigned && (
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                              meta.status === "ACCEPTED"
                                ? "bg-light-green text-dark-green border border-dark-green/20"
                                : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                          >
                            {meta.status === "ACCEPTED" ? (
                              <CheckCircle2 size={14} />
                            ) : (
                              <XCircle size={14} />
                            )}
                            {meta.status === "ACCEPTED"
                              ? "Judge Joined"
                              : "Judge Declined"}
                          </span>

                          <button
                            type="button"
                            onClick={() => navigate("/home")}
                            className="text-xs font-medium text-darker-blue hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            View Hackathon <ExternalLink size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Reminders;
