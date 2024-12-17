"use client";

import { useState, useEffect } from "react";
import { Sidebar } from "./sidebar";
import { ChatArea } from "./chatArea";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { UserAvatar } from "./userAvatar";
import { ThemeToggle } from "./themeToggle";

import { useIsMobile } from "@/hooks/use-mobile";

export type Chat = {
  id: string;
  title: string;
  messages: { role: "user" | "assistant"; content: string }[];
  createdAt: number; // Time the chat was created
};

export const ChatLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  const isMobile = useIsMobile();

  const setCurrentChatIdAndCloseSidebar = (id: string) => {
    setCurrentChatId(id);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  useEffect(() => {
    const savedChats = localStorage.getItem("chats");
    if (savedChats) {
      const parsedChats = JSON.parse(savedChats) as Chat[];
      setChats(parsedChats);
      if (parsedChats.length > 0 && !currentChatId) {
        setCurrentChatId(parsedChats[0].id);
      }
    }
  }, []);

  useEffect(() => {
    if (chats.length > 0) {
      localStorage.setItem("chats", JSON.stringify(chats));
    } else {
      localStorage.removeItem("chats");
    }
  }, [chats]);

  const createNewChat = () => {
    const newChat: Chat = {
      id: Date.now().toString(),
      title: `Chat ${chats.length + 1}`,
      messages: [],
      createdAt: Date.now(),
    };
    setChats((prevChats) => [...prevChats, newChat]);
    setCurrentChatId(newChat.id);
    return newChat.id;
  };

  const addMessageToChat = (
    chatId: string,
    message: { role: "user" | "assistant"; content: string }
  ) => {
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === chatId
          ? { ...chat, messages: [...chat.messages, message] }
          : chat
      )
    );
  };

  const shareChat = (chatId: string) => {
    const chat = chats.find((c) => c.id === chatId);
    if (chat) {
      console.log(`Sharing chat: ${chat.title}`);
      alert(`Sharing chat: ${chat.title}`);
    }
  };

  const renameChat = (chatId: string, newTitle: string) => {
    setChats((prevChats) =>
      prevChats.map((chat) =>
        chat.id === chatId ? { ...chat, title: newTitle } : chat
      )
    );
  };

  const deleteChat = (chatId: string) => {
    setChats((prevChats) => {
      const updatedChats = prevChats.filter((chat) => chat.id !== chatId);
      if (currentChatId === chatId) {
        setCurrentChatId(updatedChats.length > 0 ? updatedChats[0].id : null);
      }
      // Update local storage
      if (updatedChats.length === 0) {
        localStorage.removeItem("chats");
      } else {
        localStorage.setItem("chats", JSON.stringify(updatedChats));
      }
      return updatedChats;
    });
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
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm z-10 dark:bg-gray-800 dark:shadow-white">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-6 w-6" />
            </Button>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              Smart Asistant
            </h1>
            <div className="flex items-center space-x-2">
              <UserAvatar />
              <ThemeToggle />
            </div>
          </div>
        </header>
        <ChatArea
          currentChat={chats.find((chat) => chat.id === currentChatId)}
          chats={chats}
          addMessageToChat={addMessageToChat}
          createNewChat={createNewChat}
          setOpen={setSidebarOpen}
        />
      </div>
    </div>
  );
};
