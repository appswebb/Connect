"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Room, RoomEvent, Track, type Track as LiveTrack } from "livekit-client";
import { supabase } from "../lib/supabase";
import { Camera, CameraOff, Mic, MicOff, MonitorUp, PhoneOff, Radio, Wifi, RefreshCw, FlipHorizontal } from "lucide-react";

type PublishedTrack = { key: string; track: LiveTrack; participant: string; local: boolean };

function AudioTrackPlayer({ track }: { track: LiveTrack }) {
  const audioRef = useRef<HTMLAudioElement|null>(null);
  useEffect(() => {
    const audio = track.attach() as HTMLAudioElement;
    audio.autoplay = true;
    audio.style.display = "none";
    audioRef.current = audio;
    document.body.appendChild(audio);
    void audio.play().catch(() => {});
    return () => {
      track.detach(audio);
      audio.remove();
      audioRef.current = null;
    };
  }, [track]);
  return null;
}

function TrackTile({ item, mirrorCamera }: { item: PublishedTrack; mirrorCamera: boolean }) {
  const holder = useRef<HTMLDivElement|null>(null);
  useEffect(() => {
    if (!holder.current) return;
    const media = item.track.attach();
    media.autoplay = true;
    if (media instanceof HTMLVideoElement) media.playsInline = true;
    const mirrored = mirrorCamera && item.local && item.track.kind === Track.Kind.Video && item.track.source === Track.Source.Camera;
    media.className = "live-media" + (mirrored ? " live-media-mirrored" : "");
    holder.current.replaceChildren(media);
    return () => { item.track.detach(media); media.remove(); };
  }, [item.track, mirrorCamera, item.local]);
  return <div className="live-tile"><div ref={holder} className="live-media-holder"/><span>{item.local ? "Você" : item.participant.slice(0,8)}</span></div>;
}

