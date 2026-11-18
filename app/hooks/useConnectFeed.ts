"use client";

import { useCallback, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { supabase } from "../lib/supabase";
import type { Comment, Post, Profile } from "../types/connect";

type ConnectFeedOptions = {
  userId?: string;
  body: string;
  file: File | null;
  setBody: Dispatch<SetStateAction<string>>;
  setFile: Dispatch<SetStateAction<File | null>>;
  commentPost: string;
  commentText: string;
  setCommentPost: Dispatch<SetStateAction<string>>;
  setCommentText: Dispatch<SetStateAction<string>>;
  setPosts: Dispatch<SetStateAction<Post[]>>;
  setOwnPosts: Dispatch<SetStateAction<Post[]>>;
  setComments: Dispatch<SetStateAction<Comment[]>>;
  setBusy: Dispatch<SetStateAction<boolean>>;
  setNotice: (message: string) => void;
  fail: (message: string) => void;
  upload: (file: File, folder: string) => Promise<string>;
};

export function useConnectFeed(options: ConnectFeedOptions) {
  const { userId, body, file, setBody, setFile, commentPost, commentText, setCommentPost, setCommentText, setPosts, setOwnPosts, setComments, setBusy, setNotice, fail, upload } = options;

  const loadOwnPosts = useCallback(async (uid: string) => {
    const { data, error } = await supabase.from("posts").select("*").eq("user_id", uid).order("created_at", { ascending: false }).limit(200);
    if (error) {
      fail("Não foi possível carregar suas publicações: " + error.message);
      return;
    }
    const rows = data || [];
    if (!rows.length) {
      setOwnPosts([]);
      return;
    }
    const ids = [...new Set(rows.map((post: any) => post.user_id))];
    const postIds = rows.map((post: any) => post.id);
    const [people, likes, comments] = await Promise.all([
      supabase.from("profiles").select("*").in("id", ids),
      supabase.from("post_likes").select("post_id,user_id").in("post_id", postIds),
      supabase.from("comments").select("post_id").in("post_id", postIds),
    ]);
    const authorMap = new Map((people.data || []).map((person: any) => [person.id, person]));
    setOwnPosts(rows.flatMap((post: any) => {
      const author = authorMap.get(post.user_id) as Profile | undefined;
      if (!author) return [];
      return [{
        ...post,
        author,
        likes: (likes.data || []).filter((like: any) => like.post_id === post.id).length,
        comments: (comments.data || []).filter((comment: any) => comment.post_id === post.id).length,
        liked: (likes.data || []).some((like: any) => like.post_id === post.id && like.user_id === uid),
      }];
    }));
  }, [fail, setOwnPosts]);

  const loadFeed = useCallback(async (uid: string) => {
    const { data, error } = await supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(50);
    if (error) {
      fail(error.message);
      return;
    }
    const rows = data || [];
    if (!rows.length) {
      setPosts([]);
      return;
    }
    const ids = [...new Set(rows.map((post: any) => post.user_id))];
    const postIds = rows.map((post: any) => post.id);
    const [people, likes, comments] = await Promise.all([
      supabase.from("profiles").select("*").in("id", ids),
      supabase.from("post_likes").select("post_id,user_id").in("post_id", postIds),
      supabase.from("comments").select("post_id").in("post_id", postIds),
    ]);
    const authorMap = new Map((people.data || []).map((person: any) => [person.id, person]));
    setPosts(rows.flatMap((post: any) => {
      const author = authorMap.get(post.user_id) as Profile | undefined;
      if (!author) return [];
      return [{
        ...post,
        author,
        likes: (likes.data || []).filter((like: any) => like.post_id === post.id).length,
        comments: (comments.data || []).filter((comment: any) => comment.post_id === post.id).length,
        liked: (likes.data || []).some((like: any) => like.post_id === post.id && like.user_id === uid),
      }];
    }));
  }, [fail, setPosts]);

  const publish = useCallback(async (event: FormEvent) => {
    event.preventDefault();
    if (!userId || (!body.trim() && !file)) return;
    setBusy(true);
    try {
      let mediaUrl: string | null = null;
      let mediaType: string | null = null;
      if (file) {
        mediaUrl = await upload(file, "posts");
        mediaType = file.type.startsWith("video/") ? "video" : "image";
      }
      const result = await supabase.from("posts").insert({ user_id: userId, body: body.trim(), media_url: mediaUrl, media_type: mediaType });
      if (result.error) throw result.error;
      setBody("");
      setFile(null);
      await loadFeed(userId);
      setNotice("Publicação enviada.");
    } catch (error) {
      fail(error instanceof Error ? error.message : "Falha ao publicar.");
    } finally {
      setBusy(false);
    }
  }, [userId, body, file, upload, setBusy, setBody, setFile, loadFeed, setNotice, fail]);

  const like = useCallback(async (post: Post) => {
    if (!userId) return;
    const result = post.liked
      ? await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", userId)
      : await supabase.from("post_likes").insert({ post_id: post.id, user_id: userId });
    if (result.error) {
      fail(result.error.message);
      return;
    }
    setPosts((old) => old.map((item) => item.id === post.id ? { ...item, liked: !post.liked, likes: item.likes + (post.liked ? -1 : 1) } : item));
  }, [userId, fail, setPosts]);

  const removePost = useCallback(async (id: string) => {
    if (!window.confirm("Apagar esta publicação?")) return;
    const result = await supabase.from("posts").delete().eq("id", id);
    if (result.error) {
      fail(result.error.message);
      return;
    }
    setPosts((old) => old.filter((post) => post.id !== id));
    setOwnPosts((old) => old.filter((post) => post.id !== id));
  }, [fail, setPosts, setOwnPosts]);

  const openComments = useCallback(async (id: string) => {
    if (commentPost === id) {
      setCommentPost("");
      return;
    }
    setCommentPost(id);
    const result = await supabase.from("comments").select("*").eq("post_id", id).order("created_at");
    if (result.error) {
      fail(result.error.message);
      return;
    }
    const ids = [...new Set((result.data || []).map((item: any) => item.user_id))];
    const people = ids.length ? await supabase.from("profiles").select("*").in("id", ids) : { data: [] };
    const profiles = new Map((people.data || []).map((person: any) => [person.id, person]));
    setComments((result.data || []).flatMap((item: any) => profiles.has(item.user_id) ? [{ ...item, author: profiles.get(item.user_id) }] : []) as Comment[]);
  }, [commentPost, setCommentPost, fail, setComments]);

  const comment = useCallback(async (event: FormEvent, postId: string) => {
    event.preventDefault();
    if (!userId || !commentText.trim()) return;
    const result = await supabase.from("comments").insert({ post_id: postId, user_id: userId, body: commentText.trim() });
    if (result.error) {
      fail(result.error.message);
      return;
    }
    setCommentText("");
    const rows = await supabase.from("comments").select("*").eq("post_id", postId).order("created_at");
    const ids = [...new Set((rows.data || []).map((item: any) => item.user_id))];
    const people = ids.length ? await supabase.from("profiles").select("*").in("id", ids) : { data: [] };
    const profiles = new Map((people.data || []).map((person: any) => [person.id, person]));
    setComments((rows.data || []).flatMap((item: any) => profiles.has(item.user_id) ? [{ ...item, author: profiles.get(item.user_id) }] : []) as Comment[]);
    await loadFeed(userId);
  }, [userId, commentText, fail, setCommentText, setComments, loadFeed]);

  return { loadOwnPosts, loadFeed, publish, like, removePost, openComments, comment };
}
