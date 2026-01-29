"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageCircle, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getTheme } from "@/lib/themes";

interface Message {
  id: string;
  room_id: string;
  player_id: string;
  player_name: string;
  message: string;
  created_at: string;
}

interface GameChatProps {
  roomId: string;
  playerId: string;
  playerName: string;
  themeId?: string;
  isOpen: boolean;
  onClose: () => void;
  onUnreadChange?: (count: number) => void;
  variant?: 'drawer' | 'inline';
}

export function GameChat({
  roomId,
  playerId,
  playerName,
  themeId = 'classic',
  isOpen,
  onClose,
  onUnreadChange,
  variant = 'drawer'
}: GameChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const theme = getTheme(themeId);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  // Reset unread count when chat is opened
  useEffect(() => {
    if (isOpen) {
      setUnreadCount(0);
      onUnreadChange?.(0);
    }
  }, [isOpen, onUnreadChange]);

  // Fetch and subscribe to messages
  useEffect(() => {
    let isSubscribed = true;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('game_chat')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching chat messages:', error);
      } else if (data && isSubscribed) {
        setMessages(data);
      }
    };

    fetchMessages();

    const channel = supabase
      .channel(`chat:${roomId}`, {
        config: {
          broadcast: { self: true },
        },
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'game_chat',
          filter: `room_id=eq.${roomId}`
        },
        (payload) => {
          if (!isSubscribed) return;
          const msg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });

          if (!isOpen && variant === 'drawer') {
            setUnreadCount((prev) => {
              const newCount = prev + 1;
              onUnreadChange?.(newCount);
              return newCount;
            });
          }
        }
      )
      .subscribe();

    return () => {
      isSubscribed = false;
      supabase.removeChannel(channel);
    };
  }, [roomId, isOpen, onUnreadChange, variant]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageToSend = newMessage.trim();
    setNewMessage("");

    const { error } = await supabase.from('game_chat').insert({
      room_id: roomId,
      player_id: playerId,
      player_name: playerName,
      message: messageToSend
    });

    if (error) {
      console.error('Error sending message:', error);
    }
  };

  if (variant === 'inline') {
    return (
      <div className="flex flex-col h-full w-full bg-transparent">
        {/* Messages Area */}
        <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.player_id === playerId ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-50" style={{ color: theme.textColor }}>
                    {msg.player_id === playerId ? 'You' : msg.player_name}
                  </span>
                </div>
                <div
                  className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm shadow-sm ${msg.player_id === playerId
                    ? 'rounded-tr-none'
                    : 'rounded-tl-none'
                    }`}
                  style={{
                    background: msg.player_id === playerId
                      ? (theme.chatGradient || theme.accentColor)
                      : theme.lineColor + '10',
                    color: msg.player_id === playerId ? '#fff' : theme.textColor
                  }}
                >
                  {msg.message}
                </div>
              </div>
            ))}
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center py-20 opacity-30 text-center px-4">
                <MessageCircle className="w-16 h-16 mb-4" style={{ color: theme.textColor }} />
                <p className="text-base font-medium" style={{ color: theme.textColor }}>No messages yet. Say hello!</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <form
          onSubmit={handleSendMessage}
          className="p-4 border-t flex gap-3 shrink-0"
          style={{ borderColor: theme.lineColor + '10' }}
        >
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="h-10 border-0 focus-visible:ring-2 focus-visible:ring-offset-0 rounded-xl"
            style={{
              backgroundColor: theme.lineColor + '05',
              color: theme.textColor,
              borderColor: theme.lineColor + '10'
            }}
          />
          <Button
            type="submit"
            size="icon"
            className="h-10 w-10 shrink-0 rounded-xl shadow-lg"
            style={{ background: theme.chatGradient || theme.accentColor }}
          >
            <Send className="w-4 h-4 text-white" />
          </Button>
        </form>
      </div>
    );
  }

  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-[60] transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* Chat Panel - Chess.com style Slide-up */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[70] transition-all duration-300 ease-out flex flex-col"
        style={{
          height: '70vh',
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          backgroundColor: theme.cardBg,
          borderTopLeftRadius: '20px',
          borderTopRightRadius: '20px',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header with Close Button */}
        <div
          className="flex items-center justify-between px-4 py-4 border-b shrink-0"
          style={{ backgroundColor: theme.headerBg, borderColor: theme.lineColor + '10' }}
        >
          <div className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" style={{ color: theme.accentColor }} />
            <span className="font-bold text-base" style={{ color: theme.textColor }}>Chat</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-black/10"
          >
            <X className="w-5 h-5" style={{ color: theme.textColor }} />
          </Button>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef}>
          <div className="space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.player_id === playerId ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider opacity-50" style={{ color: theme.textColor }}>
                    {msg.player_id === playerId ? 'You' : msg.player_name}
                  </span>
                </div>
                <div
                  className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm shadow-sm ${msg.player_id === playerId
                    ? 'rounded-tr-none'
                    : 'rounded-tl-none'
                    }`}
                  style={{
                    background: msg.player_id === playerId
                      ? (theme.chatGradient || theme.accentColor)
                      : theme.lineColor + '10',
                    color: msg.player_id === playerId ? '#fff' : theme.textColor
                  }}
                >
                  {msg.message}
                </div>
              </div>
            ))}
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center py-20 opacity-30 text-center px-4">
                <MessageCircle className="w-16 h-16 mb-4" style={{ color: theme.textColor }} />
                <p className="text-base font-medium" style={{ color: theme.textColor }}>No messages yet. Say hello!</p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <form
          onSubmit={handleSendMessage}
          className="p-4 border-t flex gap-3 shrink-0"
          style={{ backgroundColor: theme.headerBg, borderColor: theme.lineColor + '10' }}
        >
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="h-12 border-0 focus-visible:ring-2 focus-visible:ring-offset-0 rounded-xl"
            style={{
              backgroundColor: theme.lineColor + '05',
              color: theme.textColor,
              borderColor: theme.lineColor + '10'
            }}
          />
          <Button
            type="submit"
            size="icon"
            className="h-12 w-12 shrink-0 rounded-xl shadow-lg"
            style={{ background: theme.chatGradient || theme.accentColor }}
          >
            <Send className="w-5 h-5 text-white" />
          </Button>
        </form>
      </div>
    </>
  );
}
