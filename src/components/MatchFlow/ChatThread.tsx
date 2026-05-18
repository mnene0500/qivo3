
"use client";

import { useRef, useEffect } from "react";
import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { PresenceIndicator } from "./PresenceIndicator";

interface Message {
  id: string;
  sender: string;
  avatar: string;
  content: string;
  timestamp: string;
  isMe?: boolean;
  status?: "online" | "busy" | "away" | "focus";
  media?: string;
}

interface ChatThreadProps {
  messages: Message[];
}

export function ChatThread({ messages }: ChatThreadProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <ScrollArea className="flex-1 px-4 lg:px-8" ref={scrollRef}>
      <div className="max-w-4xl mx-auto py-8 space-y-8">
        {messages.map((message, idx) => (
          <div
            key={message.id}
            className={cn(
              "flex items-start gap-4 group transition-opacity",
              idx === messages.length - 1 ? "animate-in fade-in slide-in-from-bottom-4 duration-500" : ""
            )}
          >
            <div className="relative flex-shrink-0">
              <Avatar className="w-10 h-10 ring-2 ring-background border-2 border-transparent group-hover:border-primary/20 transition-all">
                <AvatarImage src={message.avatar} alt={message.sender} />
                <AvatarFallback>{message.sender[0]}</AvatarFallback>
              </Avatar>
              <PresenceIndicator 
                status={message.status || "online"} 
                className="absolute -bottom-0.5 -right-0.5" 
              />
            </div>
            
            <div className="flex-1 space-y-1.5 overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="text-sm font-headline font-bold text-foreground">
                  {message.sender}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                  {message.timestamp}
                </span>
              </div>
              
              <div className="text-[15px] leading-relaxed text-muted-foreground/90 selection:bg-primary/30">
                {message.content}
              </div>

              {message.media && (
                <div className="mt-4 rounded-xl overflow-hidden border border-border/50 max-w-lg">
                  <Image 
                    src={message.media} 
                    alt="Shared media" 
                    width={800} 
                    height={600} 
                    className="w-full h-auto hover:scale-[1.02] transition-transform cursor-zoom-in"
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
