import { supabaseServer } from "@/lib/supabase/server";
import { brl, dataBR } from "@/lib/format";
import Grafico from "@/components/Grafico";
export const dynamic="force-dynamic";
export default async function Painel(){
  const sb=supabaseServer();
  const ini=new Date();ini.setDate(1);const mes=ini.toISOString().slice(0,10);
  const d30=new Date(Date.now()-29*864e5).toISOString().slice(0,10);
  const [vendas,clientes,mov,ult]=await Promise.all([
    sb.from("sale_balances").select("remaining_amount,status"),
    sb.from("customers").select("id",{count:"exact",head:true}),
    sb.from("transactions").select("type,amount").gte("occurred_on",mes),
    sb.from("transactions").select("type,amount,occurred_on,category,description").gte("occurred_on",d30).order("occurred_on",{ascending:false})]);
  if(vendas.error||mov.error||ult.error)return <p className="text-red-600">Erro ao carregar dados. Verifique se o schema foi executado no Supabase.</p>;
  const soma=(a:any[],f:(x:any)=>boolean,k:string)=>a.filter(f).reduce((s,x)=>s+Number(x[k]),0);
  const v=vendas.data??[],m=mov.data??[];
  const rec=soma(m,x=>x.type==="receita","amount"),desp=soma(m,x=>x.type==="despesa","amount");
  const cards=[["Total a receber",brl(soma(v,x=>x.status!=="pago","remaining_amount")),""],
    ["Dívidas atrasadas",brl(soma(v,x=>x.status==="atrasado","remaining_amount")),"text-red-600"],
    ["Recebido no mês",brl(rec),"text-green-600"],["Despesas no mês",brl(desp),""],
    ["Saldo do mês",brl(rec-desp),""],["Clientes",String(clientes.count??0),""]];
  return(<><h1 className="mb-4 text-2xl font-bold text-navy">Início</h1>
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">{cards.map(([t,val,c])=>
      <div key={t} className="rounded-xl bg-white p-4 shadow-sm"><p className="text-sm text-slate-500">{t}</p><p className={`text-xl font-bold ${c}`}>{val}</p></div>)}</div>
    <Grafico mov={(ult.data??[]) as any}/>
    <h2 className="mb-2 mt-6 font-semibold text-navy">Atividades recentes</h2>
    {(ult.data??[]).length===0?<p className="text-slate-500">Nenhuma atividade ainda.</p>:<ul className="space-y-2">{(ult.data??[]).slice(0,5).map((x:any,i:number)=><li key={i} className="flex justify-between rounded-xl bg-white p-3 text-sm shadow-sm"><span>{dataBR(x.occurred_on)} · {x.category}</span><b className={x.type==="receita"?"text-green-600":"text-red-600"}>{x.type==="receita"?"+":"−"} {brl(Number(x.amount))}</b></li>)}</ul></>);
}
