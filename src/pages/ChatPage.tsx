import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useParams } from "react-router";
import { ChatMessage } from "~/components/ChatMessage";
import { ThoughtMessage } from "~/components/ThoughtMessage";
import { Button } from "~/components/ui/button";
import { Textarea } from "~/components/ui/textarea";
import { db } from "~/lib/dexie";
import { ArrowDown, Brain, Send, StopCircle, Sparkles } from "lucide-react";

/**
 * Modern, interactive ChatPage
 */

const ChatPage = () => {
  const [textInput, setTextInput] = useState("");
  const [streamedThought, setStreamedThought] = useState("");
  const [streamedMessage, setStreamedMessage] = useState("");
  const [isComposing, setIsComposing] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showThoughts, setShowThoughts] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cancelRef = useRef({ cancel: false });
  const textRef = useRef<HTMLTextAreaElement | null>(null);
  const scrollToBottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLElement | null>(null);

  const params = useParams();

  const messages = useLiveQuery(
    () => db.getMessagesForThread(params.threadId as string),
    [params.threadId]
  );

  // ---- utils: scroll ----
  const scrollToBottom = (smooth = true) => {
    if (scrollToBottomRef.current) {
      scrollToBottomRef.current.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    }
  };

  const updateIsAtBottom = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const threshold = 64; // px tolerance
    setIsAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight < threshold);
  };

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const onScroll = () => updateIsAtBottom();
    el.addEventListener("scroll", onScroll, { passive: true });
    updateIsAtBottom();
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  useLayoutEffect(() => {
    if (isAtBottom) scrollToBottom(false);
  }, [messages, streamedMessage, streamedThought]);

  // ---- textarea autosize ----
  useEffect(() => {
    if (!textRef.current) return;
    textRef.current.style.height = "auto";
    const h = Math.min(textRef.current.scrollHeight, 200);
    textRef.current.style.height = h + "px";
  }, [textInput]);

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!textInput.trim() || isStreaming) return;
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    const prompt = textInput.trim();
    if (!prompt) return;

    setError(null);
    setIsStreaming(true);
    cancelRef.current.cancel = false;

    await db.createMessage({
      content: prompt,
      role: "user",
      threadId: params.threadId as string,
      thought: "",
    });

    setTextInput("");
    setStreamedMessage("");
    setStreamedThought("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch AI response");
      }

      const data = await res.json();

      const reply = data.reply ?? "";

      setStreamedMessage(reply);

      await db.createMessage({
        content: reply,
        role: "assistant",
        threadId: params.threadId as string,
        thought: "", // DeepSeek API tidak expose <think>
      });
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : String(err);
      setError(message || "Something went wrong.");
    } finally {
      setIsStreaming(false);
      setStreamedMessage("");
      setStreamedThought("");
      setTimeout(() => scrollToBottom(), 0);
    }
  };


  const stopGeneration = () => {
    if (!isStreaming) return;
    cancelRef.current.cancel = true;
    setIsStreaming(false);
  };

  const beautifyPrompt = () => {
    const s = textInput.replace(/\s+/g, " ").trim();
    const punct = /[.!?]$/;
    setTextInput(punct.test(s) ? s : s + ".");
  };

  return (
    <div className="flex flex-col flex-1 relative">
      {/* animated gradient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(60%_50%_at_50%_0%,rgba(19,234,253,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(40%_40%_at_80%_20%,rgba(161,68,255,0.10),transparent_60%)]" />
      </div>

      {/* header */}
      <header className="sticky top-0 z-20 flex items-center justify-between h-16 border-b px-4 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-widest">Dashboard</h1>
          <span className="text-xs md:text-sm text-muted-foreground">Thread: {params.threadId}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={showThoughts ? "default" : "outline"} size="sm" onClick={() => setShowThoughts((s) => !s)} title={showThoughts ? "Hide thinking" : "Show thinking"}>
            <Brain className="h-4 w-4 mr-2" />
            {showThoughts ? "Thoughts On" : "Thoughts Off"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => scrollToBottom()} title="Scroll to latest">
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* main chat area */}
      <main ref={scrollContainerRef as React.RefObject<HTMLElement>} className="flex-1 overflow-auto p-4 w-full relative">
        <div className="mx-auto pb-32 max-w-screen-xl w-full">
          {/* glass panel */}
          <div className="rounded-2xl border bg-background/60 backdrop-blur p-4 md:p-6 shadow-sm">
            <div className="space-y-4">
              {messages?.map((message, index) => (
                <ChatMessage key={index} role={message.role} content={message.content} thought={showThoughts ? message.thought : ""} />
              ))}

              {/* streaming thinking bubble */}
              {showThoughts && streamedThought && (
                <ThoughtMessage thought={streamedThought} />
              )}

              {/* streaming assistant bubble */}
              {streamedMessage && (
                <ChatMessage role="assistant" content={streamedMessage} />
              )}

              {/* error banner */}
              {error && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div ref={scrollToBottomRef} />
            </div>
          </div>
        </div>

        {/* scroll-to-bottom floating button */}
        {!isAtBottom && (
          <div className="sticky bottom-28 flex justify-center">
            <Button onClick={() => scrollToBottom()} variant="secondary" className="shadow-md">
              <ArrowDown className="mr-2 h-4 w-4" /> New messages
            </Button>
          </div>
        )}
      </main>

      {/* composer */}
      <footer className="sticky bottom-0 z-10 border-t backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="max-w-screen-xl mx-auto px-4 py-3">
          <div className="rounded-2xl border bg-background/70 backdrop-blur p-3 shadow-sm">
            <div className="flex items-start gap-3">
              <Button type="button" variant="outline" size="icon" className="shrink-0" onClick={beautifyPrompt} title="Tidy up your prompt">
                <Sparkles className="h-4 w-4" />
              </Button>

              <Textarea
                ref={textRef}
                className="flex-1 resize-none text-sm md:text-base border-0 shadow-none focus-visible:ring-0 bg-transparent"
                placeholder="Ask anything… (Enter to send, Shift+Enter for new line)"
                rows={1}
                onChange={(e) => setTextInput(e.target.value)}
                value={textInput}
                onKeyDown={handleTextareaKeyDown}
                onCompositionStart={() => setIsComposing(true)}
                onCompositionEnd={() => setIsComposing(false)}
                disabled={isStreaming}
              />

              {!isStreaming ? (
                <Button onClick={handleSubmit} type="button" disabled={!textInput.trim()} title={!textInput.trim() ? "Type a message first" : "Send"}>
                  <Send className="h-4 w-4 mr-2" /> Send
                </Button>
              ) : (
                <Button onClick={stopGeneration} type="button" variant="destructive" title="Stop generating">
                  <StopCircle className="h-4 w-4 mr-2" /> Stop
                </Button>
              )}
            </div>

            <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>Enter to send • Shift+Enter for newline</span>
              <span>{textInput.length}/4000</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ChatPage;
