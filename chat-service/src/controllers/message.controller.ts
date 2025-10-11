import type { Request, Response } from "express";
import { sendMessage } from "../services/message.service";

export async function postMessage(req: Request, res: Response) {
  console.log("Received request body:", req.body);

  const { chatId, content, userId, sessionCartId } = req.body;

  if (!chatId || !content) {
    console.log("Missing chatId or content");
    return res.status(400).json({ error: "chatId y content son requeridos" });
  }

  try {
    console.log("Calling sendMessage with:", {
      chatId,
      content,
      userId,
      sessionCartId,
    });
    const message = await sendMessage(chatId, content, userId, sessionCartId);
    console.log("sendMessage returned:", message);

    res.status(201).json(message);
  } catch (error) {
    console.error("Error in postMessage:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
