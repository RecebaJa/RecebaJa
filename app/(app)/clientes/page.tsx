"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { brl } from "@/lib/format";
type Cli={id:string;name:string;phone:string|null;notes:string|null};
export default function Clientes(){
  const sb=supabaseBrowser();
  const [lista,setLista]=useState<Cli[]>([]);const [saldo,setSaldo]=useState<Record<string,number>>({});
  const [q,setQ]=useState("");const [f,setF]=useState({name:"",phone:"",notes:""});
  const [msg,setMsg]=useState<{ok:boolean;t:string}|null>(null);const [load,setLoad]=useState(true);
  async function carregar(){
    const [c,s]=await Promise.all([sb.from("customers").select("*").order("name"),sb.from("sale_balances").select("customer_id,remaining_amount")]);
    if(c.error)setMsg({ok:false,t:"Erro ao carregar clientes."});
    setLista(c.data??[]);
    const mapa:Record<string,number>={};(s.data??[]).forEach((x:any)=>{mapa[x.customer_id]=(mapa[x.customer_id]??0)+Number(x.remaining_amount)});
    setSaldo(mapa);setLoad(false);
  }
  useEffect(()=>{carregar()},[]);
  async function salvar(e:React.FormEvent){
    e.preventDefault();
    if(!f.name.trim())return setMsg({ok:false,t:"Informe o nome do cliente."});
    const {error}=await sb.from("customers").insert({name:f.name.trim(),phone:f.phone||null,notes:f.notes||null});
    if(error)return setMsg({ok:false,t:"Não foi possível salvar: "+error.message});
    setF({name:"",phone:"",notes:""});setMsg({ok:true,t:"Cliente cadastrado!"});carregar();
  }
  async function excluir(c:Cli){
    if(!confirm(`Excluir ${c.name}?`))return;
    const {error}=await sb.from("customers").delete().eq("id",c.id);
    setMsg(error?{ok:false,t:"Não é possível excluir cliente com vendas registradas."}:{ok:true,t:"Cliente excluído."});carregar();
  }
  const vis=lista.filter(c=>c.name.toLowerCase().includes(q.toLowerCase()));
  return(<><h1 className="mb-4 text-2xl font-bold text-navy">Clientes</h1>
    <form onSubmit={salvar} className="mb-4 grid gap-2 rounded-xl bg-white p-4 shadow-sm md:grid-cols-4">
      <input className="input" placeholder="Nome" value={f.name} onChange={e=>setF({...f,name:e.target.value})}/>
      <input className="input" placeholder="Telefone (opcional)" value={f.phone} onChange={e=>setF({...f,phone:e.target.value})}/>
      <input className="input" placeholder="Observações (opcional)" value={f.notes} onChange={e=>setF({...f,notes:e.target.value})}/>
      <button className="btn">Cadastrar</button></form>
    {msg&&<p className={msg.ok?"mb-2 text-green-600":"mb-2 text-red-600"}>{msg.t}</p>}
    <input className="input mb-3" placeholder="Pesquisar cliente..." value={q} onChange={e=>setQ(e.target.value)}/>
    {load?<p>Carregando...</p>:vis.length===0?<p className="text-slate-500">Nenhum cliente encontrado.</p>:
    <ul className="space-y-2">{vis.map(c=><li key={c.id} className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm">
      <div><p className="font-medium">{c.name}</p><p className="text-sm text-slate-500">{c.phone??"Sem telefone"}</p></div>
      <div className="text-right"><p className={(saldo[c.id]??0)>0?"font-bold text-red-600":"font-bold text-green-600"}>{brl(saldo[c.id]??0)}</p>
      <button onClick={()=>excluir(c)} className="text-xs text-slate-400">Excluir</button></div></li>)}</ul>}</>);
}
