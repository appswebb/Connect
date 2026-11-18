"use client";

import { useCallback, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { supabase } from "../lib/supabase";
import type { Profile, RoomMessage } from "../types/connect";

type ConnectRoomsOptions = {
  userId?: string;
  roomCode: string;
  roomDraft: string;
  roomReply: RoomMessage | null;
  setRoomDraft: Dispatch<SetStateAction<string>>;
  setRoomReply: Dispatch<SetStateAction<RoomMessage | null>>;
  setRoomMessages: Dispatch<SetStateAction<RoomMessage[]>>;
  fail: (message: string) => void;
};

export function useConnectRooms(options: ConnectRoomsOptions) {
  const { userId, roomCode, roomDraft, roomReply, setRoomDraft, setRoomReply, setRoomMessages, fail } = options;

  const loadRoomMessages = useCallback(async (code: string) => {
    const result = await supabase.from("global_room_messages").select("*").eq("room_code", code).order("created_at", { ascending: false }).limit(100);
    if (result.error) {
      fail(result.error.message);
      return;
    }
    const rows = (result.data || []).reverse();
    const ids = [...new Set(rows.map((message: any) => message.user_id))];
    const people = ids.length ? await supabase.from("profiles").select("*").in("id", ids) : { data: [] };
    const profiles = new Map((people.data || []).map((person: any) => [person.id, person]));
    setRoomMessages(rows.flatMap((message: any) => {
      const author = profiles.get(message.user_id) as Profile | undefined;
      return author ? [{ ...message, author }] : [];
    }));
  }, [fail, setRoomMessages]);

  const sendRoomMessage = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    if (!userId || !roomDraft.trim()) return;
    const body = roomDraft.trim();
    setRoomDraft("");
    const replyTo = roomReply?.id || null;
    setRoomReply(null);
    const result = await supabase.from("global_room_messages").insert({ room_code: roomCode, user_id: userId, body, reply_to_id: replyTo });
    if (result.error) {
      setRoomDraft(body);
      setRoomReply(roomReply);
      fail("Não foi possível enviar a mensagem: " + result.error.message);
      return;
    }
    await loadRoomMessages(roomCode);
  }, [userId, roomCode, roomDraft, roomReply, setRoomDraft, setRoomReply, fail, loadRoomMessages]);

  const deleteRoomMessage = useCallback(async (message: RoomMessage) => {
    if (!userId || message.user_id !== userId) return;
    if (!window.confirm("Apagar esta mensagem da sala?")) return;
    const result = await supabase.from("global_room_messages").delete().eq("id", message.id).eq("user_id", userId);
    if (result.error) {
      fail("Não foi possível apagar a mensagem: " + result.error.message);
      return;
    }
    setRoomMessages((old) => old.filter((item) => item.id !== message.id));
    setRoomReply((old) => old?.id === message.id ? null : old);
  }, [userId, fail, setRoomMessages, setRoomReply]);

  return { loadRoomMessages, sendRoomMessage, deleteRoomMessage };
}
