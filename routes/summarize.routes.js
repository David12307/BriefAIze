import { Router } from "express";
import { summarizeText, summarizeURL, summarizePDF } from "../controllers/summarize.controller.js";
import upload from '../config/multer.js';

const summarizeRouter = Router();

summarizeRouter.post("/text", summarizeText);
summarizeRouter.post('/url', summarizeURL);
summarizeRouter.post("/pdf", upload.single('pdfFile'), summarizePDF);

export default summarizeRouter;