const mongoose = require('mongoose')
const Question = require('./models/Question')
require('dotenv').config()

mongoose
  .connect(process.env.DB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection failed', err))

const questions = [
  {
    course: 'React.js',
    questionText: 'What is JSX in React?',
    options: ['A JavaScript extension', 'A CSS framework', 'A Python library'],
    questionType: 'objective',
    correctAnswer: 'A JavaScript extension'
  },
  {
    course: 'PHP',
    questionText: 'What is PHP used for?',
    options: [
      'Frontend development',
      'Backend development',
      'Mobile development'
    ],
    questionType: 'objective',
    correctAnswer: 'Backend development'
  },
  {
    course: 'Python',
    questionText: 'What type of language is Python?',
    options: ['Compiled', 'Interpreted', 'Assembly'],
    questionType: 'objective',
    correctAnswer: 'Interpreted'
  },
  {
    course: 'C++',
    questionText: 'Which of the following is a feature of C++?',
    options: [
      'Object-oriented programming',
      'Garbage collection',
      'Automatic memory management'
    ],
    questionType: 'objective',
    correctAnswer: 'Object-oriented programming'
  },
  {
    course: 'Java',
    questionText: 'Which keyword is used to create an object in Java?',
    options: ['new', 'create', 'initialize'],
    questionType: 'objective',
    correctAnswer: 'new'
  },
  {
    course: 'HTML',
    questionText: 'What does HTML stand for?',
    options: [
      'HyperText Markup Language',
      'HighText Marking Language',
      'HyperTool Markup Language'
    ],
    questionType: 'objective',
    correctAnswer: 'HyperText Markup Language'
  },
  {
    course: 'AWS',
    questionText: 'Which of the following is a service provided by AWS?',
    options: [
      'Elastic Compute Cloud (EC2)',
      'Azure App Services',
      'Google Kubernetes Engine'
    ],
    questionType: 'objective',
    correctAnswer: 'Elastic Compute Cloud (EC2)'
  },
  {
    course: 'Google Cloud',
    questionText: 'What is Google Cloud Storage used for?',
    options: [
      'Storing relational databases',
      'Hosting applications',
      'Storing and accessing data'
    ],
    questionType: 'objective',
    correctAnswer: 'Storing and accessing data'
  },
  {
    course: 'React.js',
    questionText: "What is the use of 'useState' in React?",
    options: [
      'Managing component state',
      'Handling form submissions',
      'Styling components'
    ],
    questionType: 'objective',
    correctAnswer: 'Managing component state'
  },
  {
    course: 'PHP',
    questionText: 'What does the acronym PHP stand for?',
    options: [
      'Personal Home Page',
      'Private Hosting Protocol',
      'Page Hypertext Processor'
    ],
    questionType: 'objective',
    correctAnswer: 'Personal Home Page'
  },
  {
    course: 'Python',
    questionText: 'Which of the following is a web framework for Python?',
    options: ['Django', 'Spring', 'Laravel'],
    questionType: 'objective',
    correctAnswer: 'Django'
  },
  {
    course: 'C++',
    questionText: 'Which of the following is not a feature of C++?',
    options: ['Polymorphism', 'Encapsulation', 'Automatic garbage collection'],
    questionType: 'objective',
    correctAnswer: 'Automatic garbage collection'
  },
  {
    course: 'Java',
    questionText: 'Which method is used to start a thread in Java?',
    options: ['run()', 'start()', 'begin()'],
    questionType: 'objective',
    correctAnswer: 'start()'
  },
  {
    course: 'HTML',
    questionText: 'Which tag is used to create a hyperlink in HTML?',
    options: ['<a>', '<link>', '<href>'],
    questionType: 'objective',
    correctAnswer: '<a>'
  },
  {
    course: 'AWS',
    questionText: 'What does S3 stand for in AWS?',
    options: [
      'Simple Storage Service',
      'Scalable Storage Solution',
      'Simple System Storage'
    ],
    questionType: 'objective',
    correctAnswer: 'Simple Storage Service'
  },
  {
    course: 'Google Cloud',
    questionText:
      'Which Google Cloud service is used for serverless computing?',
    options: ['Cloud Functions', 'Compute Engine', 'App Engine'],
    questionType: 'objective',
    correctAnswer: 'Cloud Functions'
  },
  {
    course: 'React.js',
    questionText:
      'Which hook is used for lifecycle methods in functional components?',
    options: ['useEffect', 'useContext', 'useState'],
    questionType: 'objective',
    correctAnswer: 'useEffect'
  },
  {
    course: 'PHP',
    questionText:
      'Which superglobal array is used to collect form data in PHP?',
    options: ['$_POST', '$_FORM', '$_DATA'],
    questionType: 'objective',
    correctAnswer: '$_POST'
  },
  {
    course: 'Python',
    questionText:
      'Which of the following is used for package management in Python?',
    options: ['npm', 'pip', 'brew'],
    questionType: 'objective',
    correctAnswer: 'pip'
  },
  {
    course: 'C++',
    questionText: 'What is the size of an int in C++?',
    options: ['2 bytes', '4 bytes', '8 bytes'],
    questionType: 'objective',
    correctAnswer: '4 bytes'
  },
  {
    course: 'Java',
    questionText:
      'Which of the following is not a primitive data type in Java?',
    options: ['int', 'String', 'float'],
    questionType: 'objective',
    correctAnswer: 'String'
  },
  {
    course: 'HTML',
    questionText: 'Which attribute is used to define inline styles in HTML?',
    options: ['class', 'id', 'style'],
    questionType: 'objective',
    correctAnswer: 'style'
  },
  {
    course: 'AWS',
    questionText: 'What is the primary database service offered by AWS?',
    options: ['RDS', 'DynamoDB', 'Aurora'],
    questionType: 'objective',
    correctAnswer: 'RDS'
  },
  {
    course: 'Google Cloud',
    questionText: 'What is Google Kubernetes Engine (GKE) used for?',
    options: [
      'Container orchestration',
      'Cloud storage',
      'Compute virtualization'
    ],
    questionType: 'objective',
    correctAnswer: 'Container orchestration'
  },
  {
    course: 'React.js',
    questionText:
      'Which of the following is a way to pass data between React components?',
    options: ['Props', 'States', 'Events'],
    questionType: 'objective',
    correctAnswer: 'Props'
  },
  {
    course: 'PHP',
    questionText:
      'Which function is used to include one PHP file inside another?',
    options: ['import()', 'include()', 'addFile()'],
    questionType: 'objective',
    correctAnswer: 'include()'
  },
  {
    course: 'Python',
    questionText: 'What is a dictionary in Python?',
    options: [
      'A collection of key-value pairs',
      'A list of ordered elements',
      'An immutable data type'
    ],
    questionType: 'objective',
    correctAnswer: 'A collection of key-value pairs'
  },
  {
    course: 'C++',
    questionText:
      'Which operator is used for dynamic memory allocation in C++?',
    options: ['new', 'malloc', 'alloc'],
    questionType: 'objective',
    correctAnswer: 'new'
  },
  {
    course: 'Java',
    questionText: 'Which class is the root of the Java class hierarchy?',
    options: ['Object', 'Main', 'Class'],
    questionType: 'objective',
    correctAnswer: 'Object'
  },
  {
    course: 'HTML',
    questionText: 'Which HTML tag is used to define an image?',
    options: ['<img>', '<image>', '<src>'],
    questionType: 'objective',
    correctAnswer: '<img>'
  },
  {
    course: 'AWS',
    questionText: 'What does EC2 in AWS stand for?',
    options: [
      'Elastic Compute Cloud',
      'Enhanced Compute Cloud',
      'Extended Compute Cluster'
    ],
    questionType: 'objective',
    correctAnswer: 'Elastic Compute Cloud'
  },
  {
    course: 'Google Cloud',
    questionText:
      'Which Google Cloud service provides managed relational databases?',
    options: ['Cloud SQL', 'BigQuery', 'Cloud Functions'],
    questionType: 'objective',
    correctAnswer: 'Cloud SQL'
  },
  {
    course: 'React.js',
    questionText:
      'Which method is used to render components to the DOM in React?',
    options: ['ReactDOM.render', 'renderComponent', 'createComponent'],
    questionType: 'objective',
    correctAnswer: 'ReactDOM.render'
  },
  {
    course: 'PHP',
    questionText: 'Which symbol is used to declare a variable in PHP?',
    options: ['$', '#', '@'],
    questionType: 'objective',
    correctAnswer: '$'
  },
  {
    course: 'Python',
    questionText: 'Which keyword is used to define a function in Python?',
    options: ['function', 'def', 'lambda'],
    questionType: 'objective',
    correctAnswer: 'def'
  },
  {
    course: 'C++',
    questionText: "What is the purpose of the 'this' pointer in C++?",
    options: [
      'Refers to the current object',
      'Refers to the base class',
      'Refers to the global object'
    ],
    questionType: 'objective',
    correctAnswer: 'Refers to the current object'
  },
  {
    course: 'Java',
    questionText: 'Which of the following is a wrapper class in Java?',
    options: ['Integer', 'int', 'char'],
    questionType: 'objective',
    correctAnswer: 'Integer'
  },
  {
    course: 'HTML',
    questionText: 'Which tag is used to create a table in HTML?',
    options: ['<table>', '<tr>', '<td>'],
    questionType: 'objective',
    correctAnswer: '<table>'
  },
  {
    course: 'AWS',
    questionText: 'What does IAM stand for in AWS?',
    options: [
      'Identity and Access Management',
      'Internet and Access Management',
      'Integrated Account Management'
    ],
    questionType: 'objective',
    correctAnswer: 'Identity and Access Management'
  },
  {
    course: 'Google Cloud',
    questionText: 'What is BigQuery in Google Cloud used for?',
    options: ['Data analytics', 'Hosting websites', 'Running virtual machines'],
    questionType: 'objective',
    correctAnswer: 'Data analytics'
  },
  {
    course: 'React.js',
    questionText: 'Which hook is used to manage context in React?',
    options: ['useContext', 'useState', 'useReducer'],
    questionType: 'objective',
    correctAnswer: 'useContext'
  },
  {
    course: 'PHP',
    questionText: 'Which of the following is not a valid PHP variable name?',
    options: ['$variable', '$1variable', '$_variable'],
    questionType: 'objective',
    correctAnswer: '$1variable'
  },
  {
    course: 'Python',
    questionText: 'Which of the following is a mutable data type in Python?',
    options: ['Tuple', 'List', 'String'],
    questionType: 'objective',
    correctAnswer: 'List'
  },
  {
    course: 'C++',
    questionText:
      'Which of the following is used for exception handling in C++?',
    options: ['try-catch', 'throw-catch', 'exception-catch'],
    questionType: 'objective',
    correctAnswer: 'try-catch'
  },
  {
    course: 'Java',
    questionText: 'Which of these is a feature of Java?',
    options: [
      'Platform independent',
      'Garbage collection required',
      'Low-level memory management'
    ],
    questionType: 'objective',
    correctAnswer: 'Platform independent'
  },
  {
    course: 'HTML',
    questionText: 'What does the <title> tag in HTML do?',
    options: [
      'Defines the title of the document',
      'Displays an image',
      'Creates a hyperlink'
    ],
    questionType: 'objective',
    correctAnswer: 'Defines the title of the document'
  },
  {
    course: 'AWS',
    questionText: 'Which AWS service is used for DNS management?',
    options: ['Route 53', 'CloudFront', 'Lambda'],
    questionType: 'objective',
    correctAnswer: 'Route 53'
  },
  {
    course: 'Google Cloud',
    questionText: 'What does Google Cloud Pub/Sub service do?',
    options: [
      'Messaging between applications',
      'Running machine learning models',
      'Storing files'
    ],
    questionType: 'objective',
    correctAnswer: 'Messaging between applications'
  },
  {
    course: 'React.js',
    questionText:
      'Which library is commonly used for managing state in React applications?',
    options: ['Redux', 'jQuery', 'Axios'],
    questionType: 'objective',
    correctAnswer: 'Redux'
  },
  {
    course: 'React.js',
    questionText: 'Which method is used to update the state in React?',
    options: ['setState', 'updateState', 'changeState'],
    questionType: 'objective',
    correctAnswer: 'setState'
  },
  {
    course: 'PHP',
    questionText: 'Which of the following is used to start a session in PHP?',
    options: ['start_session()', 'session_start()', 'init_session()'],
    questionType: 'objective',
    correctAnswer: 'session_start()'
  },
  {
    course: 'Python',
    questionText: 'Which keyword is used to handle exceptions in Python?',
    options: ['catch', 'except', 'error'],
    questionType: 'objective',
    correctAnswer: 'except'
  },
  {
    course: 'C++',
    questionText: 'Which of the following is a loop structure in C++?',
    options: ['while', 'foreach', 'iterate'],
    questionType: 'objective',
    correctAnswer: 'while'
  },
  {
    course: 'Java',
    questionText:
      'Which access modifier is used to make variables accessible only within the class?',
    options: ['private', 'protected', 'public'],
    questionType: 'objective',
    correctAnswer: 'private'
  },
  {
    course: 'HTML',
    questionText:
      'What is the correct way to include an external CSS file in HTML?',
    options: [
      "<link rel='stylesheet' href='style.css'>",
      "<css src='style.css'>",
      "<style href='style.css'>"
    ],
    questionType: 'objective',
    correctAnswer: "<link rel='stylesheet' href='style.css'>"
  },
  {
    course: 'AWS',
    questionText: 'Which AWS service is used for object storage?',
    options: ['EC2', 'S3', 'RDS'],
    questionType: 'objective',
    correctAnswer: 'S3'
  },
  {
    course: 'Google Cloud',
    questionText:
      'Which Google Cloud service is used for managing virtual machines?',
    options: ['Compute Engine', 'Cloud Functions', 'Cloud Storage'],
    questionType: 'objective',
    correctAnswer: 'Compute Engine'
  },
  {
    course: 'React.js',
    questionText: 'What is a pure component in React?',
    options: [
      'A component that re-renders only when props or state changes',
      'A component without any state',
      'A component that is a child component'
    ],
    questionType: 'objective',
    correctAnswer:
      'A component that re-renders only when props or state changes'
  },
  {
    course: 'PHP',
    questionText: 'Which of the following is a PHP framework?',
    options: ['Laravel', 'Django', 'Flask'],
    questionType: 'objective',
    correctAnswer: 'Laravel'
  },
  {
    course: 'Python',
    questionText: 'Which library is used for data analysis in Python?',
    options: ['NumPy', 'Pandas', 'Matplotlib'],
    questionType: 'objective',
    correctAnswer: 'Pandas'
  },
  {
    course: 'C++',
    questionText: 'Which keyword is used to inherit a class in C++?',
    options: ['extends', 'inherits', 'public'],
    questionType: 'objective',
    correctAnswer: 'public'
  },
  {
    course: 'Java',
    questionText: 'What is a constructor in Java?',
    options: [
      'A special method that is called when an object is instantiated',
      'A method that initializes variables',
      'A function that creates new classes'
    ],
    questionType: 'objective',
    correctAnswer:
      'A special method that is called when an object is instantiated'
  },
  {
    course: 'HTML',
    questionText: 'Which tag is used for a line break in HTML?',
    options: ['<br>', '<hr>', '<p>'],
    questionType: 'objective',
    correctAnswer: '<br>'
  },
  {
    course: 'AWS',
    questionText: 'Which AWS service provides NoSQL databases?',
    options: ['RDS', 'DynamoDB', 'S3'],
    questionType: 'objective',
    correctAnswer: 'DynamoDB'
  },
  {
    course: 'Google Cloud',
    questionText: 'What is Cloud Spanner in Google Cloud?',
    options: [
      'A global, scalable, relational database',
      'A tool for container orchestration',
      'A serverless function service'
    ],
    questionType: 'objective',
    correctAnswer: 'A global, scalable, relational database'
  },
  {
    course: 'React.js',
    questionText: "What does 'lifting state up' mean in React?",
    options: [
      'Moving state to a parent component to share it with child components',
      'Increasing the size of a state variable',
      'Changing the state management method'
    ],
    questionType: 'objective',
    correctAnswer:
      'Moving state to a parent component to share it with child components'
  },
  {
    course: 'PHP',
    questionText: 'Which function is used to end a script in PHP?',
    options: ['die()', 'exit()', 'terminate()'],
    questionType: 'objective',
    correctAnswer: 'exit()'
  },
  {
    course: 'Python',
    questionText: 'Which Python module is used for regular expressions?',
    options: ['regex', 're', 'regexp'],
    questionType: 'objective',
    correctAnswer: 're'
  },
  {
    course: 'C++',
    questionText: 'What is a virtual function in C++?',
    options: [
      'A function that can be overridden in derived classes',
      "A function that doesn't return any value",
      'A function that is defined inside an abstract class'
    ],
    questionType: 'objective',
    correctAnswer: 'A function that can be overridden in derived classes'
  },
  {
    course: 'Java',
    questionText: 'Which method in Java is used to compare strings?',
    options: ['compare()', 'equals()', 'compareTo()'],
    questionType: 'objective',
    correctAnswer: 'equals()'
  },
  {
    course: 'HTML',
    questionText: 'What is the purpose of the <meta> tag in HTML?',
    options: [
      'Defines metadata about the HTML document',
      'Embeds media content',
      'Defines the document title'
    ],
    questionType: 'objective',
    correctAnswer: 'Defines metadata about the HTML document'
  },
  {
    course: 'AWS',
    questionText: 'Which AWS service is used for container orchestration?',
    options: ['EKS', 'Lambda', 'RDS'],
    questionType: 'objective',
    correctAnswer: 'EKS'
  },
  {
    course: 'Google Cloud',
    questionText: 'What is Cloud Run in Google Cloud?',
    options: [
      'A fully managed service to run containers',
      'A serverless storage service',
      'A database management tool'
    ],
    questionType: 'objective',
    correctAnswer: 'A fully managed service to run containers'
  },
  {
    course: 'React.js',
    questionText: 'What is the primary purpose of React Router?',
    options: [
      'To handle navigation between components',
      'To manage component state',
      'To manage forms'
    ],
    questionType: 'objective',
    correctAnswer: 'To handle navigation between components'
  },
  {
    course: 'PHP',
    questionText: 'Which PHP function is used to get the length of a string?',
    options: ['strlen()', 'strlength()', 'count()'],
    questionType: 'objective',
    correctAnswer: 'strlen()'
  },
  {
    course: 'Python',
    questionText: 'What is the output of 3**2 in Python?',
    options: ['6', '9', '8'],
    questionType: 'objective',
    correctAnswer: '9'
  },
  {
    course: 'C++',
    questionText: "What is the purpose of the 'friend' keyword in C++?",
    options: [
      'To allow access to private members of a class',
      'To declare a global function',
      'To define a friend class'
    ],
    questionType: 'objective',
    correctAnswer: 'To allow access to private members of a class'
  },
  {
    course: 'Java',
    questionText: "What is the purpose of the 'final' keyword in Java?",
    options: [
      'To prevent inheritance of a class or overriding of a method',
      'To declare a variable',
      'To start a thread'
    ],
    questionType: 'objective',
    correctAnswer: 'To prevent inheritance of a class or overriding of a method'
  },
  {
    course: 'HTML',
    questionText: 'Which tag is used to define a table header in HTML?',
    options: ['<th>', '<tr>', '<td>'],
    questionType: 'objective',
    correctAnswer: '<th>'
  },
  {
    course: 'AWS',
    questionText: 'Which AWS service is used for monitoring and observability?',
    options: ['CloudWatch', 'CloudFormation', 'S3'],
    questionType: 'objective',
    correctAnswer: 'CloudWatch'
  },
  {
    course: 'Google Cloud',
    questionText:
      'Which Google Cloud service is used for serverless event-driven functions?',
    options: ['Cloud Functions', 'Compute Engine', 'BigQuery'],
    questionType: 'objective',
    correctAnswer: 'Cloud Functions'
  },
  {
    course: 'React.js',
    questionText: 'What is the main benefit of using React hooks?',
    options: [
      'Hooks allow you to use state and other React features in functional components',
      'Hooks make components render faster',
      'Hooks replace all class components'
    ],
    questionType: 'objective',
    correctAnswer:
      'Hooks allow you to use state and other React features in functional components'
  },
  {
    course: 'PHP',
    questionText: 'Which operator is used to concatenate strings in PHP?',
    options: ['+', '.', '&'],
    questionType: 'objective',
    correctAnswer: '.'
  },
  {
    course: 'Python',
    questionText:
      'Which Python data structure can store both unique and unordered elements?',
    options: ['Set', 'List', 'Dictionary'],
    questionType: 'objective',
    correctAnswer: 'Set'
  },
  {
    course: 'React.js',
    questionText: "What does the 'useEffect' hook do in React?",
    options: [
      'It allows you to perform side effects in function components',
      'It manages state within a component',
      'It provides context to components'
    ],
    questionType: 'objective',
    correctAnswer:
      'It allows you to perform side effects in function components'
  },
  {
    course: 'PHP',
    questionText: 'Which PHP function is used to start a session?',
    options: ['start_session()', 'session_start()', 'init_session()'],
    questionType: 'objective',
    correctAnswer: 'session_start()'
  },
  {
    course: 'Python',
    questionText: 'Which data type is immutable in Python?',
    options: ['List', 'Set', 'Tuple'],
    questionType: 'objective',
    correctAnswer: 'Tuple'
  },
  {
    course: 'C++',
    questionText: "What is the purpose of the 'virtual' keyword in C++?",
    options: [
      'To allow a method to be overridden in a derived class',
      'To declare a static method',
      'To define a private method'
    ],
    questionType: 'objective',
    correctAnswer: 'To allow a method to be overridden in a derived class'
  },
  {
    course: 'Java',
    questionText: 'What is the default value of a boolean in Java?',
    options: ['true', 'false', 'null'],
    questionType: 'objective',
    correctAnswer: 'false'
  },
  {
    course: 'HTML',
    questionText:
      'Which HTML attribute is used to provide alternative text for an image?',
    options: ['alt', 'title', 'src'],
    questionType: 'objective',
    correctAnswer: 'alt'
  },
  {
    course: 'AWS',
    questionText: 'Which AWS service is used for scalable storage solutions?',
    options: ['S3', 'EC2', 'Lambda'],
    questionType: 'objective',
    correctAnswer: 'S3'
  },
  {
    course: 'Google Cloud',
    questionText:
      'Which Google Cloud service is used for machine learning models?',
    options: ['AI Platform', 'Cloud SQL', 'BigQuery'],
    questionType: 'objective',
    correctAnswer: 'AI Platform'
  },
  {
    course: 'React.js',
    questionText: "What is the primary purpose of React's 'context' API?",
    options: [
      'To manage global state across components',
      'To handle user inputs',
      'To manage component lifecycle'
    ],
    questionType: 'objective',
    correctAnswer: 'To manage global state across components'
  },
  {
    course: 'PHP',
    questionText: 'Which PHP function is used to get the current time?',
    options: ['current_time()', 'date()', 'time()'],
    questionType: 'objective',
    correctAnswer: 'date()'
  },
  {
    course: 'Python',
    questionText: 'Which Python module is used for handling JSON data?',
    options: ['json', 'xml', 'csv'],
    questionType: 'objective',
    correctAnswer: 'json'
  },
  {
    course: 'C++',
    questionText: "What does the 'namespace' keyword do in C++?",
    options: [
      'It defines a scope to group identifiers',
      'It creates a new class',
      'It includes a header file'
    ],
    questionType: 'objective',
    correctAnswer: 'It defines a scope to group identifiers'
  },
  {
    course: 'Java',
    questionText: 'Which Java keyword is used to define a constant?',
    options: ['final', 'constant', 'static'],
    questionType: 'objective',
    correctAnswer: 'final'
  },
  {
    course: 'HTML',
    questionText: 'Which tag is used to create a list in HTML?',
    options: ['<list>', '<ul>', '<ol>'],
    questionType: 'objective',
    correctAnswer: '<ul>'
  },
  {
    course: 'AWS',
    questionText:
      'Which AWS service is used for continuous integration and continuous deployment?',
    options: ['CodePipeline', 'S3', 'EC2'],
    questionType: 'objective',
    correctAnswer: 'CodePipeline'
  },
  {
    course: 'Google Cloud',
    questionText: "What does Google Cloud's 'Dataflow' service do?",
    options: [
      'Data processing and analysis',
      'Machine learning',
      'Storage management'
    ],
    questionType: 'objective',
    correctAnswer: 'Data processing and analysis'
  },
  {
    course: 'React.js',
    questionText: "What is the role of 'keys' in React lists?",
    options: [
      'To uniquely identify elements in a list for efficient updates',
      'To define component styles',
      'To manage form submissions'
    ],
    questionType: 'objective',
    correctAnswer:
      'To uniquely identify elements in a list for efficient updates'
  },
  {
    course: 'PHP',
    questionText: "What does the 'include_once' function do in PHP?",
    options: [
      'Includes a file only once',
      'Includes multiple files',
      'Includes a file and continues even if an error occurs'
    ],
    questionType: 'objective',
    correctAnswer: 'Includes a file only once'
  },
  {
    course: 'Python',
    questionText: "What is the result of '3 // 2' in Python?",
    options: ['1', '1.5', '2'],
    questionType: 'objective',
    correctAnswer: '1'
  },
  {
    course: 'C++',
    questionText: "What is the purpose of the 'friend' function in C++?",
    options: [
      'To grant access to private and protected members of a class',
      'To define a new operator',
      'To initialize class objects'
    ],
    questionType: 'objective',
    correctAnswer: 'To grant access to private and protected members of a class'
  },
  {
    course: 'Java',
    questionText: 'Which Java keyword is used to handle exceptions?',
    options: ['try', 'handle', 'error'],
    questionType: 'objective',
    correctAnswer: 'try'
  },
  {
    course: 'HTML',
    questionText: 'Which HTML tag is used to define the header of a document?',
    options: ['<header>', '<h1>', '<head>'],
    questionType: 'objective',
    correctAnswer: '<head>'
  },
  {
    course: 'AWS',
    questionText:
      'Which AWS service is used to deploy and manage containerized applications?',
    options: ['ECS', 'RDS', 'S3'],
    questionType: 'objective',
    correctAnswer: 'ECS'
  },
  {
    course: 'Google Cloud',
    questionText: "What is the purpose of Google Cloud's 'Bigtable' service?",
    options: ['Managed NoSQL database', 'Data warehousing', 'Event streaming'],
    questionType: 'objective',
    correctAnswer: 'Managed NoSQL database'
  },
  {
    course: 'React.js',
    questionText: "What is the purpose of 'React.StrictMode'?",
    options: [
      'To enable additional checks and warnings in development mode',
      'To manage state',
      'To handle routing'
    ],
    questionType: 'objective',
    correctAnswer:
      'To enable additional checks and warnings in development mode'
  },
  {
    course: 'PHP',
    questionText: 'Which PHP function is used to connect to a MySQL database?',
    options: ['mysql_connect()', 'mysqli_connect()', 'db_connect()'],
    questionType: 'objective',
    correctAnswer: 'mysqli_connect()'
  },
  {
    course: 'Python',
    questionText:
      'Which function is used to read the contents of a file in Python?',
    options: ['read()', 'load()', 'open()'],
    questionType: 'objective',
    correctAnswer: 'open()'
  },
  {
    course: 'C++',
    questionText:
      'Which of the following is used to declare a constant in C++?',
    options: ['const', '#define', 'static'],
    questionType: 'objective',
    correctAnswer: 'const'
  },
  {
    course: 'Java',
    questionText: 'What is an abstract class in Java?',
    options: [
      'A class that cannot be instantiated and may contain abstract methods',
      'A class with all methods defined',
      'A class that only contains static methods'
    ],
    questionType: 'objective',
    correctAnswer:
      'A class that cannot be instantiated and may contain abstract methods'
  },
  {
    course: 'React.js',
    questionText: 'What is JSX in React?',
    options: ['A JavaScript extension', 'A CSS framework', 'A Python library'],
    correctAnswer: 'A JavaScript extension',
    questionType: 'objective' // Multiple Choice Question
  },
  {
    course: 'PHP',
    questionText: 'What is PHP used for?',
    options: [
      'Frontend development',
      'Backend development',
      'Mobile development'
    ],
    correctAnswer: 'Backend development',
    questionType: 'objective'
  },
  {
    course: 'Python',
    questionText: 'What type of language is Python?',
    options: ['Compiled', 'Interpreted', 'Assembly'],
    correctAnswer: 'Interpreted',
    questionType: 'objective'
  },
  {
    course: 'C++',
    questionText: 'Which of the following is a feature of C++?',
    options: [
      'Object-oriented programming',
      'Garbage collection',
      'Automatic memory management'
    ],
    correctAnswer: 'Object-oriented programming',
    questionType: 'objective'
  },
  {
    course: 'Java',
    questionText: 'Which keyword is used to create an object in Java?',
    options: ['new', 'create', 'initialize'],
    correctAnswer: 'new',
    questionType: 'objective'
  },
  {
    course: 'HTML',
    questionText: 'What does HTML stand for?',
    options: [
      'HyperText Markup Language',
      'HighText Marking Language',
      'HyperTool Markup Language'
    ],
    correctAnswer: 'HyperText Markup Language',
    questionType: 'objective'
  },
  {
    course: 'AWS',
    questionText: 'Which of the following is a service provided by AWS?',
    options: [
      'Elastic Compute Cloud (EC2)',
      'Azure App Services',
      'Google Kubernetes Engine'
    ],
    correctAnswer: 'Elastic Compute Cloud (EC2)',
    questionType: 'objective'
  },
  {
    course: 'Google Cloud',
    questionText: 'What is Google Cloud Storage used for?',
    options: [
      'Storing relational databases',
      'Hosting applications',
      'Storing and accessing data'
    ],
    correctAnswer: 'Storing and accessing data',
    questionType: 'objective'
  },
  {
    course: 'React.js',
    questionText: "What is the use of 'useState' in React?",
    options: [
      'Managing component state',
      'Handling form submissions',
      'Styling components'
    ],
    correctAnswer: 'Managing component state',
    questionType: 'objective'
  },
  {
    course: 'PHP',
    questionText: 'What does the acronym PHP stand for?',
    options: [
      'Personal Home Page',
      'Private Hosting Protocol',
      'Page Hypertext Processor'
    ],
    correctAnswer: 'Personal Home Page',
    questionType: 'objective'
  },
  {
    course: 'Python',
    questionText: 'Which of the following is a web framework for Python?',
    options: ['Django', 'Spring', 'Laravel'],
    correctAnswer: 'Django',
    questionType: 'objective'
  },
  {
    course: 'C++',
    questionText: 'Which of the following is not a feature of C++?',
    options: ['Polymorphism', 'Encapsulation', 'Automatic garbage collection'],
    correctAnswer: 'Automatic garbage collection',
    questionType: 'objective'
  },
  {
    course: 'Java',
    questionText: 'Which method is used to start a thread in Java?',
    options: ['run()', 'start()', 'begin()'],
    correctAnswer: 'start()',
    questionType: 'objective'
  },
  {
    course: 'HTML',
    questionText: 'Which tag is used to create a hyperlink in HTML?',
    options: ['<a>', '<link>', '<href>'],
    correctAnswer: '<a>',
    questionType: 'objective'
  },
  {
    course: 'AWS',
    questionText: 'What does S3 stand for in AWS?',
    options: [
      'Simple Storage Service',
      'Scalable Storage Solution',
      'Simple System Storage'
    ],
    correctAnswer: 'Simple Storage Service',
    questionType: 'objective'
  },
  {
    course: 'Google Cloud',
    questionText:
      'Which Google Cloud service is used for serverless computing?',
    options: ['Cloud Functions', 'Compute Engine', 'App Engine'],
    correctAnswer: 'Cloud Functions',
    questionType: 'objective'
  },
  {
    course: 'React.js',
    questionText:
      'Which hook is used for lifecycle methods in functional components?',
    options: ['useEffect', 'useContext', 'useState'],
    correctAnswer: 'useEffect',
    questionType: 'objective'
  },
  {
    course: 'PHP',
    questionText:
      'Which superglobal array is used to collect form data in PHP?',
    options: ['$_POST', '$_FORM', '$_DATA'],
    correctAnswer: '$_POST',
    questionType: 'objective'
  },
  {
    course: 'Python',
    questionText:
      'Which of the following is used for package management in Python?',
    options: ['npm', 'pip', 'brew'],
    correctAnswer: 'pip',
    questionType: 'objective'
  },
  {
    course: 'C++',
    questionText: 'What is the size of an int in C++?',
    options: ['2 bytes', '4 bytes', '8 bytes'],
    correctAnswer: '4 bytes',
    questionType: 'objective'
  },
  {
    course: 'Java',
    questionText:
      'Which of the following is not a primitive data type in Java?',
    options: ['int', 'String', 'float'],
    correctAnswer: 'String',
    questionType: 'objective'
  },
  {
    course: 'HTML',
    questionText: 'Which attribute is used to define inline styles in HTML?',
    options: ['class', 'id', 'style'],
    correctAnswer: 'style',
    questionType: 'objective'
  },
  {
    course: 'AWS',
    questionText: 'What is the primary database service offered by AWS?',
    options: ['RDS', 'DynamoDB', 'Aurora'],
    correctAnswer: 'RDS',
    questionType: 'objective'
  },
  {
    course: 'Google Cloud',
    questionText: 'What is Google Kubernetes Engine (GKE) used for?',
    options: [
      'Container orchestration',
      'Cloud storage',
      'Compute virtualization'
    ],
    correctAnswer: 'Container orchestration',
    questionType: 'objective'
  },
  {
    course: 'React.js',
    questionText:
      'Which of the following is a way to pass data between React components?',
    options: ['Props', 'States', 'Events'],
    correctAnswer: 'Props',
    questionType: 'objective'
  },
  {
    course: 'PHP',
    questionText:
      'Which function is used to include one PHP file inside another?',
    options: ['import()', 'include()', 'addFile()'],
    correctAnswer: 'include()',
    questionType: 'objective'
  },
  {
    course: 'Python',
    questionText: 'What is a dictionary in Python?',
    options: [
      'A collection of key-value pairs',
      'A list of ordered elements',
      'An immutable data type'
    ],
    correctAnswer: 'A collection of key-value pairs',
    questionType: 'objective'
  },
  // Adding theory questions
  {
    course: 'React.js',
    questionText: 'Explain the concept of Virtual DOM in React.',
    options: [], // No options for theory questions
    correctAnswer:
      'The Virtual DOM is a lightweight representation of the actual DOM. React uses it to optimize rendering by minimizing direct manipulations of the DOM.',
    questionType: 'theory' // theory Question
  },
  {
    course: 'PHP',
    questionText: 'Describe how PHP handles form submission.',
    options: [],
    correctAnswer:
      'PHP handles form submission by using superglobal arrays like $_POST and $_GET to retrieve data sent from HTML forms.',
    questionType: 'theory'
  },
  {
    course: 'Python',
    questionText: 'What are the main features of Python?',
    options: [],
    correctAnswer:
      'Python is known for its simplicity, readability, extensive libraries, and support for multiple programming paradigms such as procedural, object-oriented, and functional programming.',
    questionType: 'theory'
  },
  {
    course: 'C++',
    questionText:
      'Discuss the importance of constructors and destructors in C++.',
    options: [],
    correctAnswer:
      'Constructors are special member functions that are called when an object is created, initializing the object. Destructors are called when an object goes out of scope or is deleted, allowing for cleanup and resource deallocation.',
    questionType: 'theory'
  }
]

async function seedQuestions () {
  await Question.insertMany(questions)
  console.log('Questions seeded')
  mongoose.disconnect()
}
seedQuestions()

module.exports = seedQuestions
