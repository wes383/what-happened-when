import OpenAI from 'openai';
import { TimelineEvent, TimelineResponse } from "../types";
import { fetchWikipediaData } from "./wikiService";

const getClient = (apiKey: string, baseURL?: string) => {
    if (!apiKey) {
        throw new Error("API_KEY is missing");
    }
    return new OpenAI({
        apiKey,
        baseURL,
        dangerouslyAllowBrowser: true
    });
};

export const generateTimelineOpenAI = async (apiKey: string, entities: string[], modelName?: string, baseURL?: string): Promise<TimelineEvent[]> => {
    const openai = getClient(apiKey, baseURL);

    // Fetch Wikipedia data for all entities in parallel
    const wikiResults = await Promise.all(
        entities.map(async (entity) => {
            const data = await fetchWikipediaData(entity);
            return { entity, data };
        })
    );

    // Determine context limit
    // If custom model is provided, limit to 1M chars.
    // If default (gpt-5-mini), use 1.5M chars.
    const contextLimit = modelName ? 1000000 : 1500000;

    // Construct the prompt context with fetched data
    let contextPrompt = "SOURCE MATERIAL:\n";
    wikiResults.forEach(({ entity, data }) => {
        if (data) {
            contextPrompt += `\n--- Wikipedia Article for Subject: "${entity}" (Title: "${data.title}") ---\n${data.content.slice(0, contextLimit)}\n`;
        } else {
            contextPrompt += `\n--- Subject: "${entity}" ---\n(No Wikipedia article found. Use internal knowledge.)\n`;
        }
    });

    const prompt = `
    Generate a unified historical timeline for the following subjects: ${entities.join(', ')}.
    
    ${contextPrompt}

    INSTRUCTIONS:
    1. Refer to the SOURCE MATERIAL provided above.
    2. Use the provided Wikipedia text as the PRIMARY source for events and dates.
    3. CRITICAL: If the Wikipedia text appears incomplete, truncated, or stops at a certain date (e.g., missing modern history), you MUST supplement it with your internal knowledge to ensure the timeline extends to the present day.
    4. IF no source material is provided for a subject, rely on your internal training data.
    5. Identify a comprehensive list of historical milestones for EACH subject. Do not arbitrarily limit the number of events; extract as many significant events as possible from the source material.
    6. Merge all events into a single list.
    7. Sort the list strictly chronologically by date.
    8. For the 'year' field, use a negative integer for BC dates (e.g., -500) and positive for AD.
    9. The 'entity' field in the output must match one of the original user inputs exactly: "${entities.join('", "')}". Do not use the Wikipedia article title.
    10. Keep descriptions concise (under 25 words).
    11. Ensure historical accuracy.
    
    Return the result as a JSON object with a single key "events" containing an array of event objects.
    Each event object must have: year (number), displayDate (string), title (string), description (string), entity (string).
  `;

    const response = await openai.chat.completions.create({
        model: modelName || (baseURL ? "qwen-plus" : "gpt-5-mini"),
        messages: [
            { role: "system", content: "You are a helpful historian AI." },
            { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content;
    const result = JSON.parse(content || "{}") as TimelineResponse;

    // Double check sorting just in case
    if (result.events) {
        return result.events.sort((a, b) => a.year - b.year);
    }

    return [];
};
