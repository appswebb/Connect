"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  Activity,
  Archive,
  ArrowRight,
  Ban,
  Bell,
  BellRing,
  Camera,
  Check,
  CheckCheck,
  Compass,
  Download,
  FileText,
  Flag,
  Globe2,
  Heart,
  ImagePlus,
  LogOut,
  Mail,
  MapPin,
  MapPinned,
  Menu,
  MessageCircle,
  MessageSquare,
  Mic,
  Minus,
  Paperclip,
  Radio,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Square,
  Sun,
  Moon,
  Trash2,
  CreditCard,
  UserRound,
  UserSearch,
  Eye,
  Users,
  X,
} from "lucide-react";
import { supabase } from "./lib/supabase";
import ImageCropper from "./components/ImageCropper";
import SubscriptionPlans from "./components/SubscriptionPlans";
import BrazilLocationPicker from "./components/BrazilLocationPicker";
import AppDownload from "./components/AppDownload";
import { brazilStates } from "./lib/brazil";
import Avatar from "./components/ConnectAvatar";
import ConnectRooms from "./components/ConnectRooms";
import ConnectLanding from "./components/ConnectLanding";
import ConnectAuthGate from "./components/ConnectAuthGate";
import { useConnectFeed } from "./hooks/useConnectFeed";
import { useConnectRooms } from "./hooks/useConnectRooms";
import { useConnectLives } from "./hooks/useConnectLives";
import ConnectLives from "./components/ConnectLives";
import ConnectNavigation from "./components/ConnectNavigation";
import ConnectFeed from "./components/ConnectFeed";
import { useConnectNotifications } from "./hooks/useConnectNotifications";
import { ago } from "./lib/connect-utils";
import { essentialNotificationTypes, genders, preferences } from "./lib/connect-data";
import type { Profile, Post, Comment, Message, ChatHistoryItem, MessageRequestItem, RoomMessage, LiveSessionRow, NotificationItem } from "./types/connect";

