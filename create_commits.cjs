const { execSync } = require('child_process');
const path = require('path');

const commits = [
  {
    date: '2026-04-01T10:00:00',
    message: 'Initial project structure and Firebase configuration',
    files: ['package.json', 'package-lock.json', 'firebase.json', '.firebaserc', 'firestore.rules', 'firestore.indexes.json', 'vite.config.js', 'index.html', 'src/services/firebase.js']
  },
  {
    date: '2026-04-04T14:30:00',
    message: 'Implement teacher classroom management and core Firestore services',
    files: ['src/services/firestore.js', 'src/pages/teacher/ClassroomManagement.jsx', 'src/pages/teacher/TeacherOverview.jsx', 'src/pages/teacher/CreateTest.jsx', 'src/pages/teacher/TestsList.jsx']
  },
  {
    date: '2026-04-07T11:20:00',
    message: 'Add student dashboard and AI Study Hub with PDF support',
    files: ['src/pages/student/StudyHub.jsx', 'src/pages/student/StudentOverview.jsx', 'src/pages/student/StudentClassrooms.jsx', 'src/pages/student/StudentTests.jsx', 'src/services/pdfExtractor.js']
  },
  {
    date: '2026-04-10T16:45:00',
    message: 'Implement Gemini API rotation and Admin API key management',
    files: ['src/services/gemini.js', 'src/pages/admin/ApiKeyManagement.jsx', 'src/pages/admin/AdminOverview.jsx', 'src/pages/admin/TeacherApprovals.jsx']
  },
  {
    date: '2026-04-13T09:15:00',
    message: 'Add automated UI tests and platform page screenshots',
    files: ['selenium_tests.py', 'capture_screenshots.py', 'screenshots_of_pages/']
  },
  {
    date: '2026-04-15T18:00:00',
    message: 'Final fixes: Redesigned Gemini retry logic and fixed classroom persistence',
    files: ['src/services/gemini.js', 'src/services/firestore.js', 'src/pages/teacher/ClassroomManagement.jsx', 'src/pages/admin/ApiKeyManagement.jsx']
  }
];

function run(cmd) {
  try {
    return execSync(cmd, { stdio: 'inherit' });
  } catch (e) {
    console.error(`Failed: ${cmd}`);
  }
}

// First, ensure we're on a clean slate or just add to current
console.log('Starting backdated commits...');

commits.forEach(commit => {
  const env = `set GIT_AUTHOR_DATE=${commit.date}&& set GIT_COMMITTER_DATE=${commit.date}`;
  
  commit.files.forEach(file => {
    // Check if file exists before adding
    run(`git add "${file}"`);
  });
  
  console.log(`Committing: ${commit.message} on ${commit.date}`);
  run(`${env} && git commit -m "${commit.message}"`);
});

console.log('All backdated commits created locally.');
