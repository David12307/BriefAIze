import { Router } from "express";
import { summarizeText, summarizeURL, summarizeFile } from "../controllers/summarize.controller.js";
import upload from '../config/multer.js';

const summarizeRouter = Router();

summarizeRouter.post("/text", summarizeText);
summarizeRouter.post('/url', summarizeURL);
summarizeRouter.post("/file", upload.single('pdfFile'), summarizeFile);

export default summarizeRouter;