"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
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
const SubscriptionPlans = dynamic(() => import("./components/SubscriptionPlans"), {
  ssr: false,
  loading: () => <div className="module-loading" role="status">Carregando assinaturas...</div>,
});
import BrazilLocationPicker from "./components/BrazilLocationPicker";
import AppDownload from "./components/AppDownload";
import { brazilStates } from "./lib/brazil";
import Avatar from "./components/ConnectAvatar";
import ConnectRooms from "./components/ConnectRooms";
import ConnectLanding from "./components/ConnectLanding";
import ConnectAuthGate from "./components/ConnectAuthGate";
import { useConnectFeed } from "./hooks/useConnectFeed";
import { useConnectRooms } from "./hooks/useConnectRooms";
import ConnectNavigation from "./components/ConnectNavigation";
import ConnectFeed from "./components/ConnectFeed";
import ConnectPeopleDirectory from "./components/ConnectPeopleDirectory";
import ConnectSettings from "./components/ConnectSettings";
import ConnectProfile from "./components/ConnectProfile";
import ConnectChat from "./components/ConnectChat";
import ConnectQueue from "./components/ConnectQueue";
import ConnectOverlays from "./components/ConnectOverlays";
import { useConnectNotifications } from "./hooks/useConnectNotifications";
import { ago, formatNotificationCount, sanitizeSearchTerm } from "./lib/connect-utils";
import { essentialNotificationTypes, PEOPLE_PAGE_SIZE, PEOPLE_ONLINE_ID_CAP } from "./lib/connect-data";
import type { Profile, Post, Comment, Message, ChatHistoryItem, MessageRequestItem, RoomMessage, NotificationItem } from "./types/connect";

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
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false);
  const [chatView, setChatView] = useState<"direct" | "rooms">("direct"),
    [roomCode, setRoomCode] = useState("BR"),
    [roomMessages, setRoomMessages] = useState<RoomMessage[]>([]),
    [roomDraft, setRoomDraft] = useState(""),
    [roomReply, setRoomReply] = useState<RoomMessage | null>(null);
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
  const lastUserIdRef = useRef<string | null>(null);
  const [peopleCursor, setPeopleCursor] = useState<{ created_at: string; id: string } | null>(null),
    [peopleHasMore, setPeopleHasMore] = useState(false),
    [peopleLoading, setPeopleLoading] = useState(false),
    [peopleTotal, setPeopleTotal] = useState(0),
    [peopleNewThisWeek, setPeopleNewThisWeek] = useState(0);
  const peopleRequestRef = useRef(0);
  const [pendingMatchId, setPendingMatchId] = useState(""),
    [pendingPartner, setPendingPartner] = useState<Profile | null>(null),
    [showMatchIntro, setShowMatchIntro] = useState(false),
    [pendingExpiresAt, setPendingExpiresAt] = useState(""),
    [pendingSeconds, setPendingSeconds] = useState(180),
    [pendingTotalSeconds, setPendingTotalSeconds] = useState(180),
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
  // Top-bar dropdowns: only one open at a time, closed by outside click, Escape or a tab change.
  useEffect(() => {
    if (notificationsOpen) { setUserMenuOpen(false); setLocationOpen(false); }
  }, [notificationsOpen]);
  useEffect(() => {
    if (locationOpen) { setUserMenuOpen(false); setNotificationsOpen(false); }
  }, [locationOpen]);
  useEffect(() => {
    if (userMenuOpen) { setLocationOpen(false); setNotificationsOpen(false); }
  }, [userMenuOpen]);
  useEffect(() => {
    setUserMenuOpen(false); setLocationOpen(false); setNotificationsOpen(false);
  }, [tab]);
  useEffect(() => {
    if (!userMenuOpen && !locationOpen && !notificationsOpen) return;
    const closeAll = () => { setUserMenuOpen(false); setLocationOpen(false); setNotificationsOpen(false); };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (target && target.closest(".topbar-actions>div")) return;
      closeAll();
    };
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") closeAll(); };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [userMenuOpen, locationOpen, notificationsOpen]);
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
    if (!m.data) return;
    if (m.data.match_status === "accepted") {
      setMatchId(id);
      setChatReadOnly(false);
      setQueue("matched");
      setTab("chat");
      if (session?.user.id) void loadChatHistory(session.user.id);
      return;
    }
    if (m.data.match_status !== "pending") {
      // The queue pointed at a match that was already declined/expired: do not stay stuck in "matched".
      setQueue("idle");
      return;
    }
    const other = m.data.user_one === session?.user.id ? m.data.user_two : m.data.user_one;
    const p = await supabase.from("profiles").select("*").eq("id", other).maybeSingle();
    setPendingMatchId(id);
    setPendingPartner(p.data as Profile | null);
    setShowMatchIntro(true);
    {
      const expiresMs = new Date(m.data.expires_at || Date.now() + 180000).getTime();
      const createdMs = m.data.created_at ? new Date(m.data.created_at).getTime() : NaN;
      const windowSeconds = Number.isFinite(createdMs) ? Math.round((expiresMs - createdMs) / 1000) : 0;
      // Janela configurada no servidor; se não der para calcular, usa a restante como referência.
      setPendingTotalSeconds(windowSeconds >= 60 && windowSeconds <= 3600 ? windowSeconds : Math.max(60, Math.ceil((expiresMs - Date.now()) / 1000)));
    }
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
  /**
   * Carrega uma página da aba Pessoas pela função `list_community_profiles` do banco:
   * paginação por cursor de tupla (created_at, id) — custo constante em qualquer profundidade —,
   * busca, filtros e cidade resolvidos no servidor. É `security invoker`, então a RLS de `profiles`
   * continua excluindo bloqueios (nos dois sentidos) e contas de demonstração.
   */
  async function loadCommunityProfiles(uid: string, mode: "reset" | "more" = "reset") {
    const requestId = ++peopleRequestRef.current;
    if (mode === "reset") setPeopleCursor(null);
    setPeopleLoading(true);
    try {
      const cursor = mode === "more" ? peopleCursor : null;
      const filter = ["all", "new", "near", "online"].includes(peopleFilter) ? peopleFilter : "all";
      const r = await supabase.rpc("list_community_profiles", {
        p_limit: PEOPLE_PAGE_SIZE + 1,
        p_cursor_created_at: cursor?.created_at ?? null,
        p_cursor_id: cursor?.id ?? null,
        p_search: sanitizeSearchTerm(peopleSearch) || null,
        p_filter: filter,
        p_online_ids: filter === "online" ? onlinePeople.filter((id: string) => id !== uid).slice(0, PEOPLE_ONLINE_ID_CAP) : null,
      });
      if (requestId !== peopleRequestRef.current) return; // resposta antiga: ignora
      if (r.error) {
        fail("Não foi possível carregar os perfis da comunidade: " + r.error.message);
        return;
      }
      const rows = (r.data || []) as Profile[];
      const hasMore = rows.length > PEOPLE_PAGE_SIZE;
      const page = hasMore ? rows.slice(0, PEOPLE_PAGE_SIZE) : rows;
      const last = page[page.length - 1];
      setPeopleCursor(last?.created_at ? { created_at: last.created_at, id: last.id } : null);
      setPeopleHasMore(hasMore && Boolean(last?.created_at));
      setCommunityProfiles((old) => {
        if (mode === "reset") return page;
        const seen = new Set(old.map((person: Profile) => person.id));
        return [...old, ...page.filter((person: Profile) => !seen.has(person.id))];
      });
    } finally {
      if (requestId === peopleRequestRef.current) setPeopleLoading(false);
    }
  }
  /** Totais da comunidade: uma vez por sessão, sem baixar nenhum perfil. */
  async function loadPeopleStats(uid: string) {
    const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const [total, recent] = await Promise.all([
      supabase.from("profiles").select("id", { count: "estimated", head: true }).neq("id", uid),
      supabase.from("profiles").select("id", { count: "exact", head: true }).neq("id", uid).gte("created_at", weekAgo),
    ]);
    setPeopleTotal(total.count || 0);
    setPeopleNewThisWeek(recent.count || 0);
  }
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
        // Mantém a mesma referência quando é só renovação de token/foco da aba,
        // para não disparar recarregamentos desnecessários.
        setSession((old) => (old && s && old.user.id === s.user.id ? (old.access_token === s.access_token ? old : s) : s));
        setLoading(false);
      }
      const nextUserId = s?.user.id ?? null;
      if (lastUserIdRef.current !== nextUserId) {
        // Entrou, saiu ou trocou de conta: nada da conta anterior pode sobreviver na tela.
        lastUserIdRef.current = nextUserId;
        setProfile(null);
        setPosts([]);
        setOwnPosts([]);
        setComments([]);
        setCommunityProfiles([]);
        setPeopleCursor(null);
        setPeopleHasMore(false);
        setPeopleTotal(0);
        setMatchId("");
        setPartner(null);
        setMessages([]);
        setDraft("");
        setQueue("idle");
        setPendingMatchId("");
        setPendingPartner(null);
        setPendingExpiresAt("");
        setPendingAccepted(false);
        setPendingOtherAccepted(false);
        setShowMatchIntro(false);
        setChatHistory([]);
        setMessageRequests([]);
        setNotifications([]);
        setBlockedPeople([]);
        setViewingProfile(null);
        setDeletionDue("");
        setRoomMessages([]);
        setRoomDraft("");
        setRoomReply(null);
        setTab("feed");
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
  }, [session?.user.id]);
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

  // Aba Pessoas: carrega somente quando está aberta e reage a busca/filtro com debounce.
  useEffect(() => {
    if (tab !== "people" || !session?.user.id || !profile) return;
    const uid = session.user.id;
    const timer = window.setTimeout(() => void loadCommunityProfiles(uid, "reset"), peopleSearch ? 300 : 0);
    return () => window.clearTimeout(timer);
  }, [tab, session?.user.id, profile?.id, peopleSearch, peopleFilter, peopleFilter === "online" ? onlinePeople.join(",") : ""]);
  useEffect(() => {
    if (session?.user.id && profile) void loadPeopleStats(session.user.id);
  }, [session?.user.id, profile?.id]);

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
  }, [session?.user.id, profile?.id]);

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
  }, [session?.user.id, profile?.id]);
  useEffect(() => {
    if (tab === "settings") void loadBlockedPeople();
    if (tab === "profile" && session?.user.id) void loadOwnPosts(session.user.id);
  }, [tab, session?.user.id]);
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
  }, [session?.user.id, tab, queue]);
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
  }, [tab, roomCode, session?.user.id]);
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
    let attempts = 0;
    const tick = () => {
      const left = Math.max(0, Math.ceil((new Date(pendingExpiresAt).getTime() - Date.now()) / 1000));
      setPendingSeconds(left);
      if (left === 0 && !expired) {
        expired = true;
        attempts += 1;
        void supabase.rpc("expire_pending_match", { p_match_id: pendingMatchId }).then(async ({ error: expireError }) => {
          // Both people may have accepted in the last second: trust the server, not the local clock.
          const { data: latest } = await supabase.from("matches").select("match_status").eq("id", pendingMatchId).maybeSingle();
          if (latest?.match_status === "accepted") {
            setPendingMatchId("");
            setPendingPartner(null);
            setPendingExpiresAt("");
            setPendingAccepted(false);
            setPendingOtherAccepted(false);
            setMatchId(pendingMatchId);
            setChatReadOnly(false);
            setTab("chat");
            setQueue("matched");
            if (session?.user.id) void loadChatHistory(session.user.id);
            setNotice("Match confirmado pelos dois! A conversa foi para a aba Chat.");
            return;
          }
          if (expireError && latest?.match_status === "pending" && attempts < 4) {
            expired = false; // server still says pending (network hiccup): try again on the next tick
            return;
          }
          setPendingMatchId("");
          setPendingPartner(null);
          setPendingExpiresAt("");
          setPendingAccepted(false);
          setPendingOtherAccepted(false);
          setMessages([]);
          setDraft("");
          setQueue("idle");
          setNotice("O tempo do encontro acabou. Cada um seguiu seu caminho.");
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
  }, [matchId, session?.user.id]);
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
  return (
    <main className="connect-app" data-screen="workspace">
      <ConnectNavigation tab={tab} setTab={setTab} queue={queue} />
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
                    {formatNotificationCount(notifications.filter((x) => !x.read_at).length)}
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
                            {item.type === "message" ? (
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
        <ConnectOverlays
          profile={profile}
          isDemo={isDemo}
          ownSocialList={ownSocialList}
          setOwnSocialList={setOwnSocialList}
          openProfile={openProfile}
          showVisitorPreview={showVisitorPreview}
          setShowVisitorPreview={setShowVisitorPreview}
          ownSocialCounts={ownSocialCounts}
          viewingProfile={viewingProfile}
          setViewingProfile={setViewingProfile}
          relationship={relationship}
          toggleFollow={toggleFollow}
          startMessage={startMessage}
          openReport={openReport}
          blockUser={blockUser}
          reportTarget={reportTarget}
          setReportTarget={setReportTarget}
          reportTargetType={reportTargetType}
          reportCategory={reportCategory}
          setReportCategory={setReportCategory}
          reportDetails={reportDetails}
          setReportDetails={setReportDetails}
          submitReport={submitReport}
          cropFile={cropFile}
          cropTarget={cropTarget}
          setCropFile={setCropFile}
          setCropTarget={setCropTarget}
          applyCroppedImage={applyCroppedImage}
        />
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
        {tab === "people" && (
          <ConnectPeopleDirectory
            communityProfiles={communityProfiles}
            peopleTotal={peopleTotal}
            peopleNewThisWeek={peopleNewThisWeek}
            peopleHasMore={peopleHasMore}
            peopleLoading={peopleLoading}
            loadMorePeople={() => (session?.user.id ? loadCommunityProfiles(session.user.id, "more") : undefined)}
            profile={profile}
            onlinePeople={onlinePeople}
            peopleSearch={peopleSearch}
            setPeopleSearch={setPeopleSearch}
            peopleFilter={peopleFilter}
            setPeopleFilter={setPeopleFilter}
            openProfile={openProfile}
          />
        )}
        {tab === "rooms" && <>{room}</>}
        <ConnectQueue
          tab={tab}
          profile={profile}
          currentUserId={session.user.id}
          pendingMatchId={pendingMatchId}
          pendingPartner={pendingPartner}
          showMatchIntro={showMatchIntro}
          setShowMatchIntro={setShowMatchIntro}
          pendingSeconds={pendingSeconds}
          pendingTotalSeconds={pendingTotalSeconds}
          pendingChatMinimized={pendingChatMinimized}
          setPendingChatMinimized={setPendingChatMinimized}
          respondToMatch={respondToMatch}
          openProfile={openProfile}
          openReport={openReport}
          blockUser={blockUser}
          messages={messages}
          cropFile={cropFile}
          cropTarget={cropTarget}
          setCropFile={setCropFile}
          setCropTarget={setCropTarget}
          applyCroppedImage={applyCroppedImage}
          send={send}
          chatFileRef={chatFileRef}
          recording={recording}
          toggleRecording={toggleRecording}
          busy={busy}
          draft={draft}
          setDraft={setDraft}
          openImageCrop={openImageCrop}
          sendAttachment={sendAttachment}
          pendingAccepted={pendingAccepted}
          pendingOtherAccepted={pendingOtherAccepted}
          queue={queue}
          queueCityFilter={queueCityFilter}
          queueStateFilter={queueStateFilter}
          queueQuota={queueQuota}
          matchId={matchId}
          setTab={setTab}
          isDemo={isDemo}
          enterQueue={enterQueue}
          leaveQueue={leaveQueue}
        />
                {tab === "chat" && (
        <ConnectChat
          currentUserId={session.user.id}
          isDemo={isDemo}
          chatView={chatView}
          setChatView={setChatView}
          chatInboxTab={chatInboxTab}
          setChatInboxTab={setChatInboxTab}
          messageRequests={messageRequests}
          loadChatHistory={loadChatHistory}
          respondMessageRequest={respondMessageRequest}
          openReport={openReport}
          matchId={matchId}
          partner={partner}
          chatMinimized={chatMinimized}
          setChatMinimized={setChatMinimized}
          openProfile={openProfile}
          chatReadOnly={chatReadOnly}
          blockUser={blockUser}
          endChat={endChat}
          messages={messages}
          send={send}
          chatFileRef={chatFileRef}
          recording={recording}
          toggleRecording={toggleRecording}
          busy={busy}
          draft={draft}
          setDraft={setDraft}
          openImageCrop={openImageCrop}
          sendAttachment={sendAttachment}
          chatHistory={chatHistory}
          setMatchId={setMatchId}
          setChatReadOnly={setChatReadOnly}
          setChatHistoryStatus={setChatHistoryStatus}
          setTab={setTab}
        />

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
          <ConnectSettings
            busy={busy}
            displayNameSetting={displayNameSetting}
            setDisplayNameSetting={setDisplayNameSetting}
            saveDisplayName={saveDisplayName}
            usernameSetting={usernameSetting}
            setUsernameSetting={setUsernameSetting}
            genderSetting={genderSetting}
            setGenderSetting={setGenderSetting}
            genderDescriptionSetting={genderDescriptionSetting}
            setGenderDescriptionSetting={setGenderDescriptionSetting}
            saveIdentity={saveIdentity}
            lookingForSetting={lookingForSetting}
            setLookingForSetting={setLookingForSetting}
            saveMatchingPreferences={saveMatchingPreferences}
            sendPasswordReset={sendPasswordReset}
            blockedPeople={blockedPeople}
            unblockUser={unblockUser}
            deletionDue={deletionDue}
            cancelDeletion={cancelDeletion}
            requestDeletion={requestDeletion}
          />
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
          <ConnectProfile
            profile={profile}
            isDemo={isDemo}
            openImageCrop={openImageCrop}
            setShowVisitorPreview={setShowVisitorPreview}
            bio={bio}
            setBio={setBio}
            saveBio={saveBio}
            ownSocialCounts={ownSocialCounts}
            openOwnSocialList={openOwnSocialList}
            ownPosts={ownPosts}
            removePost={removePost}
          />
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
