
"use client";

import { useState } from "react";
import { Sparkles, X, MessageSquareQuote, Loader2, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { summarizeChatHistory } from "@/ai/flows/chat-history-summarizer";
import { suggestChatResponses } from "@/ai/flows/suggested-chat-responses";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface FlowIntelligenceProps {
  messages: Message[];
  onSelectSuggestion: (text: string) => void;
}

export function FlowIntelligence({ messages, onSelectSuggestion }: FlowIntelligenceProps) {
  const [summary, setSummary] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const { toast } = useToast();

  const handleSummarize = async () => {
    if (messages.length === 0) return;
    setIsLoadingSummary(true);
    try {
      const historyStr = messages.map(m => `${m.role}: ${m.content}`).join('\n');
      const result = await summarizeChatHistory({ chatHistory: historyStr });
      setSummary(result.summary);
    } catch (error) {
      toast({ variant: "destructive", title: "Summarization failed", description: "AI could not process history." });
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const handleSuggest = async () => {
    setIsLoadingSuggestions(true);
    try {
      const result = await suggestChatResponses({
        chatHistory: messages.slice(-5).map(m => ({ role: m.role, content: m.content }))
      });
      setSuggestions(result.suggestions);
    } catch (error) {
      toast({ variant: "destructive", title: "Suggestions failed", description: "AI could not generate responses." });
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 border-primary/20 bg-primary/5 hover:bg-primary/10 text-primary h-8"
          onClick={handleSummarize}
          disabled={isLoadingSummary}
        >
          {isLoadingSummary ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          Summarize
        </Button>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2 border-secondary/20 bg-secondary/5 hover:bg-secondary/10 text-secondary h-8"
          onClick={handleSuggest}
          disabled={isLoadingSuggestions}
        >
          {isLoadingSuggestions ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
          Suggest Responses
        </Button>
      </div>

      {summary && (
        <Card className="bg-card/50 border-primary/10 overflow-hidden liquid-elastic-transition animate-in fade-in slide-in-from-top-2">
          <CardHeader className="p-3 bg-primary/10 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
              <MessageSquareQuote className="w-3.5 h-3.5 text-primary" />
              Intelligence Summary
            </CardTitle>
            <Button variant="ghost" size="icon" className="h-4 w-4" onClick={() => setSummary(null)}>
              <X className="w-3 h-3" />
            </Button>
          </CardHeader>
          <CardContent className="p-3 text-sm text-muted-foreground leading-relaxed">
            {summary}
          </CardContent>
        </Card>
      )}

      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2">
          {suggestions.map((s, idx) => (
            <Button
              key={idx}
              variant="secondary"
              size="sm"
              className="h-7 text-xs rounded-full bg-secondary/10 hover:bg-secondary/20 text-secondary border border-secondary/20"
              onClick={() => {
                onSelectSuggestion(s);
                setSuggestions([]);
              }}
            >
              {s}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}
