"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Paperclip, Loader, X, FolderOpenDot, Copy, ThumbsUp, ThumbsDown, Volume2 } from "lucide-react";
import { ChatMessage, ChatEntry } from "./chatLayout";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { markdownComponents } from "./markdownComponents";


type ChatAreaProps = {
  currentChatId: string | null;
  setCurrentChatId: (id: string) => void;
  messages: ChatMessage[];
  addMessageToChat: (chatId: string, message: ChatMessage) => void;
  createNewChat: () => void;
  setOpen: (open: boolean) => void;
  fetchChatEntries: () => void;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  isMobile: boolean;
  appendNewChatEntry: (entry: ChatEntry) => void;
  updateEntryTimestampLocally: (chatId: string) => void; 
};

export const ChatArea = ({
  currentChatId,
  setCurrentChatId,
  messages,
  addMessageToChat,
  createNewChat,
  setMessages,
  isMobile,
  appendNewChatEntry,
  updateEntryTimestampLocally,
}: ChatAreaProps) => {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<keyof typeof genericQuestions | null>(null);
  const [showQuestions, setShowQuestions] = useState(false); // Geçiş efekti için
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [chunks, setChunks] = useState("");
  const [openSourcesFor, setOpenSourcesFor] = useState<number | null>(null);
  
  const user = JSON.parse(localStorage.getItem("user") || "null");  
  const initials = user
      ? `${user.first_name?.charAt(0) || ""}${user.last_name?.charAt(0) || ""}`.toUpperCase()
      : "AA";

  // scrollArea kaydırma işlemi
  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector("[data-radix-scroll-area-viewport]") as HTMLElement;
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages, chunks]);

  // Yüklenme animasyonu
  useEffect(() => {
    if (isLoading) {
      const timeout = setTimeout(() => setShowAnimation(true), 1000);
      return () => clearTimeout(timeout);
    } else {
      setShowAnimation(false);
    }
  }, [isLoading]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const questionText = input;
    const tempMessage = { user_query: questionText, gpt_response: "", sources: [] };
    setMessages((prev) => (prev.length === 0 ? [tempMessage] : [...prev, tempMessage]));
    setInput("");
    setIsLoading(true);

    let chatId = currentChatId;
    const API_URL = process.env.NEXT_PUBLIC_API_URL;
    const token = localStorage.getItem("token");

    if (!chatId) {
      try {
        const response = await fetch(`${API_URL}/api/chatbot/`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Token ${token}`,
          },
        });
        const data = await response.json();
        if (data.entry_id) {
          chatId = data.entry_id;
        }
      } catch (error) {
        console.error("Entry ID alınırken hata oluştu:", error);
        setIsLoading(false);
        return;
      }
    }

    const wsBaseURL = process.env.NEXT_PUBLIC_WS_BASE_URL;
    
    if (!socket || socket.readyState !== WebSocket.OPEN) {
      const newSocket = new WebSocket(`${wsBaseURL}/ws/chat/${chatId}/?token=${token}`);
      newSocket.onopen = () => {
        newSocket.send(JSON.stringify({ question: input, entry_id: chatId }));
      };
      newSocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.token) {
          setChunks((prev) => prev + data.token);
        }
        if (data.status === "completed") {
          setIsLoading(false);
          setMessages((prevMessages: ChatMessage[]) => {
            // Eğer mevcut mesaj yoksa, direkt yeni bir array oluşturun:
            if (prevMessages.length === 0) {
              return [{
                user_query: questionText,
                gpt_response: data.final_answer,
                sources: data.sources && data.sources.length > 0 ? data.sources : [],
              }];
            } else {
              // Eğer mevcut mesaj varsa, son mesajı güncelleyin.
              return prevMessages.map((msg, index) =>
                index === prevMessages.length - 1
                  ? {
                      ...msg,
                      gpt_response: data.final_answer,
                      sources: data.sources && data.sources.length > 0 ? data.sources : msg.sources ?? [],
                    }
                  : msg
              );
            }
          });
          setChunks("");
          if (chatId) {
            setCurrentChatId(chatId)
          }
          if (currentChatId) {
            // Burada local state'te created_at'i güncelle
            updateEntryTimestampLocally(currentChatId);
          } else {
            // Yeni oluşturulmuşsa appendNewChatEntry
            appendNewChatEntry({
              entry_id: data.entry_id,
              entry_name: data.entry_name || "New Entry",
              created_at: data.created_at,
            });
          }
          newSocket.close();
        }
      };
      newSocket.onclose = () => {
        console.log(`WebSocket kapandı: ${chatId}`);
        console.log('messages-state', messages);
      };
      setSocket(newSocket);
    }
    socket?.send(JSON.stringify({ question: input, entry_id: chatId }));
  };

  const handleAttachment = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const message = `Attached file: ${file.name}`;
      createNewChat();
      addMessageToChat(currentChatId || "", { user_query: message, gpt_response: "" });
    }
  };

  const standardEntries = [
    { text: "Ekosistemimiz", icon: "🖼️" },
    { text: "Organizasyon", icon: "🔍" },
    { text: "İş Akış Planı", icon: "📝" },
    { text: "Dokümantasyon", icon: "📄" },
    { text: "Daha fazla", icon: "➕" },
  ];

  const genericQuestions = {
    Ekosistemimiz: [
      "Dağıtım kanallarımız nelerdir?",
      "Departman yapımız hakkında genel bilgi verir misin?",
      "Teknolojik iş ortaklarımıza dair genel bilgiler verir misin?",
    ],
    Organizasyon: [
      "Organizasyonel süreçlerimiz nelerdir?",
      "Şirketimizin departmanlar yapısını bana özetler misin?",
      "Belirli bir pozisyonda çalışanları aramama yardımcı ol",
    ],
    "İş Akış Planı": [
      "Satış sonrası hizmetlerimiz nelerdir?",
      "Müşteri şikayeti süreci nasıl yönetilir?",
      "Ürün iade iş adımlarında yardım istiyorum.",
    ],
    Dokümantasyon: [
      "Kalite yönetim sistemimiz konusunda yardım",
      "Saha kurum kültürümüz hakkında bilgi istiyorum",
      "Kredi derecelendirme üzerinden Kanban Yönetim Sistemi nedir?",
    ],
    "Daha fazla": [
      "Bankacılıkta israf kaynakları ve önleme metotları",
      "Bir dokümanı özetlememe yardımcı ol",
      "Beyin fırtınası yapalım mı?",
    ],
  };

  const handleEntryClick = (entry: keyof typeof genericQuestions) => {
    if (selectedEntry === entry) {
      setShowQuestions(!showQuestions);
    } else {
      setShowQuestions(false);
      setTimeout(() => {
        setSelectedEntry(entry);
        setShowQuestions(true);
      }, 300);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
      <ScrollArea
        className="flex-1 p-4"
        ref={scrollAreaRef}
        style={{ maxHeight: "calc(100vh - 200px)" }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center lg:h-80 space-y-10 mt-10">
            <p className="text-gray-600 text-center text-3xl font-light tracking-wide">
              Bir sohbet seçin veya yeni bir sohbet oluşturun.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 sm:grid-cols-3 gap-4">
              {standardEntries.map((entry, index) => (
                <button
                  key={index}
                  onClick={() =>
                    handleEntryClick(entry.text as keyof typeof genericQuestions)
                  }
                  className="border-e-2 group flex flex-col items-center justify-center space-y-2 w-28 h-28 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 border-gray-200 hover:border-zinc-400 dark:border-gray-600 rounded-3xl shadow-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition ease-in-out duration-300 dark:hover:border-zinc-500"
                >
                  <div className="text-3xl">{entry.icon}</div>
                  <span className="text-xs font-light tracking-wide text-gray-900 dark:text-gray-300 group-hover:text-red-700 transition-all ease-in-out duration-300 dark:group-hover:text-white">
                    {entry.text}
                  </span>
                </button>
              ))}
            </div>
            {selectedEntry && (
              <div
                className={`absolute bottom-12 left-1/2 transform -translate-x-1/2 transition-all duration-500 ease-in-out ${
                  showQuestions ? "opacity-100 visible" : "opacity-0 invisible"
                } ${isMobile && "bg-gray-200 dark:bg-gray-700 p-7 rounded-lg w-[90%]"}`}
              >
                {isMobile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-2"
                    onClick={() => setShowQuestions(false)}
                  >
                    <X className="h-10 w-10" />
                  </Button>
                )}
                <p className="text-gray-500 font-light text-center tracking-wide">
                  {selectedEntry === "Daha fazla"
                    ? "Başka neler yapabiliriz, bir bakalım mı?"
                    : `"${selectedEntry}" hakkında sana nasıl yardımcı olmamı istersin?`}
                </p>
                <div className={`flex flex-col items-center mt-2 ${isMobile && "gap-1"}`}>
                  {genericQuestions[selectedEntry]?.map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInput(question);
                        setShowQuestions(false);
                      }}
                      className="px-4 py-2 w-full bg-white dark:bg-gray-800 text-gray-800 hover:text-gray-950 dark:text-gray-300 border border-gray-100 hover:border-gray-300 dark:border-gray-700 rounded-lg shadow-lg hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white dark:hover:border-gray-500 transition-all ease-in-out duration-300 text-sm font-light tracking-wide cursor-pointer"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          messages.map((message, index) => (
            <div key={index} className="mb-4">
              {message.user_query && (
                <div className="flex justify-end items-start mb-4">
                  <div
                    className={`rounded-2xl p-2 max-w-[50%] bg-gray-100 text-gray-700 font-sans dark:bg-gray-600 dark:text-gray-200 tracking-wide ${
                      !isMobile ? "max-w-[30%]" : ""
                    }`}
                  >
                    {message.user_query}
                  </div>
                  <Avatar className={`ml-2 ${!isMobile ? "mr-28" : ""}`}>
                    <AvatarImage src="/placeholder.svg" alt="User" />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                </div>
              )}
              {(isLoading || message.gpt_response) && (
                <div className="flex justify-start items-start relative w-full text-gray-700 dark:text-gray-200">
                  <Avatar
                    className={`h-7 w-7 border border-spacing-2 border-zinc-500 mr-2 ${
                      !isMobile ? "ml-10" : ""
                    }`}
                  >
                    <AvatarImage src="/logo.png" alt="AI" />
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>
                  <div className="flex w-full relative">
                    <div
                      className={`p-2 tracking-wide ${
                        isMobile ? "max-w-[80%]" : "max-w-[60%]"
                      }`}
                    >
                      {index === messages.length - 1 && isLoading ? (
                        showAnimation ? (
                          <div>
                            <ReactMarkdown
                              className="font-sans tracking-wide prose prose-lg prose-gray dark:prose-invert leading-relaxed"
                              components={markdownComponents}
                              remarkPlugins={[remarkGfm]}
                              rehypePlugins={[rehypeRaw]}
                            >
                              {chunks}
                            </ReactMarkdown>
                            <div className="flex items-center space-x-2 mt-3">
                              <div className="h-3 w-3 bg-gray-500 dark:bg-gray-300 rounded-full animate-bounce"></div>
                            </div>
                          </div>
                        ) : (
                          <ReactMarkdown
                            className="font-sans tracking-wide prose prose-lg prose-gray dark:prose-invert leading-relaxed"
                            components={markdownComponents}
                            remarkPlugins={[remarkGfm]}
                            rehypePlugins={[rehypeRaw]}
                          >
                            {chunks}
                          </ReactMarkdown>
                        )
                      ) : (
                        <ReactMarkdown
                          className="font-sans tracking-wide leading-relaxed prose prose-lg prose-gray dark:prose-invert"
                          components={markdownComponents}
                          remarkPlugins={[remarkGfm]}
                          rehypePlugins={[rehypeRaw]}
                        >
                          {message.gpt_response}
                        </ReactMarkdown>
                      )}
                      {index === messages.length - 1 && message.gpt_response && (
                        <div className="mt-4  text-gray-500 dark:text-gray-400">
                          <Button
                            variant="ghost"
                            className="dark:hover:bg-gray-700"
                            title="Cevabı panoya kopyala"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(message.gpt_response);
                              alert("Cevap panoya kopyalandı!");
                            }}
                          >
                            <Copy className="h-4 w-4"></Copy>
                          </Button>
                          <Button
                            variant="ghost"
                            className="dark:hover:bg-gray-700"
                            title="Cevabı beğen"
                            size="sm"
                            onClick={() => {
                              alert("Cevabı beğendiniz!");
                            }}
                          >
                            <ThumbsUp></ThumbsUp>
                          </Button>
                          <Button
                            variant="ghost"
                            className="dark:hover:bg-gray-700"
                            title="Cevabı beğenmediniz"
                            size="sm"
                            onClick={() => {
                              alert("Cevabı beğenmediniz!");
                            }}
                          >
                            <ThumbsDown></ThumbsDown>
                          </Button>
                          <Button
                            variant="ghost"
                            className="dark:hover:bg-gray-700"
                            title="Mesajı seslendir"
                            size="sm"
                            onClick={() => {
                              alert("Mesaj seslendiriliyor!");
                            }}
                          >
                            <Volume2></Volume2>
                          </Button>
                        </div>
                      )}
                    </div>
                        
                    {message.sources && message.sources.length > 0 && (
                      <>
                        {/* Sağdaki dikey "Kaynakça" butonu */}
                        <div className="absolute bottom-20 right-0 flex flex-col z-50 items-end mb-16">
                          <button
                            className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold py-2 px-4 rounded-b-lg rotate-90 transform translate-x-10 flex items-center gap-1 opacity-60"
                            onClick={() => setOpenSourcesFor(openSourcesFor === index ? null : index)}
                          >
                            <FolderOpenDot className="h-5 w-5 -rotate-90" /> Kaynakça
                          </button>
                        </div>

                        {/* Açılan Kaynakça Paneli */}
                        <div
                          className={`absolute bottom-0 right-0 mb-16 bg-white dark:bg-gray-800 shadow-lg border border-gray-300 dark:border-gray-700 rounded-lg p-4 w-64 transition-transform duration-300 ${
                            openSourcesFor === index ? "translate-x-0 mr-6" : "translate-x-full" 
                          }`}
                        >
                          <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                              <FolderOpenDot className="h-6 w-6" /> Doküman Kaynakları
                            </h3>
                            <button
                              onClick={() => setOpenSourcesFor(null)}
                              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>
                          <ul className="list-disc pl-2 space-y-2">
                            {message.sources.map((item, idx) => (
                              <li key={idx} className="text-sm text-gray-700 dark:text-gray-300">
                                <strong className="block truncate">
                                  {item.source.split(/[/\\]/).pop()}
                                </strong>
                                <span className="text-xs text-gray-500">{item.snippet}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </ScrollArea>
      <form
        onSubmit={sendMessage}
        className={`p-4 sticky bottom-0 w-full ${!isMobile ? "max-w-[60%] ml-auto mr-auto" : ""}`}
      >
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 tracking-wide">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e);
                }
              }}
              placeholder="Mesajınızı buraya yazın..."
              className="pr-10 min-h-[100px] rounded-2xl font-sans font-normal bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 tracking-wide"
              style={{ fontSize: "16px" }}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute bottom-2 left-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
              onClick={handleAttachment}
              title="Doküman Ekle"
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            <Button
              type="submit"
              size="icon"
              disabled={isLoading}
              title="Mesaj Gönder"
              className={`
                absolute bottom-2 right-2
                rounded-full
                bg-blue-600 dark:bg-blue-700
                hover:bg-blue-700 dark:hover:bg-blue-800
                text-white
                transition-all duration-200
                focus:outline-none
                focus:ring-2
                focus:ring-offset-2
                focus:ring-blue-500 dark:focus:ring-blue-600
                active:scale-95
                disabled:opacity-70
                disabled:cursor-not-allowed
              `}
            >
              {isLoading ? (
                <Loader className="h-5 w-5 animate-spin text-white" />
              ) : (
                <Send className="h-5 w-5 dark:text-white" />
              )}
            </Button>
          </div>
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
