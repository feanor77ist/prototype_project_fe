"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./sidebar";
import { ChatArea } from "./chatArea";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { UserAvatar } from "./userAvatar";
import { ThemeToggle } from "./themeToggle";
import { useIsMobile } from "@/hooks/use-mobile";

export type PaginatedChatEntry = {
  count: number;
  next: string | null;
  previous: string | null;
  results: ChatEntry[];
};

export type ChatEntry = {
  entry_id: string; // Sohbetin benzersiz ID'si
  entry_name: string; // Sohbetin başlığı
  created_at: string; // Sohbetin oluşturulma tarihi
};

export type ChatMessage = {
  user_query: string; // Kullanıcının sorusu
  gpt_response: string; // GPT'nin cevabı
  sources?: Array<{ source: string; snippet: string }>;
};

export const ChatLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chats, setChats] = useState<ChatEntry[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isEntriesLoading, setIsEntriesLoading] = useState(false);
  const isMobile = useIsMobile();
  const [page, setPage] = useState(1);
  const itemsPerPage = 50;

  const setCurrentChatIdAndCloseSidebar = (id: string) => {
    setCurrentChatId(id);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Sohbetleri fetch eden işlev
  const fetchChatEntries = async (pageNum = 1) => { 
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Kullanıcı oturumu bulunamadı.");

      setIsEntriesLoading(true);
      const response = await fetch(`${API_URL}/api/entries/?page=${pageNum}&page_size=${itemsPerPage}`, {
        headers: {
          Authorization: `Token ${token}`, 
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch chat entries");
      }

      const data = (await response.json()) as PaginatedChatEntry;
      const entries = data.results;
      if (pageNum === 1) {
        setChats(entries);
      } else {
        setChats((prev) => [...prev, ...entries]);
      }
      setPage(pageNum);
      setIsEntriesLoading(false);

    } catch (error) {
      console.error("Error fetching chat entries:", error);
      setIsEntriesLoading(false);
    } finally {
      console.log("Chat entries fetched successfully");  
    }
  };

  const loadMoreChats = () => {
    fetchChatEntries(page + 1);
  };

  const appendNewChatEntry = (entry: ChatEntry) => {
    setChats((prev) => [entry, ...prev]);
  };

  // Bir entry'nin mesajlarını fetch eden işlev
  const fetchChatMessages = async (entryId: string) => {
    try {
      const token = localStorage.getItem("token"); // Token'ı al
      if (!token) throw new Error("Kullanıcı oturumu bulunamadı.");
      
      const API_URL = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${API_URL}/api/entries/${entryId}/`, {
        headers: {
          Authorization: `Token ${token}`, // Authorization başlığı ekle
          "Content-Type": "application/json", // Content-Type başlığı ekle
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch chat messages");
      }
      const data = await response.json();
      const transformedMessages = data.chats.map((chat: { user_query: string; gpt_response: string }) => ({
        user_query: chat.user_query,
        gpt_response: chat.gpt_response,
        sources: []
      }));
      setMessages((prevMessages: ChatMessage[]) => {
        // Eğer önceden mesaj varsa ve son mesajın sources'u doluysa:
        if (prevMessages.length > 0 && prevMessages[prevMessages.length - 1].sources && prevMessages[prevMessages.length - 1].sources!.length > 0) {
          // API'dan gelen mesajlar dizisinin son öğesinin sources'unu, önceden eklenmiş son mesajın sources'u ile güncelleyin
          transformedMessages[transformedMessages.length - 1].sources = prevMessages[prevMessages.length - 1].sources;
        }
        return transformedMessages;
      });
      console.log("Messages State:", messages);

    } catch (error) {
      console.error("Error fetching chat messages:", error);
    }
  };

  useEffect(() => {
    fetchChatEntries(1);
  }, []);

  useEffect(() => {
    if (currentChatId) {
      fetchChatMessages(currentChatId);
    }
  }, [currentChatId]);

  const createNewChat = () => {
    setCurrentChatId(null); // Seçili sohbet sıfırlanır
    setMessages([]); // Mesajlar sıfırlanır
    if (isMobile) setSidebarOpen(false);
  };

  const addMessageToChat = (chatId: string, message: ChatMessage) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  };

  const shareChat = (chatId: string) => {
    const chat = chats.find((c) => c.entry_id === chatId);
    if (chat) {
      console.log(`Sharing chat: ${chat.entry_name}`);
      alert(`Sharing chat: ${chat.entry_name}`);
    }
  };

  const renameChat = (chatId: string, newTitle: string) => {
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.entry_id === chatId ? { ...chat, entry_name: newTitle } : chat
      )
    );
  };

  const deleteChat = (chatId: string) => {
    setChats((prevChats) => {
      const updatedChats = prevChats.filter((chat) => chat.entry_id !== chatId);
      if (currentChatId === chatId) {
        setCurrentChatId(updatedChats.length > 0 ? updatedChats[0].entry_id : null);
      }
      return updatedChats;
    });
    setMessages([]); // Mesajlar sıfırlanır
  };
  //Eski Entry'lerin created_at değerini yeni bir zamanda günceller
  function updateEntryTimestampLocally(chatId: string) {
    const newDate = new Date().toISOString();
    setChats((prev) =>
      prev.map((c) =>
        c.entry_id === chatId ? { ...c, created_at: newDate } : c
      )
    );
  }  

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-800">
      <Sidebar
        open={sidebarOpen}
        setOpen={setSidebarOpen}
        chats={chats}
        currentChatId={currentChatId}
        setCurrentChatId={setCurrentChatIdAndCloseSidebar}
        createNewChat={createNewChat}
        shareChat={shareChat}
        renameChat={renameChat}
        deleteChat={deleteChat}
        isEntriesLoading={isEntriesLoading}
        loadMoreChats={loadMoreChats}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-md z-10 dark:bg-gray-800 dark:shadow-zinc-700 border-b-gray-700">
          <div className="max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-6 w-6" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-500 dark:text-gray-400">
              CognivIA
            </h1>
            <div className="flex items-center space-x-2">
              <UserAvatar  />
              <ThemeToggle />
            </div>
          </div>
        </header>
        <ChatArea
          currentChatId={chats.find((chat) => chat.entry_id === currentChatId)?.entry_id || null}
          setCurrentChatId={setCurrentChatId}
          messages={messages}
          addMessageToChat={addMessageToChat}
          createNewChat={createNewChat}
          setOpen={setSidebarOpen}
          fetchChatEntries={fetchChatEntries}
          setMessages={setMessages}
          isMobile={isMobile}
          appendNewChatEntry={appendNewChatEntry}
          updateEntryTimestampLocally={updateEntryTimestampLocally}
        />
      </div>
    </div>
  );
};
