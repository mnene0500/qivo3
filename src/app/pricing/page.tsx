
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, MessageSquare, Coins, Star, Phone, Video } from "lucide-react"
import { useUser } from "@/firebase/auth/use-user"
import { supabase } from "@/lib/supabase"

/**
 * @fileOverview Displays interaction rates based on user gender.
 */
export default function PricingPage() {
  const router = useRouter()
  const { user } = useUser()
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    if (user?.id) {
      supabase.from('users').select('gender').eq('uid', user.id).single().then(({ data }) => setProfile(data))
    }
  }, [user?.id])

  const rates = [
    { 
      label: "Texting", 
      icon: MessageSquare, 
      price: "15 Coins", 
      unit: "Per Message", 
      color: "bg-blue-50 text-blue-600",
      desc: "Instant direct messages to any user",
      visible: profile?.gender === 'male'
    },
    { 
      label: "Voice Call", 
      icon: Phone, 
      price: "70 Coins", 
      unit: "Per Minute", 
      color: "bg-green-50 text-green-600",
      desc: "High-fidelity audio interaction",
      visible: true
    },
    { 
      label: "Video Call", 
      icon: Video, 
      price: "150 Coins", 
      unit: "Per Minute", 
      color: "bg-purple-50 text-purple-600",
      desc: "Face-to-face cinematic interaction",
      visible: true
    }
  ].filter(r => r.visible)

  return (
    <div className="flex-1 bg-white min-h-screen flex flex-col select-none">
      <header className="px-4 h-16 flex items-center border-b bg-white sticky top-0 z-50">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ChevronLeft className="w-6 h-6 text-black" />
        </Button>
        <h1 className="text-sm font-black text-black uppercase tracking-widest ml-2">Interaction Rates</h1>
      </header>

      <main className="flex-1 p-6 space-y-8">
        <div className="p-8 bg-black rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl">
          <Star className="absolute -right-4 -top-4 w-24 h-24 text-white/5 rotate-12" />
          <div className="relative z-10">
            <h2 className="text-2xl font-black uppercase tracking-tighter mb-1 leading-none italic">Economy <span className="text-[#00A2FF]">Guide</span></h2>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">Global Qivo Standards</p>
          </div>
        </div>

        <div className="space-y-4">
          {rates.map((item) => (
            <div key={item.label} className="p-6 bg-gray-50 rounded-[2.2rem] border border-black/[0.03] flex items-center gap-5 shadow-sm animate-in slide-in-from-bottom-2">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${item.color}`}>
                <item.icon className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <h3 className="text-sm font-black uppercase tracking-tight text-black">{item.label}</h3>
                  <div className="flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-yellow-500 fill-current" />
                    <span className="text-sm font-black text-black">{item.price}</span>
                  </div>
                </div>
                <p className="text-[10px] font-medium text-gray-400 leading-tight mb-2">{item.desc}</p>
                <div className="px-2 py-0.5 bg-white rounded-md border border-black/5 w-fit">
                   <p className="text-[8px] font-black text-[#00A2FF] uppercase tracking-widest">{item.unit}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className="p-10 text-center">
        <Button 
          variant="outline" 
          onClick={() => router.push("/recharge")}
          className="rounded-full h-16 px-10 border-2 font-black uppercase tracking-widest text-xs shadow-lg active:scale-95 transition-all"
        >
          Top Up Wallet
        </Button>
      </footer>
    </div>
  )
}
