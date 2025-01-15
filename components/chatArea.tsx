"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, Paperclip, Loader, X } from "lucide-react";
import { ChatMessage } from "./chatLayout";

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
};

export const ChatArea = ({
  currentChatId,
  setCurrentChatId,
  messages,
  addMessageToChat,
  createNewChat,
  fetchChatEntries,
  setMessages,
  isMobile,
}: ChatAreaProps) => {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAnimation, setShowAnimation] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<
    keyof typeof genericQuestions | null
  >(null);
  const [showQuestions, setShowQuestions] = useState(false); // Geçiş efekti için

  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      ) as HTMLElement; // Doğru DOM elemanını seçiyoruz
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  }, [messages]);

  // gpt_response bouncing latency animasyonu
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

    const tempMessage = { user_query: input, gpt_response: "" };
    // Geçici mesajı ekle
    addMessageToChat(currentChatId || "", tempMessage);
    setInput("");
    setIsLoading(true);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        "https://libreconsulting.pythonanywhere.com/api/chatbot/",
        {
          method: "POST",
          headers: {
            Authorization: `Token ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: input,
            entry_id: currentChatId || "",
          }),
        }
      );

      if (!response.body) {
        throw new Error("Yanıt akışı alınamadı.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let cumulativeResponse = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.trim().split("\n");

        for (const line of lines) {
          if (!line.startsWith("data:")) continue;

          const json = JSON.parse(line.slice(5)); // "data:" sonrası parse edilir

          if (json.token) {
            // Token geldikçe biriktir ve güncelle
            cumulativeResponse += json.token;

            // Update the last message in state
            setMessages((prevMessages: ChatMessage[]) => {
              const lastIndex = prevMessages.length - 1;
              const updatedMessages = [...prevMessages];
              updatedMessages[lastIndex] = {
                ...updatedMessages[lastIndex],
                gpt_response: cumulativeResponse.trim(),
              };
              return updatedMessages;
            });
          } else if (json.entry_id && json.created_at) {
            // Yanıt tamamlandığında entry_id ve timestamp güncelle
            setCurrentChatId(json.entry_id);
            if (messages.length === 0) {
              console.log("Messages length:", messages.length);
              fetchChatEntries(); // Tüm entry'leri yenile
            }
          }
        }
      }
    } catch (error) {
      alert(
        "Mesaj gönderimi sırasında bir hata oluştu. Lütfen tekrar deneyin."
      );
      console.error("Hata:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAttachment = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const message = `Attached file: ${file.name}`;
      createNewChat(); // Yeni sohbet başlatılır
      addMessageToChat(currentChatId || "", {
        user_query: message,
        gpt_response: "",
      });
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
      setShowQuestions(false); // Önce diğer soruları gizle
      setTimeout(() => {
        setSelectedEntry(entry);
        setShowQuestions(true); // Yeni seçilen soruları göster
      }, 300); // Geçiş efekti süresi
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
            {/* Üstteki Mesaj */}
            <p className="text-gray-600 text-center text-3xl font-light tracking-wide">
              Bir sohbet seçin veya yeni bir sohbet oluşturun.
            </p>

            {/* Demo İçin kullanılacak std.entry gösterimi menüsü */}
            {/* Standart Girişler */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 sm:grid-cols-3 gap-4">
              {standardEntries.map((entry, index) => (
                <button
                  key={index}
                  onClick={() =>
                    handleEntryClick(
                      entry.text as keyof typeof genericQuestions
                    )
                  }
                  className="border-e-2 group flex flex-col items-center justify-center space-y-2 w-28 h-28 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200
                   border-gray-200 hover:border-zinc-400 dark:border-gray-600 rounded-3xl shadow-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition ease-in-out duration-300 dark:hover:border-zinc-500"
                >
                  <div className="text-3xl">{entry.icon}</div>

                  {/* Metin */}
                  <span className="text-xs font-light tracking-wide text-gray-900 dark:text-gray-300 group-hover:text-red-700 transition-all ease-in-out duration-300 dark:group-hover:text-white">
                    {entry.text}
                  </span>
                </button>
              ))}
            </div>

            {/* Jenerik Sorular */}
            {selectedEntry && (
              <div
                className={`absolute bottom-12 left-1/2 transform -translate-x-1/2 transition-all duration-500 ease-in-out ${
                  showQuestions ? "opacity-100 visible" : "opacity-0 invisible"
                } ${
                  isMobile && "bg-gray-200 dark:bg-gray-700 p-7 rounded-lg w-[90%]"
                }`}
              >
                {isMobile && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-2"
                    onClick={() => {
                      setShowQuestions(false);
                    }}
                  >
                    <X className="h-10 w-10" />
                  </Button>
                )}
                <p className="text-gray-500 font-light text-center tracking-wide">
                  {selectedEntry === "Daha fazla"
                    ? "Başka neler yapabiliriz, bir bakalım mı?"
                    : `"${selectedEntry}" hakkında sana nasıl yardımcı olmamı istersin?`}
                </p>
                <div
                  className={`flex flex-col items-center mt-2 ${
                    isMobile && "gap-1"
                  }`}
                >
                  {genericQuestions[selectedEntry]?.map((question, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setInput(question);
                        setShowQuestions(false);
                      }}
                      className="px-4 py-2 w-full bg-white dark:bg-gray-800 text-gray-800 hover:text-gray-950 dark:text-gray-300 border border-gray-100 hover:border-gray-300 dark:border-gray-700 rounded-lg shadow-lg
                         hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white dark:hover:border-gray-500 transition-all ease-in-out duration-300 text-sm font-light tracking-wide cursor-pointer"
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
              {/* Kullanıcı Mesajı */}
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
                    <AvatarFallback>AA</AvatarFallback>
                  </Avatar>
                </div>
              )}

              {/* AI Yanıtı */}
              {(showAnimation || message.gpt_response) && (
                <div className="flex justify-start items-start">
                  {/* AI Avatar */}
                  <Avatar
                    className={`h-7 w-7 border border-spacing-2 border-zinc-500 mr-2 ${
                      !isMobile ? "ml-10" : ""
                    }`}
                  >
                    <AvatarImage src="/logo.png" alt="AI" />
                    <AvatarFallback>AI</AvatarFallback>
                  </Avatar>

                  {/* Yanıt Alanı */}
                  <div
                    className={`rounded-lg p-2 max-w-[60%] ${
                      isMobile ? "max-w-[80%]" : ""
                    }`}
                  >
                    {index === messages.length - 1 && isLoading ? (
                      showAnimation ? ( // 1 saniye sonra animasyon başlar
                        <div>
                          <div className="font-sans tracking-wide">
                            {message.gpt_response}
                          </div>
                          <div className="flex items-center space-x-2 mt-3">
                            <div className="h-3 w-3 bg-gray-500 dark:bg-gray-300 rounded-full animate-bounce font-sans"></div>
                          </div>
                        </div>
                      ) : (
                        <div className="font-sans tracking-wide">
                          {message.gpt_response}
                        </div>
                      )
                    ) : (
                      <div className="font-sans tracking-wide">
                        {message.gpt_response}
                      </div>
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
        className={`p-4 sticky bottom-0 w-full ${
          !isMobile ? "max-w-[60%] ml-auto mr-auto" : ""
        }`}
      >
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 tracking-wide">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault(); // Sayfanın yenilenmesini önler
                  sendMessage(e); // Mesaj gönderme işlevini çağırır
                }
              }}
              placeholder="Mesajınızı buraya yazın..."
              className="pr-10 min-h-[100px] rounded-2xl font-sans font-normal bg-gray-100 dark:bg-gray-700 tracking-wide"
              style={{ fontSize: "16px" }}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute bottom-2 left-2 hover:bg-gray-200 dark:hover:bg-gray-600"
              onClick={handleAttachment}
              title="Doküman Ekle"
            >
              <Paperclip className="h-5 w-5" />
            </Button>
            {/* Send Butonu */}
            <Button
              type="submit"
              size="icon"
              disabled={isLoading}
              className="absolute bottom-2 right-2 bg-gray-500 dark:bg-gray-600 hover:bg-gray-800 dark:hover:bg-gray-800"
            >
              {isLoading ? (
                <Loader className="h-5 w-5 animate-spin text-black dark:text-white" />
              ) : (
                <Send className="h-4 w-4 text-gray-200 dark:text-gray-400 hover:dark:text-white" />
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
