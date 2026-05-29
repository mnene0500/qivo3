"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Gamepad2, Trophy, Coins, Sparkles, Star, LayoutGrid } from "lucide-react"

export default function GameCenterHub() {
  const router = useRouter()

  const games = [
    {
      id: 'spin',
      name: 'Spin to Win',
      desc: 'Win up to 1000 coins in one spin!',
      icon: Trophy,
      color: 'bg-amber-50 text-amber-600',
      href: '/game-center/spin',
      active: true
    },
    {
      id: 'slots',
      name: 'Slot Machine',
      desc: 'Match 3 symbols to win up to 10x your stake!',
      icon: LayoutGrid,
      color: 'bg-indigo-50 text-indigo-600',
      href: '/game-center/slots',
      active: true
    }
  ]

  return (
    <div className="flex-1 bg-white min-h-screen flex flex-col select-none animate-in fade-in duration-300">
      <header className="px-4 h-16 flex items-center border-b bg-white sticky top-0 z-50">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ChevronLeft className="w-6 h-6 text-black" />
        </Button>
        <h1 className="text-sm font-black text-black uppercase tracking-widest ml-2">Game Center</h1>
      </header>

      <main className="flex-1 p-6 space-y-8">
        <div className="p-8 bg-black rounded-[2.5rem] text-white relative overflow-hidden shadow-2xl">
          <Sparkles className="absolute -right-4 -top-4 w-24 h-24 text-white/10 rotate-12" />
          <div className="relative z-10 space-y-1">
            <h2 className="text-3xl font-black tracking-tight leading-none uppercase italic">Win Big!</h2>
            <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">Official Qivo Games</p>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1">Available Games</h3>
          
          {games.map((game) => (
            <button
              key={game.id}
              onClick={() => router.push(game.href)}
              className="w-full p-6 bg-gray-50 rounded-[2rem] border border-black/5 flex items-center gap-5 active:scale-95 transition-all group"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${game.color}`}>
                <game.icon className="w-6 h-6" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center gap-2 mb-1">
                   <h4 className="text-sm font-black text-black uppercase tracking-tight">{game.name}</h4>
                   <div className="px-2 py-0.5 bg-green-50 rounded-full border border-green-100 flex items-center gap-1">
                      <div className="w-1 h-1 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-[7px] font-black text-green-600 uppercase tracking-widest">Live</span>
                   </div>
                </div>
                <p className="text-[10px] font-medium text-gray-400 leading-tight">{game.desc}</p>
              </div>
              <div className="bg-white p-2.5 rounded-full shadow-sm border border-black/5 group-hover:bg-[#00A2FF] group-hover:text-white transition-colors">
                <Star className="w-4 h-4" />
              </div>
            </button>
          ))}
        </div>

        <div className="p-6 bg-blue-50 rounded-[2rem] border border-blue-100 flex items-center gap-4">
           <div className="bg-white p-2 rounded-xl shadow-sm"><Coins className="w-5 h-5 text-yellow-500" /></div>
           <div>
             <p className="text-[10px] font-black text-blue-900 uppercase tracking-widest">Coin Integration</p>
             <p className="text-[9px] font-bold text-blue-600 uppercase tracking-tighter">Your wallet is synced for instant play</p>
           </div>
        </div>
      </main>
    </div>
  )
}
