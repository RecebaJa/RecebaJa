"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { brl, dataBR } from "@/lib/format";
type Mov={id:string;type:"receita"|"despesa";category:string;description:string|null;amount:number;occurred_on:string;payment_id:string|null};
const hoje=()=>new Date().toISOString().slice(0,10);
const ini=()=>hoje().slice(0,8)+"01";
const CATS=["Mercadoria","Aluguel","Energia/Água","Funcionários","Impostos","Outros"];
export default function Financeiro(){
  const sb=supabaseBrowser();
  const [lista,setLista]=useState<Mov[]>([]);const [de,setDe]=useState(ini());const [ate,setAte]=useState(hoje());
  const [msg,setMsg]=useState<{ok:boolean;t:string}|null>(null);
  const [f,setF]=useState({type:"despesa",category:CATS[0],description:"",amount:"",occurred_on:hoje()});
  async function carregar(){
    const {data,error}=await sb.from("transactions").select("*").gte("occurred_on",de).lte("occurred_on",ate).order("occurred_on",{ascending:false});
    if(error)setMsg({ok:false,t:"Erro ao carregar movimentações."});setLista((data as Mov[])??[]);
  }
  useEffect(()=>{carregar()},[de,ate]);
  async function salvar(e:React.FormEvent){
    e.preventDefault();const amount=Number(f.amount.replace(",","."));
    if(!(amount>0))return setMsg({ok:false,t:"O valor deve ser maior que zero."});
    const {error}=await sb.from("transactions").insert({type:f.type,category:f.category,description:f.description||null,amount,occurred_on:f.occurred_on});
    if(error)return setMsg({ok:false,t:"Erro ao salvar: "+error.message});
    setF({...f,description:"",amount:""});setMsg({ok:true,t:"Movimentação registrada!"});carregar();
  }
  async function excluir(m:Mov){
    if(!confirm("Excluir esta movimentação?"))return;
    const {error}=await sb.from("transactions").delete().eq("id",m.id);
    setMsg(error?{ok:false,t:"Erro ao excluir."}:{ok:true,t:"Movimentação excluída."});carregar();
  }
  const tot=(t:string)=>lista.filter(m=>m.type===t).reduce((s,m)=>s+Number(m.amount),0);
  const rec=tot("receita"),desp=tot("despesa");
  return(<><h1 className="mb-4 text-2xl font-bold text-navy">Financeiro</h1>
    <div className="mb-4 grid grid-cols-3 gap-2 text-center">
      <div className="rounded-xl bg-white p-3 shadow-sm"><p className="text-xs text-slate-500">Receitas</p><p className="font-bold text-green-600">{brl(rec)}</p></div>
      <div className="rounded-xl bg-white p-3 shadow-sm"><p className="text-xs text-slate-500">Despesas</p><p className="font-bold text-red-600">{brl(desp)}</p></div>
      <div className="rounded-xl bg-white p-3 shadow-sm"><p className="text-xs text-slate-500">Saldo</p><p className="font-bold text-navy">{brl(rec-desp)}</p></div></div>
    <form onSubmit={salvar} className="mb-4 grid gap-2 rounded-xl bg-white p-4 shadow-sm md:grid-cols-3">
      <select className="input" value={f.type} onChange={e=>setF({...f,type:e.target.value})}><option value="despesa">Despesa</option><option value="receita">Receita</option></select>
      <select className="input" value={f.category} onChange={e=>setF({...f,category:e.target.value})}>{CATS.map(c=><option key={c}>{c}</option>)}</select>
      <input className="input" inputMode="decimal" placeholder="Valor (R$)" value={f.amount} onChange={e=>setF({...f,amount:e.target.value})}/>
      <input className="input md:col-span-2" placeholder="Descrição (opcional)" value={f.description} onChange={e=>setF({...f,description:e.target.value})}/>
      <input type="date" className="input" value={f.occurred_on} onChange={e=>setF({...f,occurred_on:e.target.value})}/>
      <button className="btn md:col-span-3">Registrar</button></form>
    {msg&&<p className={msg.ok?"mb-2 text-green-600":"mb-2 text-red-600"}>{msg.t}</p>}
    <div className="mb-3 flex items-center gap-2 text-sm">De <input type="date" className="input w-auto" value={de} onChange={e=>setDe(e.target.value)}/> até <input type="date" className="input w-auto" value={ate} onChange={e=>setAte(e.target.value)}/></div>
    {lista.length===0?<p className="text-slate-500">Nenhuma movimentação no período.</p>:<ul className="space-y-2">{lista.map(m=>
      <li key={m.id} className="flex items-center justify-between rounded-xl bg-white p-3 shadow-sm">
        <div><p className="font-medium">{m.category}</p><p className="text-sm text-slate-500">{dataBR(m.occurred_on)}{m.description?` · ${m.description}`:""}</p></div>
        <div className="text-right"><p className={m.type==="receita"?"font-bold text-green-600":"font-bold text-red-600"}>{m.type==="receita"?"+":"−"} {brl(Number(m.amount))}</p>
        {m.payment_id?<span className="text-xs text-slate-400">Pagamento de fiado</span>:<button onClick={()=>excluir(m)} className="text-xs text-slate-400">Excluir</button>}</div></li>)}</ul>}</>);
}
