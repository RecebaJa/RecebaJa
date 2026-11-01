"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
export default function Login(){
  const sb=supabaseBrowser();
  const [mode,setMode]=useState<"entrar"|"criar"|"recuperar">("entrar");
  const [email,setEmail]=useState("");const [senha,setSenha]=useState("");
  const [nome,setNome]=useState("");const [loja,setLoja]=useState("");
  const [msg,setMsg]=useState<{ok:boolean;t:string}|null>(null);const [busy,setBusy]=useState(false);
  async function submit(e:React.FormEvent){
    e.preventDefault();setBusy(true);setMsg(null);
    try{
      if(mode==="entrar"){
        const {error}=await sb.auth.signInWithPassword({email,password:senha});
        if(error)throw error;window.location.href="/";
      }else if(mode==="criar"){
        if(senha.length<8)throw new Error("A senha deve ter pelo menos 8 caracteres.");
        const {error}=await sb.auth.signUp({email,password:senha,options:{data:{owner_name:nome,store_name:loja}}});
        if(error)throw error;setMsg({ok:true,t:"Conta criada! Confira seu e-mail se a confirmação estiver ativada."});
      }else{
        const {error}=await sb.auth.resetPasswordForEmail(email,{redirectTo:location.origin});
        if(error)throw error;setMsg({ok:true,t:"Enviamos um link de recuperação para seu e-mail."});
      }
    }catch(err:any){setMsg({ok:false,t:err.message==="Invalid login credentials"?"E-mail ou senha incorretos.":err.message})}
    setBusy(false);
  }
  return(<main className="grid min-h-screen place-items-center p-4"><form onSubmit={submit} className="w-full max-w-sm space-y-3 rounded-2xl bg-white p-6 shadow">
    <h1 className="text-3xl font-bold text-navy">Recebe<span className="text-cyan">Já</span></h1>
    <p className="text-sm text-slate-500">Seu negócio organizado. Seu dinheiro sob controle.</p>
    {mode==="criar"&&<><input className="input" placeholder="Seu nome" value={nome} onChange={e=>setNome(e.target.value)} required/><input className="input" placeholder="Nome da loja" value={loja} onChange={e=>setLoja(e.target.value)} required/></>}
    <input className="input" type="email" placeholder="E-mail" value={email} onChange={e=>setEmail(e.target.value)} required/>
    {mode!=="recuperar"&&<input className="input" type="password" placeholder="Senha" value={senha} onChange={e=>setSenha(e.target.value)} required/>}
    {msg&&<p className={msg.ok?"text-sm text-green-600":"text-sm text-red-600"}>{msg.t}</p>}
    <button className="btn w-full" disabled={busy}>{busy?"Aguarde...":mode==="entrar"?"Entrar":mode==="criar"?"Criar conta":"Enviar link"}</button>
    <div className="flex justify-between text-sm text-cyan">
      <button type="button" onClick={()=>setMode(mode==="criar"?"entrar":"criar")}>{mode==="criar"?"Já tenho conta":"Criar conta"}</button>
      {mode==="entrar"&&<button type="button" onClick={()=>setMode("recuperar")}>Esqueci minha senha</button>}
    </div></form></main>);
}
