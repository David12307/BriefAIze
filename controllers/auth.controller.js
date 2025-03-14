import { supabase } from "../config/supabase.js";
import crypto from 'crypto';

export const signUp = async (req, res) => {
    const { password, email } = req.body;
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) throw error;
    res.json({ success: true, id: data.user.id });
}

export const signIn = async (req, res) => {
    const { password, email } = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({email, password});
    if (error) throw error;
    res.json({ id: data.user.id });
}

export const generateApiKey = async (req, res) => {
    const apiKey = crypto.randomBytes(32).toString("hex");

    const { userId } = req.body;

    const { data: userData, error: userError } = await supabase
        .from("api_keys")
        .select("*")
        .eq("user_id", userId)
    
    if (userError) throw userError;
    if (userData.length !== 0) return res.json({ success: false, key: userData[0].key });

    const { data, error } = await supabase
        .from("api_keys")
        .insert([{ user_id: userId, key: apiKey }])

    if (error) throw error;
    res.json({ key: apiKey });
}