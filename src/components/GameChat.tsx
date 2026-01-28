"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
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
  const [panelState, setPanelState] = useState<'closed' | 'peek' | 'full'>('closed');
  const [unreadCount, setUnreadCount] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);
  const theme = getTheme(themeId);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, panelState]);

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
          if (panelState === 'closed') {
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      isSubscribed = false;
      supabase.removeChannel(channel);
    };
  }, [roomId, panelState]);

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

  const togglePanel = () => {
    if (panelState === 'closed') {
      setPanelState('peek');
      setUnreadCount(0);
    } else if (panelState === 'peek') {
      setPanelState('full');
    } else {
      setPanelState('closed');
    }
  };

  const closePanel = () => {
    setPanelState('closed');
  };

  // Touch handlers for swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    startY.current = e.touches[0].clientY;
    currentY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    currentY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    const deltaY = currentY.current - startY.current;

    if (deltaY > 50) {
      // Swipe down
      if (panelState === 'full') {
        setPanelState('peek');
      } else if (panelState === 'peek') {
        setPanelState('closed');
      }
    } else if (deltaY < -50) {
      // Swipe up
      if (panelState === 'closed') {
        setPanelState('peek');
        setUnreadCount(0);
      } else if (panelState === 'peek') {
        setPanelState('full');
      }
    }
  };

  // Get panel height based on state
  const getPanelHeight = () => {
    switch (panelState) {
      case 'closed':
        return '0px';
      case 'peek':
        return '180px';
      case 'full':
        return 'calc(100vh - 120px)';
      default:
        return '0px';
    }
  };

  return (
    <>
      {/* Backdrop overlay for full state */}
      {panelState === 'full' && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={closePanel}
        />
      )}

      {/* Chat Panel */}
      <div
        ref={panelRef}
        className="fixed bottom-0 left-0 right-0 z-50 transition-all duration-300 ease-out"
        style={{
          height: getPanelHeight(),
          backgroundColor: theme.cardBg,
          borderTopLeftRadius: '16px',
          borderTopRightRadius: '16px',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
        }}
      >
        {/* Swipe Handle */}
        <div
          className="w-full py-2 cursor-pointer flex flex-col items-center"
          onClick={togglePanel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ backgroundColor: theme.headerBg }}
        >
          <div
            className="w-12 h-1 rounded-full mb-2"
            style={{ backgroundColor: theme.lineColor + '40' }}
          />
          <div className="flex items-center gap-2">
            <MessageCircle className="w-4 h-4" style={{ color: theme.chatGradient ? undefined : theme.accentColor, stroke: theme.chatGradient ? 'url(#chat-grad-stroke)' : undefined }} />
            <span
              className="font-bold text-sm"
              style={theme.chatGradient ? {
                backgroundImage: theme.chatGradient,
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              } : { color: theme.textColor }}
            >
              Chat
            </span>
            {unreadCount > 0 && panelState === 'closed' && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
            {panelState === 'peek' && <ChevronUp className="w-4 h-4" style={{ color: theme.textColor }} />}
            {panelState === 'full' && <ChevronDown className="w-4 h-4" style={{ color: theme.textColor }} />}
          </div>
          {theme.chatGradient && (
            <svg width="0" height="0" className="absolute">
              <defs>
                <linearGradient id="chat-grad-stroke" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="50%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#ef4444" />
                </linearGradient>
              </defs>
            </svg>
          )}
        </div>

        {/* Messages Area */}
        {panelState !== 'closed' && (
          <div className="flex flex-col h-[calc(100%-60px)]">
            <ScrollArea className="flex-1 px-4 py-2" ref={scrollRef}>
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
                      className={`px-3 py-2 rounded-2xl max-w-[85%] text-sm shadow-sm ${msg.player_id === playerId
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
                  <div className="h-full flex flex-col items-center justify-center py-10 opacity-30 text-center px-4">
                    <MessageCircle className="w-12 h-12 mb-2" style={{ color: theme.lineColor }} />
                    <p className="text-sm font-medium" style={{ color: theme.lineColor }}>No messages yet. Say hello!</p>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input Area */}
            <form
              onSubmit={handleSendMessage}
              className="p-3 border-t flex gap-2"
              style={{ backgroundColor: theme.headerBg, borderColor: theme.lineColor + '10' }}
            >
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="h-10 border-0 focus-visible:ring-1 focus-visible:ring-offset-0"
                style={{
                  backgroundColor: theme.lineColor + '05',
                  color: theme.textColor,
                  borderColor: theme.lineColor + '10'
                }}
              />
              <Button
                type="submit"
                size="icon"
                className="h-10 w-10 shrink-0"
                style={{ background: theme.chatGradient || theme.accentColor }}
              >
                <Send className="w-4 h-4 text-white" />
              </Button>
            </form>
          </div>
        )}
      </div>
    </>
  );
}
