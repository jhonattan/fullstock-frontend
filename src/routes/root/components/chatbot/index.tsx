import { useEffect, useState } from "react";
import Markdown from "react-markdown";
import { Link } from "react-router";

import { Button, Input } from "@/components/ui";

type ChatBotProps = {
  userId?: number;
  sessionCartId?: string;
};

export function ChatBot({ userId, sessionCartId }: ChatBotProps) {
  const [messages, setMessages] = useState<string[]>([
    "🤖: Hola! En que puedo ayudarte?",
  ]);
  const [input, setInput] = useState("");
  const [sessionid, setSessionId] = useState<null | string>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const currentSessionId = sessionStorage.getItem("sessionid");
    if (currentSessionId) {
      setSessionId(currentSessionId);
    } else {
      const newSessionId = crypto.randomUUID();
      sessionStorage.setItem("sessionid", newSessionId);
      setSessionId(newSessionId);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setInput("");
    setMessages((prev) => [...prev, `👤: ${input}`]);
    setLoading(true);

    try {
      const response = await fetch("http://localhost:4000/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chatId: sessionid,
          content: input,
          userId,
          sessionCartId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log("response:", response);
      const message = await response.json();
      console.log("Response from microservice:", message);

      setMessages((prev) => [...prev, `🤖: ${message.content || message}`]);
    } catch (error) {
      console.error("Error calling microservice:", error);
      setMessages((prev) => [...prev, `🤖: Error: Could not get response`]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded shadow-lg bg-background text-foreground w-96 max-h-96">
      <div className="overflow-y-auto max-h-60 mb-4">
        {messages.map((msg, index) => (
          <div className="mb-2" key={index}>
            <Markdown
              components={{
                a: ({ children, href, ...rest }) => (
                  <Link
                    to={href!}
                    className="text-primary font-bold hover:underline"
                    {...rest}
                  >
                    {children}
                  </Link>
                ),
              }}
            >
              {msg}
            </Markdown>
          </div>
        ))}
      </div>
      <form className="flex flex-col gap-2" onSubmit={handleSubmit}>
        <Input
          type="text"
          name="message"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoComplete="off"
        />
        <Button size="lg" type="submit" disabled={!input.trim() || loading}>
          {loading ? "Pensando..." : "Enviar"}
        </Button>
      </form>
    </div>
  );
}
