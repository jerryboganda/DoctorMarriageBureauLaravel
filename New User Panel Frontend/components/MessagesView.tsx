import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Search, Send, CheckCheck, Check, Clock, Sparkles, FileText, Download,
  ChevronLeft, Users, Calendar, Loader2, PhoneCall, X, Lock, MessageCircle
} from 'lucide-react';
import { api } from '../utils/api';
import { useAuthStore } from '../src/stores/authStore';
import { echo } from '../utils/echo';

// Group messages by date
const groupMessagesByDate = (messages: any[]) => {
  const groups: { label: string; messages: any[] }[] = [];
  let currentLabel = '';
  
  messages.forEach((msg: any) => {
    const date = new Date(msg.created_at);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    
    let label: string;
    if (date.toDateString() === today.toDateString()) {
      label = 'today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      label = 'yesterday';
    } else {
      label = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined });
    }
    
    if (label !== currentLabel) {
      currentLabel = label;
      groups.push({ label, messages: [msg] });
    } else {
      groups[groups.length - 1].messages.push(msg);
    }
  });
  
  return groups;
};

const formatMessageTime = (dateStr: string) => {
  try {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch {
    return dateStr;
  }
};

const MessagesView: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const ICEBREAKERS = [
    t('messages.icebreaker1'),
    t('messages.icebreaker2'),
    t('messages.icebreaker3'),
    t('messages.icebreaker4'),
    t('messages.icebreaker5'),
  ];
  const [activeTab, setActiveTab] = useState<'primary' | 'requests'>('primary');
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [inputText, setInputText] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [threads, setThreads] = useState<any[]>([]);
  const [activeChatData, setActiveChatData] = useState<any>(null);
  const [sending, setSending] = useState(false);
  const [onlineStatuses, setOnlineStatuses] = useState<Record<number, number>>({});
  const [showIcebreakerMenu, setShowIcebreakerMenu] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const icebreakerRef = useRef<HTMLDivElement>(null);
  const scheduleRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Heartbeat every 60s
  useEffect(() => {
    const sendHeartbeat = () => { api.post('/member/heartbeat').catch(() => {}); };
    sendHeartbeat();
    const hbInterval = setInterval(sendHeartbeat, 60000);
    return () => clearInterval(hbInterval);
  }, []);

  // Fetch threads every 15s
  useEffect(() => {
    fetchThreads();
    const interval = setInterval(fetchThreads, 15000);
    return () => clearInterval(interval);
  }, []);

  // Online status polling every 30s
  useEffect(() => {
    const fetchOnlineStatuses = async () => {
      const userIds = threads.map(t => t.user_id).filter(Boolean);
      if (userIds.length === 0) return;
      try {
        const res = await api.post('/member/user-online-status', { user_ids: userIds });
        if (res.data?.data) setOnlineStatuses(res.data.data);
      } catch (e) { /* silent */ }
    };
    fetchOnlineStatuses();
    const interval = setInterval(fetchOnlineStatuses, 30000);
    return () => clearInterval(interval);
  }, [threads]);

  // WebSocket for real-time messages
  useEffect(() => {
    if (selectedChatId && echo) {
      const channel = echo.channel(`chat.${selectedChatId}`);
      channel.listen('.MessageSent', (e: any) => {
        fetchChat(selectedChatId);
        fetchThreads();
      });
      channel.listen('.message.sent', (e: any) => {
        fetchChat(selectedChatId);
        fetchThreads();
      });
      return () => { echo.leaveChannel(`chat.${selectedChatId}`); };
    }
  }, [selectedChatId]);

  useEffect(() => {
    if (selectedChatId) fetchChat(selectedChatId);
  }, [selectedChatId]);

  // Auto-scroll to bottom
  useEffect(() => {
    requestAnimationFrame(() => {
      if (lastMessageRef.current) {
        lastMessageRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }, [activeChatData]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (icebreakerRef.current && !icebreakerRef.current.contains(e.target as Node)) {
        setShowIcebreakerMenu(false);
      }
      if (scheduleRef.current && !scheduleRef.current.contains(e.target as Node)) {
        setShowScheduleModal(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px';
    }
  }, [inputText]);

  const fetchThreads = async () => {
    try {
      const response = await api.get('/member/chat-list');
      setThreads(response.data.data);
    } catch (error) {
      console.error('Failed to fetch chat list', error);
    } finally {
      setLoadingList(false);
    }
  };

  const fetchChat = async (id: number) => {
    try {
      setLoadingChat(true);
      const response = await api.get(`/member/chat-view/${id}`);
      setActiveChatData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch chat', error);
    } finally {
      setLoadingChat(false);
    }
  };

  const selectedThread = threads.find(t => t.id === selectedChatId);
  const currentMessages = activeChatData?.messages || [];
  const currentUserId = user?.id;
  
  const displayedThreads = useMemo(() => {
    let filtered = threads.filter(t => 
      activeTab === 'requests' ? t.is_request : !t.is_request
    );
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(t => t.member_name?.toLowerCase().includes(q));
    }
    return filtered;
  }, [threads, activeTab, searchQuery]);

  const messageGroups = useMemo(() => groupMessagesByDate(currentMessages), [currentMessages]);

  const isUserOnline = (thread: any): boolean => {
    if (thread.user_id && onlineStatuses[thread.user_id] !== undefined) {
      return onlineStatuses[thread.user_id] === 1;
    }
    return thread.active === 1;
  };

  // Core send function — used by all send actions
  const doSendMessage = async (text: string) => {
    if (!text.trim() || !selectedChatId) return;
    
    // Optimistic update
    const optimisticMsg = {
      id: Date.now(),
      chat_thread_id: selectedChatId,
      sender_user_id: currentUserId,
      message: text,
      seen: 0,
      created_at: new Date().toISOString(),
      created_at_human: 'Just now',
      _optimistic: true,
    };
    
    setActiveChatData((prev: any) => prev ? {
      ...prev,
      messages: [...(prev.messages || []), optimisticMsg],
    } : prev);
    
    try {
      setSending(true);
      await api.post('/member/chat-reply', {
        chat_thread_id: selectedChatId,
        message: text
      });
      await fetchChat(selectedChatId);
      await fetchThreads();
    } catch (error) {
      console.error('Failed to send message', error);
      await fetchChat(selectedChatId);
    } finally {
      setSending(false);
    }
  };

  // Send typed message
  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText('');
    doSendMessage(text);
  };

  // Icebreaker: send selected pre-written message
  const handleIcebreaker = (message: string) => {
    setShowIcebreakerMenu(false);
    doSendMessage(message);
  };

  // Schedule Call: send scheduling request
  const handleScheduleCall = () => {
    setShowScheduleModal(false);
    doSendMessage("📞 I'd like to schedule a call with you. When would be a good time to talk? Please suggest a day and time that works for you.");
  };

  // Share Biodata — generates PDF on backend & attaches it to the chat
  const [sharingBiodata, setSharingBiodata] = useState(false);
  const handleShareBiodata = async () => {
    if (!selectedChatId || sharingBiodata) return;
    try {
      setSharingBiodata(true);
      await api.post('/member/chat/share-biodata', {
        chat_thread_id: selectedChatId,
      });
      await fetchChat(selectedChatId);
      await fetchThreads();
    } catch (error) {
      console.error('Failed to share biodata', error);
    } finally {
      setSharingBiodata(false);
    }
  };

  if (loadingList && threads.length === 0) {
    return (
      <div className="flex h-full items-center justify-center bg-white">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="flex h-full bg-white relative">
      {/* ═══════════ Left Sidebar: Thread List ═══════════ */}
      <div className={`w-full md:w-80 lg:w-96 flex-col border-r border-slate-200 bg-white ${selectedChatId ? 'hidden md:flex' : 'flex'}`}>
        
        {/* Header */}
        <div className="p-4 pb-3 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900 mb-3">{t('messages.title')}</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('messages.searchConversations')} 
              className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary/30 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
          <button 
            onClick={() => setActiveTab('primary')}
            className={`flex-1 py-2.5 text-xs font-bold transition-colors relative ${activeTab === 'primary' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {t('messages.primary')}
            {activeTab === 'primary' && <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary rounded-full" />}
          </button>
          <button 
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-2.5 text-xs font-bold transition-colors flex items-center justify-center gap-1.5 relative ${activeTab === 'requests' ? 'text-primary' : 'text-slate-400 hover:text-slate-600'}`}
          >
            {t('messages.requests')}
            {threads.filter(t => t.is_request).length > 0 && (
              <span className="bg-red-500 text-white text-[9px] min-w-[16px] h-[16px] flex items-center justify-center px-1 rounded-full leading-none">
                {threads.filter(t => t.is_request).length}
              </span>
            )}
            {activeTab === 'requests' && <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-primary rounded-full" />}
          </button>
        </div>

        {/* Thread List */}
        <div className="flex-1 overflow-y-auto">
          {displayedThreads.length === 0 ? (
            <div className="p-8 text-center">
              <div className="size-14 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                <MessageCircle size={22} className="text-slate-300" />
              </div>
              <p className="text-slate-500 text-sm font-medium">
                {searchQuery ? t('messages.noMatchingConversations') : t('messages.noConversationsYet')}
              </p>
              <p className="text-slate-400 text-xs mt-1">
                {searchQuery ? t('messages.tryDifferentSearch') : t('messages.startChatting')}
              </p>
            </div>
          ) : (
            displayedThreads.map(thread => {
              const isActive = selectedChatId === thread.id;
              const hasUnread = thread.unseen_message_count > 0;
              return (
                <div 
                  key={thread.id}
                  onClick={() => setSelectedChatId(thread.id)}
                  className={`px-4 py-3 flex gap-3 cursor-pointer transition-colors border-b border-slate-50 ${
                    isActive ? 'bg-primary/5 border-l-2 border-l-primary' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="size-11 rounded-full bg-slate-200 overflow-hidden">
                      <img src={thread.member_photo} className="w-full h-full object-cover" alt="" />
                    </div>
                    {isUserOnline(thread) && (
                      <div className="absolute bottom-0 right-0 size-3 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden min-w-0">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <h4 className={`truncate text-sm ${hasUnread ? 'font-bold text-slate-900' : 'font-medium text-slate-800'}`}>
                        {thread.member_name}
                      </h4>
                      <span className={`text-[11px] ml-2 shrink-0 ${hasUnread ? 'text-primary font-semibold' : 'text-slate-400'}`}>
                        {thread.last_message_time}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className={`text-xs truncate flex-1 ${hasUnread ? 'font-medium text-slate-700' : 'text-slate-400'}`}>
                        {thread.last_message || t('messages.startConversation')}
                      </p>
                      {hasUnread && (
                        <span className="bg-primary text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center px-1 rounded-full shrink-0">
                          {thread.unseen_message_count > 9 ? '9+' : thread.unseen_message_count}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ═══════════ Right Area: Chat Window ═══════════ */}
      <div className={`flex-1 flex-col h-full ${!selectedChatId ? 'hidden md:flex' : 'flex'}`}>
        {selectedThread ? (
          <>
            {/* Chat Header */}
            <div className="h-[60px] bg-white border-b border-slate-200 px-3 md:px-5 flex items-center shrink-0">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <button 
                  onClick={() => setSelectedChatId(null)}
                  className="md:hidden p-1 text-slate-400 hover:text-slate-700 -ml-1 shrink-0"
                >
                  <ChevronLeft size={22} />
                </button>
                <div className="relative shrink-0">
                  <div className="size-10 rounded-full bg-slate-200 overflow-hidden">
                    <img src={selectedThread.member_photo} className="w-full h-full object-cover" alt="" />
                  </div>
                  {isUserOnline(selectedThread) && (
                    <div className="absolute bottom-0 right-0 size-2.5 bg-green-500 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900 text-sm truncate">
                    {selectedThread.member_name}
                  </h3>
                  <p className={`text-[11px] leading-tight ${isUserOnline(selectedThread) ? 'text-green-600' : 'text-slate-400'}`}>
                    {isUserOnline(selectedThread) ? t('messages.online') : t('messages.offline')}
                  </p>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-16 py-4 flex flex-col bg-slate-50"
            >
              {loadingChat ? (
                <div className="flex-1 flex justify-center items-center">
                  <Loader2 className="animate-spin text-primary" size={24} />
                </div>
              ) : (
                <>
                  {/* Encryption notice */}
                  <div className="flex justify-center mb-4">
                    <div className="bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg text-[11px] text-slate-500 flex items-center gap-1.5">
                      <Lock size={10} className="shrink-0 text-slate-400" />
                      {t('messages.encrypted')}
                    </div>
                  </div>

                  {/* Messages grouped by date */}
                  {messageGroups.map((group, gi) => (
                    <div key={gi}>
                      {/* Date separator */}
                      <div className="flex justify-center my-4">
                        <div className="bg-white border border-slate-200 px-3 py-1 rounded-full text-[11px] font-medium text-slate-500">
                          {group.label === 'today' ? t('messages.today') : group.label === 'yesterday' ? t('messages.yesterday') : group.label}
                        </div>
                      </div>
                      
                      {group.messages.map((msg: any, mi: number) => {
                        const isMine = msg.sender_user_id === currentUserId;
                        const timeStr = formatMessageTime(msg.created_at);
                        const isConsecutive = mi > 0 && group.messages[mi - 1].sender_user_id === msg.sender_user_id;
                        
                        return (
                          <div 
                            key={msg.id} 
                            className={`flex ${isMine ? 'justify-end' : 'justify-start'} ${isConsecutive ? 'mt-0.5' : 'mt-3'}`}
                          >
                            <div className="max-w-[80%] md:max-w-[60%]">
                              <div className={`px-3.5 py-2 rounded-2xl ${
                                isMine 
                                  ? 'bg-primary text-white rounded-br-md' 
                                  : 'bg-white text-slate-800 border border-slate-200 rounded-bl-md'
                              }`}>
                                <p className="text-[14px] leading-relaxed whitespace-pre-wrap break-words">{msg.message}</p>

                                {/* Attachments */}
                                {msg.attachment && Array.isArray(msg.attachment) && msg.attachment.length > 0 && (
                                  <div className="mt-2 space-y-1.5">
                                    {msg.attachment.map((att: any, ai: number) => (
                                      <a
                                        key={ai}
                                        href={att.attachment}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        download={att.file_name || 'file'}
                                        className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-colors ${
                                          isMine
                                            ? 'bg-white/15 hover:bg-white/25'
                                            : 'bg-slate-50 hover:bg-slate-100 border border-slate-200'
                                        }`}
                                      >
                                        <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
                                          isMine ? 'bg-white/20' : 'bg-red-50'
                                        }`}>
                                          <FileText size={16} className={isMine ? 'text-white' : 'text-red-500'} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className={`text-xs font-medium truncate ${isMine ? 'text-white' : 'text-slate-700'}`}>
                                            {att.file_name || 'Document'}.{att.extension || 'pdf'}
                                          </p>
                                          <p className={`text-[10px] ${isMine ? 'text-white/60' : 'text-slate-400'}`}>
                                            {att.extension?.toUpperCase() || 'PDF'}
                                          </p>
                                        </div>
                                        <Download size={14} className={isMine ? 'text-white/70' : 'text-slate-400'} />
                                      </a>
                                    ))}
                                  </div>
                                )}

                                <div className={`flex items-center gap-1.5 mt-1 ${isMine ? 'justify-end' : 'justify-start'}`}>
                                  <span className={`text-[10px] ${isMine ? 'text-white/60' : 'text-slate-400'}`}>
                                    {timeStr}
                                  </span>
                                  {isMine && (
                                    msg.seen === 1 
                                      ? <CheckCheck size={13} className="text-white/80" />
                                      : msg._optimistic
                                        ? <Clock size={11} className="text-white/50" />
                                        : <Check size={13} className="text-white/60" />
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                  
                  <div ref={lastMessageRef} className="h-1" />
                </>
              )}
            </div>

            {/* Input Area */}
            <div className="bg-white border-t border-slate-200 px-3 md:px-5 py-3 relative z-20">
              
              {/* Icebreaker Dropdown — rendered outside the scrollable row */}
              {showIcebreakerMenu && (
                <div className="absolute bottom-full left-3 md:left-5 mb-1 w-[340px] bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="px-3 py-2.5 border-b border-slate-100 flex items-center justify-between">
                    <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                      <Sparkles size={12} className="text-amber-500" /> {t('messages.chooseIcebreaker')}
                    </p>
                    <button onClick={() => setShowIcebreakerMenu(false)} className="text-slate-400 hover:text-slate-600">
                      <X size={14} />
                    </button>
                  </div>
                  <div className="max-h-56 overflow-y-auto p-1.5">
                    {ICEBREAKERS.map((msg, i) => (
                      <button 
                        key={i}
                        onClick={() => handleIcebreaker(msg)}
                        className="w-full text-left px-3 py-2.5 text-[13px] text-slate-600 hover:bg-primary/5 hover:text-primary rounded-lg transition-colors leading-snug"
                      >
                        {msg}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Schedule Call Dropdown — rendered outside the scrollable row */}
              {showScheduleModal && (
                <div className="absolute bottom-full left-3 md:left-5 mb-1 w-72 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                      <PhoneCall size={14} className="text-blue-500" /> {t('messages.scheduleCall')}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {t('messages.scheduleCallDesc')}
                    </p>
                  </div>
                  <div className="px-4 py-3 flex gap-2">
                    <button 
                      onClick={handleScheduleCall}
                      className="flex-1 px-3 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      {t('messages.sendRequest')}
                    </button>
                    <button 
                      onClick={() => setShowScheduleModal(false)}
                      className="px-3 py-2 bg-slate-100 text-slate-500 text-xs font-semibold rounded-lg hover:bg-slate-200 transition-colors"
                    >
                      {t('messages.cancel')}
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Action Buttons */}
              <div className="flex gap-2 mb-2.5">
                {/* Icebreaker */}
                <button 
                  onClick={() => {
                    setShowScheduleModal(false);
                    setShowIcebreakerMenu(prev => !prev);
                  }}
                  disabled={sending}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 hover:border-slate-300 transition-all whitespace-nowrap disabled:opacity-50"
                >
                  <Sparkles size={13} className="text-amber-500" /> {t('messages.icebreaker')}
                </button>
                
                {/* Schedule Call */}
                <button 
                  onClick={() => {
                    setShowIcebreakerMenu(false);
                    setShowScheduleModal(prev => !prev);
                  }}
                  disabled={sending}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 hover:border-slate-300 transition-all whitespace-nowrap disabled:opacity-50"
                >
                  <Calendar size={13} className="text-blue-500" /> {t('messages.scheduleCall')}
                </button>

                {/* Share Biodata */}
                <button 
                  onClick={handleShareBiodata}
                  disabled={sending || sharingBiodata}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 hover:border-slate-300 transition-all whitespace-nowrap disabled:opacity-50"
                >
                  {sharingBiodata ? <Loader2 size={13} className="text-green-500 animate-spin" /> : <FileText size={13} className="text-green-500" />}
                  {sharingBiodata ? t('messages.sharing') : t('messages.shareBiodata')}
                </button>
              </div>

              {/* Text Input + Send */}
              <div className="flex items-end gap-2">
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1 focus-within:border-primary/40 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                  <textarea 
                    ref={textareaRef}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder={t('messages.typeMessage')} 
                    className="w-full bg-transparent border-none focus:ring-0 resize-none max-h-[120px] min-h-[38px] py-2 text-sm text-slate-900 placeholder:text-slate-400 leading-snug"
                    rows={1}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                    disabled={sending}
                  />
                </div>
                <button 
                  onClick={handleSendMessage} 
                  disabled={!inputText.trim() || sending}
                  className="p-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all disabled:opacity-30 shrink-0 active:scale-95"
                >
                  {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center bg-slate-50">
            <div className="text-center max-w-xs">
              <div className="size-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <MessageCircle size={36} className="text-slate-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-1">{t('messages.yourMessages')}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {t('messages.selectConversation')}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MessagesView;
