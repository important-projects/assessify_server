const pdfParse = require("pdf-parse");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

// Multer configuration remains unchanged
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error("Invalid file type. Only PDF and Word documents are allowed."),
      false
    );
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: fileFilter,
});

const extractQuestionsFromPdf = async (filePath, course) => {
  try {
    const buffer = fs.readFileSync(filePath);
    const { text } = await pdfParse(buffer);

    const lines = text
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    const questions = [];
    let currentQuestion = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim().toLowerCase();

      // Start new question
      if (line.match(/^question\s+\d+:/i)) {
        if (currentQuestion) {
          questions.push(currentQuestion);
        }

        currentQuestion = {
          course,
          questionText: "",
          options: [],
          keywords: [],
          questionType: "theory",
          difficulty: "medium",
          points: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        continue;
      }

      if (!currentQuestion) continue;

      // Parse fields
      if (line.match(/^question text:/i)) {
        currentQuestion.questionText = lines[i]
          .replace(/^question text:/i, "")
          .trim();
      } else if (line.match(/^type:/i)) {
        const type = lines[i]
          .replace(/^type:/i, "")
          .trim()
          .toLowerCase();
        currentQuestion.questionType =
          type === "objective" ? "objective" : "theory";
      } else if (line.match(/^options:/i)) {
        currentQuestion.questionType = "objective";
        let j = i + 1;
        let optionCount = 0;
        while (
          j < lines.length &&
          !lines[j]
            .trim()
            .toLowerCase()
            .match(/^(correct answer|difficulty|points|explanation|keywords):/i)
        ) {
          let cleanLine = lines[j].replace(/\s+/g, " ").trim();

          // Match options with A., B., etc. prefixes
          if (/^[A-Da-d][\.\)]\s+.+/.test(cleanLine)) {
            const prefix = String.fromCharCode(65 + optionCount) + ". ";
            if (cleanLine.toUpperCase().startsWith(prefix.toUpperCase())) {
              const optionText = cleanLine.slice(prefix.length).trim();
              if (optionText.length >= 5 && optionText.length <= 200) {
                currentQuestion.options.push(prefix + optionText);
                optionCount++;
              }
            }
          }
          j++;
        }
        i = j - 1;
      } else if (line.match(/^correct answer:/i)) {
        const answer = lines[i]
          .replace(/^correct answer:/i, "")
          .trim()
          .toUpperCase();
        if (/^[A-D]$/.test(answer)) {
          currentQuestion.correctAnswer = answer;
        }
      } else if (line.match(/^keywords:/i)) {
        let j = i + 1;
        while (
          j < lines.length &&
          !lines[j]
            .trim()
            .toLowerCase()
            .match(/^(difficulty|points|explanation):/i)
        ) {
          const keywordMatch = lines[j].match(
            /([\w\s-]+)(?:\s*\(weight:\s*([\d.]+)\s*\))?/i
          );
          if (keywordMatch) {
            const term = keywordMatch[1].trim();
            if (
              /^[\w\s-]+$/.test(term) &&
              term.length <= 30 &&
              term.length > 0
            ) {
              const weight = keywordMatch[2]
                ? parseFloat(keywordMatch[2])
                : 0.5;
              if (weight >= 0.1 && weight <= 1) {
                currentQuestion.keywords.push({ term, weight });
              }
            }
          }
          j++;
        }
        i = j - 1;
      } else if (line.match(/^difficulty:/i)) {
        const difficulty = lines[i]
          .replace(/^difficulty:/i, "")
          .trim()
          .toLowerCase();
        if (["easy", "medium", "hard"].includes(difficulty)) {
          currentQuestion.difficulty = difficulty;
        }
      } else if (line.match(/^points:/i)) {
        const points = parseInt(line.replace(/^points:/i, "").trim());
        if (!isNaN(points) && points >= 1 && points <= 10) {
          currentQuestion.points = points;
        }
      } else if (line.match(/^explanation:/i)) {
        const explanation = line.replace(/^explanation:/i, "").trim();
        if (explanation.length <= 500) {
          currentQuestion.explanation = explanation;
        }
      }
    }

    // Add the last question if valid
    if (currentQuestion && validateQuestion(currentQuestion)) {
      questions.push(currentQuestion);
    }

    return questions;
  } catch (error) {
    console.error(`Failed to parse PDF: ${error.message}`);
    return [];
  } finally {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
};

// Validate question against schema constraints
function validateQuestion(question) {
  // Required fields
  if (!question.questionText || question.questionText.length < 10) {
    return false;
  }

  // Objective question validation
  if (question.questionType === "objective") {
    if (question.options.length < 2 || question.options.length > 6) {
      return false;
    }
    if (!question.correctAnswer || !/^[A-F]$/.test(question.correctAnswer)) {
      return false;
    }
    if (!question.explanation || question.explanation.length > 500) {
      return false;
    }
    // Validate option prefixes
    const validPrefixes = question.options.every((opt, i) => {
      const prefix = String.fromCharCode(65 + i) + ". ";
      return opt.startsWith(prefix) && opt.length >= 7 && opt.length <= 203;
    });
    if (!validPrefixes) return false;
  }

  // Theory question validation
  if (question.questionType === "theory") {
    if (question.options.length > 0) {
      return false;
    }
    if (question.keywords.length === 0) {
      return false;
    }
  }

  // Keyword validation
  const uniqueTerms = new Set(
    question.keywords.map((k) => k.term.toLowerCase())
  );
  if (uniqueTerms.size !== question.keywords.length) {
    return false;
  }

  // Points validation
  if (question.points < 1 || question.points > 10) {
    return false;
  }

  return true;
}

module.exports = { upload, extractQuestionsFromPdf };
