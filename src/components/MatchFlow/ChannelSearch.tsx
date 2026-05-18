
"use client";

import { useState } from "react";
import { Search, Hash, Users, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface Channel {
  id: string;
  name: string;
  members: number;
  description: string;
}

const MOCK_CHANNELS: Channel[] = [
  { id: "1", name: "design-systems", members: 24, description: "Atomic design & UI kits" },
  { id: "2", name: "engineering-flow", members: 56, description: "Daily architecture sync" },
  { id: "3", name: "marketing-strategy", members: 12, description: "Brand & campaigns" },
  { id: "4", name: "general", members: 120, description: "Main announcements" },
  { id: "5", name: "off-topic", members: 45, description: "Coffee & banter" },
];

export function ChannelSearch() {
  const [query, setQuery] = useState("");
  
  const filtered = MOCK_CHANNELS.filter(c => 
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input
          placeholder="Explore channels..."
          className="pl-10 bg-sidebar-accent/50 border-none focus-visible:ring-1 focus-visible:ring-primary h-9 rounded-lg"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      
      <ScrollArea className="h-[250px] pr-4">
        <div className="space-y-2">
          {filtered.map((channel) => (
            <div
              key={channel.id}
              className="group flex items-center justify-between p-3 rounded-lg hover:bg-sidebar-accent/80 cursor-pointer liquid-elastic-transition border border-transparent hover:border-sidebar-border"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center text-primary">
                  <Hash className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-medium leading-none mb-1 group-hover:text-primary transition-colors">
                    {channel.name}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="w-3 h-3" />
                    <span>{channel.members} members</span>
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 h-8 w-8 text-primary">
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-xs text-center text-muted-foreground py-8">No channels found</p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
