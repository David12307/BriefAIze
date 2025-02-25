import { Router } from "express";
import { summarizeText, summarizeURL } from "../controllers/summarize.controller.js";

const summarizeRouter = Router();

summarizeRouter.post("/text", summarizeText);
summarizeRouter.post('/url', summarizeURL);

export default summarizeRouter;