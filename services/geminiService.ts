import { GoogleGenAI, Type } from "@google/genai";
import { TimelineEvent, TimelineResponse, TimelineResult } from "../types";
import { fetchWikipediaData } from "./wikiService";

const splitIntoChunks = (content: string, maxChunkSize: number): string[] => {
  if (content.length <= maxChunkSize) {
    return [content];
  }

  const chunks: string[] = [];
  let currentPos = 0;

  while (currentPos < content.length) {
    let chunkEnd = currentPos + maxChunkSize;
    
    if (chunkEnd < content.length) {
      const searchStart = chunkEnd - Math.floor(maxChunkSize * 0.1);
      const searchText = content.substring(searchStart, chunkEnd);
      const paragraphBreak = searchText.lastIndexOf('\n\n');
      
      if (paragraphBreak !== -1) {
        chunkEnd = searchStart + paragraphBreak + 2;
      } else {
        const lineBreak = searchText.lastIndexOf('\n');
        if (lineBreak !== -1) {
          chunkEnd = searchStart + lineBreak + 1;
        }
      }
    }

    chunks.push(content.substring(currentPos, chunkEnd));
    currentPos = chunkEnd;
  }

  return chunks;
};

const extractEventsFromChunk = async (
  ai: any,
  entity: string,
  chunkContent: string,
  chunkIndex: number,
  totalChunks: number,
  modelName: string,
  language?: string,
  onProgress?: (current: number, total: number) => void
): Promise<TimelineEvent[]> => {
  const languageInstruction = language === 'zh' 
    ? 'Generate all event titles and descriptions in CHINESE (中文). For dates like "123 BC", use "公元前" instead of "BC".'
    : 'Generate all event titles and descriptions in ENGLISH.';

  const prompt = `
    Extract timeline events for: ${entity}
    
    Chunk ${chunkIndex + 1}/${totalChunks} from Wikipedia article.
    
    CONTENT:
    ${chunkContent}
    
    RULES:
    1. Extract up to 12 most important events with explicit dates/ranges
    2. For ranges: use mid-point year (e.g., "1920s" → year: 1925, displayDate: "1920s")
    3. Only dates explicitly stated in text - no guessing
    4. Format: year (integer, negative for BC), displayDate, title (brief), description (<40 words)
    5. Entity field must be: "${entity}"
    6. ${languageInstruction}
    7. Skip minor events - focus on historical significance
  `;

  try {
    if (onProgress) {
      onProgress(chunkIndex + 1, totalChunks);
    }
    
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
                  year: { type: Type.INTEGER },
                  displayDate: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  entity: { type: Type.STRING }
                },
                required: ["year", "displayDate", "title", "description", "entity"]
              }
            }
          }
        }
      }
    });

    const result = JSON.parse(response.text || "{}") as TimelineResponse;
    return result.events || [];
  } catch (error) {
    return [];
  }
};

const getClient = (apiKey: string) => {
  if (!apiKey) {
    throw new Error("API_KEY is missing");
  }
  return new GoogleGenAI({ apiKey });
};

const normalizeAndTranslateEntities = async (apiKey: string, entities: string[], modelName?: string): Promise<Map<string, string>> => {
  if (entities.length === 0) {
    return new Map();
  }

  const ai = getClient(apiKey);
  
  const prompt = `Given inputs, normalize to standard Wikipedia names AND translate Chinese to English. Return JSON mapping.

Examples: {"elon": "Elon Musk", "trump": "Donald Trump", "苹果公司": "Apple Inc.", "微软": "Microsoft", "NASA": "NASA"}

Process: ${entities.map(e => `"${e}"`).join(', ')}

Return: {"input1": "Name1", "input2": "Name2", ...}`;

  try {
    const response = await ai.models.generateContent({
      model: modelName || 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });
    
    const normalized = JSON.parse(response.text || "{}");
    const resultMap = new Map<string, string>();
    
    entities.forEach(entity => {
      const normalizedName = normalized[entity] || entity;
      resultMap.set(entity, normalizedName);
    });
    
    return resultMap;
  } catch (error) {
    return new Map(entities.map(e => [e, e]));
  }
};

