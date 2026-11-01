import Link from "next/link";
import { Home, Users, HandCoins, Wallet, BarChart3, Settings } from "lucide-react";
const nav=[{h:"/",l:"Início",I:Home},{h:"/clientes",l:"Clientes",I:Users},{h:"/fiado",l:"Fiado",I:HandCoins},{h:"/financeiro",l:"Financeiro",I:Wallet},{h:"/relatorios",l:"Relatórios",I:BarChart3},{h:"/configuracoes",l:"Config.",I:Settings}];
export default function AppLayout({children}:{children:React.ReactNode}){
  return(<div className="md:flex"><aside className="hidden min-h-screen w-56 bg-navy p-4 text-white md:block">
    <div className="mb-6 text-2xl font-bold">Recebe<span className="text-cyan">Já</span></div>
    {nav.map(({h,l,I})=><Link key={h} href={h} className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-white/10"><I size={18}/>{l}</Link>)}</aside>
    <main className="flex-1 p-4 pb-20 md:p-8">{children}</main>
    <nav className="fixed inset-x-0 bottom-0 flex justify-around border-t bg-white py-2 md:hidden">
      {nav.map(({h,l,I})=><Link key={h} href={h} className="flex flex-col items-center text-xs text-navy"><I size={20}/>{l}</Link>)}</nav></div>);
}