export default function Home() {
  const [session, setSession] = useState<Session | null>(null),
    [profile, setProfile] = useState<Profile | null>(null),
    [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"signup" | "signin">("signup"),
    [authScreen, setAuthScreen] = useState<"home" | "auth" | "demo">("home"),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [demoUsername, setDemoUsername] = useState(""),
    [demoPassword, setDemoPassword] = useState(""),
    [name, setName] = useState(""),
    [username, setUsername] = useState(""),
    [gender, setGender] = useState("woman"),
    [description, setDescription] = useState(""),
    [looking, setLooking] = useState("any");
  const [tab, setTab] = useState("feed"),
    [mobileMoreOpen, setMobileMoreOpen] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  const [chatView, setChatView] = useState<"direct" | "rooms">("direct"),
    [roomCode, setRoomCode] = useState("BR"),
    [roomMessages, setRoomMessages] = useState<RoomMessage[]>([]),
    [roomDraft, setRoomDraft] = useState(""),
    [roomReply, setRoomReply] = useState<RoomMessage | null>(null);
  const [lives, setLives] = useState<LiveSessionRow[]>([]),
    [liveTitle, setLiveTitle] = useState(""),
    [activeLive, setActiveLive] = useState<LiveSessionRow | null>(null);
  const [queueStateFilter, setQueueStateFilter] = useState(""),
    [queueCityFilter, setQueueCityFilter] = useState(""),
    [queueQuota, setQueueQuota] = useState({ used: 0, remaining: 20, unlimited: false }),
    [lookingForSetting, setLookingForSetting] = useState("any");
  const [posts, setPosts] = useState<Post[]>([]),
    [ownPosts, setOwnPosts] = useState<Post[]>([]),
    [body, setBody] = useState(""),
    [file, setFile] = useState<File | null>(null),
    [comments, setComments] = useState<Comment[]>([]),
    [commentPost, setCommentPost] = useState(""),
    [commentText, setCommentText] = useState("");
  const [communityProfiles, setCommunityProfiles] = useState<Profile[]>([]),
    [peopleSearch, setPeopleSearch] = useState(""),
    [peopleFilter, setPeopleFilter] = useState("all"),
    [onlinePeople, setOnlinePeople] = useState<string[]>([]);
  const [queue, setQueue] = useState("idle"),
    [matchId, setMatchId] = useState(""),
    [partner, setPartner] = useState<Profile | null>(null),
    [messages, setMessages] = useState<Message[]>([]),
    [draft, setDraft] = useState("");
  const [pendingMatchId, setPendingMatchId] = useState(""),
    [pendingPartner, setPendingPartner] = useState<Profile | null>(null),
    [showMatchIntro, setShowMatchIntro] = useState(false),
    [pendingExpiresAt, setPendingExpiresAt] = useState(""),
    [pendingSeconds, setPendingSeconds] = useState(180),
    [pendingAccepted, setPendingAccepted] = useState(false),
    [pendingOtherAccepted, setPendingOtherAccepted] = useState(false),
    [chatReadOnly, setChatReadOnly] = useState(false),
    [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [chatMinimized, setChatMinimized] = useState(false),
    [pendingChatMinimized, setPendingChatMinimized] = useState(false),
    [recording, setRecording] = useState(false);
  const [relationship, setRelationship] = useState({
      following: false,
      follows_me: false,
      mutual: false,
      followers: 0,
      following_count: 0,
    }),
    [ownSocialCounts, setOwnSocialCounts] = useState({ followers: 0, following: 0 }),
    [ownSocialList, setOwnSocialList] = useState<{ kind: "followers" | "following"; people: Profile[] } | null>(null),
    [messageRecipient, setMessageRecipient] = useState<Profile | null>(null),
    [directMessageDraft, setDirectMessageDraft] = useState(""),
    [messageRequests, setMessageRequests] = useState<MessageRequestItem[]>([]),
    [chatInboxTab, setChatInboxTab] = useState<"conversations" | "requests" | "archived">("conversations");
  const recorderRef = useRef<MediaRecorder | null>(null),
    audioChunksRef = useRef<Blob[]>([]),
    recordingStartedRef = useRef(0),
    chatFileRef = useRef<HTMLInputElement | null>(null);
  const [bio, setBio] = useState(""),
    [displayNameSetting, setDisplayNameSetting] = useState(""),
    [usernameSetting, setUsernameSetting] = useState(""),
    [genderSetting, setGenderSetting] = useState(""),
    [genderDescriptionSetting, setGenderDescriptionSetting] = useState(""),
    [stateCode, setStateCode] = useState(""),
    [city, setCity] = useState(""),
    [locationVisible, setLocationVisible] = useState(false),
    [locationOpen, setLocationOpen] = useState(false),
    [locating, setLocating] = useState(false),
    [deletionDue, setDeletionDue] = useState("");
  const locationDetectionStartedRef = useRef(new Set<string>());
  const [cropFile, setCropFile] = useState<File | null>(null),
    [cropTarget, setCropTarget] = useState<"post" | "avatar" | "banner" | "chat" | null>(null);
  const [reportTarget, setReportTarget] = useState(""),
    [reportTargetType, setReportTargetType] = useState("profile"),
    [reportTargetId, setReportTargetId] = useState(""),
    [reportCategory, setReportCategory] = useState("spam"),
    [reportDetails, setReportDetails] = useState(""),
    [blockedPeople, setBlockedPeople] = useState<Profile[]>([]);
  const [viewingProfile, setViewingProfile] = useState<Profile | null>(null),
    [showVisitorPreview, setShowVisitorPreview] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]),
    [notificationsOpen, setNotificationsOpen] = useState(false),
    [browserNotificationPermission, setBrowserNotificationPermission] = useState("default"),
    [userMenuOpen, setUserMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light"),
    [themeReady, setThemeReady] = useState(false);
  useEffect(() => {
    const saved = window.localStorage.getItem("connect-theme");
    if (saved === "dark" || saved === "light") setTheme(saved);
    setThemeReady(true);
  }, []);
  useEffect(() => {
    if (!themeReady) return;
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem("connect-theme", theme);
  }, [theme, themeReady]);
  const fail = useCallback((s: string) => {
    setError(s);
    setNotice("");
  }, []);

  useEffect(() => {
    if (!error && !notice) return;
    const timeout = window.setTimeout(() => {
      setError("");
      setNotice("");
    }, 6500);
    return () => window.clearTimeout(timeout);
  }, [error, notice]);

  const { loadLives, createLive, joinLive, endLiveSession, leaveLive } = useConnectLives({
    userId: session?.user.id,
    liveTitle,
    activeLive,
    setLives,
    setActiveLive,
    setLiveTitle,
    setTab,
    setBusy,
    setNotice,
    fail,
  });

  const { loadRoomMessages, sendRoomMessage, deleteRoomMessage } = useConnectRooms({
    userId: session?.user.id,
    roomCode,
    roomDraft,
    roomReply,
    setRoomDraft,
    setRoomReply,
    setRoomMessages,
    fail,
  });

  const { loadOwnPosts, loadFeed, publish, like, removePost, openComments, comment } = useConnectFeed({
    userId: session?.user.id,
    body,
    file,
    setBody,
    setFile,
    commentPost,
    commentText,
    setCommentPost,
    setCommentText,
    setPosts,
    setOwnPosts,
    setComments,
    setBusy,
    setNotice,
    fail,
    upload,
  });

  const {
    loadNotifications,
    markNotificationRead,
    markAllNotificationsRead,
    clearReadNotifications,
    openNotification,
    enableBrowserNotifications,
    showBrowserNotification,
  } = useConnectNotifications({
    userId: session?.user.id,
    setNotifications,
    setNotificationsOpen,
    setBrowserNotificationPermission,
    setNotice,
    fail,
    setTab,
    setMatchId,
    setChatReadOnly,
    setChatInboxTab,
    setChatView,
    setQueue,
    loadPendingMatch,
    loadLives,
    openProfile,
    openComments,
  });

  async function detectAndSaveLocation(uid: string, force = false) {
    if (locationDetectionStartedRef.current.has(uid) && !force) return;
    locationDetectionStartedRef.current.add(uid);
    setLocating(true);
    if (!("geolocation" in navigator)) {
      setLocating(false);
      setNotice("Seu navegador não oferece localização automática. Escolha uma cidade manualmente no ícone de localização.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(
            "https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=" +
              encodeURIComponent(latitude) +
              "&longitude=" +
              encodeURIComponent(longitude) +
              "&localityLanguage=pt",
          );
          if (!response.ok) throw new Error("Falha ao identificar cidade");
          const place = await response.json();
          const detectedCity = String(place.city || place.locality || place.localityInfo?.administrative?.[2]?.name || "").trim();
          const subdivision = String(place.principalSubdivisionCode || "").toUpperCase();
          const detectedState = subdivision.startsWith("BR-") ? subdivision.slice(-2) : subdivision.slice(-2);
          if (!detectedCity || !Object.prototype.hasOwnProperty.call(brazilStates, detectedState))
            throw new Error("Cidade ou estado não identificados");
          const saved = await supabase.from("profiles").update({ city: detectedCity, state_code: detectedState }).eq("id", uid);
          if (saved.error) throw saved.error;
          setCity(detectedCity);
          setStateCode(detectedState);
          setProfile((old) => (old ? { ...old, city: detectedCity, state_code: detectedState } : old));
          setQueueCityFilter(detectedCity);
          setQueueStateFilter(detectedState);
          setLocating(false);
          setNotice("Localização detectada: " + detectedCity + " · " + detectedState + ".");
        } catch {
          setLocating(false);
          setNotice("Não foi possível identificar sua cidade. Você pode escolher outra no ícone de localização.");
        }
      },
      () => {
        setLocating(false);
        setNotice(
          "A permissão de localização foi negada ou está indisponível. Você pode escolher a cidade manualmente no ícone de localização.",
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 300000 },
    );
  }
  async function loadProfile(uid: string) {
    const [profileResult, followersResult, followingResult] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
      supabase.from("follows").select("follower_id", { count: "exact", head: true }).eq("followed_id", uid),
      supabase.from("follows").select("followed_id", { count: "exact", head: true }).eq("follower_id", uid),
    ]);
    const { data, error } = profileResult;
    setOwnSocialCounts({ followers: followersResult.count || 0, following: followingResult.count || 0 });
    if (error) {
      fail(error.message);
      return;
    }
    setProfile(data as Profile | null);
    setLookingForSetting(data?.looking_for?.[0] || "any");
    setBio(data?.bio || "");
    setDisplayNameSetting(data?.display_name || "");
    setUsernameSetting(data?.username || "");
    setGenderSetting(data?.gender || "");
    setGenderDescriptionSetting(data?.gender_description || "");
    setStateCode(data?.state_code || "");
    setCity(data?.city || "");
    setLocationVisible(Boolean(data?.location_visible));
    setQueueStateFilter((old) => old || data?.state_code || "");
    setQueueCityFilter((old) => old || data?.city || "");
    if (data && (!data.city || !data.state_code)) void detectAndSaveLocation(uid);
    const deletion = await supabase.from("account_deletion_requests").select("scheduled_for").eq("user_id", uid).maybeSingle();
    setDeletionDue(deletion.data?.scheduled_for || "");
    if (data) {
      const q = await supabase.from("queue_entries").select("status,match_id").eq("user_id", uid).maybeSingle();
      if (q.data?.status === "waiting") setQueue("waiting");
      if (q.data?.status === "matched" && q.data.match_id) {
        const m = await supabase.from("matches").select("*").eq("id", q.data.match_id).maybeSingle();
        if (m.data?.match_status === "accepted") {
          setQueue("matched");
          setMatchId(q.data.match_id);
        } else if (m.data?.match_status === "pending") {
          setQueue("matched");
          setPendingMatchId(q.data.match_id);
          await loadPendingMatch(q.data.match_id);
        }
      }
    }
    await Promise.all([loadChatHistory(uid), loadMessageRequests(uid)]);
  }
  async function loadPendingMatch(id: string) {
    const m = await supabase.from("matches").select("*").eq("id", id).maybeSingle();
    if (!m.data || m.data.match_status !== "pending") return;
    const other = m.data.user_one === session?.user.id ? m.data.user_two : m.data.user_one;
    const p = await supabase.from("profiles").select("*").eq("id", other).maybeSingle();
    setPendingMatchId(id);
    setPendingPartner(p.data as Profile | null);
    setShowMatchIntro(true);
    setPendingExpiresAt(m.data.expires_at || new Date(Date.now() + 180000).toISOString());
    setPendingSeconds(Math.max(0, Math.ceil((new Date(m.data.expires_at || Date.now() + 180000).getTime() - Date.now()) / 1000)));
    setPendingAccepted(Boolean(m.data.user_one === session?.user.id ? m.data.user_one_accepted_at : m.data.user_two_accepted_at));
    setPendingOtherAccepted(Boolean(m.data.user_one === session?.user.id ? m.data.user_two_accepted_at : m.data.user_one_accepted_at));
    setQueue("matched");
    setTab("queue");
  }
  async function loadChatHistory(uid: string) {
    const r = await supabase
      .from("matches")
      .select("*")
      .or("user_one.eq." + uid + ",user_two.eq." + uid)
      .eq("match_status", "accepted")
      .order("created_at", { ascending: false })
      .limit(100);
    if (r.error) return;
    const rows = r.data || [];
    if (!rows.length) {
      setChatHistory([]);
      return;
    }
    const prefs = await supabase.from("chat_user_preferences").select("match_id,status").eq("user_id", uid);
    const hidden = new Map((prefs.data || []).map((x: any) => [x.match_id, x.status]));
    const visible = rows.filter((m: any) => !hidden.has(m.id));
    const archived = rows.filter((m: any) => hidden.get(m.id) === "archived");
    const shown = chatInboxTab === "archived" ? archived : visible.filter((m: any) => hidden.get(m.id) !== "deleted");
    const ids = [...new Set(shown.map((m: any) => (m.user_one === uid ? m.user_two : m.user_one)))];
    if (!ids.length) {
      setChatHistory([]);
      return;
    }
    const people = await supabase.from("profiles").select("*").in("id", ids);
    const map = new Map((people.data || []).map((p: any) => [p.id, p]));
    setChatHistory(
      shown.flatMap((m: any) => {
        const p = map.get(m.user_one === uid ? m.user_two : m.user_one) as Profile | undefined;
        return p ? [{ id: m.id, created_at: m.created_at, partner: p }] : [];
      }),
    );
  }
  async function setChatHistoryStatus(id: string, status: "archived" | "deleted" | "active") {
    if (!session?.user.id) return;
    if (status === "deleted" && !window.confirm("Apagar esta conversa do seu histórico? As mensagens da outra pessoa serão preservadas."))
      return;
    const result =
      status === "active"
        ? await supabase.from("chat_user_preferences").delete().eq("user_id", session.user.id).eq("match_id", id)
        : await supabase
            .from("chat_user_preferences")
            .upsert(
              { user_id: session.user.id, match_id: id, status, updated_at: new Date().toISOString() },
              { onConflict: "user_id,match_id" },
            );
    if (result.error) {
      fail("Não foi possível atualizar a conversa: " + result.error.message);
      return;
    }
    if (matchId === id) {
      setMatchId("");
      setPartner(null);
      setMessages([]);
      setChatReadOnly(false);
    }
    await loadChatHistory(session.user.id);
    setNotice(
      status === "archived" ? "Conversa arquivada." : "active" === status ? "Conversa restaurada." : "Conversa apagada do seu histórico.",
    );
  }
  async function loadCommunityProfiles(uid: string) {
    const r = await supabase.from("profiles").select("*").neq("id", uid).order("created_at", { ascending: false }).limit(1000);
    if (r.error) {
      fail("Não foi possível carregar os perfis da comunidade: " + r.error.message);
      return;
    }
    setCommunityProfiles((r.data || []) as Profile[]);
  }
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/Connect/sw.js", { scope: "/Connect/" }).catch(() => {});
    }
  }, []);
  useEffect(() => {
    let alive = true;
    const fallback = setTimeout(() => {
      if (alive) setLoading(false);
    }, 8000);
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (alive) setSession(data.session);
      })
      .catch(() => {
        if (alive) setSession(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
        clearTimeout(fallback);
      });
    const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => {
      if (alive) {
        setSession(s);
        setLoading(false);
      }
      if (!s) {
        setProfile(null);
        setPosts([]);
        setMatchId("");
        setQueue("idle");
      }
    });
    return () => {
      alive = false;
      clearTimeout(fallback);
      listener.subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (session?.user.id) {
      void loadProfile(session.user.id);
      void loadFeed(session.user.id);
    }
  }, [session]);
  useEffect(() => {
    if (session?.user.id) void loadCommunityProfiles(session.user.id);
  }, [session]);
  useEffect(() => {
    if (!session?.user.id) return;
    const channel = supabase.channel("connect-global-presence", { config: { presence: { key: session.user.id } } });
    const refresh = () => {
      const state = channel.presenceState() as Record<string, Array<{ user_id?: string }>>;
      const ids = Object.values(state)
        .flat()
        .map((x) => x.user_id)
        .filter((x): x is string => !!x);
      setOnlinePeople([...new Set(ids)]);
    };
    channel
      .on("presence", { event: "sync" }, refresh)
      .on("presence", { event: "join" }, refresh)
      .on("presence", { event: "leave" }, refresh)
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ user_id: session.user.id, online_at: new Date().toISOString() });
          refresh();
        }
      });
    return () => {
      void supabase.removeChannel(channel);
      setOnlinePeople([]);
    };
  }, [session?.user.id]);

  useEffect(() => {
    if (!session?.user.id) return;
    const channel = supabase
      .channel("connect-people-directory")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => void loadCommunityProfiles(session.user.id))
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [session?.user.id]);

  useEffect(() => {
    if (!session?.user.id) return;
    const uid = session.user.id;
    const channel = supabase
      .channel("connect-message-requests-" + uid)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "message_requests", filter: "recipient_id=eq." + uid },
        () => void loadMessageRequests(uid),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [session?.user.id]);
  useEffect(() => {
    if (!session?.user.id || !profile) return;
    const uid = session.user.id;
    void loadNotifications(uid);
    if (typeof window !== "undefined" && "Notification" in window) setBrowserNotificationPermission(Notification.permission);
    const channel = supabase
      .channel("connect-notifications-" + uid)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: "recipient_id=eq." + uid },
        (payload) => {
          const item = payload.new as NotificationItem;
          if (!essentialNotificationTypes.includes(item.type as (typeof essentialNotificationTypes)[number])) return;
          void loadNotifications(uid);
          if (
            typeof window !== "undefined" &&
            "Notification" in window &&
            Notification.permission === "granted" &&
            document.visibilityState !== "visible"
          ) {
            void showBrowserNotification(item);
          } else if (document.visibilityState === "visible") {
            setNotice(item.title + " · " + item.body);
          }
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [session, profile]);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("demo") === "1") setAuthScreen("demo");
  }, []);
  useEffect(() => {
    if (!session?.user.id || !profile) return;
    const c = supabase
      .channel("connect-social-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, () => void loadFeed(session.user.id))
      .on("postgres_changes", { event: "*", schema: "public", table: "post_likes" }, () => void loadFeed(session.user.id))
      .on("postgres_changes", { event: "*", schema: "public", table: "comments" }, () => void loadFeed(session.user.id))
      .on("postgres_changes", { event: "*", schema: "public", table: "queue_entries", filter: "user_id=eq." + session.user.id }, (p) => {
        if (p.eventType === "DELETE") {
          setQueue("idle");
          setPendingMatchId("");
          setPendingPartner(null);
          setPendingExpiresAt("");
        } else {
          const r = p.new as any;
          if (r.status === "matched" && r.match_id) {
            setQueue("matched");
            setPendingMatchId(r.match_id);
            void loadPendingMatch(r.match_id);
          } else if (r.status === "waiting") setQueue("waiting");
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "matches" }, (p) => {
        const m = p.new as any;
        if (m.user_one !== session.user.id && m.user_two !== session.user.id) return;
        if (m.match_status === "accepted" && m.ended_at) {
          setChatReadOnly(true);
          setQueue("idle");
          void loadChatHistory(session.user.id);
          setNotice("Conversa encerrada. O histórico continua salvo.");
        } else if (m.match_status === "accepted") {
          setPendingMatchId("");
          setPendingPartner(null);
          setPendingExpiresAt("");
          setPendingAccepted(false);
          setPendingOtherAccepted(false);
          setMatchId(m.id);
          setChatReadOnly(false);
          setQueue("matched");
          setTab("chat");
          void loadChatHistory(session.user.id);
          setNotice("Match confirmado! A conversa foi salva no seu histórico.");
        } else if (m.match_status === "pending") {
          setPendingOtherAccepted(Boolean(m.user_one === session.user.id ? m.user_two_accepted_at : m.user_one_accepted_at));
        } else if (m.match_status === "declined" || m.match_status === "expired") {
          setPendingMatchId("");
          setPendingPartner(null);
          setPendingExpiresAt("");
          setPendingAccepted(false);
          setPendingOtherAccepted(false);
          setPendingChatMinimized(false);
          setQueue("idle");
          setNotice(
            m.match_status === "declined"
              ? "A outra pessoa não aceitou. Você já pode procurar alguém novo."
              : "O tempo da conexão acabou. Procure outra pessoa.",
          );
        }
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(c);
    };
  }, [session, profile]);
  useEffect(() => {
    if (tab === "settings") void loadBlockedPeople();
    if (tab === "profile" && session?.user.id) void loadOwnPosts(session.user.id);
  }, [tab, session]);
  useEffect(() => {
    if (tab !== "lives" || !session?.user.id) return;
    void loadLives();
    const channel = supabase
      .channel("connect-live-list")
      .on("postgres_changes", { event: "*", schema: "public", table: "live_sessions" }, () => {
        void loadLives();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [tab, session]);
  useEffect(() => {
    let active = true;
    if (!session?.user.id)
      return () => {
        active = false;
      };
    supabase.rpc("get_queue_search_quota").then(({ data, error }) => {
      if (!active || error) return;
      const q = Array.isArray(data) ? data[0] : data;
      if (q)
        setQueueQuota({
          used: Number(q.searches_used || 0),
          remaining: Number(q.searches_remaining ?? 0),
          unlimited: Boolean(q.unlimited),
        });
    });
    return () => {
      active = false;
    };
  }, [session, tab, queue]);
  useEffect(() => {
    if (tab === "chat" && chatView === "direct" && session?.user.id && (chatInboxTab === "conversations" || chatInboxTab === "archived"))
      void loadChatHistory(session.user.id);
  }, [tab, chatView, chatInboxTab, session?.user.id]);
  useEffect(() => {
    if (tab !== "rooms" || !session?.user.id) return;
    void loadRoomMessages(roomCode);
    const channel = supabase
      .channel("connect-room-" + roomCode)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "global_room_messages", filter: "room_code=eq." + roomCode },
        () => void loadRoomMessages(roomCode),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [tab, roomCode, session]);
  useEffect(() => {
    if (queue !== "waiting") return;
    const t = window.setInterval(() => {
      void supabase.rpc("queue_heartbeat").then(({ error }) => {
        if (error) fail("A busca perdeu conexão com o servidor: " + error.message);
      });
    }, 8000);
    return () => window.clearInterval(t);
  }, [queue]);
  useEffect(() => {
    if (queue !== "waiting" || !session?.user.id) return;
    let active = true;
    const checkQueue = async () => {
      const { data, error } = await supabase.from("queue_entries").select("status,match_id").eq("user_id", session.user.id).maybeSingle();
      if (!active) return;
      if (error) {
        fail("Não foi possível atualizar sua busca: " + error.message);
        return;
      }
      if (data?.status === "matched" && data.match_id) {
        setQueue("matched");
        setChatMinimized(false);
        await loadPendingMatch(data.match_id);
      } else if (data?.status !== "waiting") {
        setQueue("idle");
      }
    };
    void checkQueue();
    const timer = window.setInterval(() => void checkQueue(), 4000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [queue, session?.user.id]);
  useEffect(() => {
    if (!pendingMatchId || !pendingExpiresAt) return;
    let expired = false;
    const tick = () => {
      const left = Math.max(0, Math.ceil((new Date(pendingExpiresAt).getTime() - Date.now()) / 1000));
      setPendingSeconds(left);
      if (left === 0 && !expired) {
        expired = true;
        void supabase.rpc("expire_pending_match", { p_match_id: pendingMatchId }).then(() => {
          setPendingMatchId("");
          setPendingPartner(null);
          setPendingExpiresAt("");
          setPendingAccepted(false);
          setPendingOtherAccepted(false);
          setMessages([]);
          setDraft("");
          setQueue("idle");
          setNotice("O tempo de 3 minutos acabou. Cada um seguiu seu caminho.");
        });
      }
    };
    tick();
    const t = window.setInterval(tick, 1000);
    return () => window.clearInterval(t);
  }, [pendingMatchId, pendingExpiresAt]);
  useEffect(() => {
    if (!pendingMatchId || !session?.user.id) return;
    let active = true;
    const sync = async () => {
      const { data, error } = await supabase
        .from("matches")
        .select("match_status,user_one,user_two,user_one_accepted_at,user_two_accepted_at")
        .eq("id", pendingMatchId)
        .maybeSingle();
      if (!active || error || !data) return;
      if (data.match_status === "accepted") {
        setPendingMatchId("");
        setPendingPartner(null);
        setPendingExpiresAt("");
        setPendingAccepted(false);
        setPendingOtherAccepted(false);
        setPendingChatMinimized(false);
        setMatchId(pendingMatchId);
        setChatReadOnly(false);
        setTab("chat");
        setQueue("matched");
        void loadChatHistory(session.user.id);
        setNotice("Match confirmado pelos dois! A conversa foi para a aba Chat.");
        return;
      }
      if (data.match_status !== "pending") {
        setPendingMatchId("");
        setPendingPartner(null);
        setPendingExpiresAt("");
        setPendingAccepted(false);
        setPendingOtherAccepted(false);
        setMessages([]);
        setQueue("idle");
        setNotice("Este encontro foi encerrado. Cada um pode procurar outra pessoa.");
        return;
      }
      setPendingAccepted(Boolean(data.user_one === session.user.id ? data.user_one_accepted_at : data.user_two_accepted_at));
      setPendingOtherAccepted(Boolean(data.user_one === session.user.id ? data.user_two_accepted_at : data.user_one_accepted_at));
    };
    void sync();
    const t = window.setInterval(() => void sync(), 1500);
    return () => {
      active = false;
      window.clearInterval(t);
    };
  }, [pendingMatchId, session?.user.id]);
  useEffect(() => {
    if (!pendingMatchId) return;
    let active = true;
    const load = async () => {
      const { data, error } = await supabase.from("messages").select("*").eq("match_id", pendingMatchId).order("created_at");
      if (!active || error) return;
      setMessages(await Promise.all((data || []).map((row: any) => hydrateMessage(row))));
    };
    void load();
    const channel = supabase
      .channel("pending-chat-" + pendingMatchId)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: "match_id=eq." + pendingMatchId },
        async (payload) => {
          const m = await hydrateMessage(payload.new);
          setMessages((old) => (old.some((x) => x.id === m.id) ? old : [...old, m]));
        },
      )
      .subscribe();
    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, [pendingMatchId]);
  useEffect(() => {
    let alive = true;
    async function getChat() {
      if (!matchId || !session?.user.id) {
        setPartner(null);
        setMessages([]);
        return;
      }
      const { data: m, error } = await supabase.from("matches").select("*").eq("id", matchId).single();
      if (error) {
        fail(error.message);
        return;
      }
      if (m.match_status !== "accepted") {
        setMatchId("");
        return;
      }
      setChatReadOnly((current) => current || Boolean(m.ended_at));
      const otherId = m.user_one === session.user.id ? m.user_two : m.user_one;
      const [p, h] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", otherId).single(),
        supabase.from("messages").select("*").eq("match_id", matchId).order("created_at"),
      ]);
      if (!alive) return;
      setPartner(p.data as Profile | null);
      setChatMinimized(false);
      setMessages(await Promise.all((h.data || []).map((row: any) => hydrateMessage(row))));
    }
    void getChat();
    if (!matchId)
      return () => {
        alive = false;
      };
    const c = supabase
      .channel("chat-" + matchId)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: "match_id=eq." + matchId }, async (p) => {
        const m = await hydrateMessage(p.new);
        setMessages((old) => (old.some((x) => x.id === m.id) ? old : [...old, m]));
      })
      .subscribe();
    return () => {
      alive = false;
      void supabase.removeChannel(c);
    };
  }, [matchId, session]);
  async function demoLogin(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    fail("");
    try {
      const { data, error } = await supabase.functions.invoke("connect-demo-login", {
        body: { username: demoUsername.trim(), password: demoPassword },
      });
      if (error) throw error;
      if (!data?.access_token || !data?.refresh_token) throw new Error(data?.error || "Não foi possível abrir o acesso de demonstração.");
      const result = await supabase.auth.setSession({ access_token: data.access_token, refresh_token: data.refresh_token });
      if (result.error) throw result.error;
      setNotice("Você entrou no modo de demonstração, somente para visualização.");
    } catch (x) {
      fail(x instanceof Error ? x.message : "Não foi possível abrir a demonstração.");
    } finally {
      setBusy(false);
    }
  }
  async function auth(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    fail("");
    try {
      if (mode === "signin") {
        const r = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (r.error) throw r.error;
      } else {
        const handle = username.trim().replace(/^@/, "").toLowerCase();
        if (!/^[a-z0-9_]{1,20}$/g.test(handle)) throw new Error("O @ pode ter de 1 a 20 caracteres: letras, números ou _.");
        if (password.length < 8) throw new Error("Use uma senha com pelo menos 8 caracteres.");
        if (gender === "self_described" && !description.trim()) throw new Error("Descreva seu gênero.");
        const r = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: "https://appswebb.github.io/Connect/",
            data: {
              display_name: name.trim(),
              username: handle,
              gender,
              gender_description: gender === "self_described" ? description.trim() : null,
              looking_for: [looking],
            },
          },
        });
        if (r.error) throw r.error;
        if (!r.data.session) setNotice("Confirme seu e-mail para ativar a conta e depois entre.");
      }
    } catch (x) {
      fail(x instanceof Error ? x.message : "Não foi possível continuar.");
    } finally {
      setBusy(false);
    }
  }
  async function upload(f: File, folder: string) {
    if (!session?.user.id) throw new Error("Entre na conta.");
    if (!f.type.startsWith("image/") && !(folder === "posts" && f.type.startsWith("video/"))) throw new Error("Formato não permitido.");
    const max = folder === "posts" && f.type.startsWith("video/") ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
    if (f.size > max) throw new Error("Arquivo muito grande.");
    const ext = f.name.split(".").pop() || "jpg",
      path = session.user.id + "/" + folder + "/" + crypto.randomUUID() + "." + ext;
    const r = await supabase.storage
      .from("connect-media")
      .upload(path, f, { upsert: false, contentType: f.type, cacheControl: "31536000" });
    if (r.error) throw r.error;
    return supabase.storage.from("connect-media").getPublicUrl(path).data.publicUrl;
  }
  async function saveLocation(e: FormEvent): Promise<boolean> {
    e.preventDefault();
    if (!session?.user.id) return false;
    const cleanCity = city.trim();
    if ((cleanCity && !stateCode) || (locationVisible && (!cleanCity || !stateCode))) {
      fail("Selecione primeiro o estado e depois uma cidade da lista.");
      return false;
    }
    setBusy(true);
    const r = await supabase
      .from("profiles")
      .update({
        city: cleanCity || null,
        state_code: stateCode || null,
        location_visible: locationVisible && Boolean(cleanCity && stateCode),
      })
      .eq("id", session.user.id);
    setBusy(false);
    if (r.error) {
      fail("Não foi possível salvar sua localização: " + r.error.message);
      return false;
    }
    setQueueStateFilter(stateCode);
    setQueueCityFilter(cleanCity);
    await loadProfile(session.user.id);
    setNotice(locationVisible ? "Localização salva e visível no seu perfil." : "Localização salva como privada.");
    return true;
  }
  async function saveMatchingPreferences(e: FormEvent) {
    e.preventDefault();
    if (!session?.user.id) return;
    const r = await supabase
      .from("profiles")
      .update({ looking_for: [lookingForSetting] })
      .eq("id", session.user.id);
    if (r.error) {
      fail("Não foi possível salvar suas preferências: " + r.error.message);
      return;
    }
    await loadProfile(session.user.id);
    setNotice("Preferências de conexão atualizadas. Elas serão aplicadas na próxima busca.");
  }
  async function loadBlockedPeople() {
    if (!session?.user.id) return;
    const rows = await supabase.from("user_blocks").select("blocked_id").eq("blocker_id", session.user.id);
    const ids = (rows.data || []).map((x: any) => x.blocked_id);
    if (!ids.length) {
      setBlockedPeople([]);
      return;
    }
    const people = await supabase.from("profiles").select("*").in("id", ids);
    setBlockedPeople((people.data || []) as Profile[]);
  }
  async function unblockUser(uid: string) {
    if (!session?.user.id) return;
    const r = await supabase.from("user_blocks").delete().eq("blocker_id", session.user.id).eq("blocked_id", uid);
    if (r.error) {
      fail(r.error.message);
      return;
    }
    await loadBlockedPeople();
    setNotice("Pessoa desbloqueada.");
  }
  async function blockUser(uid: string) {
    if (!session?.user.id || uid === session.user.id) return;
    if (!window.confirm("Bloquear esta pessoa? Ela não poderá interagir com você nas áreas protegidas do CONNECT.")) return;
    const r = await supabase.from("user_blocks").insert({ blocker_id: session.user.id, blocked_id: uid });
    if (r.error && r.error.code !== "23505") {
      fail(r.error.message);
      return;
    }
    setPosts((old) => old.filter((p) => p.user_id !== uid));
    if (partner?.id === uid) {
      await endChat();
    }
    if (pendingPartner?.id === uid && pendingMatchId) {
      await respondToMatch(false);
      setPendingChatMinimized(false);
    }
    setNotice("Pessoa bloqueada.");
  }
  function openReport(uid: string, targetType = "profile", targetId = uid) {
    setReportTarget(uid);
    setReportTargetType(targetType);
    setReportTargetId(targetId);
    setReportCategory("spam");
    setReportDetails("");
  }
  async function submitReport(e: FormEvent) {
    e.preventDefault();
    if (!session?.user.id || !reportTarget) return;
    const r = await supabase
      .from("user_reports")
      .insert({
        reporter_id: session.user.id,
        reported_user_id: reportTarget,
        target_type: reportTargetType,
        target_id: reportTargetId || null,
        category: reportCategory,
        details: reportDetails.trim(),
      });
    if (r.error) {
      fail(r.error.message);
      return;
    }
    setReportTarget("");
    setNotice("Denúncia enviada para análise da equipe CONNECT.");
  }
  async function requestDeletion() {
    if (
      !window.confirm(
        "Sua conta será programada para exclusão definitiva daqui a 7 dias. Durante esse prazo, você poderá cancelar e recuperar o acesso. Deseja continuar?",
      )
    )
      return;
    const r = await supabase.rpc("request_account_deletion");
    if (r.error) {
      fail(r.error.message);
      return;
    }
    const due = typeof r.data === "string" ? r.data : new Date(Date.now() + 7 * 86400000).toISOString();
    setDeletionDue(due);
    setNotice("Exclusão agendada. Você tem 7 dias para cancelar.");
  }
  async function cancelDeletion() {
    const r = await supabase.rpc("cancel_account_deletion");
    if (r.error) {
      fail(r.error.message);
      return;
    }
    setDeletionDue("");
    setNotice("Pedido de exclusão cancelado. Sua conta continua ativa.");
  }
  async function sendPasswordReset() {
    if (!session?.user.email) return;
    const r = await supabase.auth.resetPasswordForEmail(session.user.email, { redirectTo: "https://appswebb.github.io/Connect/" });
    if (r.error) {
      fail(r.error.message);
      return;
    }
    setNotice("Enviamos um link para redefinir sua senha.");
  }
  async function openProfile(uid: string) {
    if (!session?.user.id) return;
    if (uid === session.user.id) {
      setTab("profile");
      return;
    }
    const [r, rel] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
      supabase.rpc("get_social_relationship", { p_other: uid }),
    ]);
    if (r.error) {
      fail("Não foi possível abrir este perfil: " + r.error.message);
      return;
    }
    if (!r.data) {
      fail("Este perfil não está disponível para visualização.");
      return;
    }
    setViewingProfile(r.data as Profile);
    setRelationship(rel.data || { following: false, follows_me: false, mutual: false, followers: 0, following_count: 0 });
  }
  async function toggleFollow() {
    if (!viewingProfile || !session?.user.id || isDemo) return;
    const wasFollowing = relationship.following;
    const r = await supabase.rpc(wasFollowing ? "unfollow_user" : "follow_user", { p_user_id: viewingProfile.id });
    if (r.error) {
      fail("Não foi possível atualizar o seguimento: " + r.error.message);
      return;
    }
    const rel = await supabase.rpc("get_social_relationship", { p_other: viewingProfile.id });
    setRelationship(rel.data || relationship);
    setNotice(wasFollowing ? "Você deixou de seguir esta pessoa." : "Agora você está seguindo esta pessoa.");
  }
  async function openOwnSocialList(kind: "followers" | "following") {
    if (!session?.user.id) return;
    const query =
      kind === "followers"
        ? supabase.from("follows").select("follower_id").eq("followed_id", session.user.id)
        : supabase.from("follows").select("followed_id").eq("follower_id", session.user.id);
    const rows = await query;
    if (rows.error) {
      fail("Não foi possível carregar a lista: " + rows.error.message);
      return;
    }
    const ids = (rows.data || []).map((x: any) => (kind === "followers" ? x.follower_id : x.followed_id));
    if (!ids.length) {
      setOwnSocialList({ kind, people: [] });
      return;
    }
    const people = await supabase.from("profiles").select("*").in("id", ids);
    if (people.error) {
      fail("Não foi possível carregar os perfis: " + people.error.message);
      return;
    }
    setOwnSocialList({ kind, people: (people.data || []) as Profile[] });
  }
  function startMessage() {
    if (!viewingProfile || isDemo) return;
    setMessageRecipient(viewingProfile);
    setDirectMessageDraft("");
  }
  async function sendDirectMessage(e: FormEvent) {
    e.preventDefault();
    if (!messageRecipient || !directMessageDraft.trim()) return;
    setBusy(true);
    const r = await supabase.rpc("send_direct_message", { p_user_id: messageRecipient.id, p_message: directMessageDraft.trim() });
    setBusy(false);
    if (r.error) {
      fail("Não foi possível enviar a mensagem: " + r.error.message);
      return;
    }
    const result = r.data as { kind: string; match_id?: string };
    setMessageRecipient(null);
    setDirectMessageDraft("");
    setViewingProfile(null);
    if (result.kind === "conversation" && result.match_id) {
      setMatchId(result.match_id);
      setChatReadOnly(false);
      setChatMinimized(false);
      setTab("chat");
      setChatView("direct");
      setChatInboxTab("conversations");
      setNotice("Mensagem enviada. A conversa já está liberada.");
    } else {
      setChatView("direct");
      setChatInboxTab("requests");
      setTab("chat");
      setNotice("Pedido de mensagem enviado. Ele aparecerá nas solicitações da pessoa.");
    }
  }
  async function loadMessageRequests(uid: string) {
    const r = await supabase
      .from("message_requests")
      .select("id,sender_id,recipient_id,initial_message,status,created_at")
      .eq("recipient_id", uid)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(100);
    if (r.error) {
      fail("Não foi possível carregar os pedidos de mensagem: " + r.error.message);
      return;
    }
    const rows = r.data || [];
    const ids = [...new Set(rows.map((x: any) => x.sender_id))];
    const people = ids.length ? await supabase.from("profiles").select("*").in("id", ids) : { data: [] };
    const map = new Map((people.data || []).map((x: any) => [x.id, x as Profile]));
    setMessageRequests(
      rows.flatMap((x: any) => {
        const sender = map.get(x.sender_id);
        return sender ? [{ ...x, sender }] : [];
      }),
    );
  }
  async function respondMessageRequest(id: string, accept: boolean) {
    if (!session?.user.id) return;
    const r = await supabase.rpc("respond_message_request", { p_request_id: id, p_accept: accept });
    if (r.error) {
      fail("Não foi possível responder ao pedido: " + r.error.message);
      return;
    }
    await loadMessageRequests(session.user.id);
    if (accept && r.data?.match_id) {
      setMatchId(r.data.match_id);
      setChatReadOnly(false);
      setChatMinimized(false);
      setChatInboxTab("conversations");
      setNotice("Pedido aceito. A conversa foi liberada.");
    } else setNotice("Pedido de mensagem recusado.");
  }

  async function saveBio(e: FormEvent) {
    e.preventDefault();
    if (!session?.user.id) return;
    const r = await supabase.from("profiles").update({ bio }).eq("id", session.user.id);
    if (r.error) {
      fail(r.error.message);
      return;
    }
    await loadProfile(session.user.id);
    setNotice("Perfil atualizado.");
  }
  async function saveDisplayName(e: FormEvent) {
    e.preventDefault();
    if (!session?.user.id) return;
    const name = displayNameSetting.trim().replace(/\s+/g, " ");
    if (name.length < 2 || name.length > 40) {
      fail("O nome deve ter entre 2 e 40 caracteres.");
      return;
    }
    setBusy(true);
    const r = await supabase.from("profiles").update({ display_name: name }).eq("id", session.user.id);
    setBusy(false);
    if (r.error) {
      fail("Não foi possível atualizar o nome: " + r.error.message);
      return;
    }
    await loadProfile(session.user.id);
    setNotice("Nome do perfil atualizado.");
  }
  async function saveIdentity(e: FormEvent) {
    e.preventDefault();
    if (!session?.user.id) return;
    const handle = usernameSetting.trim().replace(/^@/, "").toLowerCase();
    if (!/^[a-z0-9_]{1,20}$/.test(handle)) {
      fail("O @ deve ter de 3 a 20 caracteres: letras, números ou _.");
      return;
    }
    if (genderSetting === "self_described" && !genderDescriptionSetting.trim()) {
      fail("Descreva seu gênero para salvar.");
      return;
    }
    setBusy(true);
    const r = await supabase
      .from("profiles")
      .update({
        username: handle,
        gender: genderSetting,
        gender_description: genderSetting === "self_described" ? genderDescriptionSetting.trim() : null,
      })
      .eq("id", session.user.id);
    setBusy(false);
    if (r.error) {
      fail(
        r.error.code === "23505"
          ? "Esse @ já está em uso. Escolha outro identificador."
          : "Não foi possível atualizar sua identidade: " + r.error.message,
      );
      return;
    }
    await loadProfile(session.user.id);
    setNotice("Identificador e gênero atualizados.");
  }
  function openImageCrop(f: File, target: "post" | "avatar" | "banner" | "chat") {
    if (!f.type.startsWith("image/")) return;
    setCropTarget(target);
    setCropFile(f);
  }
  async function applyCroppedImage(f: File) {
    const target = cropTarget;
    setCropFile(null);
    setCropTarget(null);
    if (target === "post") setFile(f);
    else if (target === "chat") void sendAttachment(f, "image");
    else if (target === "avatar") void updateImage(f, "avatar_url");
    else if (target === "banner") void updateImage(f, "banner_url");
  }
  async function updateImage(f: File, field: "avatar_url" | "banner_url") {
    if (!session?.user.id) return;
    setBusy(true);
    try {
      const url = await upload(f, field === "avatar_url" ? "avatars" : "banners");
      const r = await supabase
        .from("profiles")
        .update({ [field]: url })
        .eq("id", session.user.id);
      if (r.error) throw r.error;
      await loadProfile(session.user.id);
      setNotice("Imagem atualizada.");
    } catch (x) {
      fail(x instanceof Error ? x.message : "Falha no envio.");
    } finally {
      setBusy(false);
    }
  }
  async function enterQueue() {
    if (matchId) {
      fail("Finalize a conversa atual antes de procurar outra pessoa.");
      return;
    }
    if (pendingMatchId) return;
    setBusy(true);
    const r = await supabase.rpc("enter_queue", { p_state_code: queueStateFilter || null, p_city: queueCityFilter.trim() || null });
    setBusy(false);
    if (r.error) {
      if (r.error.message.includes("DAILY_SEARCH_LIMIT_REACHED")) {
        const quota = await supabase.rpc("get_queue_search_quota");
        const q = Array.isArray(quota.data) ? quota.data[0] : quota.data;
        if (q)
          setQueueQuota({
            used: Number(q.searches_used || 0),
            remaining: Number(q.searches_remaining ?? 0),
            unlimited: Boolean(q.unlimited),
          });
        fail(
          "Você usou as 20 buscas gratuitas de hoje. Amanhã suas buscas renovam. Se quiser continuar hoje, veja o pacote ilimitado na Loja CONNECT.",
        );
      } else fail("Não foi possível entrar na fila: " + r.error.message);
      return;
    }
    const x = Array.isArray(r.data) ? r.data[0] : r.data;
    if (!x || typeof x.matched !== "boolean") {
      fail("O servidor não confirmou sua entrada na fila. Tente novamente.");
      return;
    }
    if (x.matched) {
      if (!x.match_id) {
        fail("O servidor encontrou uma conexão, mas não retornou o identificador. Tente novamente.");
        return;
      }
      await loadPendingMatch(x.match_id);
      setChatMinimized(false);
    } else {
      setQueue("waiting");
      setNotice("Você entrou na fila. A busca continuará automaticamente enquanto aguarda.");
    }
  }
  async function respondToMatch(accept: boolean) {
    if (!pendingMatchId) return;
    setBusy(true);
    const r = await supabase.rpc("respond_to_match", { p_match_id: pendingMatchId, p_accept: accept });
    setBusy(false);
    if (r.error) {
      fail(r.error.message);
      return;
    }
    const status = r.data as string;
    if (status === "accepted") {
      setPendingMatchId("");
      setPendingPartner(null);
      setPendingExpiresAt("");
      setPendingAccepted(false);
      setPendingOtherAccepted(false);
      setMatchId(pendingMatchId);
      setChatReadOnly(false);
      setQueue("matched");
      setTab("chat");
      if (session?.user.id) void loadChatHistory(session.user.id);
      setNotice("Match confirmado! A conversa foi salva no seu histórico.");
    } else if (status === "waiting") {
      setPendingAccepted(true);
      setNotice("Você aceitou! Falta a outra pessoa confirmar.");
    } else {
      setPendingMatchId("");
      setPendingPartner(null);
      setPendingExpiresAt("");
      setPendingAccepted(false);
      setPendingOtherAccepted(false);
      setQueue("idle");
      setNotice(status === "declined" ? "Conexão recusada. Você já pode procurar outra pessoa." : "O tempo acabou. Procure outra pessoa.");
    }
  }
  async function leaveQueue() {
    const r = await supabase.rpc("leave_queue");
    if (r.error) {
      fail(r.error.message);
      return;
    }
    setQueue("idle");
  }
  async function hydrateMessage(row: any): Promise<Message> {
    const message = row as Message;
    if (!message.attachment_path) return message;
    const signed = await supabase.storage.from("connect-chat").createSignedUrl(message.attachment_path, 3600);
    return { ...message, attachment_url: signed.data?.signedUrl || null };
  }
  async function send(e: FormEvent) {
    e.preventDefault();
    const activeId = pendingMatchId || matchId;
    if (!activeId || !session?.user.id || !draft.trim()) return;
    const text = draft.trim();
    setDraft("");
    const r = await supabase
      .from("messages")
      .insert({ match_id: activeId, sender_id: session.user.id, body: text, message_type: "text" })
      .select("*")
      .single();
    if (r.error) {
      setDraft(text);
      fail(r.error.message);
      return;
    }
    setMessages((old) => (old.some((x) => x.id === r.data.id) ? old : [...old, r.data as Message]));
  }
  async function sendAttachment(file: File, kind: "image" | "audio" | "file", duration?: number) {
    const activeId = pendingMatchId || matchId;
    if (!activeId || !session?.user.id) return;
    if (file.size === 0) {
      fail("O arquivo está vazio. Tente selecionar ou gravar novamente.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      fail("O arquivo deve ter no máximo 50 MB.");
      return;
    }
    setBusy(true);
    let uploadedPath: string | null = null;
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100) || "arquivo";
      const path = activeId + "/" + session.user.id + "/" + crypto.randomUUID() + "-" + safeName;
      const uploaded = await supabase.storage
        .from("connect-chat")
        .upload(path, file, { upsert: false, contentType: file.type || "application/octet-stream", cacheControl: "3600" });
      if (uploaded.error) throw uploaded.error;
      uploadedPath = path;
      const inserted = await supabase
        .from("messages")
        .insert({
          match_id: activeId,
          sender_id: session.user.id,
          body: "",
          message_type: kind,
          attachment_path: path,
          attachment_name: file.name,
          attachment_mime: file.type || (kind === "audio" ? "audio/webm" : "application/octet-stream"),
          attachment_size: file.size,
          duration_seconds: duration ?? null,
        })
        .select("*")
        .single();
      if (inserted.error) throw inserted.error;
      const message = await hydrateMessage(inserted.data);
      setMessages((old) => (old.some((x) => x.id === message.id) ? old : [...old, message]));
      setNotice(kind === "audio" ? "Áudio enviado." : kind === "image" ? "Imagem enviada." : "Arquivo enviado.");
    } catch (x) {
      if (uploadedPath) await supabase.storage.from("connect-chat").remove([uploadedPath]);
      fail(x instanceof Error ? x.message : "Não foi possível enviar o anexo.");
    } finally {
      setBusy(false);
    }
  }
  async function toggleRecording() {
    if (recording) {
      recorderRef.current?.stop();
      setRecording(false);
      return;
    }
    try {
      if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined")
        throw new Error("Seu navegador não permite gravar áudio aqui.");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const candidates = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"];
      const mime = candidates.find((x) => MediaRecorder.isTypeSupported(x));
      const recorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      audioChunksRef.current = [];
      recordingStartedRef.current = Date.now();
      recorder.ondataavailable = (e) => {
        if (e.data.size) audioChunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const ext = blob.type.includes("mp4") ? "m4a" : "webm";
        const file = new File([blob], "audio-" + Date.now() + "." + ext, { type: blob.type });
        const duration = Math.max(1, Math.round((Date.now() - recordingStartedRef.current) / 1000));
        void sendAttachment(file, "audio", duration);
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch (x) {
      fail(x instanceof Error ? x.message : "Não foi possível iniciar a gravação.");
      setRecording(false);
    }
  }
  async function endChat() {
    if (!matchId) return;
    if (chatReadOnly) {
      setMatchId("");
      setPartner(null);
      setMessages([]);
      setChatReadOnly(false);
      return;
    }
    const r = await supabase.rpc("end_match", { p_match_id: matchId });
    if (r.error) {
      fail(r.error.message);
      return;
    }
    setMatchId("");
    setPartner(null);
    setMessages([]);
    setChatMinimized(false);
    setChatReadOnly(false);
    setQueue("idle");
    setTab("chat");
    if (session?.user.id) await loadChatHistory(session.user.id);
  }
  async function logout() {
    setBusy(true);
    try {
      if (queue === "waiting") await supabase.rpc("leave_queue");
      if (pendingMatchId) await supabase.rpc("respond_to_match", { p_match_id: pendingMatchId, p_accept: false });
      if (matchId && !chatReadOnly) await supabase.rpc("end_match", { p_match_id: matchId });
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setNotificationsOpen(false);
      setActiveLive(null);
    } catch (x) {
      fail(x instanceof Error ? x.message : "Não foi possível sair da conta. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }
  const isDemo = Boolean(session?.user.app_metadata?.connect_demo);

  if (loading)
    return (
      <main className="loading">
        <Activity />
        <span>Preparando o CONNECT...</span>
      </main>
    );
  if (!session && authScreen === "home") {
    return (
      <ConnectLanding
        onSignIn={() => { setMode("signin"); setAuthScreen("auth"); }}
        onSignUp={() => { setMode("signup"); setAuthScreen("auth"); }}
        onDemo={() => setAuthScreen("demo")}
      />
    );
  }
  if (!session && authScreen === "demo") {
    return (
      <ConnectAuthGate
        demoMode
        onBack={() => setAuthScreen("home")}
        mode={mode}
        setMode={setMode}
        demoUsername={demoUsername}
        setDemoUsername={setDemoUsername}
        demoPassword={demoPassword}
        setDemoPassword={setDemoPassword}
        demoLogin={demoLogin}
        name={name}
        setName={setName}
        username={username}
        setUsername={setUsername}
        gender={gender}
        setGender={setGender}
        looking={looking}
        setLooking={setLooking}
        description={description}
        setDescription={setDescription}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        auth={auth}
        busy={busy}
        error={error}
        notice={notice}
      />
    );
  }
  if (!session) {
    return (
      <ConnectAuthGate
        demoMode={false}
        onBack={() => setAuthScreen("home")}
        mode={mode}
        setMode={setMode}
        demoUsername={demoUsername}
        setDemoUsername={setDemoUsername}
        demoPassword={demoPassword}
        setDemoPassword={setDemoPassword}
        demoLogin={demoLogin}
        name={name}
        setName={setName}
        username={username}
        setUsername={setUsername}
        gender={gender}
        setGender={setGender}
        looking={looking}
        setLooking={setLooking}
        description={description}
        setDescription={setDescription}
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        auth={auth}
        busy={busy}
        error={error}
        notice={notice}
      />
    );
  }
  if (!profile)
    return (
      <main className="loading">
        Preparando seu perfil... <button onClick={logout}>Sair</button>
      </main>
    );
  const room = (
    <ConnectRooms
      roomCode={roomCode}
      setRoomCode={setRoomCode}
      roomMessages={roomMessages}
      roomReply={roomReply}
      setRoomReply={setRoomReply}
      roomDraft={roomDraft}
      setRoomDraft={setRoomDraft}
      sendRoomMessage={sendRoomMessage}
      deleteRoomMessage={deleteRoomMessage}
      openProfile={openProfile}
      openReport={openReport}
      currentUserId={session.user.id}
      isDemo={isDemo}
    />
  );
  const live = (
    <ConnectLives
      lives={lives}
      activeLive={activeLive}
      currentUserId={session.user.id}
      leaveLive={leaveLive}
      isDemo={isDemo}
      liveTitle={liveTitle}
      setLiveTitle={setLiveTitle}
      createLive={createLive}
      busy={busy}
      loadLives={loadLives}
      endLiveSession={endLiveSession}
      joinLive={joinLive}
      openReport={openReport}
    />
  );
  return (
    <main className="connect-app" data-screen="workspace">
      <ConnectNavigation tab={tab} setTab={setTab} queue={queue} mobileMoreOpen={mobileMoreOpen} setMobileMoreOpen={setMobileMoreOpen} />
      <section className="connect-main">
        <header className="topbar">
          <div className="mobile-brand">
            <img src="/Connect/connect-mark.svg" alt="" />
            CONNECT
          </div>
          <small>
            <i /> UM LUGAR PARA SE CONECTAR
          </small>
          <div className="topbar-actions">
            <button
              type="button"
              className="theme-toggle"
              onClick={() => setTheme((value) => (value === "light" ? "dark" : "light"))}
              aria-label={theme === "light" ? "Ativar tema escuro" : "Ativar tema claro"}
              title={theme === "light" ? "Tema escuro" : "Tema claro"}
            >
              {theme === "light" ? <Moon size={17} /> : <Sun size={17} />}
            </button>
            <div className="notification-area">
              <button
                type="button"
                className={"notification-trigger" + (notificationsOpen ? " is-open" : "")}
                title="Notificações"
                aria-label={"Notificações, " + notifications.filter((x) => !x.read_at).length + " não lidas"}
                aria-expanded={notificationsOpen}
                onClick={() => setNotificationsOpen((x) => !x)}
              >
                <BellRing size={21} strokeWidth={2.35} />
                {notifications.some((x) => !x.read_at) && (
                  <i className="notification-count">
                    {notifications.filter((x) => !x.read_at).length > 99 ? "99+" : notifications.filter((x) => !x.read_at).length}
                  </i>
                )}
              </button>
              {notificationsOpen && (
                <section className="notification-panel" aria-label="Central de notificações">
                  <header>
                    <div>
                      <strong>Notificações</strong>
                      <small>{notifications.filter((x) => !x.read_at).length} não lidas · últimas 50</small>
                    </div>
                    <button
                      type="button"
                      className="notification-close"
                      onClick={() => setNotificationsOpen(false)}
                      aria-label="Fechar notificações"
                    >
                      <X size={17} />
                    </button>
                  </header>
                  <div className="notification-tools">
                    {notifications.some((x) => !x.read_at) && (
                      <button type="button" onClick={() => void markAllNotificationsRead()}>
                        <CheckCheck size={14} /> Marcar todas como lidas
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button type="button" onClick={() => void clearReadNotifications()}>
                        <Trash2 size={14} /> Limpar todas
                      </button>
                    )}
                  </div>
                  <div className="notification-list">
                    {notifications.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        className={"notification-item" + (!item.read_at ? " unread" : "")}
                        onClick={() => void openNotification(item)}
                      >
                        {item.actor ? (
                          <Avatar p={item.actor} size="small" />
                        ) : (
                          <span className="notification-symbol">
                            {item.type === "live" ? (
                              <Radio size={17} />
                            ) : item.type === "message" ? (
                              <MessageCircle size={17} />
                            ) : item.type === "match" || item.type === "match_accepted" ? (
                              <Heart size={17} />
                            ) : item.type === "post" ? (
                              <FileText size={17} />
                            ) : (
                              <Bell size={17} />
                            )}
                          </span>
                        )}
                        <span className="notification-copy">
                          <strong>{item.actor?.display_name || item.title}</strong>
                          <small>{item.actor ? item.title + " · " + item.body : item.body}</small>
                          <time>
                            {new Date(item.created_at).toLocaleString("pt-BR", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </time>
                        </span>
                        {!item.read_at && <i className="notification-unread-dot" />}
                      </button>
                    ))}
                    {!notifications.length && (
                      <div className="notification-empty">
                        <Bell size={22} />
                        <strong>Tudo em dia por aqui.</strong>
                        <span>Quando algo importante acontecer, você verá nesta central.</span>
                      </div>
                    )}
                  </div>
                  <footer>
                    {browserNotificationPermission === "granted" ? (
                      <span>
                        <Check size={13} /> Alertas do navegador ativados
                      </span>
                    ) : (
                      <button type="button" onClick={() => void enableBrowserNotifications()}>
                        <Bell size={14} /> Ativar alertas do navegador
                      </button>
                    )}
                  </footer>
                </section>
              )}
            </div>
            <div className="location-area">
              <button
                type="button"
                className={"location-trigger" + (locationOpen ? " is-open" : "")}
                title="Sua localização"
                aria-label="Abrir localização"
                aria-expanded={locationOpen}
                onClick={() => setLocationOpen((value) => !value)}
              >
                <MapPinned size={21} strokeWidth={2.35} />
              </button>
              {locationOpen && (
                <section className="location-panel" aria-label="Configurações de localização">
                  <header>
                    <div>
                      <strong>Sua localização</strong>
                      <small>{city && stateCode ? city + " · " + stateCode : "Localização não definida"}</small>
                    </div>
                    <button type="button" className="location-close" onClick={() => setLocationOpen(false)} aria-label="Fechar localização">
                      <X size={16} />
                    </button>
                  </header>
                  <p>
                    O CONNECT usa sua cidade para aproximar você de pessoas da região. Você pode detectar novamente ou escolher outro lugar.
                  </p>
                  <button
                    type="button"
                    className="primary location-detect-button"
                    disabled={locating || isDemo}
                    onClick={() => {
                      if (session?.user.id) void detectAndSaveLocation(session.user.id, true);
                    }}
                  >
                    <MapPin size={16} />
                    {locating ? "Buscando sua localização..." : "Buscar minha localização"}
                  </button>
                  <div className="location-manual">
                    <strong>Ou escolher outra localização</strong>
                    <BrazilLocationPicker
                      stateCode={stateCode}
                      city={city}
                      onChange={(nextState, nextCity) => {
                        setStateCode(nextState);
                        setCity(nextCity);
                      }}
                    />
                    <label className="location-profile-visibility">
                      <input type="checkbox" checked={locationVisible} onChange={(e) => setLocationVisible(e.target.checked)} /> Mostrar
                      cidade e estado no meu perfil
                    </label>
                    <button
                      type="button"
                      className="secondary"
                      disabled={busy || !city || !stateCode || isDemo}
                      onClick={async () => {
                        const saved = await saveLocation({ preventDefault: () => {} } as FormEvent);
                        if (saved) setLocationOpen(false);
                      }}
                    >
                      Salvar outra localização
                    </button>
                  </div>
                  <small className="location-privacy-note">
                    Apenas cidade e estado são salvos. Suas coordenadas GPS não são armazenadas.
                  </small>
                </section>
              )}
            </div>
            <div className="user-menu-area">
              <button
                type="button"
                className={"user-menu-trigger" + (userMenuOpen ? " is-open" : "")}
                title="Perfil e configurações"
                aria-label="Abrir perfil e configurações"
                aria-expanded={userMenuOpen}
                onClick={() => {
                  setUserMenuOpen((value) => !value);
                  setLocationOpen(false);
                  setNotificationsOpen(false);
                }}
              >
                <Avatar p={profile} />
                <span className="user-menu-caret">
                  <Menu size={13} />
                </span>
              </button>
              {userMenuOpen && (
                <section className="user-menu-panel" aria-label="Menu da conta">
                  <button
                    type="button"
                    onClick={() => {
                      setTab("profile");
                      setUserMenuOpen(false);
                    }}
                  >
                    <UserRound size={17} /> Meu perfil
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTab("settings");
                      setUserMenuOpen(false);
                    }}
                  >
                    <Settings size={17} /> Configurações
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTab("subscription");
                      setUserMenuOpen(false);
                    }}
                  >
                    <CreditCard size={17} /> Assinatura
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTab("download");
                      setUserMenuOpen(false);
                    }}
                  >
                    <Download size={17} /> Download do aplicativo
                  </button>
                  <button
                    type="button"
                    className="user-menu-logout"
                    disabled={busy}
                    onClick={() => {
                      setUserMenuOpen(false);
                      void logout();
                    }}
                  >
                    <LogOut size={17} /> Sair da conta
                  </button>
                </section>
              )}
            </div>
          </div>
        </header>
        {(error || notice) && (
          <div
            className={error ? "flash error" : "flash success"}
            role={error ? "alert" : "status"}
            aria-live={error ? "assertive" : "polite"}
            aria-atomic="true"
          >
            <span>{error || notice}</span>
            <button
              type="button"
              aria-label="Fechar aviso"
              onClick={() => {
                setError("");
                setNotice("");
              }}
            >
              <X size={14} />
            </button>
          </div>
        )}
        {isDemo && (
          <div className="demo-readonly-banner">
            <Eye size={15} /> MODO DE DEMONSTRAÇÃO · SOMENTE VISUALIZAÇÃO
          </div>
        )}
        {ownSocialList && (
          <div
            className="profile-view-backdrop"
            role="dialog"
            aria-modal="true"
            aria-label={ownSocialList.kind === "followers" ? "Seus seguidores" : "Pessoas que você segue"}
            onClick={() => setOwnSocialList(null)}
          >
            <section className="profile-view-card own-social-list" onClick={(e) => e.stopPropagation()}>
              <header>
                <strong>{ownSocialList.kind === "followers" ? "SEUS SEGUIDORES" : "VOCÊ ESTÁ SEGUINDO"}</strong>
                <button type="button" onClick={() => setOwnSocialList(null)} aria-label="Fechar lista">
                  <X />
                </button>
              </header>
              <div className="own-social-people">
                {ownSocialList.people.map((person) => (
                  <article key={person.id}>
                    <Avatar p={person} size="small" />
                    <div>
                      <strong>{person.display_name}</strong>
                      <small>@{person.username}</small>
                    </div>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => {
                        setOwnSocialList(null);
                        void openProfile(person.id);
                      }}
                    >
                      Ver perfil <ArrowRight size={14} />
                    </button>
                  </article>
                ))}
                {!ownSocialList.people.length && (
                  <div className="empty">
                    <Users />
                    <h3>{ownSocialList.kind === "followers" ? "Você ainda não tem seguidores." : "Você ainda não segue ninguém."}</h3>
                    <p>Quando essa lista tiver pessoas, elas aparecerão aqui.</p>
                  </div>
                )}
              </div>
            </section>
          </div>
        )}
        {showVisitorPreview && (
          <div
            className="profile-view-backdrop"
            role="dialog"
            aria-modal="true"
            aria-label="Prévia do seu perfil como visitante"
            onClick={() => setShowVisitorPreview(false)}
          >
            <section className="profile-view-card visitor-preview-card" onClick={(e) => e.stopPropagation()}>
              <header>
                <strong>ASSIM SEU PERFIL APARECE PARA VISITANTES</strong>
                <button type="button" onClick={() => setShowVisitorPreview(false)} aria-label="Fechar prévia">
                  <X />
                </button>
              </header>
              <div
                className="profile-view-banner"
                style={profile.banner_url ? { backgroundImage: "url(" + profile.banner_url + ")" } : {}}
              />
              <div className="profile-view-body">
                <div className="profile-view-identity">
                  <Avatar p={profile} size="large" />
                  <div>
                    <h2>{profile.display_name}</h2>
                    <span>@{profile.username}</span>
                  </div>
                </div>
                <p className="profile-view-bio">{profile.bio || "Esta pessoa ainda não adicionou uma descrição."}</p>
                <div className="profile-view-facts">
                  <div>
                    <small>GÊNERO</small>
                    <strong>
                      {genders[profile.gender] || profile.gender}
                      {profile.gender_description ? " · " + profile.gender_description : ""}
                    </strong>
                  </div>
                  <div>
                    <small>QUER CONHECER</small>
                    <strong>{(profile.looking_for || []).map((x) => preferences[x] || x).join(", ") || "Não informado"}</strong>
                  </div>
                  <div>
                    <small>LOCALIZAÇÃO</small>
                    <strong>
                      {profile.location_visible && profile.city && profile.state_code
                        ? profile.city + " · " + profile.state_code
                        : "Não exibida"}
                    </strong>
                  </div>
                </div>
                <div className="social-profile-stats">
                  <span>
                    <strong>{ownSocialCounts.followers}</strong> seguidores
                  </span>
                  <span>
                    <strong>{ownSocialCounts.following}</strong> seguindo
                  </span>
                </div>
                <p className="visitor-preview-note">
                  Prévia de visitante: botões de interação ficam disponíveis apenas para outras pessoas.
                </p>
              </div>
            </section>
          </div>
        )}
        {viewingProfile && (
          <div
            className="profile-view-backdrop"
            role="dialog"
            aria-modal="true"
            aria-label={"Perfil de " + viewingProfile.display_name}
            onClick={() => setViewingProfile(null)}
          >
            <section className="profile-view-card" onClick={(e) => e.stopPropagation()}>
              <header>
                <strong>PERFIL CONNECT</strong>
                <button type="button" onClick={() => setViewingProfile(null)} aria-label="Fechar perfil">
                  <X />
                </button>
              </header>
              <div
                className="profile-view-banner"
                style={viewingProfile.banner_url ? { backgroundImage: "url(" + viewingProfile.banner_url + ")" } : {}}
              />
              <div className="profile-view-body">
                <div className="profile-view-identity">
                  <Avatar p={viewingProfile} size="large" />
                  <div>
                    <h2>{viewingProfile.display_name}</h2>
                    <span>@{viewingProfile.username}</span>
                  </div>
                </div>
                <p className="profile-view-bio">{viewingProfile.bio || "Esta pessoa ainda não adicionou uma descrição."}</p>
                <div className="profile-view-facts">
                  <div>
                    <small>GÊNERO</small>
                    <strong>
                      {genders[viewingProfile.gender] || viewingProfile.gender}
                      {viewingProfile.gender_description ? " · " + viewingProfile.gender_description : ""}
                    </strong>
                  </div>
                  <div>
                    <small>QUER CONHECER</small>
                    <strong>{(viewingProfile.looking_for || []).map((x) => preferences[x] || x).join(", ") || "Não informado"}</strong>
                  </div>
                  <div>
                    <small>LOCALIZAÇÃO</small>
                    <strong>
                      {viewingProfile.location_visible && viewingProfile.city && viewingProfile.state_code
                        ? viewingProfile.city + " · " + viewingProfile.state_code
                        : "Não exibida"}
                    </strong>
                  </div>
                </div>
                {!isDemo && (
                  <>
                    <div className="social-profile-stats">
                      <span>
                        <strong>{relationship.followers}</strong> seguidores
                      </span>
                      <span>
                        <strong>{relationship.following_count}</strong> seguindo
                      </span>
                      {relationship.mutual && <b>AMIGOS</b>}
                    </div>
                    <footer>
                      <button type="button" className="secondary" onClick={() => void toggleFollow()}>
                        {relationship.following ? "Deixar de seguir" : "Seguir"} <Users size={15} />
                      </button>
                      <button type="button" className="primary" onClick={startMessage}>
                        <MessageCircle size={15} /> Mensagem
                      </button>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => {
                          openReport(viewingProfile.id);
                          setViewingProfile(null);
                        }}
                      >
                        <Flag size={15} /> Denunciar
                      </button>
                      <button
                        type="button"
                        className="danger-button"
                        onClick={() => {
                          const id = viewingProfile.id;
                          setViewingProfile(null);
                          void blockUser(id);
                        }}
                      >
                        <Ban size={15} /> Bloquear
                      </button>
                    </footer>
                  </>
                )}
              </div>
            </section>
          </div>
        )}
        {!isDemo && reportTarget && (
          <div className="crop-backdrop" role="dialog" aria-modal="true" aria-label="Denunciar conteúdo">
            <form className="report-dialog" onSubmit={submitReport}>
              <header>
                <div>
                  <small>SEGURANÇA DA COMUNIDADE</small>
                  <h2>
                    {reportTargetType === "profile"
                      ? "Denunciar perfil"
                      : reportTargetType === "post"
                        ? "Denunciar publicação"
                        : reportTargetType === "comment"
                          ? "Denunciar comentário"
                          : reportTargetType === "room_message"
                            ? "Denunciar mensagem da sala"
                            : reportTargetType === "chat_message"
                              ? "Denunciar mensagem privada"
                              : reportTargetType === "live"
                                ? "Denunciar transmissão"
                                : "Denunciar conteúdo"}
                  </h2>
                </div>
                <button type="button" onClick={() => setReportTarget("")}>
                  <X />
                </button>
              </header>
              <label>
                Motivo
                <select value={reportCategory} onChange={(e) => setReportCategory(e.target.value)}>
                  <option value="spam">Spam ou golpe</option>
                  <option value="harassment">Assédio ou intimidação</option>
                  <option value="hate">Discurso de ódio</option>
                  <option value="nudity">Nudez ou conteúdo sexual</option>
                  <option value="impersonation">Falsidade ideológica</option>
                  <option value="underage">Possível menor de idade</option>
                  <option value="other">Outro</option>
                </select>
              </label>
              <label>
                Detalhes (opcional)
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  maxLength={2000}
                  placeholder="Conte o que aconteceu."
                />
              </label>
              <footer>
                <button type="button" className="secondary" onClick={() => setReportTarget("")}>
                  Cancelar
                </button>
                <button className="primary">
                  Enviar denúncia <Flag size={15} />
                </button>
              </footer>
            </form>
          </div>
        )}
        {cropFile && cropTarget && cropTarget !== "chat" && (
          <ImageCropper
            file={cropFile}
            aspectRatio={cropTarget === "avatar" ? 1 : cropTarget === "banner" ? 16 / 5 : 1.25}
            title={cropTarget === "avatar" ? "Foto de perfil" : cropTarget === "banner" ? "Banner do perfil" : "Imagem da publicação"}
            onCancel={() => {
              setCropFile(null);
              setCropTarget(null);
            }}
            onApply={(f) => void applyCroppedImage(f)}
          />
        )}
        {tab === "feed" && (
          <ConnectFeed
            profile={profile}
            currentUserId={session.user.id}
            isDemo={isDemo}
            body={body}
            setBody={setBody}
            file={file}
            setFile={setFile}
            busy={busy}
            publish={publish}
            openImageCrop={openImageCrop}
            posts={posts}
            openProfile={openProfile}
            removePost={removePost}
            openReport={openReport}
            blockUser={blockUser}
            like={like}
            openComments={openComments}
            commentPost={commentPost}
            comments={comments}
            commentText={commentText}
            setCommentText={setCommentText}
            comment={comment}
          />
        )}
        {tab === "people" &&
          (() => {
            const term = peopleSearch.trim().toLowerCase().replace(/^@/, "");
            const filtered = communityProfiles
              .filter((person) => {
                const text = [person.display_name, person.username, person.bio, person.city, person.state_code, person.gender]
                  .filter(Boolean)
                  .join(" ")
                  .toLowerCase();
                if (term && !text.includes(term)) return false;
                if (peopleFilter === "online" && !onlinePeople.includes(person.id)) return false;
                if (peopleFilter === "new" && (!person.created_at || Date.now() - new Date(person.created_at).getTime() > 7 * 86400000))
                  return false;
                if (
                  peopleFilter === "near" &&
                  !(
                    profile?.location_visible &&
                    profile.city &&
                    profile.state_code &&
                    person.location_visible &&
                    person.city === profile.city &&
                    person.state_code === profile.state_code
                  )
                )
                  return false;
                return true;
              })
              .sort((a, b) => {
                if (peopleFilter === "online") return onlinePeople.indexOf(b.id) - onlinePeople.indexOf(a.id);
                const onlineDiff = Number(onlinePeople.includes(b.id)) - Number(onlinePeople.includes(a.id));
                if (onlineDiff) return onlineDiff;
                return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
              });
            return (
              <>
                <section className="people-page-hero">
                  <div className="people-hero-copy">
                    <small>
                      <Users size={14} /> CONNECT · COMUNIDADE EM TEMPO REAL
                    </small>
                    <h1>
                      Conexões que <em>acontecem aqui.</em>
                    </h1>
                    <p>Descubra pessoas, participe das conversas e encontre novas histórias pelo Brasil.</p>
                    <div className="people-hero-stats">
                      <span>
                        <strong>{communityProfiles.length + (profile ? 1 : 0)}</strong>
                        <small>MEMBROS</small>
                        <em>Na comunidade</em>
                      </span>
                      <span>
                        <strong>{onlinePeople.length}</strong>
                        <small>ONLINE AGORA</small>
                        <em>Conectados neste momento</em>
                      </span>
                      <span>
                        <strong>
                          {communityProfiles.filter((x) => x.created_at && Date.now() - new Date(x.created_at).getTime() < 7 * 86400000)
                            .length + (profile?.created_at && Date.now() - new Date(profile.created_at).getTime() < 7 * 86400000 ? 1 : 0)}
                        </strong>
                        <small>NOVOS ESTA SEMANA</small>
                        <em>Chegaram recentemente</em>
                      </span>
                    </div>
                  </div>
                  <div className="people-hero-art">
                    <div className="people-hero-avatar p1">
                      <Users />
                    </div>
                    <div className="people-hero-avatar p2">
                      <Heart />
                    </div>
                    <div className="people-hero-avatar p3">
                      <MessageCircle />
                    </div>
                    <div className="people-hero-core">
                      <Activity size={27} />
                    </div>
                  </div>
                </section>
                <label id="people-directory" className="people-directory-search">
                  <Compass size={18} />
                  <input
                    value={peopleSearch}
                    onChange={(e) => setPeopleSearch(e.target.value)}
                    placeholder="Busque por nome, @, cidade ou interesse..."
                  />
                  {peopleSearch && (
                    <button type="button" onClick={() => setPeopleSearch("")} aria-label="Limpar busca">
                      <X size={16} />
                    </button>
                  )}
                </label>
                <div className="people-filter-row">
                  {[
                    { id: "all", label: "Todos" },
                    { id: "online", label: "Online agora" },
                    { id: "new", label: "Novos membros" },
                    { id: "near", label: "Da minha cidade" },
                  ].map((f) => (
                    <button
                      type="button"
                      key={f.id}
                      className={peopleFilter === f.id ? "active" : ""}
                      onClick={() => setPeopleFilter(f.id)}
                    >
                      {f.id === "online" && <i className="people-live-dot" />}
                      {f.label}
                    </button>
                  ))}
                </div>
                <div className="people-directory-results">
                  <span>
                    {filtered.length} {filtered.length === 1 ? "pessoa encontrada" : "pessoas encontradas"}
                  </span>
                  <span>Comunidade CONNECT</span>
                </div>
                <div className="people-directory-grid">
                  {filtered.map((person) => (
                    <button type="button" className="people-directory-card" key={person.id} onClick={() => void openProfile(person.id)}>
                      <div
                        className="people-card-cover"
                        style={
                          person.banner_url
                            ? { backgroundImage: "linear-gradient(0deg,#0b1117aa,transparent),url(" + person.banner_url + ")" }
                            : {}
                        }
                      >
                        <span>
                          <ShieldCheck size={12} /> CONNECT
                        </span>
                      </div>
                      <div className="people-card-content">
                        <Avatar p={person} size="large" />
                        <div className="people-card-identity">
                          <div className="people-card-badges">
                            {person.created_at && Date.now() - new Date(person.created_at).getTime() < 7 * 86400000 && <b>NOVO</b>}
                            <i className={onlinePeople.includes(person.id) ? "people-status-online" : "people-status-offline"}>
                              {onlinePeople.includes(person.id) ? "ONLINE" : "MEMBRO"}
                            </i>
                          </div>
                          <strong>{person.display_name}</strong>
                          <small>@{person.username}</small>
                        </div>
                        <p>{person.bio || "Ainda não adicionou uma apresentação."}</p>
                        <div className="people-card-meta">
                          {person.location_visible && person.city && person.state_code ? (
                            <span>
                              <MapPin size={12} />
                              {person.city} · {person.state_code}
                            </span>
                          ) : (
                            <span>
                              <Users size={12} /> Comunidade CONNECT
                            </span>
                          )}
                          <i>
                            <span>Ver perfil</span>
                            <ArrowRight size={15} />
                          </i>
                        </div>
                      </div>
                    </button>
                  ))}
                  {filtered.length === 0 && (
                    <div className="empty people-directory-empty">
                      <Compass />
                      <h3>{peopleFilter === "near" ? "Não encontramos membros da sua cidade." : "Nenhuma pessoa encontrada."}</h3>
                      <p>
                        {peopleFilter === "online"
                          ? "Quando alguém estiver online, vai aparecer aqui em tempo real."
                          : "Tente mudar os filtros ou buscar por outro termo."}
                      </p>
                      <button
                        className="secondary"
                        onClick={() => {
                          setPeopleFilter("all");
                          setPeopleSearch("");
                        }}
                      >
                        Mostrar todo mundo
                      </button>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        {tab === "rooms" && <>{room}</>}
        {tab === "lives" && <>{live}</>}
        {tab === "queue" && (
          <>
            {pendingMatchId && pendingPartner && showMatchIntro && (
              <div className="match-found-backdrop" role="dialog" aria-modal="true" aria-label="Vocês se encontraram">
                <section className="match-found-card">
                  <div className="match-found-kicker">
                    <i /> CONEXÃO ENCONTRADA
                  </div>
                  <div className="match-found-avatars">
                    <div className="match-found-avatar first">
                      <Avatar p={profile} size="large" />
                    </div>
                    <div className="match-found-heart">
                      <Heart size={23} fill="currentColor" />
                    </div>
                    <div className="match-found-avatar second">
                      <Avatar p={pendingPartner} size="large" />
                    </div>
                  </div>
                  <div className="match-found-names">
                    <strong>{profile?.display_name || "Você"}</strong>
                    <span>+</span>
                    <strong>{pendingPartner.display_name}</strong>
                  </div>
                  <h2>Vocês se encontraram!</h2>
                  <p>Uma nova conexão acabou de acontecer. Vocês têm 3 minutos para conversar e decidir se querem dar match.</p>
                  <div className="match-found-countdown">
                    {Math.floor(pendingSeconds / 60)}:{String(pendingSeconds % 60).padStart(2, "0")} <small>restantes</small>
                  </div>
                  <button className="primary" onClick={() => setShowMatchIntro(false)}>
                    Começar conversa <ArrowRight />
                  </button>
                </section>
              </div>
            )}
            {pendingMatchId &&
              pendingPartner &&
              !showMatchIntro &&
              (pendingChatMinimized ? (
                <section className="chat-minimized queue-match-minimized">
                  <div>
                    <Avatar p={pendingPartner} size="small" />
                    <span>
                      <strong>{pendingPartner.display_name}</strong>
                      <small>
                        Encontro temporário · {Math.floor(pendingSeconds / 60)}:{String(pendingSeconds % 60).padStart(2, "0")} restantes
                      </small>
                    </span>
                  </div>
                  <button className="secondary" type="button" onClick={() => setPendingChatMinimized(false)}>
                    Reabrir conversa
                  </button>
                  <button className="chat-close-mini" type="button" onClick={() => void respondToMatch(false)} title="Encerrar encontro">
                    <X />
                  </button>
                </section>
              ) : (
                <section className="chat queue-match-chat">
                  <header>
                    <button type="button" className="profile-open-avatar" onClick={() => void openProfile(pendingPartner.id)}>
                      <Avatar p={pendingPartner} />
                    </button>
                    <div className="chat-person-info">
                      <strong>{pendingPartner.display_name}</strong>
                      <span>@{pendingPartner.username} · encontro temporário</span>
                    </div>
                    <strong className="match-live-timer">
                      {Math.floor(pendingSeconds / 60)}:{String(pendingSeconds % 60).padStart(2, "0")}
                    </strong>
                    <button type="button" title="Denunciar pessoa" onClick={() => openReport(pendingPartner.id)}>
                      <Flag />
                    </button>
                    <button type="button" title="Bloquear pessoa" onClick={() => void blockUser(pendingPartner.id)}>
                      <Ban />
                    </button>
                    <button type="button" title="Minimizar conversa" onClick={() => setPendingChatMinimized(true)}>
                      <Minus />
                    </button>
                  </header>
                  <div className="match-live-progress">
                    <i style={{ width: (pendingSeconds / 180) * 100 + "%" }} />
                  </div>
                  <div className="queue-match-status">
                    {pendingAccepted
                      ? "Você aceitou o match. Aguardando a outra pessoa."
                      : pendingOtherAccepted
                        ? "A outra pessoa aceitou. Se você também aceitar, o match será confirmado."
                        : "Conversem por até 3 minutos. O match só acontece se os dois aceitarem."}
                  </div>
                  <div className="messages">
                    {messages.map((m) => (
                      <div key={m.id} className={"bubble " + (m.sender_id === session.user.id ? "mine" : "")}>
                        {m.attachment_path && m.attachment_url ? (
                          <div className="chat-attachment">
                            {m.attachment_mime?.startsWith("image/") ? (
                              <a href={m.attachment_url} target="_blank" rel="noreferrer">
                                <img src={m.attachment_url} alt={m.attachment_name || "Imagem enviada"} />
                              </a>
                            ) : m.message_type === "audio" || m.attachment_mime?.startsWith("audio/") ? (
                              <audio src={m.attachment_url} controls preload="metadata" />
                            ) : m.attachment_mime?.startsWith("video/") ? (
                              <video src={m.attachment_url} controls />
                            ) : (
                              <a className="chat-file" href={m.attachment_url} download={m.attachment_name || "arquivo"}>
                                <FileText />
                                <span>
                                  {m.attachment_name || "Arquivo"}
                                  <small>{m.attachment_size ? Math.max(1, Math.round(m.attachment_size / 1024)) + " KB" : "Anexo"}</small>
                                </span>
                                <Download />
                              </a>
                            )}
                            {m.body && <p>{m.body}</p>}
                          </div>
                        ) : (
                          m.body
                        )}
                        {!isDemo && m.sender_id !== session.user.id && (
                          <button
                            type="button"
                            className="content-report-action"
                            onClick={() => openReport(m.sender_id, "chat_message", m.id)}
                          >
                            <Flag size={12} /> Denunciar mensagem
                          </button>
                        )}
                        <small>{new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</small>
                      </div>
                    ))}
                    {!messages.length && <p className="chat-empty">A conversa começou! Diga oi.</p>}
                  </div>
                  <form className="chat-compose" onSubmit={send}>
                    <div className="chat-tools">
                      <button
                        type="button"
                        onClick={() => chatFileRef.current?.click()}
                        title="Enviar foto, vídeo ou arquivo"
                        disabled={busy}
                      >
                        <Paperclip />
                      </button>
                      <input
                        ref={chatFileRef}
                        type="file"
                        hidden
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            if (f.type.startsWith("image/")) openImageCrop(f, "chat");
                            else void sendAttachment(f, f.type.startsWith("audio/") ? "audio" : "file");
                          }
                          e.currentTarget.value = "";
                        }}
                      />
                      <button
                        type="button"
                        className={recording ? "recording" : ""}
                        onClick={() => void toggleRecording()}
                        title={recording ? "Parar gravação" : "Gravar áudio"}
                        disabled={busy}
                      >
                        {recording ? <Square /> : <Mic />}
                      </button>
                    </div>
                    <input
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      placeholder={recording ? "Gravando áudio..." : "Converse antes de decidir..."}
                      maxLength={4000}
                    />
                    <button disabled={!draft.trim() || busy}>
                      <Send />
                    </button>
                  </form>
                  <small className="chat-upload-hint">
                    {recording ? "Toque no quadrado para finalizar o áudio." : "Fotos, vídeos, áudio e arquivos · até 50 MB"}
                  </small>
                  {cropFile && cropTarget === "chat" && (
                    <ImageCropper
                      file={cropFile}
                      aspectRatio={1.25}
                      title="Imagem do chat"
                      onCancel={() => {
                        setCropFile(null);
                        setCropTarget(null);
                      }}
                      onApply={(f) => void applyCroppedImage(f)}
                    />
                  )}
                  <div className="match-live-actions">
                    <button className="secondary" disabled={busy} onClick={() => void respondToMatch(false)}>
                      Encerrar encontro
                    </button>
                    <button className="primary" disabled={busy || pendingAccepted} onClick={() => void respondToMatch(true)}>
                      {pendingAccepted ? "Aguardando aceite" : "Aceitar match"} <Check />
                    </button>
                  </div>
                </section>
              ))}
            <div className="heading">
              <div>
                <small>CONEXÃO EM TEMPO REAL</small>
                <h1>
                  Uma conversa pode <em>começar agora.</em>
                </h1>
                <p>Encontre alguém online com preferências compatíveis.</p>
              </div>
            </div>
            <section className="queue-card">
              <div className={"connection-art " + (queue === "waiting" ? "is-searching" : pendingMatchId ? "is-found" : "")}>
                <div className="ring r1" />
                <div className="ring r2" />
                <div className="ring r3" />
                <div className="core">
                  <Activity size={30} />
                </div>
                <span className="connection-art-caption">
                  {queue === "waiting" ? "BUSCANDO PESSOAS..." : pendingMatchId ? "PESSOA ENCONTRADA" : "PRONTO PARA CONECTAR"}
                </span>
                <span className="search-orbit-dot" />
                <Users className="people-icon" />
              </div>
              <div>
                <small>MATCHING POR PREFERÊNCIAS</small>
                <div className={"queue-state " + (queue === "waiting" ? "is-active" : "")}>
                  <i />
                  {queue === "waiting" ? "PROCURANDO AGORA" : "PRONTO PARA CONECTAR"}
                </div>
                <h2>
                  {queue === "waiting"
                    ? "Estamos procurando sua conexão."
                    : pendingMatchId && pendingPartner
                      ? "Encontramos alguém para você."
                      : "Conheça alguém novo, sem complicação."}
                </h2>
                <p>
                  {queue === "waiting"
                    ? "Você está na fila. Quando alguém compatível aparecer, o chat abre automaticamente. Cada pessoa tem até 3 minutos para aceitar uma única vez."
                    : "O CONNECT procura pessoas online que também escolheram conhecer alguém com seu perfil."}
                </p>
                <div className="queue-filters">
                  <strong className="queue-location-label">Região de busca</strong>
                  <span>{queueCityFilter && queueStateFilter ? queueCityFilter + " · " + queueStateFilter : "Todo o Brasil"}</span>
                  <small>
                    Para buscar pessoas em outra cidade ou voltar à sua localização atual, use o ícone de localização no topo da tela.
                  </small>
                </div>
                <div className="queue-quota">
                  {queueQuota.unlimited ? (
                    <>
                      <strong>BUSCAS ILIMITADAS</strong>
                      <span>Seu pacote está ativo.</span>
                    </>
                  ) : (
                    <>
                      <strong>{queueQuota.remaining} de 20 buscas restantes hoje</strong>
                      <span>{queueQuota.used} buscas utilizadas · renovação à meia-noite (horário de Brasília)</span>
                    </>
                  )}
                </div>
                <ul>
                  <li>
                    <Check /> Pessoas reais
                  </li>
                  <li>
                    <Check /> Preferências respeitadas
                  </li>
                  <li>
                    <Check /> Chat em tempo real
                  </li>
                </ul>
                {pendingMatchId ? (
                  <p className="queue-pending-note">A confirmação da conexão está aberta na tela.</p>
                ) : matchId ? (
                  <button className="secondary" onClick={() => setTab("chat")}>
                    Voltar para a conversa ativa
                  </button>
                ) : queue === "waiting" ? (
                  <button className="secondary" onClick={() => void leaveQueue()}>
                    Sair da fila
                  </button>
                ) : isDemo ? (
                  <p className="demo-readonly-note">A busca por pessoas fica desativada no acesso de demonstração.</p>
                ) : (
                  <button className="primary" disabled={busy} onClick={() => void enterQueue()}>
                    <Radio /> {busy ? "Conectando..." : "Entrar na fila"} <ArrowRight />
                  </button>
                )}
              </div>
            </section>
          </>
        )}
        {tab === "chat" && (
          <>
            <div className="heading">
              <div>
                <small>CONVERSAS</small>
                <h1>
                  Suas <em>conexões.</em>
                </h1>
                <p>Conversas privadas e salas públicas do Brasil.</p>
              </div>
              <div className="chat-mode-switch">
                <button
                  className={chatView === "direct" && chatInboxTab === "conversations" ? "active" : ""}
                  onClick={() => {
                    setChatView("direct");
                    setChatInboxTab("conversations");
                  }}
                >
                  <MessageCircle size={15} /> Conversas
                </button>
                <button
                  className={chatView === "direct" && chatInboxTab === "requests" ? "active" : ""}
                  onClick={() => {
                    setChatView("direct");
                    setChatInboxTab("requests");
                  }}
                >
                  <Mail size={15} /> Pedidos {messageRequests.length > 0 && <b>{messageRequests.length}</b>}
                </button>
                <button
                  className={chatView === "direct" && chatInboxTab === "archived" ? "active" : ""}
                  onClick={() => {
                    setChatView("direct");
                    setChatInboxTab("archived");
                    if (session?.user.id) void loadChatHistory(session.user.id);
                  }}
                >
                  <Archive size={15} /> Arquivadas
                </button>
              </div>
            </div>
            {chatView === "direct" && (
              <>
                {chatInboxTab === "requests" ? (
                  <section className="message-requests">
                    {messageRequests.map((item) => (
                      <article key={item.id}>
                        <Avatar p={item.sender} size="small" />
                        <div className="message-request-copy">
                          <strong>{item.sender.display_name}</strong>
                          <small>
                            @{item.sender.username} · {ago(item.created_at)}
                          </small>
                          <p>{item.initial_message}</p>
                        </div>
                        <div className="message-request-actions">
                          <button className="primary" onClick={() => void respondMessageRequest(item.id, true)}>
                            Aceitar
                          </button>
                          <button className="secondary" onClick={() => void respondMessageRequest(item.id, false)}>
                            Recusar
                          </button>
                          {!isDemo && (
                            <button
                              type="button"
                              className="content-report-action"
                              onClick={() => openReport(item.sender_id, "chat_message", item.id)}
                            >
                              <Flag size={12} /> Denunciar mensagem
                            </button>
                          )}
                        </div>
                      </article>
                    ))}
                    {!messageRequests.length && (
                      <div className="empty">
                        <MessageCircle />
                        <h3>Nenhum pedido de mensagem.</h3>
                        <p>Quando alguém que não é seu amigo mandar mensagem, o pedido aparecerá aqui.</p>
                      </div>
                    )}
                  </section>
                ) : (
                  <>
                    {matchId && partner ? (
                      chatMinimized ? (
                        <section className="chat-minimized">
                          <div>
                            <Avatar p={partner} size="small" />
                            <span>
                              <strong>{partner.display_name}</strong>
                              <small>Conversa minimizada · mensagens continuam chegando</small>
                            </span>
                          </div>
                          <button className="secondary" onClick={() => setChatMinimized(false)}>
                            Reabrir conversa
                          </button>
                          <button className="chat-close-mini" onClick={() => void endChat()} title="Encerrar conversa">
                            <X />
                          </button>
                        </section>
                      ) : (
                        <section className="chat">
                          <header>
                            <button
                              type="button"
                              className="profile-open-avatar"
                              onClick={() => void openProfile(partner.id)}
                              aria-label={"Ver perfil de " + partner.display_name}
                            >
                              <Avatar p={partner} />
                            </button>
                            <div className="chat-person-info">
                              <button type="button" className="profile-open-name" onClick={() => void openProfile(partner.id)}>
                                {partner.display_name}
                              </button>
                              <span>
                                @{partner.username} · {chatReadOnly ? "histórico salvo" : "match confirmado"}
                              </span>
                            </div>
                            {!isDemo && (
                              <>
                                {!chatReadOnly && (
                                  <>
                                    <button title="Denunciar pessoa" onClick={() => openReport(partner.id)}>
                                      <Flag />
                                    </button>
                                    <button title="Bloquear pessoa" onClick={() => void blockUser(partner.id)}>
                                      <Ban />
                                    </button>
                                  </>
                                )}
                                {!chatReadOnly && (
                                  <button onClick={() => setChatMinimized(true)} title="Minimizar conversa">
                                    <Minus />
                                  </button>
                                )}
                                <button
                                  onClick={() => void endChat()}
                                  title={chatReadOnly ? "Voltar ao histórico" : "Fechar e salvar conversa"}
                                >
                                  <X />
                                </button>
                              </>
                            )}
                          </header>
                          <div className="messages">
                            {messages.map((m) => (
                              <div key={m.id} className={"bubble " + (m.sender_id === session.user.id ? "mine" : "")}>
                                {m.attachment_path && m.attachment_url ? (
                                  <div className="chat-attachment">
                                    {m.attachment_mime?.startsWith("image/") ? (
                                      <a href={m.attachment_url} target="_blank" rel="noreferrer">
                                        <img src={m.attachment_url} alt={m.attachment_name || "Imagem enviada"} />
                                      </a>
                                    ) : m.message_type === "audio" || m.attachment_mime?.startsWith("audio/") ? (
                                      <audio src={m.attachment_url} controls preload="metadata" />
                                    ) : m.attachment_mime?.startsWith("video/") ? (
                                      <video src={m.attachment_url} controls />
                                    ) : (
                                      <a className="chat-file" href={m.attachment_url} download={m.attachment_name || "arquivo"}>
                                        <FileText />
                                        <span>
                                          {m.attachment_name || "Arquivo"}
                                          <small>
                                            {m.attachment_size ? Math.max(1, Math.round(m.attachment_size / 1024)) + " KB" : "Anexo"}
                                          </small>
                                        </span>
                                        <Download />
                                      </a>
                                    )}
                                    {m.body && <p>{m.body}</p>}
                                  </div>
                                ) : (
                                  m.body
                                )}
                                {!isDemo && m.sender_id !== session.user.id && (
                                  <button
                                    type="button"
                                    className="content-report-action"
                                    onClick={() => openReport(m.sender_id, "chat_message", m.id)}
                                  >
                                    <Flag size={12} /> Denunciar mensagem
                                  </button>
                                )}
                                <small>{new Date(m.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</small>
                              </div>
                            ))}
                            {!messages.length && <p className="chat-empty">Vocês foram conectados! Que tal começar com um oi?</p>}
                          </div>
                          {!chatReadOnly && !isDemo ? (
                            <>
                              <form className="chat-compose" onSubmit={send}>
                                <div className="chat-tools">
                                  <button
                                    type="button"
                                    onClick={() => chatFileRef.current?.click()}
                                    title="Enviar foto ou arquivo"
                                    disabled={busy}
                                  >
                                    <Paperclip />
                                  </button>
                                  <input
                                    ref={chatFileRef}
                                    type="file"
                                    hidden
                                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.zip"
                                    onChange={(e) => {
                                      const f = e.target.files?.[0];
                                      if (f) {
                                        if (f.type.startsWith("image/")) openImageCrop(f, "chat");
                                        else void sendAttachment(f, f.type.startsWith("audio/") ? "audio" : "file");
                                      }
                                      e.currentTarget.value = "";
                                    }}
                                  />
                                  <button
                                    type="button"
                                    className={recording ? "recording" : ""}
                                    onClick={() => void toggleRecording()}
                                    title={recording ? "Parar gravação" : "Gravar áudio"}
                                    disabled={busy}
                                  >
                                    {recording ? <Square /> : <Mic />}
                                  </button>
                                </div>
                                <input
                                  value={draft}
                                  onChange={(e) => setDraft(e.target.value)}
                                  placeholder={recording ? "Gravando áudio..." : "Escreva uma mensagem..."}
                                  maxLength={4000}
                                />
                                <button disabled={!draft.trim() || busy}>
                                  <Send />
                                </button>
                              </form>
                              <small className="chat-upload-hint">
                                {recording ? "Toque no quadrado para finalizar o áudio." : "Fotos, vídeos, áudio e arquivos · até 50 MB"}
                              </small>
                            </>
                          ) : (
                            <div className="chat-archived-note">
                              {isDemo
                                ? "Modo de demonstração: mensagens e anexos estão desativados."
                                : "Esta conversa está salva no seu histórico. Ela não recebe novas mensagens."}
                            </div>
                          )}
                        </section>
                      )
                    ) : (
                      <>
                        {chatHistory.length > 0 ? (
                          <section className="chat-history">
                            <h2>{chatInboxTab === "archived" ? "Conversas arquivadas" : "Conversas"}</h2>
                            {chatHistory.map((item) => (
                              <article className="chat-history-item" key={item.id}>
                                <button
                                  className="chat-history-open"
                                  onClick={() => {
                                    setMatchId(item.id);
                                    setChatReadOnly(true);
                                    setChatMinimized(false);
                                  }}
                                >
                                  <Avatar p={item.partner} size="small" />
                                  <span>
                                    <strong>{item.partner.display_name}</strong>
                                    <small>
                                      @{item.partner.username} · {new Date(item.created_at).toLocaleDateString("pt-BR")}
                                    </small>
                                  </span>
                                  <MessageCircle />
                                </button>
                                <div className="chat-history-actions">
                                  {chatInboxTab === "archived" ? (
                                    <button
                                      type="button"
                                      title="Restaurar conversa"
                                      onClick={() => void setChatHistoryStatus(item.id, "active")}
                                    >
                                      <MessageSquare size={15} /> Restaurar
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      title="Arquivar conversa"
                                      onClick={() => void setChatHistoryStatus(item.id, "archived")}
                                    >
                                      <Minus size={15} /> Arquivar
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    className="delete-chat-action"
                                    title="Apagar do meu histórico"
                                    onClick={() => void setChatHistoryStatus(item.id, "deleted")}
                                  >
                                    <Trash2 size={15} /> Apagar
                                  </button>
                                </div>
                              </article>
                            ))}
                          </section>
                        ) : (
                          <div className="empty">
                            <MessageCircle />
                            <h3>Nenhuma conversa ativa.</h3>
                            <p>Entre na fila para encontrar alguém que também esteja online.</p>
                            <button className="primary" onClick={() => setTab("queue")}>
                              Encontrar alguém <ArrowRight />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}
        {messageRecipient && (
          <div className="crop-backdrop" role="dialog" aria-modal="true" aria-label="Enviar mensagem">
            <form className="report-dialog" onSubmit={sendDirectMessage}>
              <header>
                <div>
                  <small>{relationship.mutual ? "CONVERSA DIRETA" : "PEDIDO DE MENSAGEM"}</small>
                  <h2>Mensagem para {messageRecipient.display_name}</h2>
                </div>
                <button type="button" onClick={() => setMessageRecipient(null)}>
                  <X />
                </button>
              </header>
              <p>
                {relationship.mutual
                  ? "Vocês se seguem. Sua mensagem vai direto para a conversa."
                  : "Vocês ainda não se seguem mutuamente. Sua mensagem será enviada como pedido e a pessoa poderá aceitar ou recusar."}
              </p>
              <label>
                Mensagem
                <textarea
                  value={directMessageDraft}
                  onChange={(e) => setDirectMessageDraft(e.target.value)}
                  maxLength={4000}
                  rows={4}
                  required
                  placeholder="Escreva sua primeira mensagem..."
                />
              </label>
              <footer>
                <button type="button" className="secondary" onClick={() => setMessageRecipient(null)}>
                  Cancelar
                </button>
                <button className="primary" disabled={busy || !directMessageDraft.trim()}>
                  {busy ? "Enviando..." : "Enviar mensagem"} <Send size={15} />
                </button>
              </footer>
            </form>
          </div>
        )}
        {tab === "settings" && (
          <>
            <div className="heading">
              <div>
                <small>AJUSTES DA CONTA</small>
                <h1>Configurações.</h1>
                <p>Gerencie seus dados, preferências, segurança e privacidade.</p>
              </div>
            </div>
            <div className="settings-panel profile-settings-unified">
              <section className="settings-section profile-identity-editor">
                <div>
                  <UserRound />
                  <span>
                    <strong>Nome de exibição</strong>
                    <small>Este é o nome que aparece no seu perfil, publicações e conversas. Não altera seu @.</small>
                  </span>
                </div>
                <form onSubmit={saveDisplayName}>
                  <label>
                    Seu nome
                    <input
                      value={displayNameSetting}
                      onChange={(e) => setDisplayNameSetting(e.target.value)}
                      maxLength={40}
                      placeholder="Como deseja aparecer no CONNECT?"
                      autoComplete="name"
                    />
                  </label>
                  <button className="primary" disabled={busy}>
                    Salvar nome <Check size={15} />
                  </button>
                </form>
              </section>
              <section className="settings-section profile-identity-editor">
                <div>
                  <UserRound />
                  <span>
                    <strong>Editar identificador e gênero</strong>
                    <small>Você pode atualizar seu @ e suas informações de identidade quando quiser. O @ precisa estar disponível.</small>
                  </span>
                </div>
                <form onSubmit={saveIdentity}>
                  <label>
                    Identificador (@)
                    <input
                      value={usernameSetting}
                      onChange={(e) => setUsernameSetting(e.target.value)}
                      maxLength={20}
                      autoCapitalize="none"
                      autoCorrect="off"
                      placeholder="seu_identificador"
                    />
                  </label>
                  <label>
                    Gênero
                    <select value={genderSetting} onChange={(e) => setGenderSetting(e.target.value)}>
                      <option value="woman">Mulher</option>
                      <option value="man">Homem</option>
                      <option value="non_binary">Pessoa não binária</option>
                      <option value="self_described">Outro gênero</option>
                      <option value="prefer_not_to_say">Prefiro não informar</option>
                    </select>
                  </label>
                  {genderSetting === "self_described" && (
                    <label>
                      Descreva seu gênero
                      <input
                        value={genderDescriptionSetting}
                        onChange={(e) => setGenderDescriptionSetting(e.target.value)}
                        maxLength={80}
                        placeholder="Como deseja se identificar?"
                      />
                    </label>
                  )}
                  <button className="primary" disabled={busy}>
                    Salvar identidade <Check size={15} />
                  </button>
                </form>
              </section>
              <p className="profile-hint">
                <ShieldCheck size={16} /> Seu @ é exclusivo e não pode ser usado por outra pessoa.
              </p>
              <div className="settings-section">
                <div>
                  <Users />
                  <span>
                    <strong>Preferências de conexão</strong>
                    <small>Escolha quem deseja conhecer. As preferências dos dois lados continuam sendo respeitadas.</small>
                  </span>
                </div>
                <form onSubmit={saveMatchingPreferences}>
                  <label>
                    Quero conhecer
                    <select value={lookingForSetting} onChange={(e) => setLookingForSetting(e.target.value)}>
                      <option value="any">Qualquer gênero</option>
                      <option value="woman">Mulheres</option>
                      <option value="man">Homens</option>
                      <option value="non_binary">Pessoas não binárias</option>
                      <option value="self_described">Outros gêneros</option>
                      <option value="prefer_not_to_say">Pessoas que preferem não informar</option>
                    </select>
                  </label>
                  <button className="primary">
                    Salvar preferências <Check size={15} />
                  </button>
                </form>
              </div>
              <div className="settings-section">
                <div>
                  <ShieldCheck />
                  <span>
                    <strong>Segurança da conta</strong>
                    <small>Proteja seu acesso e gerencie pessoas bloqueadas.</small>
                  </span>
                </div>
                <button className="secondary" onClick={() => void sendPasswordReset()}>
                  Redefinir senha por e-mail
                </button>
                <div className="blocked-list">
                  <strong>Pessoas bloqueadas</strong>
                  {blockedPeople.map((person) => (
                    <div key={person.id}>
                      <Avatar p={person} size="small" />
                      <span>
                        {person.display_name}
                        <small>@{person.username}</small>
                      </span>
                      <button type="button" className="secondary" onClick={() => void unblockUser(person.id)}>
                        Desbloquear
                      </button>
                    </div>
                  ))}
                  {!blockedPeople.length && <small>Ninguém bloqueado por enquanto.</small>}
                </div>
              </div>
              <div className="settings-section danger-zone">
                <div>
                  <Trash2 />
                  <span>
                    <strong>Excluir minha conta</strong>
                    <small>Você terá 7 dias para cancelar o pedido antes da exclusão definitiva.</small>
                  </span>
                </div>
                {deletionDue ? (
                  <>
                    <p className="deletion-pending">
                      Exclusão programada para {new Date(deletionDue).toLocaleString("pt-BR")}. Você ainda pode cancelar.
                    </p>
                    <button className="secondary" onClick={() => void cancelDeletion()}>
                      Cancelar exclusão e recuperar conta
                    </button>
                  </>
                ) : (
                  <button className="danger-button" onClick={() => void requestDeletion()}>
                    Solicitar exclusão da conta
                  </button>
                )}
              </div>
            </div>
          </>
        )}
        {tab === "download" && (
          <>
            <div className="heading">
              <div>
                <small>CONNECT NO SEU CELULAR</small>
                <h1>
                  Seu CONNECT, <em>sempre por perto.</em>
                </h1>
                <p>Instale o aplicativo ou baixe a versão Android quando estiver disponível.</p>
              </div>
            </div>
            <AppDownload />
          </>
        )}
        {tab === "profile" && (
          <>
            <div className="heading">
              <div>
                <small>SEU PERFIL</small>
                <h1>
                  Seu espaço, <em>sua história.</em>
                </h1>
                <p>Veja suas informações e publicações em um só lugar.</p>
              </div>
            </div>
            <section className="profile-card">
              <div
                className="banner"
                style={
                  profile.banner_url
                    ? { backgroundImage: "linear-gradient(0deg,#090c10aa,transparent),url(" + profile.banner_url + ")" }
                    : {}
                }
              >
                {!isDemo && (
                  <label>
                    <Camera size={15} /> Alterar banner
                    <input
                      type="file"
                      hidden
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) openImageCrop(f, "banner");
                        e.currentTarget.value = "";
                      }}
                    />
                  </label>
                )}
              </div>
              <div className="profile-ident">
                <div className="profile-avatar">
                  <Avatar p={profile} size="large" />
                  {!isDemo && (
                    <label>
                      <Camera size={14} />
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) openImageCrop(f, "avatar");
                          e.currentTarget.value = "";
                        }}
                      />
                    </label>
                  )}
                </div>
                <div>
                  <h2>{profile.display_name}</h2>
                  <span>@{profile.username}</span>
                </div>
                <span className="profile-active">
                  <ShieldCheck size={14} /> PERFIL ATIVO
                </span>
                <button type="button" className="secondary visitor-preview-trigger" onClick={() => setShowVisitorPreview(true)}>
                  <Eye size={15} /> Ver como visitante
                </button>
              </div>
              {!isDemo && (
                <form className="bio-form" onSubmit={saveBio}>
                  <label>Sobre você</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={300}
                    placeholder="Conte um pouco sobre você..."
                  />
                  <button className="primary">
                    Salvar alterações <Check size={15} />
                  </button>
                </form>
              )}
              {isDemo && <p className="demo-readonly-note">Perfil em modo somente leitura.</p>}
              <div className="own-social-stats">
                <button type="button" onClick={() => void openOwnSocialList("followers")}>
                  <Users size={17} />
                  <strong>{ownSocialCounts.followers}</strong>
                  <span>Seguidores</span>
                </button>
                <button type="button" onClick={() => void openOwnSocialList("following")}>
                  <UserRound size={17} />
                  <strong>{ownSocialCounts.following}</strong>
                  <span>Seguindo</span>
                </button>
              </div>
              <div className="profile-facts">
                <div>
                  <small>IDENTIFICADOR</small>
                  <strong>@{profile.username}</strong>
                </div>
                <div>
                  <small>GÊNERO</small>
                  <strong>
                    {genders[profile.gender] || profile.gender}
                    {profile.gender_description ? " · " + profile.gender_description : ""}
                  </strong>
                </div>
                <div>
                  <small>QUER CONHECER</small>
                  <strong>{profile.looking_for.map((x) => preferences[x] || x).join(", ")}</strong>
                </div>
                <div>
                  <small>LOCALIZAÇÃO</small>
                  <strong>
                    {profile.location_visible && profile.city && profile.state_code
                      ? profile.city + " · " + profile.state_code
                      : "Não exibida"}
                  </strong>
                </div>
                <div>
                  <small>PUBLICAÇÕES</small>
                  <strong>{posts.filter((p) => p.user_id === profile.id).length}</strong>
                </div>
              </div>
            </section>
            <section className="profile-posts-section">
              <div className="section-heading">
                <div>
                  <strong>Minhas publicações</strong>
                  <span>Suas postagens ficam guardadas aqui, mesmo quando saem do feed recente.</span>
                </div>
                <small>{ownPosts.length} PUBLICAÇÕES</small>
              </div>
              {ownPosts.map((p) => (
                <article className="post own-post" key={p.id}>
                  <header>
                    <Avatar p={profile} />
                    <div>
                      <strong>{profile.display_name}</strong>
                      <span>
                        @{profile.username} · {ago(p.created_at)}
                      </span>
                    </div>
                    {!isDemo && (
                      <button className="delete" title="Apagar publicação" onClick={() => void removePost(p.id)}>
                        <Trash2 size={16} />
                      </button>
                    )}
                  </header>
                  {p.body && <p className="post-body">{p.body}</p>}
                  {p.media_url && (
                    <div className="post-media">
                      {p.media_type === "video" ? (
                        <video src={p.media_url} controls />
                      ) : (
                        <img src={p.media_url} alt="Imagem da sua publicação" />
                      )}
                    </div>
                  )}
                  <div className="post-stats">
                    <span>{p.likes} curtidas</span>
                    <span>{p.comments} comentários</span>
                  </div>
                </article>
              ))}
              {!ownPosts.length && (
                <div className="empty">
                  <MessageSquare />
                  <h3>Você ainda não publicou.</h3>
                  <p>Quando fizer uma publicação, ela aparecerá aqui para você consultar e apagar quando quiser.</p>
                </div>
              )}
            </section>
          </>
        )}
        {tab === "subscription" && (
          <>
            <div className="heading">
              <div>
                <small>CONNECT · ASSINATURA</small>
                <h1>
                  Uma assinatura. <em>Mais conexões.</em>
                </h1>
                <p>Gerencie sua assinatura e os benefícios da sua conta.</p>
              </div>
            </div>
            <section className="subscription-page-card">
              <div className="section-heading">
                <div>
                  <strong>Assinatura CONNECT</strong>
                  <span>Gerencie sua assinatura, escolha a cobrança ou presenteie alguém.</span>
                </div>
              </div>
              <SubscriptionPlans />
            </section>
          </>
        )}
      </section>
      <aside className="connect-discover">
        <div className="rail-title">
          <small>CONNECT · AO SEU LADO</small>
          <Activity />
        </div>
        <section className="rail-card">
          <small>ENCONTROS EM TEMPO REAL</small>
          <h2>
            Tem alguém esperando por <em>uma boa conversa.</em>
          </h2>
          <p>Use a aba Conectar e conheça pessoas que também estão online agora.</p>
          <img className="rail-photo" src="/Connect/images/community.webp" alt="Pessoas se divertindo juntas" loading="lazy" width={1100} height={715} />
          <div className="rail-orbits">
            <i />
            <i />
            <i />
          </div>
        </section>
        <section className="rail-tip">
          <small>
            <Sparkles size={14} /> DICA DO CONNECT
          </small>
          <p>Uma boa conversa começa com curiosidade e respeito. Seja você mesmo.</p>
        </section>
        <footer>
          CONNECT © 2026 <span>FEITO PARA APROXIMAR</span>
        </footer>
      </aside>
    </main>
  );
}
