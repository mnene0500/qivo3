"use client"

import { useMemo, use, useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { 
  ChevronLeft, 
  MessageSquare, 
  MoreHorizontal, 
  BadgeCheck,
  Ban,
  Flag,
  X,
  GraduationCap,
  Heart,
  Globe,
  Copy,
  Check,
  LayoutGrid,
  Loader2,
  Quote,
  Sparkles,
  MapPin
} from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { useUserPresence } from "@/hooks/use-presence"
import { useUser } from "@/firebase/auth/use-user"

interface UserProfile {
  uid: string
  name: string
  photo_url: string
  additional_photos?: string[]
  country: string
  gender: string
  dob: string
  interests?: string
  match_flow_id?: string
  is_verified?: boolean
  blocking?: string[]
  education_level?: string
  looking_for?: string
}

export default function UserDetailPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = use(params)
  const router = useRouter()
  const { user: currentUser } = useUser()
  const { toast } = useToast()
  const presence = useUserPresence(userId)

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [myProfile, setMyProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isPhotoOpen, setIsPhotoOpen] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!currentUser?.id) return
    Promise.all([
      supabase.from('users').select('*').eq('uid', userId).single(),
      supabase.from('users').select('blocking, blocked_by').eq('uid', currentUser.id).single()
    ]).then(([{ data: target }, { data: me }]) => {
      if (target) setProfile(target)
      if (me) setMyProfile(me)
      setLoading(false)
    })
  }, [userId, currentUser?.id])

  const calculateAge = (dob: string) => {
    if (!dob) return "21"
    const birthDate = new Date(dob)
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    const m = today.getMonth() - birthDate.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
    return age
  }

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (profile?.match_flow_id) {
      navigator.clipboard.writeText(profile.match_flow_id)
      setCopied(true)
      toast({ title: "ID Copied" })
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleBlock = async () => {
    if (!currentUser || !profile) return
    const { data: myData } = await supabase.from('users').select('blocking').eq('uid', currentUser.id).single()
    const myBlocking = Array.from(new Set([...(myData?.blocking || []), profile.uid]))
    await supabase.from('users').update({ blocking: myBlocking }).eq('uid', currentUser.id)
    const { data: targetData } = await supabase.from('users').select('blocked_by').eq('uid', profile.uid).single()
    const targetBlockedBy = Array.from(new Set([...(targetData?.blocked_by || []), currentUser.id]))
    await supabase.from('users').update({ blocked_by: targetBlockedBy }).eq('uid', profile.uid)
    toast({ title: "User Blocked" })
    router.push("/home")
  }

  const handleReport = () => {
    toast({ title: "Report Submitted", description: "We will review this profile for any violations." })
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <Loader2 className="w-8 h-8 animate-spin text-[#00A2FF]" />
    </div>
  )

  if (!profile) return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white p-8 text-center space-y-4">
      <div className="bg-gray-100 p-6 rounded-full"><Ban className="w-10 h-10 text-gray-400" /></div>
      <h2 className="text-xl font-bold text-black">Profile Not Found</h2>
      <Button onClick={() => router.back()} variant="outline" className="rounded-full">Go Back</Button>
    </div>
  )

  const isBlocked = myProfile && (
    (myProfile.blocking || []).includes(profile.uid) || 
    (myProfile.blocked_by || []).includes(profile.uid)
  );

  const age = calculateAge(profile.dob)
  const allPhotos = Array.from(new Set([profile.photo_url, ...(profile.additional_photos || [])].filter(Boolean)));

  return (
    <div className="flex-1 bg-[#F9FAFB] flex flex-col min-h-screen pb-40 select-none overflow-x-hidden">
      {/* CINEMATIC HERO IMAGE */}
      <div className="relative h-[60vh] w-full cursor-pointer overflow-hidden group" onClick={() => { setSelectedPhoto(profile.photo_url); setIsPhotoOpen(true); }}>
        <Image 
          src={profile.photo_url || ""} 
          alt={profile.name} 
          fill 
          className="object-cover animate-in fade-in zoom-in-105 duration-1000 group-hover:scale-110 transition-transform duration-700" 
          priority 
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#F9FAFB] via-transparent to-black/30" />
        
        {/* TOP OVERLAY BUTTONS */}
        <div className="absolute top-12 inset-x-0 px-6 flex justify-between items-center z-20" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full bg-white/10 backdrop-blur-xl text-white w-12 h-12 border border-white/20 shadow-2xl active:scale-90 transition-all hover:bg-white/20"><ChevronLeft className="w-7 h-7" /></Button>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="rounded-full bg-white/10 backdrop-blur-xl text-white w-12 h-12 border border-white/20 shadow-2xl active:scale-90 transition-all hover:bg-white/20"><MoreHorizontal className="w-7 h-7" /></Button></DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-[2rem] min-w-[180px] p-2 border-none shadow-2xl">
                <DropdownMenuItem onClick={handleBlock} className="rounded-2xl h-12 text-red-500 font-bold gap-3 px-4"><Ban className="w-5 h-5" /> Block User</DropdownMenuItem>
                <DropdownMenuItem onClick={handleReport} className="rounded-2xl h-12 font-bold gap-3 px-4"><Flag className="w-5 h-5 text-gray-400" /> Report</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* PRESENCE BADGE */}
        {presence?.state === 'online' && !isBlocked && (
          <div className="absolute bottom-16 left-8 bg-green-500/90 backdrop-blur-md text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-xl flex items-center gap-2 animate-in slide-in-from-left-4 duration-500">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />Live Online
          </div>
        )}
      </div>

      {/* CONTENT SHEET */}
      <div className="relative z-10 bg-white px-8 -mt-10 rounded-t-[3rem] pt-12 space-y-12 shadow-[0_-25px_60px_rgba(0,0,0,0.08)] pb-10">
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-black text-black tracking-tighter leading-none">{profile.name}</h1>
              {profile.is_verified && <div className="bg-[#00A2FF]/10 p-1.5 rounded-full"><BadgeCheck className="w-6 h-6 text-[#00A2FF] fill-white" /></div>}
            </div>
            <div className="flex items-center gap-2 text-gray-400">
              <div className="flex items-center gap-1 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                <MapPin className="w-3 h-3 text-[#00A2FF]" />
                <span className="text-[10px] font-black uppercase tracking-widest">{profile.country || "GLOBAL"}</span>
              </div>
              <div className="flex items-center gap-1 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                <Sparkles className="w-3 h-3 text-[#00A2FF]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-[#00A2FF]">Top Match</span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-black text-white px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl flex items-center gap-2">
              <span className="text-sm">{profile.gender === 'female' ? '♀' : '♂'}</span>
              <span>{age} Years</span>
            </div>
            <button 
              onClick={handleCopyId} 
              className="bg-gray-50 hover:bg-gray-100 text-gray-500 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-gray-100 flex items-center gap-2 active:scale-95 transition-all"
            >
              ID: {profile.match_flow_id || "---"}
              {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5 opacity-40" />}
            </button>
          </div>
        </div>

        {/* BIO SECTION */}
        {profile.interests && (
          <section className="space-y-4">
             <div className="flex items-center gap-2 text-gray-900">
               <Quote className="w-4 h-4 text-[#00A2FF] rotate-180" />
               <span className="text-[11px] font-black uppercase tracking-[0.2em]">Bio & Interests</span>
             </div>
             <div className="bg-gray-50/70 p-8 rounded-[2.5rem] border border-black/5 relative overflow-hidden">
                <Quote className="absolute -right-4 -bottom-4 w-24 h-24 text-black/5 pointer-events-none" />
                <p className="text-base font-medium text-gray-700 leading-relaxed italic relative z-10 select-text">
                  "{profile.interests}"
                </p>
             </div>
          </section>
        )}

        {/* GALLERY GRID */}
        {allPhotos.length > 1 && (
          <section className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2 text-gray-900">
                <LayoutGrid className="w-4 h-4 text-[#00A2FF]" />
                <span className="text-[11px] font-black uppercase tracking-[0.2em]">Visual Gallery</span>
              </div>
              <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">{allPhotos.length} Photos</span>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {allPhotos.map((url, i) => (
                <div 
                  key={url} 
                  className="relative aspect-square rounded-[1.5rem] overflow-hidden cursor-pointer border-2 border-gray-100 shadow-sm active:scale-95 transition-all" 
                  onClick={() => { setSelectedPhoto(url); setIsPhotoOpen(true); }}
                >
                  <Image src={url} alt={`Photo ${i}`} fill className="object-cover" sizes="25vw" />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* DETAILS GRID */}
        <div className="grid grid-cols-1 gap-4 pb-12">
          <DetailItem icon={Globe} label="Region" value={profile.country || "Not specified"} color="bg-emerald-50 text-emerald-600" />
          <DetailItem icon={GraduationCap} label="Academic" value={profile.education_level || "Not specified"} color="bg-purple-50 text-purple-600" />
          <DetailItem icon={Heart} label="Intentions" value={profile.looking_for || "Exploring"} color="bg-rose-50 text-rose-600" />
        </div>
      </div>

      {/* FULL SCREEN PHOTO MODAL */}
      {isPhotoOpen && selectedPhoto && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center animate-in fade-in duration-300" onClick={() => setIsPhotoOpen(false)}>
          <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setIsPhotoOpen(false); }} className="absolute top-12 right-6 rounded-full bg-white/10 text-white w-14 h-14 z-[110] hover:bg-white/20 transition-all"><X className="w-8 h-8 stroke-[3]" /></Button>
          <div className="relative w-full h-full p-4 flex items-center justify-center">
            <Image src={selectedPhoto} alt="Full screen" fill className="object-contain" priority sizes="100vw" />
          </div>
        </div>
      )}

      {/* FIXED BOTTOM ACTION */}
      <div className="fixed bottom-0 inset-x-0 p-8 bg-gradient-to-t from-white via-white/95 to-transparent z-50">
        <Button 
          disabled={isBlocked}
          className={cn(
            "w-full h-20 rounded-[2.5rem] text-white text-base font-black flex items-center justify-center gap-4 shadow-[0_20px_50px_rgba(0,162,255,0.3)] uppercase tracking-[0.2em] active:scale-95 transition-all",
            isBlocked ? "bg-gray-200 shadow-none cursor-not-allowed text-gray-400" : "bg-[#00A2FF] hover:bg-[#0081CC] border-none"
          )} 
          onClick={() => router.push(`/chats?startWith=${profile.uid}`)}
        >
          {isBlocked ? <><Ban className="w-6 h-6" /> Blocked</> : <><MessageSquare className="w-6 h-6 fill-white" />Send Message</>}
        </Button>
      </div>
    </div>
  )
}

function DetailItem({ icon: Icon, label, value, color }: { icon: any, label: string, value: string, color: string }) {
  return (
    <div className="flex items-center gap-6 bg-white p-6 rounded-[2.5rem] border border-black/[0.03] shadow-sm hover:shadow-md transition-shadow">
      <div className={cn("w-14 h-14 rounded-[1.5rem] flex items-center justify-center shrink-0 shadow-inner", color)}>
        <Icon className="w-7 h-7" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">{label}</p>
        <p className="text-[15px] font-black text-black truncate tracking-tight">{value}</p>
      </div>
    </div>
  )
}
