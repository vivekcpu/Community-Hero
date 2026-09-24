import { GoogleGenAI } from "@google/genai";

// Initialize Gemini API client
export const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("⚠️ GEMINI_API_KEY is not set. Gemini API calls will use elegant mock responses.");
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
};

// Global tracking for API quota exhaustion (429) per model to avoid slow sequential rate-limit retries under heavy load
const modelCooldowns: Record<string, number> = {};

// Robust helper to query Gemini with retry (for 503 errors) and fallback model support
export const callGeminiWithRetry = async (
  ai: any,
  params: {
    model: string;
    contents: any;
    config?: any;
  },
  maxRetries = 2
): Promise<any> => {
  // Use a robust array of supported Gemini models to try sequentially, strictly avoiding prohibited or deprecated models.
  const modelsToTry = Array.from(new Set([
    params.model,
    "gemini-3.5-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest",
    "gemini-3.1-pro-preview",
  ])).filter(Boolean);

  let lastError: any = null;
  let triedAtLeastOne = false;

  for (const model of modelsToTry) {
    // Check if this model is on active cooldown
    const cooldownUntil = modelCooldowns[model] || 0;
    if (Date.now() < cooldownUntil) {
      const secondsLeft = ((cooldownUntil - Date.now()) / 1000).toFixed(0);
      console.warn(`[Gemini API] Model ${model} is currently in a 429 quota cooldown (skipping for another ${secondsLeft}s)...`);
      continue;
    }

    triedAtLeastOne = true;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Gemini API] Querying model: ${model} (attempt ${attempt + 1}/${maxRetries + 1})`);
        const response = await ai.models.generateContent({
          ...params,
          model
        });
        return response;
      } catch (err: any) {
        lastError = err;
        
        // Since Error objects have non-enumerable properties, standard JSON.stringify(err) produces "{}".
        // We serialize the Error object carefully to capture nested and custom SDK properties.
        let errJsonStr = "";
        try {
          const serializedError: any = {
            message: err.message,
            stack: err.stack,
            status: err.status,
            code: err.code,
            statusText: err.statusText,
          };
          if (err.error) {
            serializedError.error = {
              code: err.error.code,
              message: err.error.message,
              status: err.error.status,
              details: err.error.details,
            };
          }
          errJsonStr = JSON.stringify(serializedError).toLowerCase();
        } catch (e) {
          errJsonStr = String(err).toLowerCase();
        }

        const errStr = String(err.message || err).toLowerCase();
        const isQuotaExceeded = 
          errStr.includes("quota") || 
          errStr.includes("429") || 
          errStr.includes("resource_exhausted") || 
          errJsonStr.includes("quota") || 
          errJsonStr.includes("429") || 
          errJsonStr.includes("resource_exhausted") ||
          err.status === "RESOURCE_EXHAUSTED" ||
          err.status === 429 ||
          err.status === "429" ||
          err.code === 429 ||
          err.code === "429" ||
          err.error?.code === 429 ||
          err.error?.status === "RESOURCE_EXHAUSTED";

        if (isQuotaExceeded) {
          console.log(`[Gemini API] Quota limit (429 RESOURCE_EXHAUSTED) hit on model ${model}.`);
        } else {
          console.log(`[Gemini API] Note on model ${model} (attempt ${attempt + 1}):`, err.message || err);
        }

        const isServiceUnavailable = 
          errStr.includes("503") || 
          errStr.includes("unavailable") ||
          errJsonStr.includes("503") || 
          errJsonStr.includes("unavailable") ||
          err.status === "UNAVAILABLE" ||
          err.status === 503 ||
          err.status === "503" ||
          err.code === 503 ||
          err.code === "503" ||
          err.error?.code === 503;

        if (isServiceUnavailable) {
          // On 503 (High Demand), we only retry ONCE to avoid long delays.
          // If the second attempt fails, we move to the next model immediately.
          if (attempt >= 1) {
            console.log(`[Gemini API] Model ${model} is still unavailable (503) after retry. Marking cooldown and moving to next model...`);
            modelCooldowns[model] = Date.now() + 60 * 1000;
            break; 
          }
          console.log(`[Gemini API] Model ${model} is busy (503). Retrying once...`);
        }

        if (isQuotaExceeded) {
          console.log(`[Gemini API] Quota limit hit for model ${model}. Bypassing remaining retries and marking this model on cooldown for 3 minutes...`);
          // Mark this specific model as quota cooldown for the next 3 minutes
          modelCooldowns[model] = Date.now() + 3 * 60 * 1000;
          break; // Break the attempt loop to try the next model
        }

        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`[Gemini API] Temporary error (possibly 503) on model ${model}. Retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries + 1})...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    console.info(`[Gemini API] Model ${model} finished attempts. Trying fallback model...`);
  }

  if (!triedAtLeastOne) {
    throw new Error("All AI models are currently in a quota cooldown. Please try again in a few minutes.");
  }

  throw lastError || new Error("All Gemini models failed or were exhausted.");
};

/**
 * Safely parses JSON responses from Gemini, with aggressive cleaning and regex-based fallbacks.
 */
