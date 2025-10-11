import type { Message } from "../models/message.model";
import { config } from "dotenv";
import { type Chat, GoogleGenAI } from "@google/genai";
import { generateSystemPrompt } from "./chat-system-prompt";

config();

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_API_KEY || "",
});

const chats: { [key: string]: Chat } = {};

export async function sendMessage(
  chatId: string,
  content: string,
  userId: string,
  sessionCartId: string
) {
  console.log("sendMessage called with:", {
    chatId,
    content,
    userId,
    sessionCartId,
  });

  if (!chats[chatId]) {
    const systemInstruction = generateSystemPrompt();

    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      history: [],
      config: {
        systemInstruction,
      },
    });

    chats[chatId] = chat;
  }

  const chat = chats[chatId];

  const response = await chat.sendMessage({
    message: content,
  });

  console.log("Returning response:", response);

  return response.text;
}
