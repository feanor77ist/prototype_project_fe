"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Paperclip } from "lucide-react";
import { Chat } from "./chatLayout";
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import axios from 'axios';

type ChatAreaProps = {
  currentChat: Chat | undefined;
  chats: Chat[];
  addMessageToChat: (
    chatId: string,
    message: { role: "user" | "assistant"; content: string }
  ) => void;
  createNewChat: () => string;
  setOpen: (open: boolean) => void;
};

// API call function

// const fetchAIResponse = async (message: string) => {
//   const response = await axios.post('https://your-api-endpoint.com/chat', { message });
//   return response.data;
// };

export const ChatArea = ({
  currentChat,
  chats,
  addMessageToChat,
  createNewChat,
}: ChatAreaProps) => {
  const [input, setInput] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [currentChat?.messages]);

  // const aiResponseMutation = useMutation(fetchAIResponse, {
  //     onSuccess: (data, variables, context) => {
  //       if (context && typeof context === 'object' && 'chatId' in context) {
  //         addMessageToChat(context.chatId as string, { role: 'assistant', content: data.response });
  //       }
  //     },
  //   });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      let chatId = currentChat?.id;
      if (!chatId) {
        chatId = createNewChat();
      }
      addMessageToChat(chatId, { role: "user", content: input });
      setInput("");
      // Simulating AI response
      setTimeout(() => {
        addMessageToChat(chatId!, {
          role: "assistant",
          content: "Test response",
        });
      }, 1000);

      // Trigger AI response
      // aiResponseMutation.mutate(input, {
      //   context: { chatId },
      // });
    }
  };

  const handleAttachment = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Here, typically upload the file and get a URL
      const message = `Attached file: ${file.name}`;
      let chatId = currentChat?.id;
      if (!chatId) {
        chatId = createNewChat();
      }
      addMessageToChat(chatId, { role: "user", content: message });
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        {chats.length === 0 ? (
          <div className="flex items-center justify-center h-80">
            <p className="text-gray-500 text-center text-2xl">
              Mesajlaşmaya başlamak için bir sohbet seçin veya yeni bir sohbet
              oluşturun.
            </p>
          </div>
        ) : (
          currentChat?.messages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start mb-4 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <Avatar className="mr-2">
                  <AvatarImage
                    src="/placeholder.svg?height=40&width=40"
                    alt="AI"
                  />
                  <AvatarFallback>AI</AvatarFallback>
                </Avatar>
              )}
              <div
                className={`rounded-lg p-2 max-w-[70%] ${
                  message.role === "user"
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200 dark:bg-gray-700"
                }`}
              >
                {message.content}
              </div>
              {message.role === "user" && (
                <Avatar className="ml-2">
                  <AvatarImage
                    src="/placeholder.svg?height=40&width=40"
                    alt="User"
                  />
                  <AvatarFallback>AA</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))
        )}
      </ScrollArea>
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Mesajınızı buraya yazın..."
              className="pr-10 min-h-[100px] text-lg placeholder:text-lg"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute left-2 bottom-2"
              onClick={handleAttachment}
            >
              <Paperclip className="h-5 w-5" />
            </Button>
          </div>
          <Button type="submit" size="icon">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};
