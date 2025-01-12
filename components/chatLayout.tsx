"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./sidebar";
import { ChatArea } from "./chatArea";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { UserAvatar } from "./userAvatar";
import { ThemeToggle } from "./themeToggle";

import { useIsMobile } from "@/hooks/use-mobile";

export type ChatEntry = {
  entry_id: string; // Sohbetin benzersiz ID'si
  entry_name: string; // Sohbetin başlığı
  created_at: string; // Sohbetin oluşturulma tarihi
};

export type ChatMessage = {
  user_query: string; // Kullanıcının sorusu
  gpt_response: string; // GPT'nin cevabı
};

export const ChatLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chats, setChats] = useState<ChatEntry[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [isEntriesLoading, setIsEntriesLoading] = useState(false);
  const isMobile = useIsMobile();

  const setCurrentChatIdAndCloseSidebar = (id: string) => {
    setCurrentChatId(id);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  let isFetching = false;

  // Sohbetleri fetch eden işlev
  const fetchChatEntries = async () => {
    if (isFetching) return; 
    isFetching = true;

    try {
      const token = localStorage.getItem("token"); // Token'ı al
      if (!token) throw new Error("Kullanıcı oturumu bulunamadı.");

      setIsEntriesLoading(true);
      const response = await fetch("https://libreconsulting.pythonanywhere.com/api/entries/", {
        headers: {
          Authorization: `Token ${token}`, 
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch chat entries");
      }
      const data: ChatEntry[] = await response.json();
      setChats(data.slice(0, 50));
      setIsEntriesLoading(false);
      
      // Geri kalanları işlemeye devam et
      setTimeout(() => {
        setChats(data); // Tam listeyi yükle
      }, 1000); // Kalanları 1 saniye sonra yükle (örnek)

    } catch (error) {
      console.error("Error fetching chat entries:", error);
    } finally {
      isFetching = false;
      console.log("Chat entries fetched successfully");  
    }
  };

  // Bir entry'nin mesajlarını fetch eden işlev
  const fetchChatMessages = async (entryId: string) => {
    try {
      const token = localStorage.getItem("token"); // Token'ı al
      if (!token) throw new Error("Kullanıcı oturumu bulunamadı.");

      const response = await fetch(`https://libreconsulting.pythonanywhere.com/api/entries/${entryId}/`, {
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
      }));
      setMessages(transformedMessages); // Endpoint'ten dönen `chats` alanını kullanıyoruz
      
      console.log("Messages:", transformedMessages);
      console.log("Messages State:", messages);

    } catch (error) {
      console.error("Error fetching chat messages:", error);
    }
  };

  useEffect(() => {
    fetchChatEntries();
  }, [fetchChatEntries]);

  useEffect(() => {
    if (currentChatId) {
      fetchChatMessages(currentChatId);
    }
  }, [currentChatId]);

  const createNewChat = () => {
    setCurrentChatId(null); // Seçili sohbet sıfırlanır
    setMessages([]); // Mesajlar sıfırlanır
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
              Smart Assistant
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
        />
      </div>
    </div>
  );
};
