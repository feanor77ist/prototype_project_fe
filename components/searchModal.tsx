import { useState, useEffect } from "react";
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
import { Chat } from "./chatLayout";

type SearchModalProps = {
  isOpen: boolean;
  onClose: () => void;
  chats: Chat[];
  setCurrentChatId: (id: string) => void;
};

export const SearchModal = ({
  isOpen,
  onClose,
  chats,
  setCurrentChatId,
}: SearchModalProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Chat[]>([]);

  useEffect(() => {
    if (searchQuery) {
      const filteredChats = chats.filter((chat) =>
        chat.title.toLowerCase().includes(searchQuery.toLowerCase())
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
      <DialogContent className="sm:max-w-[425px]">
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
            placeholder="Sohbet Ara..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="mb-4"
          />
          <ScrollArea className="h-[300px]">
            {searchResults.length > 0
              ? searchResults.map((chat) => (
                  <Button
                    key={chat.id}
                    variant="ghost"
                    className="w-full justify-start mb-2"
                    onClick={() => handleSelectChat(chat.id)}
                  >
                    {chat.title}
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
