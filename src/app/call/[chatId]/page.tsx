
"use client"

import { useEffect, useRef, use } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useUser, useDoc, useFirestore } from "@/firebase"
import { doc } from "firebase/firestore"
import { Loader2 } from "lucide-react"

/**
 * @fileOverview One-on-one Video/Voice call interface using ZegoCloud.
 */
export default function CallPage({ params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = use(params)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useUser()
  const db = useFirestore()
  const containerRef = useRef<HTMLDivElement>(null)
  
  const isVideo = searchParams.get('type') !== 'voice'
  const { data: profile } = useDoc<any>(user?.uid ? doc(db, "users", user.uid) : null)

  useEffect(() => {
    if (!user || !profile || !containerRef.current) return

    const initCall = async () => {
      const { ZegoUIKitPrebuilt } = await import('@zegocloud/zego-uikit-prebuilt')
      
      const appID = Number(process.env.NEXT_PUBLIC_ZEGO_APP_ID)
      // In production, generate this token on the server. For prototyping, we use the kit's internal method.
      const serverSecret = "ea06598c894f6f874530007d468f7004" // REPLACEME: Use env in production
      
      const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
        appID,
        serverSecret,
        chatId,
        user.uid,
        profile.name || "User"
      )

      const zp = ZegoUIKitPrebuilt.create(kitToken)
      
      zp.joinRoom({
        container: containerRef.current,
        mode: ZegoUIKitPrebuilt.OneONoneCall,
        showPreJoinView: false,
        scenario: {
          mode: isVideo ? ZegoUIKitPrebuilt.VideoCall : ZegoUIKitPrebuilt.VoiceCall,
        },
        onLeaveRoom: () => {
          router.replace("/chats")
        },
      })
    }

    initCall()
  }, [user, profile, chatId, isVideo, router])

  if (!user || !profile) {
    return (
      <div className="flex-1 bg-black flex flex-col items-center justify-center text-white">
        <Loader2 className="w-10 h-10 animate-spin text-[#00A2FF]" />
        <p className="mt-4 font-bold uppercase tracking-widest text-[10px]">Joining Call...</p>
      </div>
    )
  }

  return (
    <div className="w-full h-screen bg-black overflow-hidden relative">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}
