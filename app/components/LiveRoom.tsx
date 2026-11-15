"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Room, RoomEvent, Track, type Track as LiveTrack } from "livekit-client";
import { supabase } from "../lib/supabase";
import { Camera, CameraOff, Mic, MicOff, MonitorUp, PhoneOff, Radio, Wifi } from "lucide-react";

type PublishedTrack = { key: string; track: LiveTrack; participant: string; local: boolean };

function TrackTile({ item }: { item: PublishedTrack }) {
  const holder = useRef<HTMLDivElement|null>(null);
  useEffect(() => {
    if (!holder.current) return;
    const media = item.track.attach();
    media.autoplay = true;
    if (media instanceof HTMLVideoElement) media.playsInline = true;
    media.className = "live-media";
    holder.current.replaceChildren(media);
    return () => { item.track.detach(media); media.remove(); };
  }, [item.track]);
  return <div className="live-tile"><div ref={holder} className="live-media-holder"/><span>{item.local ? "Você" : item.participant.slice(0,8)}</span></div>;
}

export default function LiveRoom({ liveId, isHost, onLeave }: { liveId: string; isHost: boolean; onLeave: () => void }) {
  const roomRef = useRef<Room|null>(null);
  const [connected,setConnected] = useState(false);
  const [connecting,setConnecting] = useState(false);
  const [cameraOn,setCameraOn] = useState(false);
  const [micOn,setMicOn] = useState(false);
  const [screenOn,setScreenOn] = useState(false);
  const [tracks,setTracks] = useState<PublishedTrack[]>([]);
  const [error,setError] = useState("");

  const addTrack = useCallback((track: LiveTrack, participant: string, local: boolean) => {
    const key = (local ? "local-" : participant+"-") + (track as any).sid;
    setTracks(old => old.some(x=>x.key===key) ? old : [...old,{key,track,participant,local}]);
  },[]);
  const removeTrack = useCallback((track: LiveTrack, participant: string, local: boolean) => {
    const key = (local ? "local-" : participant+"-") + (track as any).sid;
    setTracks(old => old.filter(x=>x.key!==key));
  },[]);

  async function connect() {
    setConnecting(true);setError("");
    try {
      const {data,error:tokenError}=await supabase.functions.invoke("livekit-token",{body:{live_id:liveId}});
      if(tokenError) throw tokenError;
      if(!data?.token||!data?.server_url) throw new Error(data?.error||"O serviço de lives ainda não está configurado.");
      const room=new Room({adaptiveStream:true,dynacast:true});
      room.on(RoomEvent.TrackSubscribed,(track,_publication,participant)=>addTrack(track,participant.identity,false));
      room.on(RoomEvent.TrackUnsubscribed,(track,_publication,participant)=>removeTrack(track,participant.identity,false));
      room.on(RoomEvent.LocalTrackPublished,(publication)=>{if(publication.track)addTrack(publication.track,"Você",true);});
      room.on(RoomEvent.LocalTrackUnpublished,(publication)=>{if(publication.track)removeTrack(publication.track,"Você",true);});
      room.on(RoomEvent.Disconnected,()=>{setConnected(false);setTracks([]);});
      await room.connect(data.server_url,data.token);
      roomRef.current=room;setConnected(true);
      for(const participant of room.remoteParticipants.values()){
        for(const publication of participant.trackPublications.values()){
          if(publication.track&&publication.isSubscribed)addTrack(publication.track,participant.identity,false);
        }
      }
      if(isHost){
        await room.localParticipant.setCameraEnabled(true);
        await room.localParticipant.setMicrophoneEnabled(true);
        setCameraOn(true);setMicOn(true);
      }
    } catch(e:any) { setError(e?.message||"Não foi possível conectar à live."); }
    finally { setConnecting(false); }
  }
  async function toggleCamera(){const r=roomRef.current;if(!r)return;try{await r.localParticipant.setCameraEnabled(!cameraOn);setCameraOn(!cameraOn);}catch(e:any){setError(e?.message||"Não foi possível acessar a câmera.");}}
  async function toggleMic(){const r=roomRef.current;if(!r)return;try{await r.localParticipant.setMicrophoneEnabled(!micOn);setMicOn(!micOn);}catch(e:any){setError(e?.message||"Não foi possível acessar o microfone.");}}
  async function toggleScreen(){const r=roomRef.current;if(!r)return;try{await r.localParticipant.setScreenShareEnabled(!screenOn);setScreenOn(!screenOn);}catch(e:any){setError(e?.message||"O compartilhamento de tela não foi permitido ou não é compatível neste navegador.");}}
  async function leave(){try{await roomRef.current?.disconnect();}finally{roomRef.current=null;setConnected(false);setTracks([]);onLeave();}}
  useEffect(()=>()=>{void roomRef.current?.disconnect();},[]);

  return <section className="live-stage">
    <header><div><span className="live-on"><i/> AO VIVO</span><strong>{isHost?"Sua transmissão":"Assistindo transmissão"}</strong></div><span className="live-secure"><Wifi size={14}/> Conexão criptografada</span></header>
    {!connected?<div className="live-connect"><Radio size={34}/><h3>Pronto para entrar na transmissão?</h3><p>{isHost?"Ao conectar, sua câmera e seu microfone serão ativados. Você poderá compartilhar a tela também.":"Conecte para assistir à transmissão ao vivo."}</p><button className="primary" disabled={connecting} onClick={()=>void connect()}>{connecting?"Conectando...":"Conectar à live"}</button></div>:<>
      <div className="live-grid">{tracks.map(item=><TrackTile key={item.key} item={item}/>)}{!tracks.length&&<div className="live-wait">Aguardando vídeo da transmissão...</div>}</div>
      <div className="live-controls">{isHost&&<><button className={cameraOn?"active":""} onClick={()=>void toggleCamera()}>{cameraOn?<Camera/>:<CameraOff/>} Câmera</button><button className={micOn?"active":""} onClick={()=>void toggleMic()}>{micOn?<Mic/>:<MicOff/>} Microfone</button><button className={screenOn?"active":""} onClick={()=>void toggleScreen()}><MonitorUp/> {screenOn?"Parar tela":"Compartilhar tela"}</button></>}<button className="live-leave" onClick={()=>void leave()}><PhoneOff/> {isHost?"Encerrar transmissão":"Sair da live"}</button></div>
    </>}
    {error&&<p className="live-error">{error}</p>}
  </section>;
}
