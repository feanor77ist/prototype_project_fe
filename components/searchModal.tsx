import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatEntry } from "./chatLayout";

type SearchModalProps = {
  isOpen: boolean;
  onClose: () => void;
  chats: ChatEntry[];
  setCurrentChatId: (id: string) => void;
};

export const SearchModal = ({
  isOpen,
  onClose,
  chats,
  setCurrentChatId,
}: SearchModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ChatEntry[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50); // Küçük bir gecikme ile odaklanma
    }
  }, [isOpen]); 

  useEffect(() => {
    if (searchQuery) {
      const filteredChats = chats.filter((chat) =>
        chat.entry_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setSearchResults(filteredChats);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, chats]);

  const handleSelectChat = (chatId: string) => {
    setCurrentChatId(chatId);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle>Sohbet Ara</DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute right-4 top-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        <div className="py-4">
          <Input
            ref={inputRef}
            placeholder="Sohbet Ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-4 border-gray-200 dark:border-gray-700 rounded-2xl"
          />
          <ScrollArea className="h-[300px]">
            {searchResults.length > 0
              ? searchResults.map((chat) => (
                  <Button
                    key={chat.entry_id}
                    variant="ghost"
                    className="w-full justify-start mb-2"
                    onClick={() => handleSelectChat(chat.entry_id)}
                  >
                    {chat.entry_name}
                  </Button>
                ))
              : searchQuery && (
                  <p className="text-center text-gray-500">
                    Sohbet Bulunamadı.
                  </p>
                )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
