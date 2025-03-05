import { supabase } from "../config/supabase.js";
import crypto from 'crypto';

export const signUp = async (req, res) => {
    const { password, email } = req.body;
    const { user, error } = await supabase.auth.signUp({ email, password });

    if (error) throw error;
    res.send(user);
}

export const signIn = async (req, res) => {
    const { password, email } = req.body;

    const { user, error } = await supabase.auth.signInWithPassword({email, password});
    if (error) throw error;
    res.send(user);
}

export const generateApiKey = async (req, res) => {
    const apiKey = crypto.randomBytes(32).toString("hex");

    const { userId } = req.body;

    const { data, error } = await supabase
        .from("api_keys")
        .insert([{ user_id: userId, key: apiKey }])

    if (error) throw error;
    res.send(apiKey);
}