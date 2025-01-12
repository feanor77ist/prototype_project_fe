import React, { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  SquarePen,
  X,
  MoreVertical,
  Share,
  Pencil,
  Trash2,
  Search,
  Upload,
  Loader,
  FolderOpenDot,
} from "lucide-react";
import { ChatEntry } from "./chatLayout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { SearchModal } from "./searchModal";
import { useIsMobile } from "@/hooks/use-mobile";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

type Document = {
  id: number;
  file: string;
};

type SidebarProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  currentChatId: string | null;
  setCurrentChatId: (id: string) => void;
  createNewChat: () => void;
  shareChat: (id: string) => void;
  renameChat: (id: string, newTitle: string) => void;
  deleteChat: (id: string) => void;
  chats: ChatEntry[];
  isEntriesLoading: boolean;
};

type ClassifiedChats = {
  [key: string]: ChatEntry[];
};

const classifyChats = (chats: ChatEntry[]): ClassifiedChats => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const oneWeekAgo = today - 7 * 24 * 60 * 60 * 1000;
  const oneMonthAgo = today - 30 * 24 * 60 * 60 * 1000;

  return chats.reduce((acc: ClassifiedChats, chat) => {
    const chatDate = new Date(chat.created_at).getTime();
    if (chatDate >= today) {
      acc["Bugün"] = [...(acc["Bugün"] || []), chat];
    } else if (chatDate >= oneWeekAgo) {
      acc["Önceki 7 Gün"] = [...(acc["Önceki 7 Gün"] || []), chat];
    } else if (chatDate >= oneMonthAgo) {
      acc["Önceki 30 Gün"] = [...(acc["Önceki 30 Gün"] || []), chat];
    } else {
      const monthYear = new Date(chatDate).toLocaleString("default", {
        month: "long",
        year: "numeric",
      });
      acc[monthYear] = [...(acc[monthYear] || []), chat];
    }
    return acc;
  }, {});
};

