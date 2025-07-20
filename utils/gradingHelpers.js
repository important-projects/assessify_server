
const Response = require("../models/Response")
const TestSubmission = require('../models/TestSubmission');
const Results = require('../models/Results');
const { gradeWithAI, basicTheoryGrading } = require("../utils/aiGrading")

async function saveResponse(userId, testId, questionId, answer, result) {
    try {
        const response = await Response.create({
            userId: userId,
            testId: testId,
            question: questionId,
            answer: answer,
            isCorrect: result.isCorrect,
            pointsEarned: result.score,
            maxPoints: result.maxPoints,
            feedback: result.feedback,
            conceptsAddressed: result.conceptsAddressed || [],
            improvementAreas: result.improvementAreas || [],
            questionType: result.questionType,
            gradedWithAI: result.gradedWithAI || false,
            isComplete: result.isComplete !== false
        });
        console.log(response)
        return response;
    } catch (error) {
        console.error('Failed to save response:', error);
        throw new Error('Failed to save response to database');
    }
}

async function saveTestSubmission(userId, testId, { totalScore, answerDetails }) {
    console.log(
        { user: userId, test: testId },
        {
            user: userId,
            test: testId,
            status: 'completed',
            score: totalScore,
            submittedAt: new Date(),
            answers: answerDetails
        },
        { new: true, upsert: true })

    return await TestSubmission.findOneAndUpdate(
        { user: userId, test: testId },
        {
            user: userId,
            test: testId,
            status: 'completed',
            score: totalScore,
            submittedAt: new Date(),
            answers: answerDetails
        },
        { new: true, upsert: true }
    );
}

async function saveTestResults(userId, testId, courseId, { totalScore, totalPossibleScore, answerDetails, aiFailures, answers }) {

    console.log({
        userId: userId,
        testId: testId,
        courseId: courseId,
        score: totalScore,
        totalPossibleScore: totalPossibleScore,
        totalQuestions: answerDetails.length,
        status: 'completed',
        aiFailures: aiFailures,
        answers: answers
    })
    return await Results.create({
        userId: userId,
        testId: testId,
        courseId: courseId,
        score: totalScore,
        totalPossibleScore: totalPossibleScore,
        totalQuestions: answerDetails.length,
        status: 'completed',
        aiFailures: aiFailures,
        answers: answers
    });
}

async function processQuestion(question, answer, maxPoints, isPremiumUser) {
    try {
        let result;

        if (question.questionType === 'objective') {
            result = gradeObjectiveQuestion(question, answer, maxPoints);
        } else {
            // Try AI grading for premium users
            if (isPremiumUser) {
                const aiResult = await gradeWithAI(question, answer, maxPoints);
                result = aiResult?.success ? aiResult : null;
            }

            // Fallback to basic grading if AI fails or not premium
            if (!result) {
                result = basicTheoryGrading(question, answer, maxPoints);
                if (isPremiumUser) {
                    return {
                        result,
                        error: 'AI grading failed',
                        isAI: true
                    };
                }
            }
        }

        return { result };
        console.log(result)
    } catch (error) {
        return {
            error: error.message,
            isAI: false
        };
    }
}

function gradeObjectiveQuestion(question, answer, maxPoints) {
    const isCorrect = answer.trim().charAt(0).toUpperCase() ===
        question.correctAnswer.trim().charAt(0).toUpperCase();

    return {
        score: isCorrect ? maxPoints : 0,
        feedback: isCorrect ? 'Correct answer' : `Incorrect (correct: ${question.correctAnswer})`,
        isCorrect,
        conceptsAddressed: [],
        improvementAreas: isCorrect ? [] : ['Review the correct answer'],
        gradedWithAI: false,
        isComplete: true
    };
}

async function processAnswers(userId, testId, answers, questions, isPremiumUser) {
    const results = {
        totalScore: 0,
        answerDetails: [],
        savedResponses: [],
        aiFailures: 0,
        skippedAnswers: [],
        totalPossibleScore: questions.reduce((sum, q) => sum + (q.points || (q.questionType === 'objective' ? 1 : 5)), 0)
    };

    for (const { questionId, answer } of answers) {
        const question = questions.find(q => q._id.equals(questionId));
        if (!question) {
            results.skippedAnswers.push({ questionId, reason: 'Question not found' });
            continue;
        }

        const maxPoints = question.points || (question.questionType === 'objective' ? 1 : 5);
        const processed = await processQuestion(
            question,
            answer,
            maxPoints,
            isPremiumUser
        );

        if (processed.error) {
            results.aiFailures += processed.isAI ? 1 : 0;
            results.skippedAnswers.push({
                questionId,
                reason: processed.error
            });
            continue;
        }

        try {
            const response = await saveResponse(
                userId,
                testId,
                questionId,
                answer,
                {
                    ...processed.result,
                    questionType: question.questionType,
                    maxPoints: maxPoints
                }
            );

            results.totalScore += processed.result.score;
            results.answerDetails.push({
                questionId,
                questionText: question.questionText,
                questionType: question.questionType,
                submittedAnswer: answer,
                correctAnswer: question.questionType === 'objective' ? question.correctAnswer : null,
                ...processed.result,
                maxPoints: maxPoints
            });
            results.savedResponses.push(response._id);
        } catch (error) {
            results.skippedAnswers.push({
                questionId,
                reason: 'Failed to save response: ' + error.message
            });
            continue;
        }
    }

    console.log(results)
    return results;
}

function buildSuccessResponse(test, { totalScore, answerDetails, aiFailures }) {
    console.log({
        success: true,
        totalScore,
        totalPossibleScore: test.questions.reduce(
            (sum, q) => sum + (q.points || (q.questionType === 'objective' ? 1 : 5)),
            0
        ),
        answerDetails,
        aiFailures,
        gradingSystem: {
            theory: {
                criteria: [
                    'content_accuracy',
                    'concept_coverage',
                    'example_quality',
                    'organization',
                    'keyword_usage'
                ],
                minWords: 20,
                rubrics: {
                    excellent: { minScore: 4.5, description: 'Comprehensive and accurate' },
                    good: { minScore: 3.5, description: 'Solid with minor gaps' },
                    fair: { minScore: 2.5, description: 'Basic understanding shown' },
                    poor: { minScore: 0, description: 'Incomplete or inaccurate' }
                }
            },
            objective: {
                criteria: ['accuracy'],
                rubrics: {
                    correct: { score: 'full', description: 'Correct answer' },
                    incorrect: { score: 0, description: 'Incorrect answer' }
                }
            }
        }
    }); return {
        success: true,
        totalScore,
        totalPossibleScore: test.questions.reduce((sum, q) => sum + (q.points || (q.questionType === 'objective' ? 1 : 5)), 0),
        answerDetails,
        aiFailures,
        gradingSystem: {
            theory: {
                criteria: [
                    'content_accuracy',
                    'concept_coverage',
                    'example_quality',
                    'organization',
                    'keyword_usage'
                ],
                minWords: 20,
                rubrics: {
                    excellent: { minScore: 4.5, description: 'Comprehensive and accurate' },
                    good: { minScore: 3.5, description: 'Solid with minor gaps' },
                    fair: { minScore: 2.5, description: 'Basic understanding shown' },
                    poor: { minScore: 0, description: 'Incomplete or inaccurate' }
                }
            },
            objective: {
                criteria: ['accuracy'],
                rubrics: {
                    correct: { score: 'full', description: 'Correct answer' },
                    incorrect: { score: 0, description: 'Incorrect answer' }
                }
            }
        }
    };

}
module.exports = { processAnswers, saveTestSubmission, saveTestResults, buildSuccessResponse }