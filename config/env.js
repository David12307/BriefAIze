import { config } from 'dotenv';

config({path: '.env'});

export const { PORT, GEMINI_API_KEY, ARCJET_KEY, ARCJET_ENV, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = process.env;