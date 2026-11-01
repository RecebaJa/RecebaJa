"use client";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { brl, dataBR } from "@/lib/format";
const hoje=()=>new Date().toISOString().slice(0,10);
const ini=()=>hoje().slice(0,8)+"01";
export default function Relatorios(){
  const sb=supabaseBrowser();
  const [de,setDe]=useState(ini());const [ate,setAte]=useState(hoje());
  const [d,setD]=useState<any>(null);const [erro,setErro]=useState("");
  useEffect(()=>{(async()=>{
    setErro("");
    const [v,p,t,c]=await Promise.all([
      sb.from("sale_balances").select("*"),
      sb.from("payments").select("amount").gte("paid_at",de).lte("paid_at",ate),
      sb.from("transactions").select("type,amount").gte("occurred_on",de).lte("occurred_on",ate),
      sb.from("customers").select("id,name")]);
    if(v.error||p.error||t.error||c.error)return setErro("Erro ao carregar relatórios.");
    setD({v:v.data??[],p:p.data??[],t:t.data??[],c:c.data??[]});
  })()},[de,ate]);
  if(erro)return <p className="text-red-600">{erro}</p>;
  if(!d)return <p>Carregando...</p>;
  const soma=(a:any[],k:string)=>a.reduce((s,x)=>s+Number(x[k]),0);
  const nome=(id:string)=>d.c.find((x:any)=>x.id===id)?.name??"—";
  const doPeriodo=d.v.filter((x:any)=>x.sale_date>=de&&x.sale_date<=ate);
  const abertas=d.v.filter((x:any)=>x.status!=="pago");
  const rec=soma(d.t.filter((x:any)=>x.type==="receita"),"amount"),desp=soma(d.t.filter((x:any)=>x.type==="despesa"),"amount");
  const devedores=Object.entries(abertas.reduce((m:Record<string,number>,x:any)=>{m[x.customer_id]=(m[x.customer_id]??0)+Number(x.remaining_amount);return m},{}))
    .sort((a,b)=>(b[1] as number)-(a[1] as number)).slice(0,5);
  const cards:[string,string,string][]=[
    ["Vendido fiado no período",brl(soma(doPeriodo,"amount")),""],
    ["Recebido no período",brl(soma(d.p,"amount")),"text-green-600"],
    ["Total pendente (hoje)",brl(soma(abertas,"remaining_amount")),""],
    ["Total atrasado (hoje)",brl(soma(abertas.filter((x:any)=>x.status==="atrasado"),"remaining_amount")),"text-red-600"],
    ["Receitas no período",brl(rec),"text-green-600"],["Despesas no período",brl(desp),"text-red-600"]];
  function csv(){
    const L:any[][]=[["Cliente","Descrição","Data da venda","Vencimento","Valor","Pago","Saldo","Situação"],
      ...doPeriodo.map((x:any)=>[nome(x.customer_id),x.description,dataBR(x.sale_date),dataBR(x.due_date),x.amount,x.paid_amount,x.remaining_amount,x.status])];
    const txt=L.map((r:any[])=>r.map((c:any)=>`"${String(c).replace(/"/g,'""').replace(/^([=+\-@])/,"'$1")}"`).join(";")).join("\n");
    const a=document.createElement("a");a.href=URL.createObjectURL(new Blob(["\ufeff"+txt],{type:"text/csv;charset=utf-8"}));
    a.download=`recebeja_${de}_${ate}.csv`;a.click();
  }
  return(<><h1 className="mb-4 text-2xl font-bold text-navy">Relatórios</h1>
    <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">De <input type="date" className="input w-auto" value={de} onChange={e=>setDe(e.target.value)}/> até <input type="date" className="input w-auto" value={ate} onChange={e=>setAte(e.target.value)}/>
      <button onClick={csv} className="btn">Exportar CSV</button></div>
    <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-3">{cards.map(([t,val,c])=>
      <div key={t} className="rounded-xl bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">{t}</p><p className={`text-xl font-bold ${c}`}>{val}</p></div>)}</div>
    <h2 className="mb-2 font-semibold text-navy">Maiores saldos devedores</h2>
    {devedores.length===0?<p className="text-slate-500">Nenhum cliente devendo.</p>:<ul className="space-y-2">{devedores.map(([id,val])=>
      <li key={id} className="flex justify-between rounded-xl bg-white p-3 shadow-sm"><span>{nome(id)}</span><b className="text-red-600">{brl(val as number)}</b></li>)}</ul>}</>);
}
