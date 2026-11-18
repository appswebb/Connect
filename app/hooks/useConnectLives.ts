"use client";

import { useCallback, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { supabase } from "../lib/supabase";
import type { LiveSessionRow, Profile } from "../types/connect";

type ConnectLivesOptions = {
  userId?: string;
  liveTitle: string;
  activeLive: LiveSessionRow | null;
  setLives: Dispatch<SetStateAction<LiveSessionRow[]>>;
  setActiveLive: Dispatch<SetStateAction<LiveSessionRow | null>>;
  setLiveTitle: Dispatch<SetStateAction<string>>;
  setTab: Dispatch<SetStateAction<string>>;
  setBusy: Dispatch<SetStateAction<boolean>>;
  setNotice: (message: string) => void;
  fail: (message: string) => void;
};

export function useConnectLives(options: ConnectLivesOptions) {
  const { userId, liveTitle, activeLive, setLives, setActiveLive, setLiveTitle, setTab, setBusy, setNotice, fail } = options;

  const loadLives = useCallback(async () => {
    const result = await supabase.from("live_sessions").select("id,host_user_id,title,room_name,status,created_at").eq("status", "live").order("created_at", { ascending: false }).limit(50);
    if (result.error) {
      fail(result.error.message);
      return;
    }
    const rows = (result.data || []) as LiveSessionRow[];
    const ids = [...new Set(rows.map((live) => live.host_user_id))];
    const people = ids.length ? await supabase.from("profiles").select("*").in("id", ids) : { data: [] };
    const profiles = new Map((people.data || []).map((person: any) => [person.id, person]));
    setLives(rows.map((live) => ({ ...live, host: profiles.get(live.host_user_id) as Profile | undefined })));
  }, [fail, setLives]);

  const createLive = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    if (!userId || liveTitle.trim().length < 3) return;
    setBusy(true);
    try {
      const ready = await supabase.functions.invoke("livekit-token", { body: { action: "check" } });
      if (ready.error) throw ready.error;
      if (!ready.data?.ready) throw new Error(ready.data?.error || "O serviço de transmissão ainda não está pronto.");
      const result = await supabase.from("live_sessions").insert({ host_user_id: userId, title: liveTitle.trim(), status: "live" }).select("id,host_user_id,title,room_name,status,created_at").single();
      if (result.error) throw result.error;
      setActiveLive(result.data as LiveSessionRow);
      setTab("lives");
      setLiveTitle("");
      await loadLives();
    } catch (error) {
      const message = error instanceof Error ? error.message : String((error as any)?.message || "");
      if (message.includes("LIVEKIT_NOT_CONFIGURED") || message.includes("503")) {
        fail("As transmissões ainda não foram ativadas. Falta configurar LIVEKIT_URL, LIVEKIT_API_KEY e LIVEKIT_API_SECRET nos Secrets das Edge Functions do Supabase. Nenhuma live falsa foi criada.");
      } else {
        fail("Não foi possível preparar a live: " + (message || "verifique a conexão e tente novamente."));
      }
    } finally {
      setBusy(false);
    }
  }, [userId, liveTitle, setBusy, setActiveLive, setTab, setLiveTitle, loadLives, fail]);

  const joinLive = useCallback(async (live: LiveSessionRow) => {
    setActiveLive(live);
  }, [setActiveLive]);

  const endLiveSession = useCallback(async (liveId: string) => {
    if (!userId) return;
    setBusy(true);
    const result = await supabase.from("live_sessions").update({ status: "ended", ended_at: new Date().toISOString() }).eq("id", liveId).eq("host_user_id", userId).eq("status", "live").select("id").maybeSingle();
    setBusy(false);
    if (result.error) {
      fail("Não foi possível encerrar a live: " + result.error.message);
      return;
    }
    if (!result.data) {
      fail("A live já foi encerrada ou você não é a pessoa responsável por ela.");
      return;
    }
    if (activeLive?.id === liveId) setActiveLive(null);
    setNotice("Transmissão encerrada. Ela não aparece mais na lista de lives.");
    await loadLives();
  }, [userId, setBusy, fail, activeLive, setActiveLive, setNotice, loadLives]);

  const leaveLive = useCallback(async () => {
    const current = activeLive;
    if (current && current.host_user_id === userId) {
      await endLiveSession(current.id);
      return;
    }
    setActiveLive(null);
    await loadLives();
  }, [activeLive, userId, endLiveSession, setActiveLive, loadLives]);

  return { loadLives, createLive, joinLive, endLiveSession, leaveLive };
}
