// Enhanced grading system with better error handling and evaluation
const axios = require("axios");
const NodeCache = require("node-cache");
const answerCache = new NodeCache({ stdTTL: 3600, checkperiod: 600 });

// Constants
const HF_API_URL = "https://router.huggingface.co/v1/chat/completions";
const MODEL = "meta-llama/Llama-3.2-3B-Instruct:novita";
const MAX_RETRIES = 2;
const TIMEOUT = 30000; // 30 seconds

async function gradeWithAI(question, answer, maxPoints) {
  const cacheKey = `${question._id}-${hashAnswer(answer)}`;
  const cached = answerCache.get(cacheKey);
  if (cached) return cached;

  let attempt = 0;
  let lastError = null;

  while (attempt < MAX_RETRIES) {
    try {
      const prompt = buildEvaluationPrompt(question, answer, maxPoints);
      const response = await axios.post(
        HF_API_URL,
        {
          messages: [{ role: "user", content: prompt }],
          model: MODEL,
          temperature: 0.3,
          max_tokens: 500,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            "Content-Type": "application/json",
          },
          timeout: TIMEOUT,
        }
      );

      const result = parseAIResponse(response.data, maxPoints);
      answerCache.set(cacheKey, result);
      console.log(result);
      return result;
    } catch (error) {
      lastError = error;
      console.warn(`AI grading attempt ${attempt + 1} failed:`, {
        status: error.response?.status,
        message: error.message,
      });
      attempt++;
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
    }
  }

  console.error("AI grading failed after retries:", lastError);
  return null;
}

function buildEvaluationPrompt(question, answer, maxPoints) {
  return `[INST] <<SYS>>You are an expert exam grading assistant. Evaluate this answer strictly but fairly.<</SYS>>

**Question:** ${question.questionText}
**Answer:** ${answer}

**Evaluation Criteria:**
1. Accuracy (0-40% of score)
2. Completeness (0-30% of score)
3. Clarity (0-20% of score)
4. Examples/Evidence (0-10% of score)

**Required Format:**
{
  "score": ${maxPoints},
  "feedback": "Concise evaluation",
  "concepts": ["list", "of", "concepts"],
  "improvements": ["specific", "actionable", "items"],
  "isComplete": true
}

Provide only valid JSON output. [/INST]`;
}

function parseAIResponse(responseData, maxPoints) {
  try {
    const { content } = responseData.choices[0].message.content;
    const result = JSON.parse(content);

    console.log({
      success: true,
      score: Math.min(Math.max(0, result.score || 0), maxPoints),
      feedback: result.feedback || "Evaluation complete",
      conceptsAddressed: Array.isArray(result.concepts)
        ? result.concepts
        : [result.concepts].filter(Boolean),
      improvementAreas: Array.isArray(result.improvements)
        ? result.improvements
        : [result.improvements].filter(Boolean),
      isComplete: result.isComplete !== false,
      gradedWithAI: true,
    });
    // Validate and normalize the response
    return {
      success: true,
      score: Math.min(Math.max(0, result.score || 0), maxPoints),
      feedback: result.feedback || "Evaluation complete",
      conceptsAddressed: Array.isArray(result.concepts)
        ? result.concepts
        : [result.concepts].filter(Boolean),
      improvementAreas: Array.isArray(result.improvements)
        ? result.improvements
        : [result.improvements].filter(Boolean),
      isComplete: result.isComplete !== false,
      gradedWithAI: true,
    };
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    return null;
  }
}

function hashAnswer(answer) {
  // Simple hash for caching
  let hash = 0;
  for (let i = 0; i < Math.min(answer.length, 50); i++) {
    hash = (hash << 5) - hash + answer.charCodeAt(i);
    hash |= 0;
  }
  console.log(hash);
  return hash;
}

