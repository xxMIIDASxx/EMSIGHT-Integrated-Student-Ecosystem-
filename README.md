# EMSIGHT Student Portal

A modern, integrated student ecosystem built with React, Vite, and Django.

## Prerequisites
- Node.js (v18 or higher)
- Python 3.10+ (for backend)

## Running the Project Locally

### 1. Setup the Backend
Navigate to the `backend` directory and start the Django server:
```powershell
cd backend
# Delete any broken virtual environment (optional, but good if you moved the folder)
if (Test-Path venv) { Remove-Item -Recurse -Force venv }

python -m venv venv
venv\Scripts\activate

python -m pip install --upgrade pip
pip install -r requirements.txt
pip install groq

python manage.py migrate
python manage.py runserver
```
The backend should now be running at `http://127.0.0.1:8000`.

*(Note: Production dependencies for Render are located in `requirements-prod.txt` and will be automatically installed during deployment via `build.sh`)*

### 2. Setup the Frontend
Open a new terminal window, navigate to the `frontend` directory, install dependencies, and start the Vite development server:
```powershell
cd frontend
npm install
npm run dev
```
The frontend will be available at `http://localhost:5173`.

## Features
- Role-based access (Student, Teacher, Admin).
- Interactive weekly schedule.
- Grade tracking with Year/Semester filtering.
- Absence justification workflow.
- Notification broadcasting and management.
- Administrative document requests.

## Technologies Used
- React 19
- Vite
- Axios
- Lucide React
- Django REST Framework

<div align="center">
  <p>Built with ❤️ by Amjad AHRRAR - Hajar CHABLI - Nizar BTIRA - Nizar EL IDRYSY - Owais BAKKALI - 3IIRG3.</p>
</div>