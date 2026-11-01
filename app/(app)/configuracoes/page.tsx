"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
export default function Configuracoes(){
  const sb=supabaseBrowser();
  const [p,setP]=useState({owner_name:"",store_name:"",phone:""});
  const [uid,setUid]=useState("");const [email,setEmail]=useState("");
  const [s1,setS1]=useState("");const [s2,setS2]=useState("");
  const [msg,setMsg]=useState<{ok:boolean;t:string}|null>(null);
  useEffect(()=>{(async()=>{
    const {data:{user}}=await sb.auth.getUser();if(!user)return;
    setUid(user.id);setEmail(user.email??"");
    const {data,error}=await sb.from("profiles").select("owner_name,store_name,phone").eq("id",user.id).single();
    if(error)return setMsg({ok:false,t:"Erro ao carregar seus dados."});
    setP({owner_name:data.owner_name??"",store_name:data.store_name??"",phone:data.phone??""});
  })()},[]);
  async function salvar(e:React.FormEvent){
    e.preventDefault();
    if(!p.store_name.trim())return setMsg({ok:false,t:"Informe o nome da loja."});
    const {error}=await sb.from("profiles").update({owner_name:p.owner_name.trim(),store_name:p.store_name.trim(),phone:p.phone||null}).eq("id",uid);
    setMsg(error?{ok:false,t:"Erro ao salvar: "+error.message}:{ok:true,t:"Dados atualizados!"});
  }
  async function senha(e:React.FormEvent){
    e.preventDefault();
    if(s1.length<8)return setMsg({ok:false,t:"A senha deve ter pelo menos 8 caracteres."});
    if(s1!==s2)return setMsg({ok:false,t:"As senhas não conferem."});
    const {error}=await sb.auth.updateUser({password:s1});
    if(error)return setMsg({ok:false,t:"Erro ao alterar senha: "+error.message});
    setS1("");setS2("");setMsg({ok:true,t:"Senha alterada!"});
  }
  async function sair(){await sb.auth.signOut();window.location.href="/login"}
  return(<><h1 className="mb-4 text-2xl font-bold text-navy">Configurações</h1>
    {msg&&<p className={msg.ok?"mb-3 text-green-600":"mb-3 text-red-600"}>{msg.t}</p>}
    <form onSubmit={salvar} className="mb-4 max-w-md space-y-2 rounded-xl bg-white p-4 shadow-sm">
      <h2 className="font-semibold text-navy">Loja e comerciante</h2>
      <input className="input bg-slate-100" value={email} disabled/>
      <input className="input" placeholder="Seu nome" value={p.owner_name} onChange={e=>setP({...p,owner_name:e.target.value})}/>
      <input className="input" placeholder="Nome da loja" value={p.store_name} onChange={e=>setP({...p,store_name:e.target.value})}/>
      <input className="input" placeholder="Telefone (opcional)" value={p.phone} onChange={e=>setP({...p,phone:e.target.value})}/>
      <p className="text-xs text-slate-500">Moeda: Real brasileiro (R$)</p>
      <button className="btn">Salvar</button></form>
    <form onSubmit={senha} className="mb-4 max-w-md space-y-2 rounded-xl bg-white p-4 shadow-sm">
      <h2 className="font-semibold text-navy">Alterar senha</h2>
      <input className="input" type="password" placeholder="Nova senha" value={s1} onChange={e=>setS1(e.target.value)}/>
      <input className="input" type="password" placeholder="Repita a nova senha" value={s2} onChange={e=>setS2(e.target.value)}/>
      <button className="btn">Alterar senha</button></form>
    <button onClick={sair} className="rounded-lg border border-red-300 px-4 py-2 text-red-600">Sair da conta</button></>);
}
