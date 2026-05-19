
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ref, onValue, set, off } from "firebase/database"
import { useUser, useDatabase } from "@/firebase"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Phone, PhoneOff, Video, X } from "lucide-react"

/**
 * @fileOverview Global listener for incoming calls.
 */
export function CallManager() {
  const router = useRouter()
  const { user } = useUser()
  const rtdb = useDatabase()
  const [incomingCall, setIncomingCall] = useState<any>(null)

  useEffect(() => {
    if (!user?.uid) return

    const callRef = ref(rtdb, `calls/${user.uid}`)
    const unsubscribe = onValue(callRef, (snap) => {
      if (snap.exists()) {
        setIncomingCall(snap.val())
      } else {
        setIncomingCall(null)
      }
    })

    return () => off(callRef, 'value', unsubscribe)
  }, [user?.uid, rtdb])

  const handleAccept = async () => {
    if (!incomingCall || !user?.uid) return
    const { chatId, type } = incomingCall
    
    // Clear signal
    await set(ref(rtdb, `calls/${user.uid}`), null)
    router.push(`/call/${chatId}?type=${type}`)
  }

  const handleReject = async () => {
    if (!user?.uid) return
    await set(ref(rtdb, `calls/${user.uid}`), null)
    setIncomingCall(null)
  }

  if (!incomingCall) return null

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#00A2FF]/20 rounded-full blur-[100px] animate-pulse" />
      
      <div className="relative z-10 flex flex-col items-center space-y-12 text-center">
        <div className="relative">
          <Avatar className="w-32 h-32 border-4 border-[#00A2FF] shadow-2xl ring-4 ring-white/10">
            <AvatarImage src={incomingCall.callerPhoto} />
            <AvatarFallback className="bg-blue-600 text-white text-4xl font-bold">
              {incomingCall.callerName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#00A2FF] px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg">
            Incoming {incomingCall.type}
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-3xl font-black text-white tracking-tight">{incomingCall.callerName}</h2>
          <p className="text-gray-400 font-bold uppercase tracking-[0.3em] text-[10px] animate-pulse">Calling you...</p>
        </div>

        <div className="flex gap-10 items-center">
          <button 
            onClick={handleReject}
            className="w-20 h-20 rounded-full bg-red-500 flex items-center justify-center shadow-2xl shadow-red-500/40 active:scale-90 transition-transform"
          >
            <PhoneOff className="w-8 h-8 text-white fill-current" />
          </button>
          
          <button 
            onClick={handleAccept}
            className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center shadow-2xl shadow-green-500/40 active:scale-90 transition-transform animate-bounce"
          >
            {incomingCall.type === 'video' ? (
              <Video className="w-8 h-8 text-white fill-current" />
            ) : (
              <Phone className="w-8 h-8 text-white fill-current" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
