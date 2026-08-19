import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MessageSquare } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import type { Socket } from 'socket.io-client';

interface DocumentChatProps {
  docId: string;
  socket: Socket | null;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userColor?: string;
  content: string;
  timestamp: string;
}

export const DocumentChat: React.FC<DocumentChatProps> = ({ docId, socket, onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiClient.get<any[]>(`/documents/${docId}/chat`)
      .then(data => {
        setMessages(data.map((m: any) => ({
          id: m._id || m.id,
          userId: m.userId?._id || m.userId,
          userName: m.userName,
          userColor: m.userColor,
          content: m.content,
          timestamp: new Date(m.createdAt || m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        })));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [docId]);

  useEffect(() => {
    if (!socket) return;

    const handleReceived = (data: any) => {
      setMessages(prev => {
        if (prev.some(m => m.id === data.id)) return prev;
        return [...prev, {
          id: data.id,
          userId: data.userId,
          userName: data.userName,
          userColor: data.userColor,
          content: data.content,
          timestamp: new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }];
      });
    };

    socket.on('chat:received', handleReceived);
    return () => { socket.off('chat:received', handleReceived); };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !socket) return;

    socket.emit('chat:send', { documentId: docId, content: newMessage.trim() }, (res: any) => {
      if (res?.error) console.error('Chat send error:', res.error);
    });
    setNewMessage('');
  };

  return (
    <div className="w-80 bg-[#FFFFFF] border-l border-[#E7E5E4] flex flex-col h-full animate-in slide-in-from-right duration-300">
      <div className="px-4 py-3 border-b border-[#F5F5F4] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 text-[#1C1917]">
          <MessageSquare className="w-4 h-4 text-[#D97706]" />
          <h3 className="font-semibold text-sm">Document Chat</h3>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg text-[#78716C] hover:bg-[#F4F0EA] transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-5 h-5 border-2 border-[#D97706] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="w-8 h-8 text-[#D6D3D1] mx-auto mb-2" />
            <p className="text-xs text-[#78716C]">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isCurrentUser = msg.userId === user?.id;
            const showAvatar = index === 0 || messages[index - 1].userId !== msg.userId;

            return (
              <div key={msg.id} className={`flex gap-2 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className="shrink-0 w-7 h-7">
                  {showAvatar && (
                    <div className="w-full h-full rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-xs" style={{ backgroundColor: msg.userColor || '#A8A29E' }} title={msg.userName}>
                      {msg.userName[0]}
                    </div>
                  )}
                </div>
                <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'} max-w-[75%]`}>
                  {showAvatar && (
                    <div className="flex items-center gap-1.5 mb-1 mx-1">
                      <span className="text-[10px] font-semibold text-[#57534E]">{isCurrentUser ? 'You' : msg.userName}</span>
                      <span className="text-[9px] text-[#A8A29E]">{msg.timestamp}</span>
                    </div>
                  )}
                  <div className={`px-3 py-2 rounded-2xl text-xs leading-relaxed ${isCurrentUser ? 'bg-[#1C1917] text-[#FAF8F5] rounded-tr-sm' : 'bg-[#F4F0EA] text-[#1C1917] rounded-tl-sm'}`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-[#F5F5F4] bg-[#FAF8F5] shrink-0">
        <form onSubmit={handleSend} className="relative">
          <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Message collaborators..." className="w-full bg-[#FFFFFF] border border-[#E7E5E4] rounded-xl pl-4 pr-10 py-2.5 text-xs text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#1C1917]" />
          <button type="submit" disabled={!newMessage.trim()} className="absolute right-1.5 top-1.5 p-1.5 bg-[#1C1917] text-white rounded-lg disabled:opacity-50 hover:bg-[#292524] transition-colors">
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
