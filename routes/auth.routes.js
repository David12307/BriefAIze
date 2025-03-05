import { Router } from 'express';
import { signUp, signIn, generateApiKey } from '../controllers/auth.controller.js';

const authRouter = Router();

authRouter.post('/sign-up', signUp);

authRouter.post('/sign-in', signIn);

authRouter.post('/generate-api-key', generateApiKey);

export default authRouter;