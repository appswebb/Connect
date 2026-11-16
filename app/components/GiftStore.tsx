"use client";
import { useEffect,useState } from "react";
import { Gift,Coins,ShoppingBag,RefreshCw } from "lucide-react";
import { supabase } from "../lib/supabase";

type GiftItem={id:string;name:string;emoji:string;price_coins:number};
type CoinPackage={id:string;name:string;coins:number;price_brl:number};
const GIFT_ART:Record<string,string>={bala_arco_iris:"/Connect/gifts/bala-arco-iris.webp",tulipa_encantada:"/Connect/gifts/tulipa-encantada.webp",corgi_fofo:"/Connect/gifts/corgi-fofo.webp",fenix_dourada:"/Connect/gifts/fenix-dourada.webp",dragao_real:"/Connect/gifts/dragao-real.webp"};
const money=(v:number)=>new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(v);
export default function GiftStore(){
 const [items,setItems]=useState<GiftItem[]>([]);
 const [packages,setPackages]=useState<CoinPackage[]>([]);
 const [balance,setBalance]=useState(0);
 const [inventory,setInventory]=useState<Record<string,number>>({});
 const [busy,setBusy]=useState("");
 const [message,setMessage]=useState("");
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
  <div className="gift-store-grid">{items.map(g=><article key={g.id} className="gift-store-item"><span className="gift-store-art">{GIFT_ART[g.id]?<img src={GIFT_ART[g.id]} alt={g.name} loading="lazy"/>:<span className="gift-store-emoji">{g.emoji}</span>}</span><strong>{g.name}</strong><span>{g.price_coins} moedas</span><small>No inventário: {inventory[g.id]||0}</small><button className="primary" disabled={!!busy||balance<g.price_coins} onClick={()=>void buy(g.id)}><Gift size={14}/>{busy===g.id?"Comprando...":"Comprar presente"}</button></article>)}</div>
  {message&&<p className="gift-store-message" role="status">{message}</p>}
  <p className="gift-store-note">As moedas são creditadas somente após a confirmação do pagamento pelo servidor. Não feche a página de checkout antes de concluir.</p>
 </section>;
}
