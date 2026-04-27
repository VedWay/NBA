import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { facultyApi, notificationApi } from "../api/facultyApi";
import { useEffect, useRef, useState } from "react";
import Footer from "../components/Footer";
import { WS_BASE_URL } from "../api/client";
import vjtiLogoEnglish from "../assets/vjti-logo-english.png";
import vjtiLogoMarathi from "../assets/logo-light.gif";
import adminBasePhoto from "../assets/admin-base-photo.svg";
import {
  getStoredNotifications,
  markAllStoredNotificationsRead,
  markStoredNotificationRead,
  mergeStoredNotifications,
} from "../utils/notificationStore";

export default function AppLayout() {
  const location = useLocation();
  const { isAuthenticated, role, logout, token, user } = useAuth();
  const canUseNotifications = isAuthenticated && (role === "faculty" || role === "admin");
  const canUseProfileMenu = isAuthenticated && (role === "faculty" || role === "admin");

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [openNotifications, setOpenNotifications] = useState(false);
  const [openProfileMenu, setOpenProfileMenu] = useState(false);
  const [notificationFilter, setNotificationFilter] = useState("all");
  const [cachedNotifications, setCachedNotifications] = useState([]);
  const [showEnglishLogo, setShowEnglishLogo] = useState(true);

  const previousNotificationsRef = useRef(null);
  const queryClient = useQueryClient();
  const storageUserId = user?.id || "";

  const routeNavItems = [
    { label: "Home", to: "/" },
    { label: "Faculty", to: "/faculty" },
    { label: "Students", to: "/students" },
    ...(isAuthenticated && role === "faculty" ? [{ label: "Dashboard", to: "/dashboard" }] : []),
    ...(isAuthenticated && role === "student" ? [{ label: "My Desk", to: "/student-desk" }] : []),
    ...(isAuthenticated && role === "admin" ? [{ label: "Admin", to: "/admin" }] : []),
  ];

  const { data: facultyList = [] } = useQuery({
    queryKey: ["faculty", "topbar"],
    queryFn: () => facultyApi.list(token),
    enabled: Boolean(isAuthenticated && token && (role === "faculty" || role === "admin")),
  });

  const ownFaculty =
    facultyList.find((f) => f.user_id === user?.id) ||
    facultyList.find((f) => f.email?.toLowerCase() === user?.email?.toLowerCase()) ||
    null;

  const adminName = user?.email ? user.email.split("@")[0] : "Admin";
  const adminPhoto = ownFaculty?.photo_url || adminBasePhoto;

  const {
    data: notificationsData = [],
    isLoading: notificationsLoading,
    isError: notificationsError,
    error: notificationsErrorObject,
    refetch: refetchNotifications,
  } = useQuery({
    queryKey: ["notifications", notificationFilter],
    queryFn: () => notificationApi.list(token, { unreadOnly: notificationFilter === "unread", limit: 150 }),
    enabled: Boolean(canUseNotifications && token),
    refetchInterval: 10000,
  });

  const notificationsFromApi = Array.isArray(notificationsData) ? notificationsData : [];

  const notifications = (() => {
    const merged = [...notificationsFromApi, ...cachedNotifications];
    const deduped = new Map();

    for (const item of merged) {
      deduped.set(item.id, item);
    }

    return Array.from(deduped.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  })();

  useEffect(() => {
    if (!storageUserId) return;
    setCachedNotifications(getStoredNotifications(storageUserId));
  }, [storageUserId]);

  useEffect(() => {
    if (!storageUserId || !notificationsFromApi.length) return;
    const merged = mergeStoredNotifications(storageUserId, notificationsFromApi);
    setCachedNotifications(merged);
  }, [storageUserId, notificationsFromApi]);

  useEffect(() => {
    setMobileNavOpen(false);
    setOpenNotifications(false);
    setOpenProfileMenu(false);
  }, [location.pathname]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setShowEnglishLogo((current) => !current);
    }, 2000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const markRead = useMutation({
    mutationFn: (id) => notificationApi.markRead(id, token),
    onSuccess: (_data, id) => {
      markStoredNotificationRead(storageUserId, id);
      setCachedNotifications(getStoredNotifications(storageUserId));
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationApi.markAllRead(token),
    onSuccess: () => {
      markAllStoredNotificationsRead(storageUserId);
      setCachedNotifications(getStoredNotifications(storageUserId));
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  useEffect(() => {
    previousNotificationsRef.current = notifications;
  }, [notifications]);

  useEffect(() => {
    if (!canUseNotifications || !token) {
      return undefined;
    }

    const wsUrl = `${WS_BASE_URL}/ws?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(wsUrl);

    ws.onmessage = (event) => {
      try {
        const packet = JSON.parse(event.data);
        if (packet?.event !== "notification.created" || !packet?.payload?.id) {
          return;
        }

        const incoming = packet.payload;
        if (storageUserId) {
          const merged = mergeStoredNotifications(storageUserId, [incoming]);
          setCachedNotifications(merged);
        }

        queryClient.setQueryData(["notifications"], (current = []) => {
          if (current.some((item) => item.id === incoming.id)) {
            return current;
          }
          return [incoming, ...current];
        });
      } catch {
        // Ignore malformed websocket payloads.
      }
    };

    return () => {
      ws.close();
    };
  }, [canUseNotifications, token, queryClient, storageUserId]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const renderNotificationsPanel = (panelClassName) => (
    <div className={panelClassName}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-slate-800">Recent Notifications</h3>
        <button
          type="button"
          onClick={() => markAllRead.mutate()}
          disabled={markAllRead.isPending || !notifications.length}
          className="rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 disabled:opacity-50"
        >
          {markAllRead.isPending ? "Marking..." : "Mark all read"}
        </button>
      </div>

      <div className="mb-2 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setNotificationFilter("all")}
          className={`rounded px-2 py-1 text-[11px] font-semibold ${
            notificationFilter === "all"
              ? "bg-slate-800 text-white"
              : "border border-slate-300 bg-white text-slate-700"
          }`}
        >
          All
        </button>

        <button
          type="button"
          onClick={() => setNotificationFilter("unread")}
          className={`rounded px-2 py-1 text-[11px] font-semibold ${
            notificationFilter === "unread"
              ? "bg-slate-800 text-white"
              : "border border-slate-300 bg-white text-slate-700"
          }`}
        >
          Unread
        </button>
      </div>

      <div className="max-h-64 space-y-2 overflow-auto">
        {notificationsLoading && (
          <p className="rounded-lg bg-white/90 px-2 py-2 text-xs text-slate-600">Loading notifications...</p>
        )}

        {notificationsError && (
          <div className="rounded-lg border border-rose-300 bg-rose-50 px-2 py-2 text-xs text-rose-700">
            <p>{notificationsErrorObject?.message || "Unable to load notifications."}</p>
            <button
              type="button"
              onClick={() => refetchNotifications()}
              className="mt-2 rounded border border-rose-300 bg-white px-2 py-1 font-semibold text-rose-700"
            >
              Retry
            </button>
          </div>
        )}

        {!notificationsLoading &&
          !notificationsError &&
          notifications.map((n) => (
            <button
              key={n.id}
              onClick={() => markRead.mutate(n.id)}
              className={`w-full rounded-xl border px-2 py-2 text-left text-xs ${
                n.is_read ? "bg-white/90 text-slate-700" : "border-amber-300 bg-amber-50 text-slate-800"
              }`}
            >
              <p className="font-semibold text-slate-800">{n.title || "Notification"}</p>
              <p className="text-slate-700">{n.message || "No details available."}</p>
              {n.created_at && (
                <p className="mt-1 text-[11px] text-slate-500">{new Date(n.created_at).toLocaleString()}</p>
              )}
            </button>
          ))}

        {!notificationsLoading && !notificationsError && !notifications.length && (
          <p className="rounded-lg bg-white/90 px-2 py-2 text-xs text-slate-600">
            {role === "admin"
              ? "No admin notifications yet. New faculty submissions and updates will appear here."
              : notificationFilter === "unread"
                ? "No unread notifications."
                : "No notifications yet."}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="liquid-skin min-h-screen text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-0 md:px-8">

          {/* Logo */}
          <Link to="/" className="flex shrink-0 items-center py-2">
            <img
              src={showEnglishLogo ? vjtiLogoEnglish : vjtiLogoMarathi}
              alt="VJTI"
              className="h-11 w-auto md:h-13"
            />
          </Link>

          {/* Center nav */}
          <nav className="hidden items-center gap-0.5 md:flex">
            {routeNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-[#9d2235] text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Right controls */}
          <div className="hidden items-center gap-2 md:flex">

            {/* Notifications bell */}
            {canUseNotifications && (
              <div className="relative">
                <button
                  onClick={() => { setOpenNotifications((v) => { if (!v) refetchNotifications(); return !v; }); }}
                  className="relative flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100"
                  title="Notifications"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                  {unreadCount > 0 && (
                    <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#9d2235] px-1 text-[9px] font-extrabold text-white leading-none">{unreadCount}</span>
                  )}
                </button>
                {openNotifications && renderNotificationsPanel("liquid-glass absolute right-0 top-full z-20 mt-2 w-80 rounded-xl p-3")}
              </div>
            )}

            {/* Profile dropdown — faculty */}
            {canUseProfileMenu && role === "faculty" && ownFaculty && (
              <div className="relative">
                <button
                  onClick={() => setOpenProfileMenu((v) => !v)}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-1.5 transition hover:bg-slate-50"
                >
                  <img
                    src={ownFaculty.photo_url || "https://via.placeholder.com/40x40?text=F"}
                    alt={ownFaculty.name || "Profile"}
                    className="h-7 w-7 rounded-full object-cover"
                  />
                  <span className="max-w-32 truncate text-xs font-semibold text-slate-700">{ownFaculty.name}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                {openProfileMenu && (
                  <div className="absolute right-0 top-full z-20 mt-2 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
                    <Link to={`/faculty/${ownFaculty.id}`} onClick={() => setOpenProfileMenu(false)}
                      className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100">My Profile</Link>
                    <button onClick={() => { setOpenProfileMenu(false); logout(); }}
                      className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-rose-600 transition hover:bg-rose-50">Sign Out</button>
                  </div>
                )}
              </div>
            )}


            {/* Role badge */}
            <span className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              {isAuthenticated ? String(role || "").toUpperCase() : "GUEST"}
            </span>

            {/* Login / Logout */}
            {isAuthenticated ? (
              <button
                onClick={logout}
                className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
              >
                Logout
              </button>
            ) : (
              <Link
                to="/login"
                className="rounded-lg bg-[#9d2235] px-5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#b51a34]"
              >
                Login
              </Link>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileNavOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 md:hidden"
          >
            {mobileNavOpen
              ? <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              : <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            }
          </button>
        </div>

        {mobileNavOpen && (
          <div className="border-t border-slate-200 bg-white px-4 py-4 md:hidden">
            <nav className="space-y-1">
              {routeNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setMobileNavOpen(false)}
                  className={({ isActive }) =>
                    `block rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                      isActive ? "bg-[#9d2235] text-white" : "text-slate-700 hover:bg-slate-100"
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <div className="mt-4 flex items-center gap-2 border-t border-slate-100 pt-4">
              <span className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-center text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                {isAuthenticated ? String(role || "").toUpperCase() : "GUEST"}
              </span>
              {isAuthenticated ? (
                <button
                  className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-rose-50 hover:text-rose-700"
                  onClick={() => { setMobileNavOpen(false); logout(); }}
                >
                  Logout
                </button>
              ) : (
                <Link
                  to="/login"
                  className="rounded-lg bg-[#9d2235] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#b51a34]"
                  onClick={() => setMobileNavOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
            {canUseNotifications && (
              <div className="mt-3">
                <button
                  onClick={() => { setOpenNotifications((v) => { if (!v) refetchNotifications(); return !v; }); }}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2 text-left text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Notifications {unreadCount > 0 ? `(${unreadCount})` : ""}
                </button>
                {openNotifications && renderNotificationsPanel("mt-2 rounded-xl border border-slate-200 bg-white p-3 shadow")}
              </div>
            )}
          </div>
        )}
      </header>

      <main className="campus-page-main min-h-[calc(100vh-6rem)]">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
