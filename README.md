<div align="center">

# 🧠 MINDSCAPE

### Focus. Transform. Grow.

**A Smart Student Productivity & Focus Management System**

A productivity platform designed to help students organize their studies, build better focus habits, manage tasks, and track their learning progress in one place.

<br>

[![GitHub Repository](https://img.shields.io/badge/GitHub-MindScape-181717?style=for-the-badge&logo=github)](https://github.com/aadarsh18272-png/MindScape)
[![Node.js](https://img.shields.io/badge/Node.js-Runtime-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-Backend-000000?style=for-the-badge&logo=express)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)

</div>

---

## 📌 About the Project

**MINDSCAPE** is a student-focused productivity and study management application built to make studying more structured, engaging, and manageable.

Students often struggle with distractions, inconsistent study routines, task management, and tracking their academic progress. MINDSCAPE brings essential productivity tools together in a unified interface to help address these challenges.

With a combination of focus sessions, study planning, learning tools, progress tracking, and AI-assisted learning, MINDSCAPE aims to create a more organized study experience.

### 🎯 Project Objectives

- Improve concentration through structured focus sessions.
- Organize study tasks and learning goals.
- Make revision more effective using flashcards.
- Support students with an AI-powered learning assistant.
- Track productivity and visualize study progress.
- Encourage consistent study habits through achievements.

---

## ✨ Key Features

### ⏱️ 1. Pomodoro Focus Timer
Use structured study sessions and breaks to manage time, maintain concentration, and build consistent study habits.

### 🌿 2. Focus Environment
Create a more engaging study atmosphere with visual focus environments, including nature-inspired scenes and relaxing animations.

### 🗂️ 3. Flashcards
Create and review flashcards to reinforce important concepts and make revision easier.

### 📅 4. Study Plan
Organize study activities, manage tasks, and structure learning goals around your academic schedule.

### 🤖 5. AI Tutor
Get AI-assisted learning support to help understand concepts, explore topics, and support your study workflow.

### 📊 6. Analytics
Review productivity information and study progress through a dedicated analytics interface.

### 🏆 7. Achievements
Track milestones and recognize progress toward your productivity goals.

### 🧰 8. Student Tools
Access useful study-oriented tools from a centralized workspace.

### ⚙️ 9. Settings
Manage the application's available preferences and configuration options.

---

## 🖥️ Application Preview

Screenshots of the actual application will be added here.

<!--
After uploading screenshots to the repository, uncomment and update these examples.

<p align="center">
  <img src="frontend/assets/dashboard.png" alt="MINDSCAPE Dashboard" width="85%">
</p>

<p align="center">
  <em>MINDSCAPE — Main Dashboard</em>
</p>

<p align="center">
  <img src="frontend/assets/focus-timer.png" alt="MINDSCAPE Focus Timer" width="85%">
</p>

<p align="center">
  <em>Focus Timer and Study Environment</em>
</p>
-->

**Recommended screenshots:**

- Main dashboard
- Pomodoro timer and focus environment
- AI Tutor
- Flashcards
- Study Plan
- Analytics dashboard

*Use actual screenshots from your application. Ensure that each image path matches the files committed to GitHub.*

---

## 🛠️ Technology Stack

| Technology | Purpose |
|---|---|
| HTML5 | Frontend structure |
| CSS3 | Styling and responsive interface |
| JavaScript | Frontend interactions and application logic |
| Node.js | Backend runtime |
| Express.js | Backend server and API routes |
| MongoDB Atlas | Cloud database |
| Mongoose | MongoDB object modeling |
| JSON Web Token (JWT) | Authentication tokens |
| bcryptjs | Password hashing |
| Google GenAI SDK | AI integration |
| dotenv | Environment configuration |
| Nodemon | Development workflow |

*The frontend technologies are based on the project's existing development setup. Verify the actual AI integration and environment configuration before deploying.*

---

## 🏗️ Project Architecture

MINDSCAPE separates the frontend interface from the backend services.

```text
MINDSCAPE/
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   └── assets/
│
├── backend/
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   ├── middleware/
│   └── server.js
│
├── package.json
├── package-lock.json
├── .gitignore
└── README.md
```

*This is an illustrative structure. Update the tree to match the actual files and folders in your repository.*

---

## 🚀 Getting Started

Follow these steps to set up MINDSCAPE locally.

### Prerequisites

Install the following tools before starting:

- [Node.js](https://nodejs.org/)
- npm, included with Node.js
- [Git](https://git-scm.com/)
- A [MongoDB Atlas](https://www.mongodb.com/atlas) database, if required by your configuration
- A Google GenAI API key, if the AI Tutor requires it

### 1. Clone the Repository

```bash
git clone https://github.com/aadarsh18272-png/MindScape.git
```

### 2. Navigate to the Project

```bash
cd MindScape
```

### 3. Install Dependencies

The repository includes a root-level `package.json`.

```bash
npm install
```

### 4. Configure Environment Variables

Create the environment file at the location expected by your backend configuration.

For example, if your backend reads its configuration from `backend/.env`, add:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
GOOGLE_API_KEY=your_google_genai_api_key
```

**Important:** These are example variable names. Check the backend source code to confirm the exact names required by your application. Do not commit real credentials or secret keys to GitHub.

### 5. Start the Application

Run the frontend and backend using the commands defined by your project configuration.

The exact commands depend on the scripts and static-file configuration currently implemented in the repository. Verify the root `package.json` and backend server before using commands such as `npm start` or `node backend/server.js`.

---

## 🔐 Security

Follow these security practices when configuring or deploying MINDSCAPE:

- Store database credentials and API keys in environment variables.
- Never expose private API keys in frontend JavaScript.
- Never commit `.env` files containing secrets.
- Use strong, unpredictable JWT secrets.
- Hash passwords before storing them.
- Validate incoming API requests.
- Restrict database access to trusted applications and users.
- Configure CORS according to the application's deployment requirements.

---

## 🗺️ Future Enhancements

Potential improvements for future versions include:

- [ ] More personalized study recommendations.
- [ ] Improved study analytics and progress visualization.
- [ ] Additional focus environments.
- [ ] Enhanced flashcard revision workflows.
- [ ] Improved mobile responsiveness.
- [ ] More detailed productivity reports.
- [ ] Additional accessibility improvements.

*These are potential enhancements, not claims about currently implemented features.*

---

## 🤝 Contributing

Contributions, suggestions, and feedback are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Test the changes locally.
5. Submit a pull request with a clear description.

---

## 👨‍💻 Author

**Adarsh Dwivedi**

Computer Science Student | Project Developer

- **GitHub:** [@aadarsh18272-png](https://github.com/aadarsh18272-png)
- **Project Repository:** [MINDSCAPE](https://github.com/aadarsh18272-png/MindScape)

---

## 📄 License

Check the repository's licensing terms before redistributing or reusing this project.

---

<div align="center">

### MINDSCAPE

**Focus. Transform. Grow.**

*Build better study habits. One session at a time.*

</div>
