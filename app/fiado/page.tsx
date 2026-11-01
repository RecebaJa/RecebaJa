"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { brl, dataBR } from "@/lib/format";
type Venda={id:string;customer_id:string;description:string;amount:number;due_date:string;sale_date:string;paid_amount:number;remaining_amount:number;status:string};
const ST:Record<string,[string,string]>={pendente:["Pendente","bg-slate-100 text-slate-700"],parcialmente_pago:["Parcialmente pago","bg-cyan/20 text-navy"],pago:["Pago","bg-green-100 text-green-700"],atrasado:["Atrasado","bg-red-100 text-red-700"]};
const hoje=()=>new Date().toISOString().slice(0,10);
export default function Fiado(){
  const sb=supabaseBrowser();
  const [vendas,setVendas]=useState<Venda[]>([]);const [clis,setClis]=useState<{id:string;name:string}[]>([]);
  const [filtro,setFiltro]=useState("todas");const [msg,setMsg]=useState<{ok:boolean;t:string}|null>(null);
  const [f,setF]=useState({customer_id:"",description:"",amount:"",sale_date:hoje(),due_date:hoje(),installments:"1"});
  const [pg,setPg]=useState<{id:string;amount:string;method:string;paid_at:string}|null>(null);
  async function carregar(){
    const [v,c]=await Promise.all([sb.from("sale_balances").select("*").order("due_date"),sb.from("customers").select("id,name").order("name")]);
    if(v.error)setMsg({ok:false,t:"Erro ao carregar vendas."});
    setVendas((v.data as Venda[])??[]);setClis(c.data??[]);
  }
  useEffect(()=>{carregar()},[]);
  const nome=(id:string)=>clis.find(c=>c.id===id)?.name??"—";
  async function vender(e:React.FormEvent){
    e.preventDefault();const amount=Number(f.amount.replace(",","."));
    if(!f.customer_id)return setMsg({ok:false,t:"Escolha o cliente."});
    if(!f.description.trim())return setMsg({ok:false,t:"Descreva a compra."});
    if(!(amount>0))return setMsg({ok:false,t:"O valor deve ser maior que zero."});
    if(f.due_date<f.sale_date)return setMsg({ok:false,t:"O vencimento não pode ser antes da venda."});
    const {error}=await sb.from("sales").insert({customer_id:f.customer_id,description:f.description.trim(),amount,sale_date:f.sale_date,due_date:f.due_date,installments:Number(f.installments)||1});
    if(error)return setMsg({ok:false,t:"Erro ao salvar: "+error.message});
    setF({...f,description:"",amount:""});setMsg({ok:true,t:"Venda fiada registrada!"});carregar();
  }
  async function pagar(e:React.FormEvent,v:Venda){
    e.preventDefault();if(!pg)return;const amount=Number(pg.amount.replace(",","."));
    if(!(amount>0))return setMsg({ok:false,t:"O valor deve ser maior que zero."});
    if(amount>v.remaining_amount)return setMsg({ok:false,t:`Pagamento maior que o saldo (${brl(v.remaining_amount)}).`});
    const {error}=await sb.from("payments").insert({sale_id:v.id,amount,method:pg.method,paid_at:pg.paid_at});
    if(error)return setMsg({ok:false,t:"Erro ao registrar: "+error.message});
    setPg(null);setMsg({ok:true,t:"Pagamento registrado!"});carregar();
  }
  const vis=vendas.filter(v=>filtro==="todas"||(filtro==="abertas"?v.status!=="pago":v.status===filtro));
  return(<><h1 className="mb-4 text-2xl font-bold text-navy">Fiado</h1>
    <form onSubmit={vender} className="mb-4 grid gap-2 rounded-xl bg-white p-4 shadow-sm md:grid-cols-3">
      <select className="input" value={f.customer_id} onChange={e=>setF({...f,customer_id:e.target.value})}><option value="">Cliente...</option>{clis.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
      <input className="input" placeholder="Descrição da compra" value={f.description} onChange={e=>setF({...f,description:e.target.value})}/>
      <input className="input" inputMode="decimal" placeholder="Valor (R$)" value={f.amount} onChange={e=>setF({...f,amount:e.target.value})}/>
      <label className="text-xs">Data da venda<input type="date" className="input" value={f.sale_date} onChange={e=>setF({...f,sale_date:e.target.value})}/></label>
      <label className="text-xs">Vencimento<input type="date" className="input" value={f.due_date} onChange={e=>setF({...f,due_date:e.target.value})}/></label>
      <label className="text-xs">Parcelas (opcional)<input type="number" min={1} className="input" value={f.installments} onChange={e=>setF({...f,installments:e.target.value})}/></label>
      <button className="btn md:col-span-3">Registrar venda fiada</button></form>
    {msg&&<p className={msg.ok?"mb-2 text-green-600":"mb-2 text-red-600"}>{msg.t}</p>}
    <div className="mb-3 flex flex-wrap gap-2">{[["todas","Todas"],["abertas","Em aberto"],["pendente","Pendentes"],["parcialmente_pago","Parciais"],["atrasado","Atrasadas"],["pago","Quitadas"]].map(([k,l])=>
      <button key={k} onClick={()=>setFiltro(k)} className={`rounded-full px-3 py-1 text-sm ${filtro===k?"bg-navy text-white":"bg-white"}`}>{l}</button>)}</div>
    {vis.length===0?<p className="text-slate-500">Nenhuma venda encontrada.</p>:<ul className="space-y-2">{vis.map(v=>{const [t,c]=ST[v.status];return(
      <li key={v.id} className="rounded-xl bg-white p-3 shadow-sm">
        <div className="flex justify-between"><div><p className="font-medium">{nome(v.customer_id)}</p><p className="text-sm text-slate-500">{v.description} · vence {dataBR(v.due_date)}</p></div>
          <span className={`h-fit rounded-full px-2 py-1 text-xs ${c}`}>{t}</span></div>
        <p className="mt-2 text-sm">Original {brl(v.amount)} · Pago <b className="text-green-600">{brl(v.paid_amount)}</b> · Resta <b className={v.status==="atrasado"?"text-red-600":""}>{brl(v.remaining_amount)}</b></p>
        {v.status!=="pago"&&(pg?.id===v.id?
          <form onSubmit={e=>pagar(e,v)} className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-5">
            <input className="input" inputMode="decimal" placeholder="Valor" value={pg.amount} onChange={e=>setPg({...pg,amount:e.target.value})}/>
            <select className="input" value={pg.method} onChange={e=>setPg({...pg,method:e.target.value})}>{[["dinheiro","Dinheiro"],["pix","Pix"],["cartao_debito","Débito"],["cartao_credito","Crédito"],["transferencia","Transferência"],["outro","Outro"]].map(([k,l])=><option key={k} value={k}>{l}</option>)}</select>
            <input type="date" className="input" value={pg.paid_at} onChange={e=>setPg({...pg,paid_at:e.target.value})}/>
            <button className="btn">Confirmar</button><button type="button" onClick={()=>setPg(null)} className="text-sm text-slate-500">Cancelar</button></form>
          :<button onClick={()=>setPg({id:v.id,amount:"",method:"dinheiro",paid_at:hoje()})} className="mt-2 text-sm font-medium text-cyan">Registrar pagamento</button>)}
      </li>)})}</ul>}</>);
}
