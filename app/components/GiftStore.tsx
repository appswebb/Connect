"use client";
import { useEffect,useState } from "react";
import { Gift,Coins,ShoppingBag } from "lucide-react";
import { supabase } from "../lib/supabase";

type GiftItem={id:string;name:string;emoji:string;price_coins:number};
const GIFT_ART:Record<string,string>={bala_arco_iris:"/Connect/gifts/bala-arco-iris.webp",tulipa_encantada:"/Connect/gifts/tulipa-encantada.webp",corgi_fofo:"/Connect/gifts/corgi-fofo.webp",fenix_dourada:"/Connect/gifts/fenix-dourada.webp",dragao_real:"/Connect/gifts/dragao-real.webp"};
export default function GiftStore(){
 const [items,setItems]=useState<GiftItem[]>([]);
 const [balance,setBalance]=useState(0);
 const [inventory,setInventory]=useState<Record<string,number>>({});
 const [busy,setBusy]=useState("");
 const [message,setMessage]=useState("");
 async function load(){
  const {data:{user}}=await supabase.auth.getUser();if(!user)return;
  const [g,w,i]=await Promise.all([
   supabase.from("gift_catalog").select("id,name,emoji,price_coins").eq("active",true).order("price_coins"),
   supabase.from("user_wallets").select("coins").eq("user_id",user.id).maybeSingle(),
   supabase.from("user_gift_inventory").select("gift_id,quantity").eq("user_id",user.id)
  ]);
  if(g.error){setMessage(g.error.message);return;}
  setItems(g.data||[]);setBalance(Number(w.data?.coins||0));
  setInventory(Object.fromEntries((i.data||[]).map((x:any)=>[x.gift_id,x.quantity])));
 }
 useEffect(()=>{void load();},[]);
 async function buy(id:string){
  setBusy(id);setMessage("");
  const {data,error}=await supabase.rpc("buy_live_gift",{p_gift_id:id,p_quantity:1});
  if(error)setMessage(error.message);else{setMessage("Presente adicionado ao seu inventário!");setBalance(Number(data?.balance||0));await load();}
  setBusy("");
 }
 return <section className="gift-store">
  <div className="gift-store-head"><div><small>CONNECT LIVE GIFTS</small><h2>Loja de presentes</h2><p>Escolha presentes para enviar durante as transmissões.</p></div><div className="gift-wallet"><Coins size={18}/><strong>{balance}</strong><span>moedas</span></div></div>
  <div className="gift-store-grid">{items.map(g=><article key={g.id} className="gift-store-item"><span className="gift-store-art">{GIFT_ART[g.id]?<img src={GIFT_ART[g.id]} alt={g.name} loading="lazy"/>:<span className="gift-store-emoji">{g.emoji}</span>}</span><strong>{g.name}</strong><span>{g.price_coins} moedas</span><small>No inventário: {inventory[g.id]||0}</small><button className="primary" disabled={!!busy} onClick={()=>void buy(g.id)}><ShoppingBag size={14}/>{busy===g.id?"Comprando...":"Comprar presente"}</button></article>)}</div>
  <p className="gift-store-note">Moedas são virtuais. A compra de moedas com dinheiro real ainda não está disponível.</p>
  {message&&<p className="gift-store-message">{message}</p>}
 </section>;
}