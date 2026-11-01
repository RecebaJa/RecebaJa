import "./globals.css";
import SW from "@/components/SW";
export const metadata={title:"RecebeJá",description:"Seu negócio organizado. Seu dinheiro sob controle.",manifest:"/manifest.webmanifest",themeColor:"#0B2545"};
export default function Root({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body>{children}<SW/></body></html>}
