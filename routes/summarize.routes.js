import { Router } from "express";
import { summarizeText, summarizeURL, summarizeFile } from "../controllers/summarize.controller.js";
import { validateAPIKey } from "../middleware/validation.middleware.js";
import upload from '../config/multer.js';

const summarizeRouter = Router();

summarizeRouter.post("/text", validateAPIKey, summarizeText);
summarizeRouter.post('/url', validateAPIKey, summarizeURL);
summarizeRouter.post("/file", upload.single('pdfFile'), validateAPIKey, summarizeFile);

export default summarizeRouter;