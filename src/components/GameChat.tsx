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
}

export function GameChat({ roomId, playerId, playerName, themeId = 'classic' }: GameChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isOpenRef = useRef(isOpen);
  const theme = getTheme(themeId);

  // Keep ref in sync with state
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // Debug: log when chat component mounts
  useEffect(() => {
    console.log('GameChat component mounted for room:', roomId);
    return () => console.log('GameChat component unmounted');
  }, [roomId]);

  useEffect(() => {
    let isSubscribed = true;

    // Fetch existing messages
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('game_chat')
        .select('*')
        .eq('room_id', roomId)
        .order('created_at', { ascending: true });

      if (error) {
        // Only log actual errors, not "no rows" errors
        if (error.code !== 'PGRST116') {
          console.error('Error fetching chat messages:', error);
        }
      } else if (data && isSubscribed) {
        setMessages(data);
      }
    };

    fetchMessages();

    // Subscribe to new messages
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
            // Prevent duplicate messages
            if (prev.some(m => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          if (!isOpenRef.current) {
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Chat channel subscribed successfully');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Chat channel subscription error');
        }
      });

    return () => {
      isSubscribed = false;
      supabase.removeChannel(channel);
    };
  }, [roomId]); // Remove isOpen from dependencies to prevent re-subscriptions

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

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

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {isOpen && (
        <div
          className="mb-4 w-80 h-[450px] rounded-2xl shadow-2xl flex flex-col border overflow-hidden animate-in slide-in-from-bottom-4 duration-300"
          style={{ backgroundColor: theme.cardBg, borderColor: theme.lineColor + '20' }}
        >
          {/* Header */}
          <div
            className="px-4 py-3 flex items-center justify-between border-b"
            style={{ backgroundColor: theme.headerBg, borderColor: theme.lineColor + '10' }}
          >
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" style={{ color: theme.accentColor }} />
              <span className="font-bold" style={{ color: theme.lineColor }}>Game Chat</span>
            </div>
            <button
              onClick={toggleChat}
              className="p-1 rounded-full hover:bg-black/10 transition-colors"
            >
              <X className="w-5 h-5" style={{ color: theme.lineColor }} />
            </button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.player_id === playerId ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-50" style={{ color: theme.lineColor }}>
                      {msg.player_id === playerId ? 'You' : msg.player_name}
                    </span>
                  </div>
                  <div
                    className={`px-3 py-2 rounded-2xl max-w-[90%] text-sm shadow-sm ${msg.player_id === playerId
                      ? 'rounded-tr-none'
                      : 'rounded-tl-none'
                      }`}
                    style={{
                      backgroundColor: msg.player_id === playerId ? theme.accentColor : theme.lineColor + '10',
                      color: msg.player_id === playerId ? '#fff' : theme.lineColor
                    }}
                  >
                    {msg.message}
                  </div>
                </div>
              ))}
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center py-10 opacity-30 text-center px-4">
                  <MessageCircle className="w-12 h-12 mb-2" style={{ color: theme.lineColor }} />
                  <p className="text-sm font-medium" style={{ color: theme.lineColor }}>No messages yet. Say hello!</p>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 border-t flex gap-2"
            style={{ backgroundColor: theme.headerBg, borderColor: theme.lineColor + '10' }}
          >
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="h-10 border-0 focus-visible:ring-1 focus-visible:ring-offset-0 bg-white/5"
              style={{
                backgroundColor: theme.lineColor + '05',
                color: theme.lineColor,
                borderColor: theme.lineColor + '10'
              }}
            />
            <Button
              type="submit"
              size="icon"
              className="h-10 w-10 shrink-0"
              style={{ backgroundColor: theme.accentColor }}
            >
              <Send className="w-4 h-4 text-white" />
            </Button>
          </form>
        </div>
      )}

      <Button
        onClick={toggleChat}
        className="w-14 h-14 rounded-full shadow-2xl relative transition-transform hover:scale-105 active:scale-95 animate-bounce-slow"
        style={{ backgroundColor: theme.accentColor }}
        aria-label="Open chat"
      >
        <MessageCircle className="w-6 h-6 text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>
    </div>
  );
}