export default function LiveRoom({ liveId, isHost, onLeave }: { liveId: string; isHost: boolean; onLeave: () => void }) {
  const roomRef = useRef<Room|null>(null);
  const [connected,setConnected] = useState(false);
  const [connecting,setConnecting] = useState(false);
  const [cameraOn,setCameraOn] = useState(false);
  const [micOn,setMicOn] = useState(false);
  const [screenOn,setScreenOn] = useState(false);
  const [cameraFacing,setCameraFacing] = useState<"user"|"environment">("user");
  const [mirrorCamera,setMirrorCamera] = useState(true);
  const [tracks,setTracks] = useState<PublishedTrack[]>([]);
  const [audioTracks,setAudioTracks] = useState<PublishedTrack[]>([]);
  const [error,setError] = useState("");
  const [guestRequests,setGuestRequests] = useState<any[]>([]);
  const [guestMode,setGuestMode] = useState<"video"|"audio">("video");
  const [requestState,setRequestState] = useState<"none"|"pending"|"accepted"|"declined">("none");

  const addTrack = useCallback((track: LiveTrack, participant: string, local: boolean) => {
    const key = (local ? "local-" : participant+"-") + (track as any).sid;
    const item = {key,track,participant,local};
    if (track.kind === Track.Kind.Audio) {
      // O áudio remoto continua sendo reproduzido, mas nunca ocupa um quadro de vídeo.
      // Não anexamos o microfone local para evitar retorno/eco.
      if (!local) setAudioTracks(old => old.some(x=>x.key===key) ? old : [...old,item]);
      return;
    }
    setTracks(old => old.some(x=>x.key===key) ? old : [...old,item]);
  },[]);
  const removeTrack = useCallback((track: LiveTrack, participant: string, local: boolean) => {
    const key = (local ? "local-" : participant+"-") + (track as any).sid;
    if (track.kind === Track.Kind.Audio) {
      setAudioTracks(old => old.filter(x=>x.key!==key));
      return;
    }
    setTracks(old => old.filter(x=>x.key!==key));
  },[]);

  async function connect() {
    setConnecting(true);setError("");
    try {
      const {data,error:tokenError}=await supabase.functions.invoke("livekit-token",{body:{live_id:liveId}});
      if(tokenError) throw tokenError;
      if(!data?.token||!data?.server_url) throw new Error(data?.error||"O serviço de lives ainda não está configurado.");
      const room=new Room({adaptiveStream:true,dynacast:true});
      room.on(RoomEvent.TrackPublished,(publication,participant)=>{ if(participant.identity!==room.localParticipant.identity) void publication.setSubscribed(true); });
      room.on(RoomEvent.TrackSubscribed,(track,_publication,participant)=>addTrack(track,participant.identity,false));
      room.on(RoomEvent.TrackUnsubscribed,(track,_publication,participant)=>removeTrack(track,participant.identity,false));
      room.on(RoomEvent.LocalTrackPublished,(publication)=>{if(publication.track)addTrack(publication.track,"Você",true);});
      room.on(RoomEvent.LocalTrackUnpublished,(publication)=>{if(publication.track){removeTrack(publication.track,"Você",true);if(publication.track.source===Track.Source.ScreenShare)setScreenOn(false);if(publication.track.source===Track.Source.Camera)setCameraOn(false);if(publication.track.source===Track.Source.Microphone)setMicOn(false);}});
      room.on(RoomEvent.Disconnected,()=>{setConnected(false);setTracks([]);setAudioTracks([]);});
      await room.connect(data.server_url,data.token);
      roomRef.current=room;setConnected(true);
      for(const participant of room.remoteParticipants.values()){
        for(const publication of participant.trackPublications.values()){
          // Força a inscrição nas faixas já publicadas antes da entrada deste espectador.
          await publication.setSubscribed(true);
          if(publication.track)addTrack(publication.track,participant.identity,false);
        }
      }
      if(isHost){
        await room.localParticipant.setCameraEnabled(true,{facingMode:"user"});
        await room.localParticipant.setMicrophoneEnabled(true);
        setCameraOn(true);setMicOn(true);
      }
    } catch(e:any) { setError(e?.message||"Não foi possível conectar à live."); }
    finally { setConnecting(false); }
  }
  async function requestToJoin(){
    try {
      const {data:{user}}=await supabase.auth.getUser();
      if(!user) throw new Error("Entre na sua conta para solicitar participação.");
      const {error:e}=await supabase.from("live_guest_requests").upsert({live_id:liveId,user_id:user.id,video_enabled:guestMode==="video",status:"pending"},{onConflict:"live_id,user_id"});
      if(e) throw e;
      setRequestState("pending");
    } catch(e:any){setError(e?.message||"Não foi possível enviar o pedido.");}
  }
  async function decideGuest(requestId:string, accept:boolean){
    const {error:e}=await supabase.from("live_guest_requests").update({status:accept?"accepted":"declined",updated_at:new Date().toISOString()}).eq("id",requestId);
    if(e){setError(e.message);return;}
    setGuestRequests(old=>old.filter(x=>x.id!==requestId));
  }
  useEffect(()=>{
    if(!connected)return;
    const channel=supabase.channel("live-guests-"+liveId)
      .on("postgres_changes",{event:"*",schema:"public",table:"live_guest_requests",filter:"live_id=eq."+liveId},payload=>{
        const row=(payload.new||payload.old) as any;
        if(!row)return;
        if(row.user_id===undefined)return;
        if(row.user_id && row.status==="pending" && isHost){setGuestRequests(old=>[...old.filter(x=>x.id!==row.id),row]);}
        if(!isHost && row.user_id){const next=row.status==="accepted"?"accepted":row.status==="declined"?"declined":row.status==="pending"?"pending":"none";setRequestState(next);if(next==="accepted"&&roomRef.current){void (async()=>{await roomRef.current?.disconnect();roomRef.current=null;setConnected(false);setTracks([]);setAudioTracks([]);await connect();})();}}
      }).subscribe();
    if(isHost) void supabase.from("live_guest_requests").select("id,user_id,video_enabled,status").eq("live_id",liveId).eq("status","pending").then(({data})=>setGuestRequests(data||[]));
    return ()=>{void supabase.removeChannel(channel);};
  },[connected,liveId,isHost]);
  async function toggleCamera(){const r=roomRef.current;if(!r)return;try{await r.localParticipant.setCameraEnabled(!cameraOn,{facingMode:cameraFacing});setCameraOn(!cameraOn);}catch(e:any){setError(e?.message||"Não foi possível acessar a câmera.");}}
  async function flipCamera(){const r=roomRef.current;if(!r||!cameraOn)return;const next=cameraFacing==="user"?"environment":"user";try{const publication=r.localParticipant.getTrackPublication(Track.Source.Camera);if(!publication?.videoTrack)throw new Error("A câmera ainda não está disponível.");await publication.videoTrack.restartTrack({facingMode:next});setCameraFacing(next);}catch(e:any){setError(e?.message||"Este aparelho não conseguiu trocar a câmera.");}}
  async function toggleMic(){const r=roomRef.current;if(!r)return;try{await r.localParticipant.setMicrophoneEnabled(!micOn);setMicOn(!micOn);}catch(e:any){setError(e?.message||"Não foi possível acessar o microfone.");}}
  async function toggleScreen(){const r=roomRef.current;if(!r)return;if(!screenOn&&typeof navigator!=="undefined"&&(!navigator.mediaDevices||typeof navigator.mediaDevices.getDisplayMedia!=="function")){setError("Este navegador não oferece compartilhamento da tela. Tente no Chrome atualizado ou em um computador; alguns navegadores móveis, especialmente iPhone/iPad, não permitem essa função.");return;}try{await r.localParticipant.setScreenShareEnabled(!screenOn);setScreenOn(!screenOn);setError("");}catch(e:any){setError(e?.message||"O sistema ou navegador não permitiu compartilhar a tela. Verifique a compatibilidade e a permissão.");}}
  async function leave(){try{await roomRef.current?.disconnect();}finally{roomRef.current=null;setConnected(false);setTracks([]);setAudioTracks([]);onLeave();}}
  useEffect(()=>()=>{void roomRef.current?.disconnect();},[]);

  return <section className="live-stage">
    <header><div><span className="live-on"><i/> AO VIVO</span><strong>{isHost?"Sua transmissão":"Assistindo transmissão"}</strong></div><div className="live-header-actions"><span className="live-secure"><Wifi size={14}/> Conexão criptografada</span>{isHost&&<button type="button" className="live-header-end" onClick={()=>void leave()}><PhoneOff size={14}/> Encerrar live</button>}</div></header>
    {!connected?<div className="live-connect"><Radio size={34}/><h3>Pronto para entrar na transmissão?</h3><p>{isHost?"Ao conectar, câmera frontal e microfone serão ativados. Depois você pode desligar a câmera, trocar para a traseira, espelhar a imagem ou compartilhar a tela.":"Conecte para assistir à transmissão ao vivo."}</p><button className="primary" disabled={connecting} onClick={()=>void connect()}>{connecting?"Conectando...":"Conectar à live"}</button>{!isHost&&<div className="live-guest-request"><strong>Quer participar da live?</strong><p>Peça para subir com câmera ou somente com áudio.</p><div className="live-guest-choice"><button type="button" className={guestMode==="video"?"active":""} onClick={()=>setGuestMode("video")}><Camera size={15}/> Com câmera</button><button type="button" className={guestMode==="audio"?"active":""} onClick={()=>setGuestMode("audio")}><Mic size={15}/> Só áudio</button></div><button type="button" className="primary" disabled={requestState==="pending"||requestState==="accepted"} onClick={()=>void requestToJoin()}>{requestState==="pending"?"Pedido enviado":requestState==="accepted"?"Pedido aprovado":requestState==="declined"?"Solicitar novamente":"Solicitar para subir"}</button></div>}</div>:<>
      {audioTracks.map(item=><AudioTrackPlayer key={item.key} track={item.track}/>)}{isHost&&guestRequests.length>0&&<div className="live-guest-requests"><strong>Pedidos para participar</strong>{guestRequests.map(req=><div key={req.id}><span>{req.user_id.slice(0,8)} · {req.video_enabled?"Com câmera":"Somente áudio"}</span><button type="button" onClick={()=>void decideGuest(req.id,true)}>Aceitar</button><button type="button" onClick={()=>void decideGuest(req.id,false)}>Recusar</button></div>)}</div>}<div className="live-grid">{tracks.map(item=><TrackTile key={item.key} item={item} mirrorCamera={mirrorCamera}/>) }{!tracks.length&&<div className="live-wait">Aguardando vídeo da transmissão...</div>}</div>
      <div className="live-controls">{(isHost||requestState==="accepted")&&<><button className={cameraOn?"active":""} onClick={()=>void toggleCamera()}>{cameraOn?<Camera/>:<CameraOff/>} Câmera</button><button className={cameraOn?"":"disabled"} disabled={!cameraOn} onClick={()=>void flipCamera()}><RefreshCw/> {cameraFacing==="user"?"Câmera traseira":"Câmera frontal"}</button><button className={mirrorCamera?"active":""} disabled={!cameraOn||cameraFacing!=="user"} onClick={()=>setMirrorCamera(v=>!v)}><FlipHorizontal/> {mirrorCamera?"Espelhada":"Espelhar frontal"}</button><button className={micOn?"active":""} onClick={()=>void toggleMic()}>{micOn?<Mic/>:<MicOff/>} Microfone</button><button className={screenOn?"active":""} onClick={()=>void toggleScreen()}><MonitorUp/> {screenOn?"Parar tela":"Compartilhar tela"}</button></>}{!isHost&&requestState!=="accepted"&&<button className="live-leave" onClick={()=>void leave()}><PhoneOff/> Sair da live</button>}</div>
    </>}
    {error&&<p className="live-error">{error}</p>}
  </section>;
}
