
"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "@/components/MatchFlow/Sidebar";
import { ChatThread } from "@/components/MatchFlow/ChatThread";
import { MessageInput } from "@/components/MatchFlow/MessageInput";
import { FlowIntelligence } from "@/components/MatchFlow/FlowIntelligence";
import { Hash, Users, Pin, Search, Bell, Info, Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Toaster } from "@/components/ui/toaster";

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

const INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    sender: "Alex Rivera",
    avatar: "https://picsum.photos/seed/user1/100/100",
    content: "Hey team, just finished the wireframes for the new workflow dashboard. What do you think about the asymmetric layout?",
    timestamp: "10:42 AM",
    status: "online"
  },
  {
    id: "2",
    sender: "Sarah Chen",
    avatar: "https://picsum.photos/seed/user2/100/100",
    content: "I love it! The focused center thread really helps keep eyes on the conversation. Did you use the electric indigo for the primary buttons?",
    timestamp: "10:45 AM",
    status: "focus"
  },
  {
    id: "3",
    sender: "Marcus Wright",
    avatar: "https://picsum.photos/seed/user3/100/100",
    content: "Just jumping in. I've shared some initial feedback on the media flux component. Drag-and-drop feels very smooth.",
    timestamp: "10:50 AM",
    status: "busy",
    media: "https://picsum.photos/seed/workspace/800/600"
  }
];

export default function MatchFlowApp() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [showFlowIntelligence, setShowFlowIntelligence] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSendMessage = (content: string, media?: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: "You",
      avatar: "https://picsum.photos/seed/me/100/100",
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true,
      status: "online",
      media
    };
    setMessages([...messages, newMessage]);
  };

  if (!mounted) return null;

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      
      <main className="flex-1 flex flex-col relative min-w-0">
        {/* Thread Header */}
        <header className="h-16 border-b border-border flex items-center justify-between px-6 bg-background/80 backdrop-blur-xl z-30">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-sidebar-accent flex items-center justify-center text-primary border border-primary/20">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-headline font-bold text-foreground leading-none">design-sync</h2>
                <Pin className="w-3 h-3 text-primary rotate-45" />
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-medium mt-1">
                <Users className="w-3 h-3" />
                <span>24 Members</span>
                <span className="opacity-30">•</span>
                <span>Atomic design & UI kits flow</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search thread..." 
                className="pl-9 h-9 w-64 bg-sidebar-accent/50 border-none focus-visible:ring-1 focus-visible:ring-primary rounded-full text-sm"
              />
            </div>
            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
              <Bell className="w-5 h-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn("text-muted-foreground hover:text-primary transition-colors", showFlowIntelligence && "text-primary bg-primary/5")}
              onClick={() => setShowFlowIntelligence(!showFlowIntelligence)}
            >
              <Info className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Dynamic Layout: Center Thread + Intelligence Panel */}
        <div className="flex-1 flex overflow-hidden">
          <ChatThread messages={messages} />

          {/* Collapsible Intelligence Panel */}
          {showFlowIntelligence && (
            <aside className="w-80 border-l border-border bg-sidebar-background/30 backdrop-blur-sm hidden xl:block p-6 animate-in slide-in-from-right duration-300">
              <div className="flex flex-col gap-6 h-full">
                <div className="flex items-center gap-2">
                  <Workflow className="w-5 h-5 text-primary" />
                  <h3 className="text-sm font-headline font-bold uppercase tracking-wider">Flow Intelligence</h3>
                </div>
                
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Real-time analysis active. AI reasoning tools are ready to optimize your connectivity and summarize high-density logs.
                </p>

                <FlowIntelligence 
                  messages={messages.map(m => ({ role: m.isMe ? 'user' : 'model', content: m.content }))} 
                  onSelectSuggestion={(txt) => handleSendMessage(txt)}
                />

                <div className="mt-auto p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-[10px] font-bold uppercase text-primary">Live Context indexing</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    All messages are securely indexed and retrieved for session persistence.
                  </p>
                </div>
              </div>
            </aside>
          )}
        </div>

        {/* Global Floating AI Component for Mobile/Compact */}
        <div className="md:hidden p-4">
           <FlowIntelligence 
             messages={messages.map(m => ({ role: m.isMe ? 'user' : 'model', content: m.content }))} 
             onSelectSuggestion={(txt) => handleSendMessage(txt)}
           />
        </div>

        <MessageInput onSendMessage={handleSendMessage} />
      </main>
      <Toaster />
    </div>
  );
}
