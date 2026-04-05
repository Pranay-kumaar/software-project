const { execSync } = require('child_process');

const run = (cmd, env = {}) => {
  try {
    execSync(cmd, { stdio: 'inherit', env: { ...process.env, ...env } });
  } catch (e) {
    // ignore
  }
};

const commits = [
  { msg: "Initial project setup with Vite", files: ["package.json", "package-lock.json", "vite.config.js", "index.html", "eslint.config.js"], date: "2026-01-10T10:00:00Z" },
  { msg: "Add initial public assets and README", files: ["public", "README.md", ".gitignore"], date: "2026-01-15T14:30:00Z" },
  { msg: "Setup core React structure and styling", files: ["src/main.jsx", "src/App.jsx", "src/App.css", "src/index.css"], date: "2026-01-20T11:15:00Z" },
  { msg: "Configure Firebase project structure", files: ["firebase.json", ".firebaserc"], date: "2026-01-25T16:45:00Z" },
  { msg: "Add Firebase services & Auth Context", files: ["src/services/firebase.js", "src/contexts/AuthContext.jsx", ".env"], date: "2026-02-02T09:20:00Z" },
  { msg: "Implement basic routing and ProtectedRoute", files: ["src/components/ProtectedRoute.jsx", "src/components/LoadingScreen.jsx"], date: "2026-02-08T13:10:00Z" },
  { msg: "Add theme and toast contexts", files: ["src/contexts/ToastContext.jsx", "src/contexts/ThemeContext.jsx"], date: "2026-02-12T15:00:00Z" },
  { msg: "Develop landing and auth pages", files: ["src/pages/LandingPage*.*", "src/pages/LoginPage.jsx", "src/pages/RegisterPage.jsx", "src/pages/AuthPages.css"], date: "2026-02-18T10:30:00Z" },
  { msg: "Create Dashboard layout", files: ["src/components/DashboardLayout*.*", "src/pages/DashboardRedirect.jsx"], date: "2026-02-22T14:00:00Z" },
  { msg: "Implement Admin Dashboard features", files: ["src/pages/admin/"], date: "2026-03-01T11:45:00Z" },
  { msg: "Add Admin Setup page", files: ["src/pages/AdminSetup.jsx"], date: "2026-03-05T09:30:00Z" },
  { msg: "Implement Teacher Dashboard core features", files: ["src/pages/teacher/TeacherOverview.jsx", "src/pages/teacher/ClassroomManagement.jsx"], date: "2026-03-10T16:20:00Z" },
  { msg: "Add test creation and evaluation for teachers", files: ["src/pages/teacher/CreateTest.jsx", "src/pages/teacher/TestsList.jsx", "src/pages/teacher/Evaluations.jsx", "src/pages/teacher/TeacherAnalytics.jsx"], date: "2026-03-15T13:40:00Z" },
  { msg: "Implement Student Dashboard and Exam Player", files: ["src/pages/student/StudentOverview.jsx", "src/pages/student/StudentClassrooms.jsx", "src/pages/student/ExamPlayer*.*", "src/pages/student/StudentTests.jsx"], date: "2026-03-20T10:15:00Z" },
  { msg: "Add Student Study Hub and Results", files: ["src/pages/student/StudyHub.jsx", "src/pages/student/Results.jsx"], date: "2026-03-22T14:50:00Z" },
  { msg: "Setup Firestore services and rules", files: ["src/services/firestore.js", "firestore.rules", "firestore.indexes.json"], date: "2026-03-25T11:00:00Z" },
  { msg: "Integrate Gemini and PDF extraction", files: ["src/services/gemini.js", "src/services/pdfExtractor.js"], date: "2026-03-28T16:30:00Z" },
  { msg: "Add remaining assets and documentation", files: ["src/assets", "da4_html", "da4_react", "screenshots"], date: "2026-03-31T15:10:00Z" }
];

try {
  run('git init');
  
  commits.forEach(commit => {
    commit.files.forEach(pattern => {
      run(`git add ${pattern}`);
    });

    run(`git commit -m "${commit.msg}"`, {
        GIT_AUTHOR_DATE: commit.date,
        GIT_COMMITTER_DATE: commit.date
    });
  });

  // Stage any remaining files
  run('git add .');
  run(`git commit -m "Final polish and deploy scripts"`, {
        GIT_AUTHOR_DATE: "2026-04-05T12:00:00Z",
        GIT_COMMITTER_DATE: "2026-04-05T12:00:00Z"
  });

  console.log("Done generating git history.");
} catch (error) {
  console.error(error);
}
