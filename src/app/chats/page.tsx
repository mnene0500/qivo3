
"use client"

import { useEffect, useState, Suspense, useCallback, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Send, ChevronLeft, Loader2, User, Trash2, MoreVertical, AlertCircle, Gift, Phone, Video, Ban, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useUser } from "@/firebase/auth/use-user"
import { format } from "date-fns"
import { sendGiftAction } from "@/app/actions/matchflow-actions"
import { checkCallBalanceAction } from "@/app/actions/call-actions"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Message {
  id: string | number
  text: string
  sender_id: string
  timestamp: number
  is_gift?: boolean
  is_optimistic?: boolean
}

interface ChatSummary {
  id: string
  partner_id: string
  partner_name: string
  partner_photo: string
  last_message: string
  last_message_at: number
  unread_count: number
  cleared_at?: Record<string, number>
  last_seen_at?: Record<string, number>
}

const GIFTS = [
  { id: 'rose', name: 'Rose', price: 200, icon: '🌹' },
  { id: 'heart', name: 'Heart', price: 500, icon: '❤️' },
  { id: 'diamond', name: 'Diamond', price: 2000, icon: '💎' },
  { id: 'ring', name: 'Ring', price: 5000, icon: '💍' },
]

function ChatsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()
  const { user: currentUser, loading: authLoading, isInitialized } = useUser()
  const startWithId = searchParams.get("startWith")
  
  const [chatId, setChatId] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [chatSummaries, setChatSummaries] = useState<ChatSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [partnerProfile, setPartnerProfile] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [userBalance, setUserBalance] = useState<number>(0)
  const [isSending, setIsSending] = useState(false)
  const [activeChatClearedAt, setActiveChatClearedAt] = useState<number>(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auth Guard
  useEffect(() => {
    if (isInitialized && !authLoading && !currentUser) {
      router.replace("/welcome")
    }
  }, [currentUser, isInitialized, authLoading, router])

  const markAsSeen = async (id: string, customTime?: number) => {
    if (!currentUser?.id) return
    const { data } = await supabase.from('chats').select('last_seen_at').eq('id', id).maybeSingle()
    const newSeenAt = { ...(data?.last_seen_at || {}), [currentUser.id]: customTime || Date.now() }
    await supabase.from('chats').update({ last_seen_at: newSeenAt }).eq('id', id)
  }

  useEffect(() => {
    if (!currentUser?.id) return
    supabase.from('users').select('*').eq('uid', currentUser.id).maybeSingle().then(({ data }) => setUserProfile(data))
    supabase.from('balances').select('coins').eq('user_id', currentUser.id).maybeSingle().then(({ data }) => setUserBalance(Number(data?.coins) || 0))
    
    const balChan = supabase.channel(`my-bal-${currentUser.id}`)
      .on('postgres_changes', { event: 'UPDATE', table: 'balances', filter: `user_id=eq.${currentUser.id}` }, (payload) => {
        setUserBalance(Number(payload.new.coins) || 0)
      }).subscribe()

    return () => { supabase.removeChannel(balChan) }
  }, [currentUser?.id])

  const fetchSummaries = useCallback(async () => {
    if (!currentUser?.id || !userProfile) return
    const { data: chatsData } = await supabase.from('chats').select('*').contains('participant_ids', [currentUser.id]).order('last_message_at', { ascending: false })
    if (chatsData) {
      const blockedUids = new Set([...(userProfile.blocking || []), ...(userProfile.blocked_by || [])]);
      const enhanced = await Promise.all(chatsData.map(async (c) => {
        const pId = c.participant_ids.find((id: string) => id !== currentUser.id)
        if (!pId || blockedUids.has(pId)) return null;
        const { data: p } = await supabase.from('users').select('name, photo_url').eq('uid', pId).maybeSingle()
        return {
          id: c.id,
          partner_id: pId,
          partner_name: p?.name || `User`,
          partner_photo: p?.photo_url || "",
          last_message: c.last_message || "",
          last_message_at: c.last_message_at || Date.now(),
          unread_count: (c.last_seen_at?.[currentUser.id] || 0) < c.last_message_at && c.participant_ids[0] !== currentUser.id ? 1 : 0
        } as ChatSummary
      }))
      setChatSummaries(enhanced.filter(Boolean) as ChatSummary[])
    }
    setLoading(false)
  }, [currentUser?.id, userProfile])

  useEffect(() => {
    if (currentUser?.id && userProfile && !startWithId) {
      fetchSummaries()
      const channel = supabase.channel('chats_realtime').on('postgres_changes', { event: '*', table: 'chats' }, () => fetchSummaries()).subscribe()
      return () => { supabase.removeChannel(channel) }
    }
  }, [currentUser?.id, userProfile, startWithId, fetchSummaries])

  useEffect(() => {
    if (currentUser?.id && startWithId) {
      const ids = [currentUser.id, startWithId].sort()
      const cId = `direct_${ids[0]}_${ids[1]}`
      setChatId(cId)
      markAsSeen(cId)
      supabase.from('users').select('*').eq('uid', startWithId).maybeSingle().then(({ data }) => setPartnerProfile(data))
      supabase.from('chats').select('cleared_at').eq('id', cId).maybeSingle().then(({ data }) => setActiveChatClearedAt(data?.cleared_at?.[currentUser.id] || 0))
    }
  }, [currentUser?.id, startWithId])

  useEffect(() => {
    if (!chatId) return
    const fetchMessages = async () => {
      const { data } = await supabase.from('messages').select('*').eq('chat_id', chatId).gt('timestamp', activeChatClearedAt).order('timestamp', { ascending: false }).limit(50)
      if (data) setMessages(data)
    }
    fetchMessages()
    const channel = supabase.channel(`messages:${chatId}`).on('postgres_changes', { event: 'INSERT', table: 'messages', filter: `chat_id=eq.${chatId}` }, (payload) => {
      const newMsg = payload.new as Message
      if (newMsg.timestamp <= activeChatClearedAt) return
      setMessages(prev => {
        if (prev.some(m => m.text === newMsg.text && Math.abs(m.timestamp - newMsg.timestamp) < 2000)) {
          return prev.map(m => (m.text === newMsg.text && m.is_optimistic) ? newMsg : m)
        }
        return [newMsg, ...prev]
      })
      markAsSeen(chatId)
    }).subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [chatId, activeChatClearedAt])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !chatId || !currentUser?.id || !startWithId) return
    const text = newMessage.trim()
    const timestamp = Date.now()
    const optimisticMsg: Message = { id: `temp-${timestamp}`, text, sender_id: currentUser.id, timestamp, is_optimistic: true }
    
    setMessages(prev => [optimisticMsg, ...prev])
    setNewMessage("")

    const { error } = await supabase.from('messages').insert({ chat_id: chatId, text, sender_id: currentUser.id, timestamp })
    if (!error) {
      await supabase.from('chats').upsert({ id: chatId, last_message: text, last_message_at: timestamp, participant_ids: [currentUser.id, startWithId] })
      await markAsSeen(chatId, timestamp)
    } else {
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id))
      toast({ variant: "destructive", title: "Failed to send" })
    }
  }

  const handleCall = async (type: 'voice' | 'video') => {
    if (!currentUser || !startWithId || !partnerProfile || !chatId) return
    const cost = type === 'video' ? 150 : 70
    if (userProfile?.gender === 'male' && userBalance < cost && !userProfile.is_admin) {
      toast({ variant: "destructive", title: "Insufficient Balance" })
      router.push("/recharge")
      return
    }
    router.push(`/call/${chatId}?type=${type}&partner=${encodeURIComponent(partnerProfile.name)}&partnerId=${startWithId}&caller=true`)
  }

  if (authLoading || !isInitialized) return <div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-[#00A2FF]" /></div>

  if (!startWithId) return (
    <div className="flex-1 bg-white min-h-screen pb-20 select-none">
      <header className="px-6 h-16 flex items-center border-b sticky top-0 bg-white/80 backdrop-blur-md z-50">
        <h1 className="text-3xl font-logo text-[#00A2FF]">Chats</h1>
      </header>
      <main className="flex flex-col">
        {loading ? (<div className="py-20 flex justify-center"><Loader2 className="animate-spin text-[#00A2FF]" /></div>) : chatSummaries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 opacity-40 px-12 text-center">
            <User className="w-12 h-12 mb-4 text-gray-300" />
            <p className="font-bold text-xs uppercase tracking-[0.2em]">No conversations</p>
          </div>
        ) : chatSummaries.map(s => (
          <div key={s.id} onClick={() => router.push(`/chats?startWith=${s.partner_id}`)} className="p-5 border-b flex items-center gap-4 active:bg-gray-50 cursor-pointer">
            <div className="relative">
              <Avatar className="w-14 h-14 border"><AvatarImage src={s.partner_photo} className="object-cover" /><AvatarFallback>{s.partner_name[0]}</AvatarFallback></Avatar>
              {s.unread_count > 0 && <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">NEW</div>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between mb-1">
                <p className="text-sm font-black truncate">{s.partner_name}</p>
                <span className="text-[9px] font-bold text-gray-300 uppercase">{format(s.last_message_at, "HH:mm")}</span>
              </div>
              <p className={cn("text-xs truncate", s.unread_count > 0 ? "font-bold text-black" : "text-gray-400")}>{s.last_message}</p>
            </div>
          </div>
        ))}
      </main>
    </div>
  )

  return (
    <div className="flex flex-col h-screen bg-white select-none overflow-hidden">
      <header className="h-16 border-b flex items-center px-4 gap-4 bg-white z-50">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full"><ChevronLeft className="w-6 h-6 text-black" /></Button>
        <div className="flex items-center gap-3 flex-1">
          <Avatar className="w-10 h-10 border"><AvatarImage src={partnerProfile?.photo_url} className="object-cover" /><AvatarFallback>{partnerProfile?.name?.[0]}</AvatarFallback></Avatar>
          <div><p className="font-black text-sm leading-none">{partnerProfile?.name || '...'}</p><p className="text-[9px] font-bold text-green-500 uppercase tracking-widest mt-1">Available</p></div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => handleCall('voice')} className="rounded-full"><Phone className="w-5 h-5" /></Button>
          <Button variant="ghost" size="icon" onClick={() => handleCall('video')} className="rounded-full"><Video className="w-5 h-5" /></Button>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto p-6 flex flex-col-reverse gap-4 bg-gray-50 no-scrollbar">
        {messages.map(m => (
          <div key={m.id} className={cn("max-w-[80%] p-4 rounded-[2rem] text-sm font-medium shadow-sm animate-in zoom-in-95", m.sender_id === currentUser?.id ? "bg-[#00A2FF] text-white self-end rounded-br-none" : "bg-white text-black self-start rounded-bl-none border")}>
            {m.text}
          </div>
        ))}
      </main>
      <footer className="p-4 border-t bg-white flex gap-2">
        <input value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSendMessage()} className="flex-1 h-12 bg-gray-50 rounded-2xl px-5 text-sm font-bold outline-none" placeholder="Message..." />
        <Button onClick={handleSendMessage} size="icon" className="rounded-full h-12 w-12 bg-[#00A2FF]"><Send className="w-5 h-5" /></Button>
      </footer>
    </div>
  )
}

export default function ChatsPage() { return <Suspense fallback={<div className="h-screen flex items-center justify-center bg-white"><Loader2 className="animate-spin text-[#00A2FF]" /></div>}><ChatsContent /></Suspense> }
