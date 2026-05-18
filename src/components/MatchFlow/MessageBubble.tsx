"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card } from "@/components/ui/card"
import { FileText, PlayCircle } from "lucide-react"

export interface Message {
  id: string
  senderId: string
  senderName: string
  senderAvatar: string
  content: string
  timestamp: string
  isMe: boolean
  type?: "text" | "image" | "video" | "file"
  mediaUrl?: string
}

interface MessageBubbleProps {
  message: Message
}

/**
 * @fileOverview Cinematic message bubble with support for multiple media types.
 */
export function MessageBubble({ message }: MessageBubbleProps) {
  return (
    <div className={cn(
      "flex w-full gap-3 mb-4 group bubble-enter",
      message.isMe ? "flex-row-reverse" : "flex-row"
    )}>
      <Avatar className="h-8 w-8 mt-1 border border-black/5 shadow-sm">
        <AvatarImage src={message.senderAvatar} className="object-cover" />
        <AvatarFallback className="bg-gray-100 text-gray-400 text-[10px] font-bold">
          {message.senderName?.[0] || "?"}
        </AvatarFallback>
      </Avatar>
      
      <div className={cn(
        "flex flex-col max-w-[75%] md:max-w-[60%]",
        message.isMe ? "items-end" : "items-start"
      )}>
        {!message.isMe && (
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 ml-1">
            {message.senderName}
          </span>
        )}
        
        <Card className={cn(
          "px-4 py-3 shadow-md relative liquid-elastic-transition overflow-hidden",
          message.isMe 
            ? "bg-[#00A2FF] text-white rounded-tr-none border-none" 
            : "bg-white text-black rounded-tl-none border border-black/5"
        )}>
          {message.type === "image" && message.mediaUrl && (
            <div className="mb-2 -mx-2 -mt-1 rounded-xl overflow-hidden">
              <Image 
                src={message.mediaUrl} 
                alt="Shared content" 
                width={400} 
                height={300} 
                className="object-cover w-full h-auto hover:scale-105 transition-transform duration-500"
                data-ai-hint="shared image"
              />
            </div>
          )}
          
          {message.type === "video" && (
            <div className="mb-2 -mx-2 -mt-1 aspect-video bg-black/20 flex items-center justify-center rounded-xl cursor-pointer hover:bg-black/30 transition-colors group/video">
              <PlayCircle className="h-12 w-12 text-white/80 group-hover/video:scale-110 transition-transform" />
            </div>
          )}

          {message.type === "file" && (
            <div className="mb-2 p-3 bg-black/5 rounded-xl flex items-center gap-3 border border-black/5">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <FileText className="h-4 w-4 text-[#00A2FF]" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold truncate max-w-[120px]">Document.pdf</span>
                <span className="text-[8px] font-medium opacity-50 uppercase">1.2 MB</span>
              </div>
            </div>
          )}

          <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </Card>
        
        <span className="text-[8px] font-bold text-gray-300 uppercase tracking-widest mt-1 px-1">
          {message.timestamp}
        </span>
      </div>
    </div>
  )
}