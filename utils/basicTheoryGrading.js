// Basic grading for non-premium users
const basicTheoryGrading = (question, answer, maxPoints = 5) => {
    const wordCount = answer.trim().split(/\s+/).length;
    const lengthScore = Math.min(wordCount / 20, 1) * 0.7;

    const matchedKeywords = question.keywords?.filter(keyword =>
        answer.toLowerCase().includes(keyword.term.toLowerCase())
    ) || [];


    const keywordScore = matchedKeywords.length * 0.3;

    const totalScore = (lengthScore + keywordScore) * maxPoints;

    return {
        score: Math.round(totalScore * 10) / 10,
        feedback: `Basic evaluation: ${wordCount} words, ${matchedKeywords.length} keywords matched`
    };
};

module.exports = basicTheoryGrading