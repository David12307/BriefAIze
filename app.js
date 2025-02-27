import express from 'express';
import cookieParser from 'cookie-parser';
import summarizeRouter from './routes/summarize.routes.js';
import { PORT } from './config/env.js';
import arcjetMiddleware from './middleware/arcjet.middleware.js';

var app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(arcjetMiddleware);

app.get("/", (req, res) => {
    res.send("Hello world!");
});

app.use("/api/v1/summarize", summarizeRouter);

app.listen(PORT, () => {
    console.log(`App is running at http://localhost:${PORT}/`);
});

export default app;