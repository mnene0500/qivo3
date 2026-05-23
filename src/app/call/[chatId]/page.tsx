"use client"

import { useEffect, useRef, use, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { useUser } from "@/firebase/auth/use-user"
import { PhoneOff, Mic, MicOff, Video, VideoOff, Loader2, AlertCircle } from "lucide-react"
import { deductCallCoinsAction, checkCallBalanceAction, getZegoConfigAction } from "@/app/actions/call-actions"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function CallPage({ params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useUser()
  const { toast } = useToast()
  
  const containerRef = useRef<HTMLDivElement>(null)
  const zpRef = useRef<any>(null)
  const ringtoneRef = useRef<HTMLAudioElement | null>(null)
  const callStartTimeRef = useRef<number>(0)
  const billingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  const isVideo = searchParams.get('type') !== 'voice'
  const isCaller = searchParams.get('caller') === 'true'
  const partnerName = searchParams.get('partner') || "Partner"
  const partnerId = searchParams.get('partnerId') || ""
  
  const [micEnabled, setMicEnabled] = useState(true)
  const [cameraEnabled, setCameraEnabled] = useState(isVideo)
  const [isConnected, setIsConnected] = useState(false)
  const [configError, setConfigError] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  const stopRingtone = () => {
    if (ringtoneRef.current) {
      ringtoneRef.current.pause()
      ringtoneRef.current.currentTime = 0
    }
  }

  const logCallInChat = async (status: string) => {
    if (!chatId || !user) return
    await supabase.from('messages').insert({ 
      chat_id: chatId, 
      text: status, 
      sender_id: user.id, 
      timestamp: Date.now() 
    })
    await supabase.from('chats').update({ 
      last_message: status, 
      last_message_at: Date.now(),
      participant_ids: [user.id, partnerId] // Ensure I am the last sender
    }).eq('id', chatId)
  }

  const hangUp = () => {
    stopRingtone()
    if (billingIntervalRef.current) clearInterval(billingIntervalRef.current)
    if (zpRef.current) try { zpRef.current.leaveRoom() } catch (e) {}
    
    if (isCaller && !isConnected) {
      supabase.channel(`calls:${partnerId}`).send({ type: 'broadcast', event: 'cancel-call' })
      logCallInChat("[Cancelled]")
    } else if (isConnected) {
      const durationSec = Math.floor((Date.now() - callStartTimeRef.current) / 1000)
      const mins = Math.floor(durationSec / 60)
      const secs = durationSec % 60
      logCallInChat(`[${mins}:${secs.toString().padStart(2, '0')}]`)
    }

    router.replace("/chats")
  }

  // 1. Pre-init: Check Balance and Signaling
  useEffect(() => {
    if (!user || !partnerId) return
    
    const preCheck = async () => {
      // MANDATORY: Must have coins for first minute to even see the calling screen
      if (isCaller) {
        const check = await checkCallBalanceAction(user.id, isVideo ? 'video' : 'voice')
        if (!check.success) {
          toast({ variant: "destructive", title: "Insufficient Balance", description: "Recharge to make this call." })
          router.replace("/recharge")
          return
        }

        ringtoneRef.current = new Audio('/notification.mp3')
        ringtoneRef.current.loop = true
        ringtoneRef.current.play().catch(() => {})
        
        supabase.channel(`calls:${partnerId}`).send({
          type: 'broadcast',
          event: 'incoming-call',
          payload: { 
            chatId, 
            type: isVideo ? 'video' : 'voice', 
            callerId: user.id, 
            callerName: user.user_metadata?.full_name || user.email?.split('@')[0] || "User", 
            callerPhoto: user.user_metadata?.avatar_url 
          }
        })
      }
      setIsInitializing(false)
    }

    preCheck()

    const channel = supabase.channel(`calls:${user.id}`)
      .on('broadcast', { event: 'call-rejected' }, () => { 
        toast({ title: "Call Rejected" })
        hangUp()
      })
      .on('broadcast', { event: 'cancel-call' }, () => { 
        toast({ title: "Caller Cancelled" })
        hangUp()
      })
      .subscribe()

    return () => { 
      supabase.removeChannel(channel)
      stopRingtone() 
    }
  }, [user, partnerId])

  // 2. ZegoCloud Engine Initialization
  useEffect(() => {
    if (!user || !containerRef.current || isInitializing) return
    
    const init = async () => {
      try {
        const config = await getZegoConfigAction()
        if (!config.success) throw new Error("Service Unavailable")
        
        const { ZegoUIKitPrebuilt } = await import('@zegocloud/zego-uikit-prebuilt')
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          config.appId, 
          config.serverSecret, 
          chatId, 
          user.id, 
          user.user_metadata?.full_name || "User"
        )
        
        const zp = ZegoUIKitPrebuilt.create(kitToken)
        zpRef.current = zp
        
        zp.joinRoom({
          container: containerRef.current,
          mode: ZegoUIKitPrebuilt.OneONoneCall,
          showPreJoinView: false,
          turnOnCameraWhenJoining: isVideo,
          turnOnMicrophoneWhenJoining: true,
          onUserJoin: () => {
            setIsConnected(true)
            stopRingtone()
            callStartTimeRef.current = Date.now()
            if (isCaller) startBilling()
          },
          onLeaveRoom: () => hangUp(),
        })
      } catch (err) { 
        setConfigError("Failed to connect to secure line.") 
      }
    }
    init()
  }, [user, chatId, isInitializing])

  const startBilling = () => {
    if (!isCaller) return
    
    // First 10 seconds of 1st minute are free, but we already confirmed balance exists
    setTimeout(async () => {
      if (zpRef.current) {
        // Deduction for Minute 1
        deductCallCoinsAction(user!.id, isVideo ? 'video' : 'voice', partnerId, partnerName)
      }
    }, 11000)

    // Billed at start of every subsequent minute
    // CHECK BALANCE 1 SECOND BEFORE THE MINUTE MARK
    billingIntervalRef.current = setInterval(async () => {
      // PRE-CHECK for next minute
      const check = await checkCallBalanceAction(user!.id, isVideo ? 'video' : 'voice')
      if (!check.success) {
        toast({ variant: "destructive", title: "Balance Exhausted", description: "Ending call automatically." })
        return hangUp()
      }
      // DEDUCT for next minute
      deductCallCoinsAction(user!.id, isVideo ? 'video' : 'voice', partnerId, partnerName)
    }, 60000)
  }

  if (isInitializing) return (
    <div className="h-screen bg-black flex flex-col items-center justify-center text-white">
      <Loader2 className="w-10 h-10 animate-spin text-[#00A2FF]" />
      <p className="text-[10px] font-bold uppercase tracking-widest mt-4">Verifying Balance...</p>
    </div>
  )

  if (configError) return (
    <div className="h-screen bg-black flex flex-col items-center justify-center text-white p-8 text-center space-y-6">
      <AlertCircle className="w-16 h-16 text-red-500 animate-pulse" />
      <h2 className="text-xl font-black uppercase tracking-widest">{configError}</h2>
      <Button onClick={() => router.back()} className="rounded-full h-14 px-10 bg-white text-black font-bold">Return Home</Button>
    </div>
  )

  return (
    <div className="w-full h-screen bg-black relative flex flex-col items-center justify-center overflow-hidden">
      {!isConnected && (
        <div className="absolute inset-0 z-40 bg-black/80 backdrop-blur-2xl flex flex-col items-center justify-center animate-in fade-in duration-700">
          <div className="relative mb-8">
             <div className="w-32 h-32 border-4 border-[#00A2FF]/20 rounded-full animate-pulse" />
             <div className="absolute inset-0 border-4 border-[#00A2FF] border-t-transparent rounded-full animate-spin" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-widest text-white italic">
            {isCaller ? 'Calling...' : 'Secure Connection...'}
          </h2>
          <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-[0.4em]">{partnerName}</p>
        </div>
      )}
      
      <div ref={containerRef} className="w-full h-full" />
      
      {isConnected && (
        <div className="absolute bottom-12 inset-x-0 flex justify-center items-center gap-8 z-50 px-10">
          <button 
            onClick={() => { setMicEnabled(!micEnabled); zpRef.current?.enableMicrophone(!micEnabled); }} 
            className={cn(
              "w-16 h-16 rounded-full backdrop-blur-xl border border-white/20 flex items-center justify-center transition-all shadow-xl", 
              micEnabled ? "bg-white/10 text-white" : "bg-red-500 text-white"
            )}
          >
            {micEnabled ? <Mic /> : <MicOff />}
          </button>
          
          <button 
            onClick={() => hangUp()} 
            className="w-20 h-20 rounded-full bg-red-600 flex items-center justify-center shadow-2xl active:scale-90 transition-transform"
          >
            <PhoneOff className="text-white w-8 h-8" />
          </button>
          
          {isVideo && (
            <button 
              onClick={() => { setCameraEnabled(!cameraEnabled); zpRef.current?.enableCamera(!cameraEnabled); }} 
              className={cn(
                "w-16 h-16 rounded-full backdrop-blur-xl border border-white/20 flex items-center justify-center transition-all shadow-xl", 
                cameraEnabled ? "bg-white/10 text-white" : "bg-red-500 text-white"
              )}
            >
              {cameraEnabled ? <Video /> : <VideoOff />}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
