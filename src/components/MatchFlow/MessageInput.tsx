
"use client";

import { useState, useRef } from "react";
import { Paperclip, SendHorizontal, Image as ImageIcon, Smile, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  onSendMessage: (content: string, media?: string) => void;
  className?: string;
  initialValue?: string;
}

export function MessageInput({ onSendMessage, className, initialValue }: MessageInputProps) {
  const [content, setContent] = useState(initialValue || "");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (content.trim()) {
      onSendMessage(content);
      setContent("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // Simulate file drop
    onSendMessage("Shared a high-resolution workflow capture.", "https://picsum.photos/seed/drop/800/600");
  };

  return (
    <div className={cn("p-4 border-t border-border bg-background/50 backdrop-blur-md", className)}>
      <div 
        className={cn(
          "max-w-4xl mx-auto relative group rounded-2xl border transition-all duration-300",
          isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-border bg-sidebar-accent/30 hover:border-border-foreground/20",
          "liquid-elastic-transition"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex items-end gap-2 p-2 min-h-[56px]">
          <div className="flex items-center gap-1 mb-1">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:text-primary transition-colors">
              <Paperclip className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground hover:text-secondary transition-colors" onClick={() => fileInputRef.current?.click()}>
              <ImageIcon className="w-5 h-5" />
            </Button>
            <input type="file" ref={fileInputRef} className="hidden" />
          </div>

          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isDragging ? "Drop to upload..." : "Type your message or flow..."}
            className="flex-1 min-h-[40px] max-h-[200px] bg-transparent border-none focus-visible:ring-0 resize-none py-3 px-0 text-[15px]"
          />

          <div className="flex items-center gap-1 mb-1">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground">
              <Smile className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-muted-foreground">
              <Mic className="w-5 h-5" />
            </Button>
            <Button 
              size="icon" 
              className="h-9 w-9 rounded-full bg-primary text-primary-foreground hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
              onClick={handleSend}
              disabled={!content.trim()}
            >
              <SendHorizontal className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-2xl pointer-events-none z-10 border-2 border-dashed border-primary">
            <div className="text-primary font-headline font-bold flex flex-col items-center gap-2">
              <ImageIcon className="w-8 h-8 animate-bounce" />
              Multimedia Flux: Release to Upload
            </div>
          </div>
        )}
      </div>
      <p className="text-[10px] text-center text-muted-foreground/60 mt-3 font-medium uppercase tracking-[0.2em]">
        Press Enter to Send • Shift + Enter for New Line
      </p>
    </div>
  );
}
