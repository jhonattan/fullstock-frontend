import { Router } from "express";
import { postMessage } from "../controllers/message.controller";

const router = Router();

router.post("/messages", postMessage);

export default router;