export const Sidebar = ({
  open,
  setOpen,
  currentChatId,
  setCurrentChatId,
  createNewChat,
  shareChat,
  renameChat,
  deleteChat,
  chats,
  isEntriesLoading,
}: SidebarProps) => {
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isDocumentLoading, setIsDocumentLoading] = useState(false);
  const [isDocumentUploading, setIsDocumentUploading] = useState(false);
  const [isUploadComplete, setIsUploadComplete] = useState(false);
  const [isDocumentDeleting, setIsDocumentDeleting] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isMobile = useIsMobile();

  // Sidebar dışına tıklanınca kapanma işlevi
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (renamingChatId !== null) {
        return; // Yeniden adlandırma aktifse sidebar kapanmasın
      }

      const target = event.target as HTMLElement;
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(target) &&
        !target.closest("[data-dropdown-menu]") &&
        isMobile
      ) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setOpen, renamingChatId, isMobile]);

  const handleRename = (chatId: string) => {
    if (newTitle.trim()) {
      renameChat(chatId, newTitle.trim());
    }
    setRenamingChatId(null);
    setNewTitle("");
  };

  const handleChatClick = (chatId: string) => {
    setCurrentChatId(chatId);
    if (isMobile) setOpen(false);
  };

  const handleSearch = () => {
    setIsSearchModalOpen(true);
  };

  const classifiedChats = classifyChats(chats);

  // Dokümanları Fetch Etme İşlevi
  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Kullanıcı oturumu bulunamadı.");
      
      setIsDocumentLoading(true);
      const response = await fetch("https://libreconsulting.pythonanywhere.com/api/document/", {
        headers: {
          Authorization: `Token ${token}`, 
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      setDocuments(data.results);
    } catch (error) {
      console.error("Dokümanlar alınamadı:", error);
    } finally {
      setIsDocumentLoading(false);
    }
  };

  // Doküman Yükleme İşlevi
  const uploadDocument = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Kullanıcı oturumu bulunamadı.");
      
      setIsDocumentUploading(true);
      const response = await fetch("https://libreconsulting.pythonanywhere.com/api/document/", {
        method: "POST",
        headers: {
          Authorization: `Token ${token}`, 
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error uploading document:", errorData);
        throw new Error("Failed to upload document");
      }

      await fetchDocuments();
      setIsUploadComplete(true);
    } catch (error) {
      console.error("Error uploading document:", error);
    }
    finally {
      setIsDocumentUploading(false);
      console.log("File uploaded successfully");
    }
  };

  // Doküman Silme İşlevi
  const deleteDocument = async (documentId: number) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Kullanıcı oturumu bulunamadı.");

      setIsDocumentDeleting(documentId);
      const response = await fetch(`https://libreconsulting.pythonanywhere.com/api/document/${documentId}/`, {
        method: "DELETE",
        headers: {
          Authorization: `Token ${token}`, 
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to delete document with ID: ${documentId}`);
      }

      setDocuments((prevDocs) => prevDocs.filter((doc) => doc.id !== documentId));
    } catch (error) {
      console.error("Error deleting document:", error);
    }
    finally {
      setIsDocumentDeleting(null);
      console.log("File deleted successfully");
    }
  };

  return (
    <>
      <div
        ref={sidebarRef}
        className={`fixed inset-y-0 left-0 z-50 w-64 transition-transform duration-300 ease-in-out md:relative md:translate-x-0 dark:bg-gray-900 ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }` + (isMobile ? " bg-gray-100 dark:bg-gray-700" : "")}
      >
        <div className="flex h-full flex-col">
          <div className="shadow-md shadow-gray-200 dark:shadow-zinc-700 dark:text-gray-200">
            {/* Sidebar Başlığı */}
            <div className="flex items-center ml-6 py-3">
              <h2 className="text-xl font-semibold">Sohbetler</h2>
              <div className="flex items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSearch}
                  className="ml-5 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                  title="Sohbetlerde ara"
                >
                  <Search className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={createNewChat}
                  className="hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400"
                  title="Yeni sohbet oluştur"
                >
                  <SquarePen className="h-5 w-5 mx-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setOpen(false)}
                  className="md:hidden"
                >
                  <X className="h-6 w-6" />
                </Button>
              </div>
            </div>

            {/* Yeni Sohbet Butonu */}
            <Button
              className="w-48 mx-4 px-1 text-sm hover:bg-gray-200 dark:hover:bg-gray-700 justify-start"
              variant="ghost"
              onClick={createNewChat}
              title="Yeni sohbet oluştur"
            >
              <img
                src="/logo.png"
                alt="Yeni Sohbet Logosu"
                className="mr-1 h-6 w-6 border border-spacing-2 border-zinc-500 rounded-full"
              />
              Smart Assistant
            </Button>

            <Accordion type="single" collapsible className="w-full mt-auto mb-auto">
              <AccordionItem value="documents" className="border-b-gray-200 dark:border-b-gray-700">
              <AccordionTrigger
                onClick={() => {
                  if (documents.length === 0 && !isDocumentLoading) {
                    fetchDocuments(); // Sadece dokümanlar henüz yüklenmemişse çağır
                  }
                }}
              >
                <Button
                  className="w-48 px-2 ml-4 text-sm hover:bg-gray-200 dark:hover:bg-gray-700 justify-start"
                  variant="ghost"
                  title="Doküman Yönetimi Panelini Aç"
                >
                  {(isDocumentLoading && !isUploadComplete) ? <Loader className="h-4 w-4 animate-spin mr-2" /> : <FolderOpenDot className="mr-2 h-5 w-5 text-gray-800 dark:text-gray-200" />}
                  Doküman Yönetimi
                </Button>
              </AccordionTrigger>
                <AccordionContent>
                {(!isDocumentLoading || isUploadComplete) &&
                  <Button
                    className="w-48 mx-4 px-2 text-sm hover:bg-gray-200 dark:hover:bg-gray-700 justify-start"
                    variant="ghost"
                    onClick={() => fileInputRef.current?.click()}
                    title="Yeni Doküman Yükle"
                  >
                    {isDocumentUploading ? <Loader className="h-4 w-4 animate-spin mr-2" /> : <Upload className="mr-2 h-5 w-5 text-gray-800 dark:text-gray-200" />}
                    Yükle
                  </Button>
                }
                  {!isDocumentLoading && documents.length === 0 ? (
                    <p className="text-gray-500">Yüklenmiş doküman yok.</p>
                  ) : (
                    <ul className="px-4 bg-gray-100 dark:bg-gray-900">
                      {documents.map((doc) => (
                      <li
                        key={doc.id}
                        className="flex justify-between items-center text-left bg-gray-100 dark:bg-gray-900 rounded-lg"
                      >
                        <span title={doc.file.split('/').pop()} 
                              className="w-48 truncate text-[14px] font-sans hover:bg-gray-200 dark:hover:bg-gray-700 py-2 p-2 rounded-lg"
                        >{doc.file.split('/').pop()}
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:bg-gray-200 dark:hover:bg-gray-600 w-7"
                              title="Doküman Menüsü"
                            >
                              {isDocumentDeleting === doc.id ?
                                <Loader className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4 text-gray-400 dark:text-gray-500" />}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="ml-10 shadow-2xl bg-white dark:bg-gray-900 rounded-2xl p-2">
                            <DropdownMenuItem
                              onClick={() => deleteDocument(doc.id)}
                              className="rounded-lg text-red-600 font-semibold"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Dokümanı Sil
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </li>        
                      ))}
                    </ul>
                  )}
                </AccordionContent>
              </AccordionItem>
              <input
                type="file"
                ref={fileInputRef}
                onChange={uploadDocument}
                className="hidden"
              />
            </Accordion>
          </div>
          {/* Sohbet Listesi */}
          <ScrollArea className="flex-1 px-4">
            {isEntriesLoading && (
              <div className="absolute inset-4 flex items-start justify-center">
                <Loader className="h-4 w-4 animate-spin" />
              </div>
            )}
            <div className="space-y-4 py-4">
              {Object.entries(classifiedChats).map(
                ([category, categoryChats]) => (
                  <div key={category}>
                    <h3 className="mb-1 text-xs font-semibold text-gray-400">
                      {category}
                    </h3>
                    <div className="space-y-0.5">
                      {categoryChats
                        .sort(
                          (a, b) =>
                            new Date(b.created_at).getTime() -
                            new Date(a.created_at).getTime()
                        )
                        .map((chat) => (
                          <div key={chat.entry_id} className="flex items-center">
                            {/* Entry Name */}
                            {renamingChatId === chat.entry_id ? (
                              <form
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  handleRename(chat.entry_id);
                                }}
                                className="flex-1 mr-2"
                              >
                                <Input
                                  value={newTitle}
                                  onChange={(e) => setNewTitle(e.target.value)}
                                  placeholder="Sohbet adını girin"
                                  className="bg-gray-800 text-white"
                                  onBlur={() => handleRename(chat.entry_id)}
                                  autoFocus
                                />
                              </form> 
                            ) : (
                              <Button
                                variant={
                                  chat.entry_id === currentChatId
                                    ? "default"
                                    : "ghost"
                                }
                                className={`w-48 flex justify-between items-center text-left text-[14px] truncate px-2 py-1 font-normal font-sans ${
                                  chat.entry_id === currentChatId
                                    ? "bg-gray-200 text-black hover:bg-gray-300 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                                    : "hover:bg-gray-200 dark:hover:bg-gray-700"
                                }`}
                                onClick={() => handleChatClick(chat.entry_id)}
                                title={chat.entry_name}
                              >
                                {chat.entry_name}
                              </Button>
                            )}

                            {/* Dropdown Menü */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="hover:bg-zinc-200 dark:hover:bg-zinc-700 w-7 ml-1"
                                  title="Sohbet menüsü"
                                >
                                  <MoreVertical className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent data-dropdown-menu className="ml-10 shadow-2xl bg-white dark:bg-gray-900 rounded-2xl p-2">
                                <DropdownMenuItem
                                  onClick={() => shareChat(chat.entry_id)} className="rounded-lg"
                                >
                                  <Share className="mr-2 h-4 w-4" />
                                  Paylaş
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setRenamingChatId(chat.entry_id)} className="rounded-lg"
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Yeniden Adlandır
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => deleteChat(chat.entry_id)} className="rounded-lg text-red-600 font-semibold"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Sil
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ))}
                    </div>
                  </div>
                )
              )}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Arama Modalı */}
      {isSearchModalOpen && (
        <SearchModal
          isOpen={isSearchModalOpen}
          onClose={() => setIsSearchModalOpen(false)}
          chats={chats}
          setCurrentChatId={setCurrentChatId}
        />
      )}
      
      {/* Doküman Yükleme Tamam Modalı */}
      {isUploadComplete && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-10 shadow-lg">
            <h2 className="text-lg font-semibold text-center">Doküman Yüklendi!</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
              Doküman başarıyla yüklendi ve sisteminize eklendi.
            </p>
            <Button
              className="mt-4 mx-auto block"
              onClick={() => setIsUploadComplete(false)}
            >
              Tamam
            </Button>
          </div>
        </div>
      )}

    </>
  );
};
