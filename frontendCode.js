import React, { useState } from "react";
import {
  Button,
  Container,
  Typography,
  TextField,
  Box,
  RadioGroup,
  Radio,
  FormControlLabel,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  IconButton,
  Snackbar,
  Paper,
} from "@mui/material";
import { motion } from "framer-motion";
import API from "../api";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import Alert from "@mui/material/Alert";

const AdminTestUpload = () => {
  // const [testName, setTestName] = useState("");
  const [category, setCategory] = useState("");
  const [questions, setQuestions] = useState([]);
  const [currentQuestion, setCurrentQuestion] = useState({
    questionText: "",
    questionType: "objective",
    options: ["", ""],
    correctAnswer: "",
  });
  const [testFile, setTestFile] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [validationErrors, setValidationErrors] = useState({});

  const handleQuestionChange = (index, value) => {
    const newOptions = [...currentQuestion.options];
    newOptions[index] = value;
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  const addOption = () => {
    setCurrentQuestion({
      ...currentQuestion,
      options: [...currentQuestion.options, ""],
    });
  };

  const removeOption = (index) => {
    const newOptions = currentQuestion.options.filter((_, i) => i !== index);
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  const validateForm = () => {
    const errors = {};
    // if (!testName) errors.testName = "Test name is required.";
    if (!category) errors.category = "Category is required.";
    if (!testFile) errors.testFile = "Test file is required.";

    questions.forEach((question, index) => {
      if (!question.questionText) {
        errors[`questionText${index}`] = "Question text is required.";
      }
      if (question.questionType === "objective") {
        if (question.options.some((opt) => !opt)) {
          errors[`options${index}`] = "All options are required.";
        }
        if (!question.correctAnswer) {
          errors[`correctAnswer${index}`] = "Correct answer is required.";
        }
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const addQuestion = () => {
    if (currentQuestion.questionText && currentQuestion.correctAnswer) {
      setQuestions([...questions, currentQuestion]);
      setCurrentQuestion({
        questionText: "",
        questionType: "objective",
        options: ["", ""],
        correctAnswer: "",
      });
      setValidationErrors({});
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (
      file &&
      (file.type === "application/pdf" ||
        file.type === "application/msword" ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document")
    ) {
      if (file.size <= 10485760) {
        setTestFile(file);
      } else {
        setSnackbar({
          open: true,
          message: "File size exceeds 10 MB limit.",
          severity: "error",
        });
      }
    } else {
      setSnackbar({
        open: true,
        message: "Only PDF and Word documents are allowed.",
        severity: "error",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const formData = new FormData();
    // formData.append("testName", testName);
    formData.append("category", category);
    formData.append("file", testFile);
    formData.append("questions", JSON.stringify(questions));

    try {
      await API.post("admin/tests/create", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setSnackbar({
        open: true,
        message: "Test created successfully!",
        severity: "success",
      });

      // setTestName("");
      setCategory("");
      setQuestions([]);
      setTestFile(null);
      setValidationErrors({});
    } catch (error) {
      console.error("Error creating test:", error);
      setSnackbar({
        open: true,
        message: "Failed to create the test.",
        severity: "error",
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  return (
    <Container maxWidth="md" sx={{ mt: 5, mb: 5 }}>
      <Paper elevation={3} sx={{ padding: 4, borderRadius: 2 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Typography variant="h4" gutterBottom align="center" color="primary">
            Create a New Test
          </Typography>

          <form onSubmit={handleSubmit}>
            {/* Test Name */}
            {/* <Box mb={3}>
              <TextField
                label="Test Name"
                fullWidth
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                required
                variant="outlined"
                error={Boolean(validationErrors.testName)}
                helperText={validationErrors.testName}
                sx={{ backgroundColor: "white" }}
              />
            </Box> */}

            {/* Category Selector */}
            <Box mb={3}>
              <FormControl
                fullWidth
                variant="outlined"
                error={Boolean(validationErrors.category)}
              >
                <InputLabel>Category</InputLabel>
                <Select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  required
                  label="Category"
                >
                  <MenuItem value="React.js">React.js</MenuItem>
                  <MenuItem value="Node.js">Node.js</MenuItem>
                  <MenuItem value="Python">Python</MenuItem>
                  <MenuItem value="Java">Java</MenuItem>
                  <MenuItem value="C++">C++</MenuItem>
                  <MenuItem value="CSS">CSS</MenuItem>
                  <MenuItem value="AWS">AWS</MenuItem>
                  <MenuItem value="Google Cloud">Google Cloud</MenuItem>
                </Select>
                {validationErrors.category && (
                  <Typography color="error" variant="caption">
                    {validationErrors.category}
                  </Typography>
                )}
              </FormControl>
            </Box>

            {/* File Upload */}
            <Box mb={3}>
              <Button
                variant="contained"
                component="label"
                startIcon={<CloudUploadIcon />}
                fullWidth
              >
                {testFile ? testFile.name : "Upload Test File"}
                <input
                  type="file"
                  hidden
                  onChange={handleFileChange}
                  accept=".pdf, .doc, .docx"
                />
              </Button>
              {validationErrors.testFile && (
                <Typography color="error" variant="caption">
                  {validationErrors.testFile}
                </Typography>
              )}
            </Box>

            {/* Question Text */}
            <Box mb={3}>
              <TextField
                label="Question Text"
                fullWidth
                multiline
                rows={3}
                value={currentQuestion.questionText}
                onChange={(e) =>
                  setCurrentQuestion({
                    ...currentQuestion,
                    questionText: e.target.value,
                  })
                }
                required
                variant="outlined"
                error={Boolean(
                  validationErrors[`questionText${questions.length}`]
                )}
                helperText={validationErrors[`questionText${questions.length}`]}
                sx={{ backgroundColor: "white" }}
              />
            </Box>

            {/* Question Type */}
            <Box mb={3}>
              <FormControl component="fieldset">
                <RadioGroup
                  row
                  value={currentQuestion.questionType}
                  onChange={(e) =>
                    setCurrentQuestion({
                      ...currentQuestion,
                      questionType: e.target.value,
                    })
                  }
                >
                  <FormControlLabel
                    value="objective"
                    control={<Radio />}
                    label="Objective"
                    sx={{ color: "black" }}
                  />
                  <FormControlLabel
                    value="theory"
                    control={<Radio />}
                    label="Theory"
                    sx={{ color: "black" }}
                  />
                </RadioGroup>
              </FormControl>
            </Box>

            {/* Options */}
            {currentQuestion.questionType === "objective" &&
              currentQuestion.options.map((option, index) => (
                <Box mb={2} display="flex" key={index}>
                  <TextField
                    label={`Option ${index + 1}`}
                    value={option}
                    onChange={(e) =>
                      handleQuestionChange(index, e.target.value)
                    }
                    variant="outlined"
                    error={Boolean(
                      validationErrors[`options${questions.length}`]
                    )}
                    helperText={validationErrors[`options${questions.length}`]}
                    sx={{ backgroundColor: "white", flex: 1, marginRight: 1 }}
                  />
                  <IconButton
                    onClick={() => removeOption(index)}
                    color="error"
                    sx={{ height: "100%" }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              ))}
            <Button
              variant="outlined"
              onClick={addOption}
              startIcon={<AddIcon />}
              sx={{ mb: 2 }}
            >
              Add Option
            </Button>

            {/* Correct Answer */}
            <Box mb={3}>
              <TextField
                label="Correct Answer"
                fullWidth
                value={currentQuestion.correctAnswer}
                onChange={(e) =>
                  setCurrentQuestion({
                    ...currentQuestion,
                    correctAnswer: e.target.value,
                  })
                }
                required
                variant="outlined"
                error={Boolean(
                  validationErrors[`correctAnswer${questions.length}`]
                )}
                helperText={
                  validationErrors[`correctAnswer${questions.length}`]
                }
                sx={{ backgroundColor: "white" }}
              />
            </Box>

            {/* Add Question Button */}
            <Button variant="contained" onClick={addQuestion} sx={{ mb: 3 }}>
              Add Question
            </Button>

            {/* Submit Button */}
            <Button variant="contained" type="submit" color="primary" fullWidth>
              Create Test
            </Button>
          </form>

          {/* Snackbar for notifications */}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={6000}
            onClose={handleCloseSnackbar}
          >
            <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
              {snackbar.message}
            </Alert>
          </Snackbar>
        </motion.div>
      </Paper>
    </Container>
  );
};

export default AdminTestUpload;