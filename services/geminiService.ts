import { GoogleGenAI, Type } from "@google/genai";
import { TimelineEvent, TimelineResponse } from "../types";
import { fetchWikipediaData } from "./wikiService";

const getClient = (apiKey: string) => {
  if (!apiKey) {
    throw new Error("API_KEY is missing");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateTimeline = async (apiKey: string, entities: string[], modelName?: string): Promise<TimelineEvent[]> => {
  const ai = getClient(apiKey);

  // Fetch Wikipedia data for all entities in parallel
  const wikiResults = await Promise.all(
    entities.map(async (entity) => {
      const data = await fetchWikipediaData(entity);
      return { entity, data };
    })
  );

  // Determine context limit
  // Default Gemini 1.5/2.5 Flash has 1M context.
  // Custom models will be limited to 1M chars as requested.
  const contextLimit = 1000000;

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
  `;

  const response = await ai.models.generateContent({
    model: modelName || 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          events: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                year: { type: Type.INTEGER, description: "The year of the event. Negative for BC." },
                displayDate: { type: Type.STRING, description: "Human readable date, e.g. 'July 1969' or '44 BC'" },
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                entity: { type: Type.STRING, description: "The subject this event belongs to (must match user input)" }
              },
              required: ["year", "displayDate", "title", "description", "entity"]
            }
          }
        }
      }
    }
  });

  const result = JSON.parse(response.text || "{}") as TimelineResponse;

  // Double check sorting just in case
  if (result.events) {
    return result.events.sort((a, b) => a.year - b.year);
  }

  return [];
};