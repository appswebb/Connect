"use client";

import { useCallback, type Dispatch, type SetStateAction } from "react";
import { supabase } from "../lib/supabase";
import { essentialNotificationTypes } from "../lib/connect-data";
import type { NotificationItem, Profile } from "../types/connect";

type ConnectNotificationsOptions = {
  userId?: string;
  setNotifications: Dispatch<SetStateAction<NotificationItem[]>>;
  setNotificationsOpen: Dispatch<SetStateAction<boolean>>;
  setBrowserNotificationPermission: Dispatch<SetStateAction<string>>;
  setNotice: (message: string) => void;
  fail: (message: string) => void;
  setTab: Dispatch<SetStateAction<string>>;
  setMatchId: Dispatch<SetStateAction<string>>;
  setChatReadOnly: Dispatch<SetStateAction<boolean>>;
  setChatInboxTab: Dispatch<SetStateAction<"conversations" | "requests" | "archived">>;
  setChatView: Dispatch<SetStateAction<"direct" | "rooms">>;
  setQueue: Dispatch<SetStateAction<string>>;
  loadPendingMatch: (id: string) => Promise<void>;
  openProfile: (id: string) => Promise<void>;
  openComments: (id: string) => Promise<void>;
};

export function useConnectNotifications(options: ConnectNotificationsOptions) {
  const {
    userId, setNotifications, setNotificationsOpen, setBrowserNotificationPermission,
    setNotice, fail, setTab, setMatchId, setChatReadOnly, setChatInboxTab,
    setChatView, setQueue, loadPendingMatch, openProfile, openComments,
  } = options;

  const loadNotifications = useCallback(async (uid: string) => {
    const result = await supabase
      .from("notifications")
      .select("id,recipient_id,actor_id,type,title,body,entity_type,entity_id,read_at,created_at")
      .eq("recipient_id", uid)
      .in("type", [...essentialNotificationTypes])
      .order("created_at", { ascending: false })
      .limit(50);
    if (result.error) {
      fail("Não foi possível carregar suas notificações: " + result.error.message);
      return;
    }
    const rows = (result.data || []) as NotificationItem[];
    const actorIds = [...new Set(rows.map((item) => item.actor_id).filter(Boolean) as string[])];
    const people = actorIds.length
      ? await supabase.from("profiles").select("*").in("id", actorIds)
      : { data: [] };
    const profiles = new Map((people.data || []).map((person: any) => [person.id, person as Profile]));
    setNotifications(rows.map((item) => ({ ...item, actor: item.actor_id ? profiles.get(item.actor_id) || null : null })));
  }, [fail, setNotifications]);

  const markNotificationRead = useCallback(async (item: NotificationItem) => {
    if (!userId || item.read_at) return;
    const now = new Date().toISOString();
    const result = await supabase.from("notifications").update({ read_at: now }).eq("id", item.id).eq("recipient_id", userId);
    if (result.error) {
      fail("Não foi possível marcar a notificação como lida: " + result.error.message);
      return;
    }
    setNotifications((old) => old.map((notification) => notification.id === item.id ? { ...notification, read_at: now } : notification));
  }, [userId, fail, setNotifications]);

  const markAllNotificationsRead = useCallback(async () => {
    if (!userId) return;
    const result = await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("recipient_id", userId).is("read_at", null);
    if (result.error) {
      fail("Não foi possível marcar todas como lidas: " + result.error.message);
      return;
    }
    await loadNotifications(userId);
  }, [userId, fail, loadNotifications]);

  const clearReadNotifications = useCallback(async () => {
    if (!userId) return;
    if (!window.confirm("Apagar todas as suas notificações? Essa ação não afeta notificações de outras pessoas.")) return;
    const result = await supabase.from("notifications").delete().eq("recipient_id", userId);
    if (result.error) {
      fail("Não foi possível limpar suas notificações: " + result.error.message);
      return;
    }
    setNotifications([]);
    setNotice("Todas as suas notificações foram limpas.");
  }, [userId, fail, setNotifications, setNotice]);

  const openNotification = useCallback(async (item: NotificationItem) => {
    await markNotificationRead(item);
    setNotificationsOpen(false);
    if ((item.type === "message" || item.type === "new_message" || item.type === "message_request_accepted") && item.entity_id) {
      setMatchId(item.entity_id);
      setChatReadOnly(false);
      setChatInboxTab("conversations");
      setTab("chat");
      return;
    }
    if (item.type === "message_request") {
      setChatInboxTab("requests");
      setChatView("direct");
      setTab("chat");
      return;
    }
    if (item.type === "new_follower" && item.actor_id) {
      setTab("people");
      void openProfile(item.actor_id);
      return;
    }
    if (item.type === "match" && item.entity_id) {
      await loadPendingMatch(item.entity_id);
      setTab("queue");
      return;
    }
    if (item.type === "match_accepted" && item.entity_id) {
      setMatchId(item.entity_id);
      setChatReadOnly(false);
      setQueue("matched");
      setTab("chat");
      return;
    }
    if (item.type === "match_closed") {
      setTab("chat");
      return;
    }
    if (item.type === "subscription_gift_received") {
      setTab("profile");
      return;
    }
    if (item.type === "site_update") {
      setTab("feed");
      return;
    }
    setTab("feed");
    if (item.type === "comment" && item.entity_id) void openComments(item.entity_id);
  }, [markNotificationRead, setNotificationsOpen, setMatchId, setChatReadOnly, setChatInboxTab, setTab, setChatView, openProfile, loadPendingMatch, setQueue, openComments]);

  const enableBrowserNotifications = useCallback(async () => {
    if (!("Notification" in window)) {
      setNotice("Este navegador não oferece notificações do sistema.");
      return;
    }
    const permission = await Notification.requestPermission();
    setBrowserNotificationPermission(permission);
    if (permission === "granted" && "serviceWorker" in navigator) {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch {
        setNotice("Permissão ativada, mas não foi possível preparar os alertas em segundo plano.");
        return;
      }
    }
    setNotice(permission === "granted" ? "Notificações do navegador ativadas." : "A permissão para notificações do navegador não foi concedida.");
  }, [setBrowserNotificationPermission, setNotice]);

  const showBrowserNotification = useCallback(async (item: NotificationItem) => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    if ("serviceWorker" in navigator) {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        await navigator.serviceWorker.ready;
        await registration.showNotification(item.title, { body: item.body, tag: item.id });
        return;
      } catch {}
    }
    try { new Notification(item.title, { body: item.body, tag: item.id }); } catch {}
  }, []);

  return { loadNotifications, markNotificationRead, markAllNotificationsRead, clearReadNotifications, openNotification, enableBrowserNotifications, showBrowserNotification };
}