export const generateTimeline = async (
  apiKey: string, 
  entities: string[], 
  modelName?: string, 
  language?: string,
  onProgress?: (info: { currentEntity: string; currentChunk: number; totalChunks: number; entityIndex: number; totalEntities: number }) => void
): Promise<TimelineResult> => {
  const ai = getClient(apiKey);

  const normalizationMap = await normalizeAndTranslateEntities(apiKey, entities, modelName);
  const normalizedEntities = entities.map(e => normalizationMap.get(e) || e);
  
  const wikiResults = await Promise.all(
    normalizedEntities.map(async (normalizedEntity, index) => {
      const originalEntity = entities[index];
      const data = await fetchWikipediaData(normalizedEntity);
      return { entity: originalEntity, data, searchTerm: normalizedEntity };
    })
  );

  const wikiSources = wikiResults
    .filter(({ data }) => data !== null)
    .map(({ data }) => data!.title);

  const maxChunkSize = 40000;
  const allEvents: TimelineEvent[] = [];

  for (let entityIdx = 0; entityIdx < wikiResults.length; entityIdx++) {
    const { entity, data } = wikiResults[entityIdx];
    
    if (data && data.content) {
      const chunks = splitIntoChunks(data.content, maxChunkSize);

      const chunkEvents: TimelineEvent[][] = [];
      for (let index = 0; index < chunks.length; index++) {
        const chunk = chunks[index];
        
        const events = await extractEventsFromChunk(
          ai, 
          entity, 
          chunk, 
          index, 
          chunks.length, 
          modelName || 'gemini-2.5-flash', 
          language,
          (current, total) => {
            if (onProgress) {
              onProgress({
                currentEntity: entity,
                currentChunk: current,
                totalChunks: total,
                entityIndex: entityIdx + 1,
                totalEntities: entities.length
              });
            }
          }
        );
        
        chunkEvents.push(events);
      }

      const flatEvents = chunkEvents.flat();
      allEvents.push(...flatEvents);
    } else {
      const prompt = `
        Generate timeline for: ${entity}
        
        No Wikipedia found. Use your knowledge.
        
        RULES:
        1. Generate up to 12 most important events with dates/ranges
        2. Priority: birth, death, founding, major achievements only
        3. For ranges: use mid-point year (e.g., "1920s" → year: 1925, displayDate: "1920s")
        4. Format: year (integer, negative for BC), displayDate, title, description (<20 words)
        5. Entity field: "${entity}"
        6. ${language === 'zh' ? 'Chinese content. Use "公元前" not "BC".' : 'English content.'}
        7. Only most significant historical events
        8. Sort chronologically
      `;

      try {
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
                      year: { type: Type.INTEGER },
                      displayDate: { type: Type.STRING },
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      entity: { type: Type.STRING }
                    },
                    required: ["year", "displayDate", "title", "description", "entity"]
                  }
                }
              }
            }
          }
        });

        const result = JSON.parse(response.text || "{}") as TimelineResponse;
        if (result.events) {
          allEvents.push(...result.events);
        }
      } catch (error) {
        // Silent error handling
      }
    }
  }

  const uniqueEvents = Array.from(
    new Map(
      allEvents.map(event => {
        const key = `${event.entity}-${event.year}-${event.title}`;
        return [key, event];
      })
    ).values()
  ).sort((a, b) => {
    if (a.year !== b.year) {
      return a.year - b.year;
    }
    
    const parseDate = (displayDate: string) => {
      const patterns = [
        /(\d+)年(\d+)月(\d+)日/,  // Chinese: 2013年9月4日
        /(\d+)年(\d+)月/,         // Chinese: 2015年2月
        /(\w+)\s+(\d+),\s*(\d+)/, // English: September 4, 2013
        /(\w+)\s+(\d+)/,          // English: February 2015
        /(\d+)\/(\d+)\/(\d+)/,    // Slash: 9/4/2013
        /(\d+)\/(\d+)/,           // Slash: 2/2015
        /(\d+)-(\d+)-(\d+)/,      // Dash: 2013-09-04
        /(\d+)-(\d+)/             // Dash: 2015-02
      ];
      
      for (const pattern of patterns) {
        const match = displayDate.match(pattern);
        if (match) {
          // Chinese: 2013年9月4日
          if (pattern === patterns[0]) {
            return { month: parseInt(match[2]), day: parseInt(match[3]) };
          }
          // Chinese: 2015年2月
          else if (pattern === patterns[1]) {
            return { month: parseInt(match[2]), day: 1 };
          }
          // English: September 4, 2013
          else if (pattern === patterns[2]) {
            const monthNames: { [key: string]: number } = {
              'January': 1, 'February': 2, 'March': 3, 'April': 4,
              'May': 5, 'June': 6, 'July': 7, 'August': 8,
              'September': 9, 'October': 10, 'November': 11, 'December': 12
            };
            const month = monthNames[match[1]] || 0;
            return { month, day: parseInt(match[2]) };
          }
          // English: February 2015
          else if (pattern === patterns[3]) {
            const monthNames: { [key: string]: number } = {
              'January': 1, 'February': 2, 'March': 3, 'April': 4,
              'May': 5, 'June': 6, 'July': 7, 'August': 8,
              'September': 9, 'October': 10, 'November': 11, 'December': 12
            };
            const month = monthNames[match[1]] || 0;
            return { month, day: 1 };
          }
          // Slash: 9/4/2013
          else if (pattern === patterns[4]) {
            return { month: parseInt(match[1]), day: parseInt(match[2]) };
          }
          // Slash: 2/2015
          else if (pattern === patterns[5]) {
            return { month: parseInt(match[1]), day: 1 };
          }
          // Dash: 2013-09-04
          else if (pattern === patterns[6]) {
            return { month: parseInt(match[2]), day: parseInt(match[3]) };
          }
          // Dash: 2015-02
          else if (pattern === patterns[7]) {
            return { month: parseInt(match[2]), day: 1 };
          }
        }
      }
      return { month: 0, day: 0 };
    };
    
    const dateA = parseDate(a.displayDate);
    const dateB = parseDate(b.displayDate);
    
    if (dateA.month !== dateB.month) {
      return dateA.month - dateB.month;
    }
    if (dateA.day !== dateB.day) {
      return dateA.day - dateB.day;
    }
    
    return a.displayDate.localeCompare(b.displayDate);
  });

  return {
    events: uniqueEvents,
    wikiSources
  };
};
