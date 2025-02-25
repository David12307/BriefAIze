import { config } from 'dotenv';

config({path: '.env'});

export const { PORT, GEMINI_API_KEY } = process.env;