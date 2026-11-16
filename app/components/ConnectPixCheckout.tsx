"use client";
import { useState } from "react";
import { ArrowLeft, Copy, LoaderCircle, QrCode, ShieldCheck } from "lucide-react";
import { supabase } from "../lib/supabase";
type Plan = { id: string; name: string; billing_interval: "month" | "year"; price_brl: number };
export default function ConnectPixCheckout({ plan, onBack, onComplete }: { plan: Plan; onBack: () => void; onComplete: () => void }) {
 const [loading,setLoading]=useState(false),[checking,setChecking]=useState(false),[message,setMessage]=useState(""),[copied,setCopied]=useState(false);
 const [pix,setPix]=useState<{id:string;code:string;image:string;expires:string}|null>(null);
 const money=new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(Number(plan.price_brl));
 async function createPix(){setLoading(true);setMessage("");try{const {data,error}=await supabase.functions.invoke("mercadopago-subscriptions",{body:{action:"create_pix",planId:plan.id}});if(error||!data?.pix_checkout_id||!data?.qr_code||!data?.qr_code_base64)throw new Error(data?.error||error?.message||"Não foi possível gerar o Pix.");setPix({id:data.pix_checkout_id,code:data.qr_code,image:data.qr_code_base64,expires:data.expires_at});}catch(e){setMessage(e instanceof Error?e.message:"Falha ao gerar Pix.");}finally{setLoading(false);}}
 async function checkStatus(){if(!pix)return;setChecking(true);setMessage("");try{const {data,error}=await supabase.functions.invoke("mercadopago-subscriptions",{body:{action:"pix_status",pixCheckoutId:pix.id}});if(error||!data)throw new Error(data?.error||error?.message||"Não foi possível consultar.");if(data.status==="approved")onComplete();else setMessage("Ainda aguardando a confirmação do Mercado Pago. A liberação acontece automaticamente após a aprovação.");}catch(e){setMessage(e instanceof Error?e.message:"Falha ao consultar Pix.");}finally{setChecking(false);}}
 async function copyCode(){if(!pix)return;try{await navigator.clipboard.writeText(pix.code);setCopied(true);}catch{setMessage("Não foi possível copiar automaticamente. Selecione o código e copie.");}}
 return <section style={{width:"100%",maxWidth:620,margin:"14px auto",padding:16,borderRadius:20,border:"1px solid #ffffff20",background:"linear-gradient(145deg,#121c30,#0b1220)",color:"#f7f8ff",boxSizing:"border-box"}}>
 <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}><button type="button" onClick={onBack} disabled={loading} style={{display:"flex",alignItems:"center",gap:7,padding:"9px 11px",borderRadius:10,border:"1px solid #ffffff24",background:"#ffffff0b",color:"#dbe6ff"}}><ArrowLeft size={16}/> Voltar</button><strong style={{letterSpacing:2}}>CONNECT</strong></div>
 <div style={{display:"flex",alignItems:"center",gap:9,margin:"18px 0 12px",color:"#a9f1d2"}}><ShieldCheck size={19}/> Pix seguro pelo Mercado Pago</div>
 <h2 style={{fontSize:25,margin:"8px 0"}}>Pague com Pix</h2>
 <p style={{color:"#aab7d0",fontSize:13,lineHeight:1.55,margin:"0 0 16px"}}>{plan.name} · {money} · acesso por {plan.billing_interval==="year"?"365 dias":"30 dias"}. Pagamento único, sem renovação automática.</p>
 {!pix?<button type="button" onClick={()=>void createPix()} disabled={loading} style={{width:"100%",padding:14,border:0,borderRadius:12,background:"linear-gradient(100deg,#20a978,#087f68)",color:"white",fontWeight:900,display:"flex",justifyContent:"center",alignItems:"center",gap:9}}>{loading?<><LoaderCircle size={18}/> Gerando Pix...</>:<><QrCode size={18}/> Gerar QR Code Pix</>}</button>:
 <div style={{padding:12,borderRadius:16,background:"#ffffff08",border:"1px solid #ffffff18",textAlign:"center"}}>
 <img alt="QR Code Pix para pagamento" src={"data:image/png;base64,"+pix.image} style={{width:"min(220px,68vw)",height:"auto",objectFit:"contain",background:"white",borderRadius:12,padding:8,boxSizing:"border-box"}}/>
 <p style={{fontSize:12,color:"#aab7d0"}}>Escaneie o QR Code no aplicativo do seu banco</p>
 <button type="button" onClick={()=>void copyCode()} style={{width:"100%",display:"flex",justifyContent:"center",alignItems:"center",gap:8,padding:12,borderRadius:11,border:"1px solid #3e806d",background:"#12352d",color:"#c5ffe7",fontWeight:850}}><Copy size={16}/>{copied?"Código copiado":"Copiar código Pix"}</button>
 <textarea readOnly value={pix.code} aria-label="Código Pix copia e cola" style={{width:"100%",height:78,marginTop:10,padding:10,boxSizing:"border-box",resize:"none",borderRadius:9,border:"1px solid #ffffff22",background:"#080f1d",color:"#dbe5fa",fontSize:11}}/>
 <p style={{fontSize:11,color:"#9eabc2"}}>Válido até {new Date(pix.expires).toLocaleString("pt-BR")}</p>
 <button type="button" onClick={()=>void checkStatus()} disabled={checking} style={{width:"100%",padding:12,border:0,borderRadius:11,background:"#6c5ce7",color:"white",fontWeight:850}}>{checking?"Consultando...":"Já paguei · verificar status"}</button></div>}
 {message&&<p role="status" style={{marginTop:13,padding:11,borderRadius:10,background:"#3a2b18",color:"#ffe0a6",fontSize:12,lineHeight:1.5}}>{message}</p>}
 <p style={{fontSize:11,color:"#8391ab",lineHeight:1.55,marginTop:14}}>A liberação ocorre somente após confirmação do pagamento pelo webhook do Mercado Pago.</p>
 </section>;
}
