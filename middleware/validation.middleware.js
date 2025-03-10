import { supabase } from "../config/supabase.js";

const planLimits = {
    free: {
        maxRequests: 50,
        maxPages: 25,
        maxChars: 125000
    },
    pro: {
        maxRequests: 500,
        maxPages: 50,
        maxChars: 250000,
    }
}

// Get the data about the API key or false if there is no valid API key
const getApiData = async (apiKey) => {
    const {data, error} = await supabase
        .from("api_keys")
        .select("*")
        .eq('key', apiKey)
        .single();

    if (error) return false;
    return data;
}

const updateRequestsCounter = async (apiKey) => {
    // Get the current requests_made value to increment
    const {data, error} = await supabase
        .from("api_keys")
        .select("requests_made")
        .eq('key', apiKey)
        .single();

    if (error || !data) return {error: "Error fetching API key data"}
    else {
        const newRequestsMade = data.requests_made + 1;

        // Update the requests_made field
        const { error: updateError } = await supabase
            .from("api_keys")
            .update({ requests_made: newRequestsMade })
            .eq('key', apiKey);
        
        if (updateError) { 
            return { error: "Failed updating request counter." }
        } else {
            return true;
        }
    }
    
}

const checkAndResetUsage = async (apiKey) => {
    const { data, error } = await supabase
        .from("api_keys")
        .select("requests_made, last_reset")
        .eq('key', apiKey)
        .single();

    if (error || !data) return { error: "Invalid API key" };

    const { requests_made, last_reset } = data;
    const now = new Date();
    const lastResetTime = new Date(last_reset);

    // Check if 24 hours have passed
    if (now - lastResetTime > 24 * 60 * 60 * 1000) {
        // Reset requests_made and update last_Reset
        console.log("Time exceeded.");
        await supabase
            .from("api_keys")
            .update({ requests_made: 0, last_reset: now })
            .eq('key', apiKey)
        return { requests_made: 0 };
    }

    return { requests_made };
}

export const validateAPIKey = async (req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey) return res.status(401).json({ error: "API Key required." });

    const apiData = await getApiData(apiKey);
    if (!apiData) return res.status(403).json({error: "Invalid API key."});

    // Check requests made and make sure it stays in it's specific limit
    const { requests_made, error } = await checkAndResetUsage(apiKey);
    if (error) return res.status(403).json({error});
    
    if (requests_made >= planLimits[apiData.pricing_plan].maxRequests)
        return res.status(429).json({error: "Request limit exceeded."});

    // Increment requests_made field
    const { error: updateError } = await updateRequestsCounter(apiKey);
    if (updateError) return res.status(401).json({error: "Something went wrong... try again later."});

    next();
}