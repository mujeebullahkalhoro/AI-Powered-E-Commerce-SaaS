"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { sendMessage } from "@/lib/api/chat";
import { ApiError } from "@/lib/api/client";
import type { ChatProduct } from "@/lib/api/types";
import { formatPrice } from "@/lib/products";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/Button";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  products?: ChatProduct[];
}

function createMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function ChatWidget() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });

    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
    }

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, isOpen]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSend = async (event: FormEvent) => {
    event.preventDefault();

    const text = input.trim();
    if (!text || isTyping) {
      return;
    }

    setInput("");
    setError(null);
    setIsTyping(true);

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: "user",
      content: text,
    };

    setMessages((current) => [...current, userMessage]);

    try {
      const data = await sendMessage({
        message: text,
        conversationId: conversationId ?? undefined,
      });

      setConversationId(data.conversationId);

      const assistantMessage: ChatMessage = {
        id: createMessageId(),
        role: "assistant",
        content: data.reply,
        products: data.products,
      };

      setMessages((current) => [...current, assistantMessage]);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Failed to send message";
      setError(
        message.includes("tool call rounds")
          ? "The assistant had trouble responding. Please try again."
          : message,
      );
    } finally {
      setIsTyping(false);
    }
  };

  if (!hydrated || !isAuthenticated) {
    return null;
  }

  return (
    <>
      {isOpen ? (
        <button
          type="button"
          aria-label="Close chat backdrop"
          className="fixed inset-0 z-40 bg-black/40 sm:bg-transparent"
          onClick={() => setIsOpen(false)}
        />
      ) : null}

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex justify-end p-4 sm:inset-x-auto sm:left-auto sm:right-0 sm:p-6">
        <div className="pointer-events-auto flex w-full max-w-[350px] flex-col items-end">
          {isOpen ? (
            <div
              className="mb-3 flex w-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl sm:mb-4"
              style={{
                height: "min(500px, calc(100dvh - 6rem))",
                maxHeight: "min(85dvh, 500px)",
              }}
            >
              <header className="flex shrink-0 items-center justify-between border-b border-zinc-200 bg-zinc-900 px-4 py-3 text-white">
                <div className="min-w-0 pr-2">
                  <p className="truncate text-sm font-semibold">Shopping Assistant</p>
                  <p className="truncate text-xs text-zinc-300">Ask about products</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="shrink-0 rounded-lg p-1.5 text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
                  aria-label="Close chat"
                >
                  <CloseIcon />
                </button>
              </header>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-zinc-50 p-3 sm:p-4">
                {messages.length === 0 ? (
                  <p className="text-center text-sm text-zinc-500">
                    Hi! I can help you find products. Try asking for recommendations.
                  </p>
                ) : null}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm sm:max-w-[85%] ${
                        message.role === "user"
                          ? "bg-zinc-900 text-white"
                          : "border border-zinc-200 bg-white text-zinc-800"
                      }`}
                    >
                      <p className="whitespace-pre-wrap break-words">{message.content}</p>

                      {message.products && message.products.length > 0 ? (
                        <div className="mt-2 space-y-2">
                          {message.products.map((product) => (
                            <Link
                              key={product.id}
                              href={`/products/${product.id}`}
                              onClick={() => setIsOpen(false)}
                              className="block rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 transition-colors hover:border-zinc-300 hover:bg-white"
                            >
                              <p className="font-medium text-zinc-900">{product.name}</p>
                              <p className="text-xs text-zinc-600">
                                {formatPrice(product.price)}
                              </p>
                            </Link>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}

                {isTyping ? (
                  <div className="flex justify-start">
                    <div className="rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-500">
                      <span className="inline-flex items-center gap-1">
                        <TypingDots />
                        Assistant is typing
                      </span>
                    </div>
                  </div>
                ) : null}

                {error ? (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    {error}
                  </p>
                ) : null}

                <div ref={messagesEndRef} />
              </div>

              <form
                onSubmit={handleSend}
                className="flex shrink-0 items-center gap-2 border-t border-zinc-200 bg-white p-3"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask about products..."
                  disabled={isTyping}
                  className="h-10 min-w-0 flex-1 rounded-lg border border-zinc-300 px-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 disabled:bg-zinc-50"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="shrink-0"
                  disabled={isTyping || !input.trim()}
                >
                  Send
                </Button>
              </form>
            </div>
          ) : null}

          <button
            type="button"
            onClick={() => setIsOpen((open) => !open)}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-white shadow-lg transition-transform hover:scale-105 hover:bg-zinc-800 sm:h-14 sm:w-14"
            aria-label={
              isOpen ? "Close shopping assistant" : "Open shopping assistant"
            }
            aria-expanded={isOpen}
          >
            {isOpen ? <CloseIcon /> : <ChatIcon />}
          </button>
        </div>
      </div>
    </>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex gap-0.5" aria-hidden="true">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:0ms]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:150ms]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-zinc-400 [animation-delay:300ms]" />
    </span>
  );
}

function ChatIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 11.5a8.4 8.4 0 0 1-1.1 4.2 8.5 8.5 0 0 1-7.4 4.3 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.3-7.4 8.4 8.4 0 0 1 4.2-1.1h.4a8.5 8.5 0 0 1 8.1 8.1z"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