function basicTheoryGrading(question, answer, maxPoints) {
  const MIN_WORDS = question.minWords || 20;
  const KEYWORDS = Array.isArray(question.keywords)
    ? question.keywords.filter((kw) => typeof kw === "string")
    : [];

  // Calculate length score (0-50%)
  const wordCount = answer.split(/\s+/).length;
  const lengthScore = Math.min(wordCount / MIN_WORDS, 1) * 0.5;

  // Calculate keyword score (0-30%)
  const matchedKeywords = KEYWORDS.filter((kw) => {
    try {
      return new RegExp(`\\b${kw.toLowerCase()}\\b`).test(answer.toLowerCase());
    } catch (e) {
      console.warn(`Invalid keyword pattern: ${kw}`);
      return false;
    }
  });
  const keywordScore =
    (matchedKeywords.length / Math.max(KEYWORDS.length, 1)) * 0.3;

  // Calculate structure score (0-20%)
  const hasParagraphs = answer.split("\n\n").length > 1;
  const hasExamples = /example|e\.g|for instance/i.test(answer);
  const structureScore =
    hasParagraphs && hasExamples ? 0.2 : hasParagraphs || hasExamples ? 0.1 : 0;

  const totalScore = Math.round(
    (lengthScore + keywordScore + structureScore) * maxPoints
  );

  // Generate feedback
  const feedbackParts = [];
  feedbackParts.push(
    wordCount >= MIN_WORDS
      ? `Met minimum length (${wordCount} words)`
      : `Too short (${wordCount}/${MIN_WORDS} words)`
  );

  feedbackParts.push(
    `Matched ${matchedKeywords.length}/${KEYWORDS.length} keywords`
  );

  if (!hasParagraphs) {
    feedbackParts.push("Consider using paragraphs");
  }
  if (!hasExamples) {
    feedbackParts.push("Add specific examples");
  }

  console.log({
    success: true,
    score: totalScore,
    feedback: `Basic evaluation: ${feedbackParts.join("; ")}`,
    conceptsAddressed: matchedKeywords,
    improvementAreas: [
      ...KEYWORDS.filter((kw) => !matchedKeywords.includes(kw)).map(
        (kw) => `Include "${kw}"`
      ),
      ...(wordCount < MIN_WORDS ? [`Write at least ${MIN_WORDS} words`] : []),
      ...(hasExamples ? [] : ["Provide concrete examples"]),
    ],
    isCorrect: totalScore >= maxPoints * 0.7,
    gradedWithAI: false,
    isComplete: true,
  });

  return {
    success: true,
    score: totalScore,
    feedback: `Basic evaluation: ${feedbackParts.join("; ")}`,
    conceptsAddressed: matchedKeywords,
    improvementAreas: [
      ...KEYWORDS.filter((kw) => !matchedKeywords.includes(kw)).map(
        (kw) => `Include "${kw}"`
      ),
      ...(wordCount < MIN_WORDS ? [`Write at least ${MIN_WORDS} words`] : []),
      ...(hasExamples ? [] : ["Provide concrete examples"]),
    ],
    isCorrect: totalScore >= maxPoints * 0.7,
    gradedWithAI: false,
    isComplete: true,
  };
}

module.exports = {
  gradeWithAI,
  basicTheoryGrading,
  parseAIResponse,
};
// const { Anthropic } = require('@anthropic-ai/sdk');

// const gradeWithOpenAI = async (question, answer, maxPoints) => {
//   const anthropic = new Anthropic({
//     apiKey: process.env.CLAUDE_API_KEY
//   });

//   try {
//     const response = await anthropic.messages.create({
//       model: "claude-3-haiku-20240307", // Fast and affordable
//       max_tokens: 500,
//       messages: [
//         {
//           role: "user",
//           content: `Evaluate this test answer:
//             Question: ${question.questionText}
//             Answer: ${answer}

//             Grading Criteria: ${question.gradingCriteria?.join(', ') || 'Relevance, accuracy'}
//             Max Points: ${maxPoints}

//             Provide feedback and score from 0-${maxPoints}`
//         }
//       ]
//     });

