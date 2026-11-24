import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
const geistSans=Geist({variable:"--font-geist-sans",subsets:["latin"]});
const geistMono=Geist_Mono({variable:"--font-geist-mono",subsets:["latin"]});
export const metadata:Metadata={title:"Auriventa | Gestão de parcerias e resultados",description:"Organize parcerias, acompanhe publicações, registre vendas e acompanhe comissões com a Auriventa, da Remedio Labs."};
export default function RootLayout({children}:LayoutProps<"/">){return <html lang="pt-BR" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}><body className="min-h-full flex flex-col">{children}</body></html>;}