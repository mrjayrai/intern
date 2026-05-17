const axios = require("axios");
const ApiError = require("../utils/apiError");

const GROK_API_KEY = process.env.GROK_API_KEY;

const GROK_API_URL =
  process.env.GROK_API_URL ||
  "https://api.groq.com/openai/v1/chat/completions";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;

const delay = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableError = (error) => {
  if (!error.response) return true;

  const status = error.response.status;

  return status === 429 || status >= 500;
};

const parseResumeText = async (text) => {
  if (!GROK_API_KEY) {
    throw new ApiError(500, "Missing Groq API key");
  }

  if (!text || !text.trim()) {
    throw new ApiError(400, "Resume text is empty");
  }

  let attempt = 0;
  let lastError = null;

  while (attempt < MAX_RETRIES) {
    attempt += 1;

    try {
      const response = await axios.post(
        GROK_API_URL,
        {
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `You are an enterprise resume parsing system.

Analyze the provided resume text and extract structured candidate information.

Return ONLY valid raw JSON.
Do NOT use markdown.
Do NOT use code blocks.
Do NOT add explanations.
Do NOT add extra text before or after JSON.

Required JSON structure:

{
  "fullName": "",
  "email": "",
  "phone": "",
  "location": "",
  "skills": [],
  "education": [],
  "experience": [],
  "projects": [],
  "certifications": [],
  "linkedin": "",
  "github": "",
  "portfolio": "",
  "summary": "",
  "totalExperienceYears": 0,
  "confidenceScore": 0
}

Rules:
- skills must be an array of strings
- education must be an array of objects
- experience must be an array of objects
- confidenceScore must be between 0 and 100
- If information is unavailable, return empty string, empty array, or 0
- Infer totalExperienceYears if possible
- Normalize phone numbers
- Normalize email formatting
- Extract technical skills separately from soft skills when possible
- Keep JSON schema valid at all times

Return ONLY JSON.`,
            },
            {
              role: "user",
              content: text,
            },
          ],
          temperature: 0,
        },
        {
          headers: {
            Authorization: `Bearer ${GROK_API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        }
      );

      const content = response.data?.choices?.[0]?.message?.content;
      if (!content) {
        throw new ApiError(500, 'Grok API returned unexpected response');
      }

      const cleanedContent = content
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      try {
        return JSON.parse(cleanedContent);
      } catch (parseError) {
        console.error('Failed to parse AI JSON:', cleanedContent);
        throw new ApiError(500, 'AI returned invalid JSON response');
      }
    } catch (error) {
      lastError = error;

      console.error(
        "Groq API Error:",
        error.response?.data || error.message
      );

      if (!isRetryableError(error)) {
        break;
      }
    }

    if (attempt < MAX_RETRIES) {
      await delay(RETRY_DELAY_MS * attempt);
    }
  }

  const message =
    lastError?.response?.data?.error?.message ||
    lastError?.message ||
    "Failed to call Groq API";

  throw new ApiError(502, `Groq API error: ${message}`);
};

module.exports = {
  parseResumeText,
};