"use client";
import { useEffect,useState } from "react";
import { Gift,Coins,ShoppingBag,RefreshCw,Send,Search, X } from "lucide-react";
import { supabase } from "../lib/supabase";

type GiftItem={id:string;name:string;emoji:string;price_coins:number};
type CoinPackage={id:string;name:string;coins:number;price_brl:number};
type Person={id:string;display_name:string;username:string;avatar_url:string|null};
const GIFT_ART:Record<string,string>={bala_arco_iris:"/Connect/gifts/bala-arco-iris.webp",tulipa_encantada:"/Connect/gifts/tulipa-encantada.webp",corgi_fofo:"/Connect/gifts/corgi-fofo.webp",fenix_dourada:"/Connect/gifts/fenix-dourada.webp",dragao_real:"/Connect/gifts/dragao-real.webp"};
const money=(v:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v);
export default function GiftStore(){
 const [items,setItems]=useState<GiftItem[]>([]);
 const [packages,setPackages]=useState<CoinPackage[]>([]);
 const [balance,setBalance]=useState(0);
 const [inventory,setInventory]=useState<Record<string,number>>({});
 const [busy,setBusy]=useState("");
 const [message,setMessage]=useState("");
 const [recipientQuery,setRecipientQuery]=useState("");
 const [recipients,setRecipients]=useState<Person[]>([]);
 const [selectedRecipient,setSelectedRecipient]=useState<Person|null>(null);
 const [sendingGift,setSendingGift]=useState<GiftItem|null>(null);
 async function load(){
  const {data:{user}}=await supabase.auth.getUser();if(!user)return;
  const [g,w,i,p]=await Promise.all([
   supabase.from("gift_catalog").select("id,name,emoji,price_coins").eq("active",true).order("price_coins"),
   supabase.from("user_wallets").select("coins").eq("user_id",user.id).maybeSingle(),
   supabase.from("user_gift_inventory").select("gift_id,quantity").eq("user_id",user.id),
   supabase.from("coin_packages").select("id,name,coins,price_brl").eq("active",true).order("sort_order")
  ]);
  if(g.error){setMessage(g.error.message);return;}
  if(p.error){setMessage("Não foi possível carregar os pacotes: "+p.error.message);return;}
  setItems(g.data||[]);setPackages((p.data||[]) as CoinPackage[]);setBalance(Number(w.data?.coins||0));
  setInventory(Object.fromEntries((i.data||[]).map((x:any)=>[x.gift_id,x.quantity])));
 }
 useEffect(()=>{
  void load();
  const result=new URLSearchParams(window.location.search).get("payment");
  const kind=new URLSearchParams(window.location.search).get("kind");
  if(kind==="coins"&&result==="success")setMessage("Pagamento enviado! As moedas serão adicionadas após a confirmação segura do Mercado Pago. Atualize seu saldo em instantes.");
  else if(kind==="coins"&&result==="pending")setMessage("Seu pagamento está pendente. As moedas serão adicionadas quando o Mercado Pago confirmar.");
  else if(kind==="coins"&&result==="failure")setMessage("O pagamento não foi concluído. Você pode tentar novamente.");
 },[]);
 async function buy(id:string){
  setBusy(id);setMessage("");
  const {data,error}=await supabase.rpc("buy_live_gift",{p_gift_id:id,p_quantity:1});
  if(error)setMessage(error.message);else{setMessage("Presente adicionado ao seu inventário!");setBalance(Number(data?.balance||0));await load();}
  setBusy("");
 }
 async function searchRecipients(){
  const q=recipientQuery.trim().replace(/^@/,"");if(q.length<2){setRecipients([]);return;}
  const {data,error}=await supabase.from("profiles").select("id,display_name,username,avatar_url").or(`username.ilike.%${q}%,display_name.ilike.%${q}%`).neq("id",(await supabase.auth.getUser()).data.user?.id||"").limit(8);
  if(error){setMessage("Não foi possível buscar pessoas: "+error.message);return;}setRecipients((data||[]) as Person[]);
 }
 async function sendStoredGift(){
  if(!sendingGift||!selectedRecipient)return;setBusy("send-"+sendingGift.id);setMessage("");
  const {data,error}=await supabase.rpc("send_gift_to_user",{p_gift_id:sendingGift.id,p_recipient_id:selectedRecipient.id,p_quantity:1});
  if(error)setMessage(error.message);else{setMessage(`${sendingGift.name} enviado para @${selectedRecipient.username}!`);setSendingGift(null);setSelectedRecipient(null);setRecipientQuery("");setRecipients([]);await load();}
  setBusy("");
 }
 async function buyCoins(packageId:string){
  setBusy(packageId);setMessage("");
  try{
   const {data,error}=await supabase.functions.invoke("mercadopago-coin-checkout",{body:{packageId}});
   if(error)throw error;
   if(!data?.init_point)throw new Error(data?.error||"O Mercado Pago não retornou o link de pagamento.");
   window.location.assign(data.init_point);
  }catch(e){setMessage(e instanceof Error?e.message:"Não foi possível iniciar a compra.");setBusy("");}
 }
 return <section className="gift-store">
  <div className="gift-store-head"><div><small>CONNECT WALLET</small><h2>Compre moedas</h2><p>Escolha um pacote e pague com segurança pelo Mercado Pago.</p></div><div className="gift-wallet"><Coins size={18}/><strong>{balance}</strong><span>moedas</span></div></div>
  <div className="gift-store-grid">{packages.map(p=><article key={p.id} className="gift-store-item">
   <span className="gift-store-art"><Coins size={34}/></span><strong>{p.name}</strong><span>{p.coins.toLocaleString("pt-BR")} moedas</span><strong>{money(Number(p.price_brl))}</strong>
   <button className="primary" disabled={!!busy} onClick={()=>void buyCoins(p.id)}><ShoppingBag size={14}/>{busy===p.id?"Abrindo pagamento...":"Comprar moedas"}</button>
  </article>)}</div>
  <div className="gift-store-head" style={{marginTop:28}}><div><small>CONNECT LIVE GIFTS</small><h2>Loja de presentes</h2><p>Use suas moedas para comprar presentes e enviar durante as transmissões.</p></div><button className="secondary" onClick={()=>void load()} disabled={!!busy}><RefreshCw size={15}/> Atualizar saldo</button></div>
  <div className="gift-store-grid">{items.map(g=><article key={g.id} className="gift-store-item"><span className="gift-store-art">{GIFT_ART[g.id]?<img src={GIFT_ART[g.id]} alt={g.name} loading="lazy"/>:<span className="gift-store-emoji">{g.emoji}</span>}</span><strong>{g.name}</strong><span>{g.price_coins} moedas</span><small>No inventário: {inventory[g.id]||0}</small><button className="primary" disabled={!!busy||balance<g.price_coins} onClick={()=>void buy(g.id)}><Gift size={14}/>{busy===g.id?"Comprando...":"Comprar presente"}</button>{(inventory[g.id]||0)>0&&<button className="secondary" style={{marginTop:7,width:"100%",justifyContent:"center"}} disabled={!!busy} onClick={()=>{setSendingGift(g);setSelectedRecipient(null);setRecipientQuery("");setRecipients([]);}}><Send size={14}/>Enviar para alguém</button>}</article>)}</div>
  {sendingGift&&<div className="gift-send-panel" style={{marginTop:18,padding:18,border:"1px solid #35452c",borderRadius:14,background:"#121b16"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}><div><strong>Enviar {sendingGift.name}</strong><p style={{margin:"5px 0 12px",color:"#9ba79a",fontSize:12}}>Escolha quem vai receber. O presente será retirado do seu inventário.</p></div><button className="secondary" onClick={()=>setSendingGift(null)} aria-label="Fechar"><X size={16}/></button></div><div style={{display:"flex",gap:8}}><input value={recipientQuery} onChange={e=>{setRecipientQuery(e.target.value);setSelectedRecipient(null);}} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();void searchRecipients();}}} placeholder="Buscar por nome ou @usuário" style={{flex:1,minWidth:0,padding:"11px 12px",borderRadius:9,border:"1px solid #35424d",background:"#0b1115",color:"white"}}/><button className="secondary" onClick={()=>void searchRecipients()}><Search size={15}/>Buscar</button></div>{recipients.length>0&&<div style={{display:"grid",gap:6,marginTop:10}}>{recipients.map(person=><button key={person.id} onClick={()=>{setSelectedRecipient(person);setRecipients([]);}} className="secondary" style={{display:"flex",alignItems:"center",gap:10,textAlign:"left",justifyContent:"flex-start"}}>{person.avatar_url?<img src={person.avatar_url} alt="" style={{width:32,height:32,borderRadius:"50%",objectFit:"cover"}}/>:<span className="avatar small">{person.display_name?.slice(0,1)||"?"}</span>}<span>{person.display_name} <small style={{color:"#91a09a"}}>@{person.username}</small></span></button>)}</div>}{selectedRecipient&&<div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:10,marginTop:12,padding:10,borderRadius:9,background:"#1c2b18"}}><span>Enviar para <strong>{selectedRecipient.display_name} (@{selectedRecipient.username})</strong></span><button className="primary" disabled={!!busy} onClick={()=>void sendStoredGift()}><Send size={14}/>{busy==="send-"+sendingGift.id?"Enviando...":"Confirmar envio"}</button></div>}</div>}
  {message&&<p className="gift-store-message" role="status">{message}</p>}
  <p className="gift-store-note">As moedas são creditadas somente após a confirmação do pagamento pelo servidor. Não feche a página de checkout antes de concluir.</p>
 </section>;
}