export const safeJsonParse = (rawText: string): any => {
  if (!rawText) return null;

  // 1. Remove markdown code block wraps (```json ... ```) and whitespace
  let clean = rawText
    .replace(/```json/i, "")
    .replace(/```/g, "")
    .trim();

  // 2. Locate the first { or [ and last } or ]
  const firstBrace = clean.indexOf("{");
  const lastBrace = clean.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    clean = clean.substring(firstBrace, lastBrace + 1);
  } else {
    const firstBracket = clean.indexOf("[");
    const lastBracket = clean.lastIndexOf("]");
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      clean = clean.substring(firstBracket, lastBracket + 1);
    }
  }

  // 3. Try standard parse first
  try {
    return JSON.parse(clean);
  } catch (err: any) {
    console.warn("[safeJsonParse] Standard JSON.parse failed, attempting aggressive repair...", err.message || err);
  }

  // 4. Try basic repairs:
  try {
    let repaired = clean;

    // Remove trailing commas before a closing brace or bracket: e.g. ,} or ,]
    repaired = repaired.replace(/,\s*([}\]])/g, "$1");

    // Replace unescaped newlines or control characters within string values
    // Split by lines to perform safe line-by-line quote escaping
    const lines = repaired.split(/\r?\n/);
    const repairedLines = lines.map((line) => {
      // Find matches like `"key": "value"`
      const match = line.match(/^\s*"([^"]+)"\s*:\s*"(.*)"\s*(,?)\s*$/);
      if (match) {
        const key = match[1];
        const val = match[2];
        const comma = match[3] || "";
        
        // Escape any unescaped double quotes in the value string
        let newVal = "";
        for (let i = 0; i < val.length; i++) {
          if (val[i] === '"' && (i === 0 || val[i - 1] !== '\\')) {
            newVal += '\\"';
          } else {
            newVal += val[i];
          }
        }
        return `  "${key}": "${newVal}"${comma}`;
      }
      return line;
    });

    repaired = repairedLines.join("\n");
    return JSON.parse(repaired);
  } catch (repairErr: any) {
    console.error("[safeJsonParse] Aggressive repair failed too:", repairErr.message || repairErr);
    
    // 5. Absolute fallback: regex-based field extraction
    try {
      const categoryMatch = clean.match(/"category"\s*:\s*"([^"]+)"/i);
      const severityMatch = clean.match(/"severity"\s*:\s*(\d+)/i);
      const descriptionMatch = clean.match(/"description"\s*:\s*"([\s\S]*?)"\s*(?:,|\r?\n|\})/i);
      const transcriptMatch = clean.match(/"transcript"\s*:\s*"([\s\S]*?)"\s*(?:,|\r?\n|\})/i);
      const summaryMatch = clean.match(/"summary"\s*:\s*"([\s\S]*?)"\s*(?:,|\r?\n|\})/i);
      
      const result: any = {};
      if (categoryMatch) result.category = categoryMatch[1];
      if (severityMatch) result.severity = Number(severityMatch[1]);
      if (descriptionMatch) result.description = descriptionMatch[1].replace(/\\"/g, '"').trim();
      if (transcriptMatch) result.transcript = transcriptMatch[1].replace(/\\"/g, '"').trim();
      if (summaryMatch) result.summary = summaryMatch[1].replace(/\\"/g, '"').trim();

      // Suggestions extraction (array of strings)
      const suggestionsMatch = clean.match(/"suggestions"\s*:\s*\[([\s\S]*?)\]/i);
      if (suggestionsMatch) {
        const itemsText = suggestionsMatch[1];
        // Parse individual quoted items in array
        const items: string[] = [];
        const itemRegex = /"([\s\S]*?)"/g;
        let match;
        while ((match = itemRegex.exec(itemsText)) !== null) {
          items.push(match[1].replace(/\\"/g, '"').trim());
        }
        if (items.length > 0) {
          result.suggestions = items;
        }
      }

      // Urgency Pipeline extraction
      const urgencyScoreMatch = clean.match(/"urgencyScore"\s*:\s*(\d+)/i);
      const isMostUrgentMatch = clean.match(/"isMostUrgent"\s*:\s*(true|false)/i);
      const justificationMatch = clean.match(/"justification"\s*:\s*"([\s\S]*?)"\s*(?:,|\r?\n|\})/i);

      if (urgencyScoreMatch) result.urgencyScore = Number(urgencyScoreMatch[1]);
      if (isMostUrgentMatch) result.isMostUrgent = isMostUrgentMatch[1] === "true";
      if (justificationMatch) result.justification = justificationMatch[1].replace(/\\"/g, '"').trim();

      if (Object.keys(result).length > 0) {
        console.log("[safeJsonParse] Successfully extracted fields via fallback regex matching:", result);
        return result;
      }
    } catch (regexExtractErr: any) {
      console.error("[safeJsonParse] Regex extraction failed too:", regexExtractErr.message || regexExtractErr);
    }

    throw new Error(`JSON parsing and repair failed. Original text: ${rawText}`);
  }
};

