# EMSIGHT Platform: Comprehensive Project Report

## 1. Introduction
The EMSIGHT project is an Integrated Student Ecosystem designed for an academic environment, serving as a unified digital hub for students, teachers, and administrators. It is developed as a "Projet de Fin d'Année" (PFA). The platform is divided into three major modules: **EMSIGHT Portal** (core academic management), **EMSI Share** (academic resource sharing), and **EMSI Community** (social networking, job opportunities, and AI-driven career services).

This document provides a detailed, top-to-bottom technical and functional overview of the project, structured to facilitate the generation of a formal LaTeX (`.tex`) report.

---

## 2. System Architecture & Technology Stack

The project follows a decoupled client-server architecture.

### 2.1 Backend Architecture (Server)
- **Framework**: Django & Django REST Framework (DRF)
- **Language**: Python 3
- **Database**: SQLite (used for development; easily translatable to PostgreSQL)
- **AI Integration**: Groq API (Llama 3.3 70B Versatile) for CV analysis, with a built-in smart heuristic keyword-matching fallback.

### 2.2 Frontend Architecture (Client)
- **Framework**: React.js configured with Vite
- **Language**: JavaScript (JSX), Vanilla CSS with CSS Variables for dynamic theming (Light/Dark mode)
- **State Management**: React Hooks (`useState`, `useEffect`) and `localStorage` for session and theme persistence.
- **Routing**: Component-level conditional rendering based on platform state (`portal`, `share`, `community`) and user roles.

---

## 3. Database Schema & Data Models

The backend is modularized into four primary Django apps.

### 3.1 `accounts` App (Authentication & Roles)
Handles customized user authentication and role-based access control (RBAC).
- **CustomUser**: Extends `AbstractUser`. Includes fields for `role` (`student`, `teacher`, `admin`), `matricule`, `gender`, and `profile_picture`.
- **StudentProfile**: Linked One-to-One with User. Stores `filiere` (major), `annee_etude` (year), `numero_etudiant`, and `tutor_name`.
- **TeacherProfile**: Linked One-to-One with User. Stores `departement`, `matiere` (subjects taught), and `classes`.
- **AdminProfile**: Linked One-to-One with User. Stores `service` department.

### 3.2 `portal` App (Academic Management)
Manages the core administrative and academic workflows.
- **ClassSchedule**: Stores weekly timetable data in JSON format (`schedule_data`) for a specific `target_class`.
- **ReportCard & Grade**: `ReportCard` tracks academic terms (year/semester) and general averages. `Grade` is linked to a report card and tracks individual subject scores and whether it is a "rattrapage" (retake).
- **Absence**: Tracks student attendance. Includes `subject`, `date_seance`, `is_present`, and a justification system (`justification_text`, `justification_status` validated by teachers).
- **DocumentRequest**: Allows students to request administrative documents (e.g., Attestation de Scolarité/Réussite) and tracks the validation `status` by admins.
- **CalendarEvent**: Academic events created by admins, assigned to specific teachers, and targeted at specific classes.
- **Notification**: System alerts sent by admins to specific recipients.

### 3.3 `share` App (EMSI Share)
A collaborative platform for sharing educational materials.
- **Resource**: The core model for shared files. Includes `title`, `subject`, `resource_type` (Course, Exercise with/without solution), the uploaded `file`, and the `author`. It features a `validated_by` Many-to-Many field allowing multiple teachers to verify the content.
- **ResourceFavorite**: Allows users to bookmark resources.
- **ResourceReport**: Allows users to report inappropriate or inaccurate resources.

### 3.4 `community` App (EMSI Community)
A social and professional networking module.
- **Post**: Social feed posts containing text and optional `media`. Like resources, posts support a multi-teacher validation system via `validated_by`.
- **Event**: Community-organized events with `date` and `location`.
- **JobOffer**: Internship and job postings featuring `company`, `description`, `requirements`, and `job_type`.
- **CVAnalysis**: Stores the results of AI-driven CV evaluations against specific Job Offers, containing the `cv_text`, the match `score`, and actionable `suggestions`.

---

## 4. Frontend Structure & UI/UX

The frontend is housed in the `frontend/` directory and built around a unified single-page application (SPA) layout.

### 4.1 Core Components
- **`App.jsx`**: The root component managing global state (User, Theme, Current Platform). It acts as the primary router, injecting the appropriate Dashboard based on the user's role and selected module.
- **`TopBar.jsx`**: Global navigation header allowing users to switch between the three main platforms (Portal, Share, Community), toggle Light/Dark themes, and log out.
- **`Sidebar.jsx`**: Context-aware side navigation menu. The menu items dynamically change based on the active platform and the user's role (e.g., Admins see "Schedule Management", Students see "My Grades").

### 4.2 Module Dashboards
- **Role-Based Portal Dashboards** (`StudentDashboard.jsx`, `TeacherDashboard.jsx`, `AdminDashboard.jsx`): Tailored interfaces showing relevant academic widgets (e.g., timetable grids, absence lists, grade charts).
- **`ShareDashboard.jsx`**: Displays a searchable, filterable repository of academic resources. Includes UI indicators (Verified Badges) to show how many teachers have validated a resource.
- **`CommunityDashboard.jsx`**: Functions as a LinkedIn/Facebook hybrid. Features a scrolling feed of posts, a Job Board, and a dedicated interface for CV uploads and AI Analysis.

---

## 5. Key Functional Workflows

### 5.1 Multi-Teacher Validation System
Both shared resources and community posts implement a decentralized peer-review system. Any user with the `teacher` role can click a "Validate" toggle on a post or resource. The frontend updates dynamically to show a "Verified by X Teachers" badge, enhancing the academic credibility of student-shared content.

### 5.2 Dynamic Class Timetables
Administrators use an interactive grid in the `AdminDashboard` to build weekly schedules for specific classes. This data is serialized as JSON and saved in the `ClassSchedule` model. When a student logs in, the backend cross-references their profile's class and serves the corresponding JSON schedule, which the `StudentDashboard` renders as a visual calendar.

### 5.3 AI-Powered CV Analyzer
Located in the Community module, this feature assists students in tailoring their resumes to specific job offers.
1. **Input**: The user uploads or pastes their CV text, selecting a target `JobOffer`.
2. **AI Processing (`ai_service.py`)**: 
   - The backend attempts to call the **Groq API** (running Llama 3.3 70B), passing a strict prompt to act as an expert recruiter and return a JSON object with a calculated match `score` (0-100) and specific `suggestions`.
   - **Smart Fallback**: If the API fails or rate-limits, the system automatically falls back to a custom Python heuristic algorithm. This algorithm extracts keywords, filters stop words, maps multi-word technical skills, calculates a match ratio, and generates structured feedback on missing vs. matched skills.
3. **Output**: The score and suggestions are saved to the `CVAnalysis` model and displayed visually to the user.

---

## 6. Security and Quality Considerations
- **Environment Management**: API Keys (Groq) and Django Secret Keys are abstracted using `.env` files.
- **Graceful Degradation**: Built-in fallback mechanisms for third-party AI services ensure the platform remains functional even during API outages.
- **Responsive Design**: The entire CSS architecture uses flexible grid/flexbox layouts and CSS variables, ensuring full compatibility across desktop and mobile views while supporting instantaneous light/dark theme switching.

---

## 7. Conclusion
The EMSIGHT platform represents a modern, highly scalable educational ecosystem. By combining standard academic ERP features with modern social networking and AI-assisted career tools, it provides a holistic digital environment for a university. The modular Django backend ensures data integrity and security, while the React frontend guarantees a smooth, dynamic, and premium user experience.
