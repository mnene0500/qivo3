"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ChevronLeft, Coins, Trophy, Loader2, Sparkles, Info, Star } from "lucide-react"
import { useUser } from "@/firebase/auth/use-user"
import { useToast } from "@/hooks/use-toast"
import { useBalance } from "@/lib/providers/BalanceProvider"
import { playSpinGameAction } from "@/app/actions/matchflow-actions"
import { cn } from "@/lib/utils"

const STAKES = [20, 50, 100, 200, 500]
const PRIZES = [0, 20, 0, 100, 50, 0, 1000, 200, 0, 500]
const SECTOR_ANGLE = 360 / PRIZES.length

export default function SpinToWinPage() {
  const router = useRouter()
  const { user } = useUser()
  const { toast } = useToast()
  const { coins } = useBalance()
  
  const [selectedStake, setSelectedStake] = useState(20)
  const [isSpinning, setIsSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [lastWin, setLastWin] = useState<number | null>(null)
  
  const wheelRef = useRef<SVGSVGElement>(null)

  const handleSpin = async () => {
    if (!user || isSpinning) return
    if (coins < selectedStake) {
      toast({ variant: "destructive", title: "Insufficient Coins" })
      return
    }

    setIsSpinning(true)
    setLastWin(null)

    try {
      const res = await playSpinGameAction(user.id, selectedStake)
      
      if (res.success && res.index !== undefined) {
        // Calculate new rotation
        // Add 5-8 full spins for drama, then land on the specific index
        const fullSpins = 6 + Math.floor(Math.random() * 3)
        // Adjust for sector position (negative to spin clockwise)
        const targetAngle = fullSpins * 360 + (res.index * SECTOR_ANGLE)
        
        // We accumulate rotation to keep it spinning smoothly from current pos
        const newRotation = rotation + targetAngle
        setRotation(newRotation)

        // Wait for animation to finish (match CSS transition duration)
        setTimeout(() => {
          setIsSpinning(false)
          setLastWin(res.winAmount)
          if (res.winAmount > 0) {
            toast({ title: `You Won ${res.winAmount} Coins!`, description: "Winning added to your wallet." })
          } else {
            toast({ title: "No Win This Time", description: "Better luck next spin!" })
          }
        }, 5000)
      } else {
        throw new Error(res.error)
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message })
      setIsSpinning(false)
    }
  }

  return (
    <div className="flex-1 bg-[#1A1A1A] min-h-screen flex flex-col select-none overflow-hidden relative">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,#4F46E5_0%,transparent_70%)]" />
      </div>

      <header className="px-4 h-16 flex items-center justify-between sticky top-0 z-[60] bg-black/40 backdrop-blur-md">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full text-white/60 hover:text-white">
          <ChevronLeft className="w-6 h-6" />
        </Button>
        <div className="flex items-center gap-2 bg-black/50 px-4 py-1.5 rounded-full border border-white/10">
          <Coins className="w-3.5 h-3.5 text-yellow-500 fill-current" />
          <span className="text-xs font-black text-white">{coins}</span>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 space-y-10 relative z-10">
        <div className="text-center space-y-1">
          <h1 className="text-4xl font-black text-white tracking-tighter italic uppercase">Spin <span className="text-amber-500">To Win</span></h1>
          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.3em]">High Stakes • Big Rewards</p>
        </div>

        {/* WHEEL CONTAINER */}
        <div className="relative w-80 h-80 flex items-center justify-center">
          {/* ARROW INDICATOR */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-50 filter drop-shadow-xl">
            <div className="w-8 h-8 bg-amber-500 clip-path-polygon-[50%_100%,0%_0%,100%_0%] rotate-180" style={{ clipPath: 'polygon(50% 100%, 0 0, 100% 0)' }} />
          </div>

          {/* THE WHEEL */}
          <div 
            className="w-full h-full rounded-full border-[10px] border-amber-900 shadow-[0_0_80px_rgba(245,158,11,0.2)] bg-black overflow-hidden relative transition-transform duration-[5000ms] cubic-bezier(0.15, 0, 0.15, 1)"
            style={{ transform: `rotate(-${rotation}deg)` }}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {PRIZES.map((prize, i) => {
                const angle = i * SECTOR_ANGLE
                const isWin = prize > 0
                return (
                  <g key={i} transform={`rotate(${angle} 50 50)`}>
                    <path
                      d="M 50 50 L 50 0 A 50 50 0 0 1 79.38 15.45 Z"
                      fill={i % 2 === 0 ? '#111' : '#222'}
                      stroke="#333"
                      strokeWidth="0.2"
                    />
                    <text
                      x="70"
                      y="15"
                      transform="rotate(18 70 15)"
                      fill={isWin ? '#F59E0B' : '#444'}
                      className="text-[4px] font-black uppercase tracking-tighter"
                      textAnchor="middle"
                    >
                      {prize === 1000 ? '⭐ 1000' : prize === 0 ? 'LOSE' : prize}
                    </text>
                  </g>
                )
              })}
            </svg>
            {/* WHEEL CENTER */}
            <div className="absolute inset-[40%] bg-amber-600 rounded-full border-4 border-amber-900 shadow-inner flex items-center justify-center">
              <Star className="w-6 h-6 text-white fill-current" />
            </div>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-3">
             <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Select Stake Amount</p>
             <div className="flex justify-between gap-2">
               {STAKES.map((stake) => (
                 <button
                   key={stake}
                   disabled={isSpinning}
                   onClick={() => setSelectedStake(stake)}
                   className={cn(
                     "flex-1 h-12 rounded-xl border-2 font-black text-xs transition-all active:scale-90",
                     selectedStake === stake 
                       ? "bg-amber-500 border-amber-400 text-black shadow-lg shadow-amber-500/20" 
                       : "bg-white/5 border-white/5 text-white/40"
                   )}
                 >
                   {stake}
                 </button>
               ))}
             </div>
          </div>

          <Button
            onClick={handleSpin}
            disabled={isSpinning || coins < selectedStake}
            className={cn(
              "w-full h-18 py-8 rounded-[2rem] text-lg font-black uppercase tracking-[0.2em] shadow-2xl active:scale-95 transition-all",
              isSpinning ? "bg-white/10 text-gray-500" : "bg-white text-black hover:bg-amber-500"
            )}
          >
            {isSpinning ? <Loader2 className="w-8 h-8 animate-spin" /> : "Place Stake & Spin"}
          </Button>

          <div className="flex items-center justify-center gap-6 pt-4 text-gray-500">
            <div className="flex items-center gap-2">
              <Star className="w-3.5 h-3.5" />
              <span className="text-[8px] font-black uppercase tracking-widest">Instant Payout</span>
            </div>
            <div className="flex items-center gap-2">
              <Info className="w-3.5 h-3.5" />
              <span className="text-[8px] font-black uppercase tracking-widest">Fair Play AI</span>
            </div>
          </div>
        </div>
      </main>

      {/* WIN OVERLAY */}
      {lastWin !== null && lastWin > 0 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-10 animate-in fade-in zoom-in duration-300" onClick={() => setLastWin(null)}>
           <div className="bg-amber-500 p-10 rounded-[3rem] text-center space-y-6 shadow-[0_0_100px_rgba(245,158,11,0.5)]">
             <Trophy className="w-20 h-20 text-black mx-auto animate-bounce" />
             <div className="space-y-1">
               <h3 className="text-4xl font-black text-black tracking-tighter uppercase italic">Big Win!</h3>
               <div className="flex items-center justify-center gap-3 text-white bg-black px-6 py-2 rounded-full">
                 <Coins className="w-6 h-6 fill-current text-yellow-500" />
                 <span className="text-3xl font-black">+{lastWin}</span>
               </div>
             </div>
             <p className="text-[10px] font-bold text-black/60 uppercase tracking-widest">Added To Your Balance</p>
           </div>
        </div>
      )}
    </div>
  )
}