//     return {
//       success: true,
//       feedback: response.content[0].text,
//       score: extractScore(response.content[0].text, maxPoints)
//     };
//   } catch (error) {
//     console.error('Claude API error:', error);
//     return {
//       success: false,
//       error: 'claude_error',
//       message: 'Claude grading unavailable'
//     };
//   }
// };

/*const OpenAI = require('openai');


async function gradeWithOpenAI(question, answer, maxPoints = 5) {
    try {
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            maxRetries: 2,
            timeout: 30000
            // dangerouslyAllowBrowser: true
        });

        const prompt = `
  You are an expert educational assessment AI. Analyze the following student answer and provide:

  1. Score (0-${maxPoints})
  2. Detailed feedback
  3. Key concepts addressed
  4. Areas for improvement

  Question: "${question.questionText}"
  ${question.keywords?.length ? `Keywords to consider: ${question.keywords.join(', ')}` : ''}

  Student Answer: "${answer}"

  Respond in this JSON format:
  {
    "score": number,
    "feedback": string,
    "conceptsAddressed": string[],
    "improvementAreas": string[]
  }
  `;
        const completion = await openai.chat.completions.create({
            messages: [{ role: 'system', content: prompt }],
            model: "gpt-3.5-turbo",
            response_format: { type: 'json_object' },
            temperature: 0.3,
            max_tokens: 500
        });

        const result = JSON.parse(completion.choices[0]?.message?.content || '{}');

        return {
            score: Math.min(Math.max(0, result.score || 0), maxPoints),
            feedback: result.feedback || 'No feedback provided',
            conceptsAddressed: result.conceptsAddressed || [],
            improvementAreas: result.improvementAreas || []
        };
    } catch (error) {
        console.error('OpenAI API Error:', error);
        throw new Error('AI grading service unavailable');
    }
};
*/
/*const { OpenAI } = require('openai');

const gradeWithOpenAI = async (question, answer, maxPoints = 5) => {
    try {
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            maxRetries: 2, // Add retry mechanism
            timeout: 30000 // 30 seconds timeout
        });

        const prompt = `
      Evaluate this answer to the question below.
      Question: ${question.questionText}
      Answer: ${answer}

      Grading criteria: ${question.gradingCriteria?.join(', ') || 'Relevance, accuracy, completeness'}
      Expected keywords: ${question.keywords?.join(', ') || 'None specified'}
      Minimum words: ${question.minWords || 'Not specified'}

      Provide detailed feedback and score from 0 to ${question.maxPoints}.
    `;

        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are an expert test grading assistant." },
                { role: "user", content: prompt }
            ],
            temperature: 0.3,
            max_tokens: 500
        });

        return {
            success: true,
            feedback: response.choices[0].message.content,
            score: extractScore(response.choices[0].message.content, question.maxPoints)
        };
    } catch (error) {
        if (error.status === 429) {
            console.warn('OpenAI rate limit exceeded:', error.message);
            return {
                success: false,
                error: 'rate_limit',
                message: 'AI grading rate limit exceeded. Using basic grading.'
            };
        } else if (error.code === 'insufficient_quota') {
            console.warn('OpenAI quota exceeded:', error.message);
            return {
                success: false,
                error: 'insufficient_quota',
                message: 'AI grading quota exceeded. Using basic grading.'
            };
        } else {
            console.error('OpenAI API error:', error);
            return {
                success: false,
                error: 'api_error',
                message: 'AI grading service unavailable. Using basic grading.'
            };
        }
    }
};

function extractScore(feedback, maxScore) {
    // Implement logic to extract score from feedback
    // This is a simple implementation - adjust as needed
    const scoreMatch = feedback.match(/(\d+)\s*\/\s*\d+/);
    return scoreMatch ? Math.min(parseInt(scoreMatch[1]), maxScore) : maxScore / 2;
}
*/
// module.exports = gradeWithOpenAI;

// module.exports = gradeWithOpenAI;
