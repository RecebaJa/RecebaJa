"use client";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
type M={type:string;amount:number;occurred_on:string};
export default function Grafico({mov}:{mov:M[]}){
  const [dias,setDias]=useState(7);
  const data=Array.from({length:dias},(_,i)=>{
    const iso=new Date(Date.now()-(dias-1-i)*864e5).toISOString().slice(0,10);
    const dia=mov.filter(m=>m.occurred_on===iso);
    const soma=(t:string)=>dia.filter(m=>m.type===t).reduce((s,m)=>s+Number(m.amount),0);
    return{dia:iso.slice(8)+"/"+iso.slice(5,7),Receitas:soma("receita"),Despesas:soma("despesa")};
  });
  return(<div className="mt-6 rounded-xl bg-white p-4 shadow-sm">
    <div className="mb-2 flex items-center justify-between"><h2 className="font-semibold text-navy">Receitas e despesas</h2>
      <div className="flex gap-1 text-sm">{[7,30].map(n=><button key={n} onClick={()=>setDias(n)} className={`rounded-full px-3 py-1 ${dias===n?"bg-navy text-white":"bg-slate-100"}`}>{n} dias</button>)}</div></div>
    <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={data}>
      <XAxis dataKey="dia" tick={{fontSize:11}} interval={dias===30?4:0}/><YAxis tick={{fontSize:11}} width={40}/>
      <Tooltip formatter={(v:number)=>v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"})}/><Legend/>
      <Bar dataKey="Receitas" fill="#16a34a"/><Bar dataKey="Despesas" fill="#dc2626"/></BarChart></ResponsiveContainer></div></div>);
}
