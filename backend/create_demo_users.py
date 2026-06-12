import os
import django
import json

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'emsight_backend.settings')
django.setup()

from accounts.models import CustomUser, StudentProfile, TeacherProfile, AdminProfile

def create_users():
    users_data = []

    # Create a Teacher
    if not CustomUser.objects.filter(email='teacher@emsi-prof.ma').exists():
        teacher = CustomUser.objects.create_user(
            username='teacher_demo',
            email='teacher@emsi-prof.ma',
            password='teacherpassword123',
            first_name='Ahmed',
            last_name='Benali',
            role='teacher',
            gender='M',
            matricule='T-12345678'
        )
        TeacherProfile.objects.create(user=teacher, departement='Computer Science', matiere='["React", "Django"]')
        users_data.append({
            "name": "Ahmed Benali",
            "role": "Teacher",
            "email": "teacher@emsi-prof.ma",
            "password": "teacherpassword123"
        })
    else:
        users_data.append({
            "name": "Ahmed Benali",
            "role": "Teacher",
            "email": "teacher@emsi-prof.ma",
            "password": "teacherpassword123",
            "note": "Already existed"
        })

    # Create a Student
    if not CustomUser.objects.filter(email='student@emsi-edu.ma').exists():
        student = CustomUser.objects.create_user(
            username='student_demo',
            email='student@emsi-edu.ma',
            password='studentpassword123',
            first_name='Sara',
            last_name='Alaoui',
            role='student',
            gender='F',
            matricule='S-2024ABCD'
        )
        StudentProfile.objects.create(user=student, filiere='IIR', annee_etude=4, numero_etudiant='S-2024ABCD')
        users_data.append({
            "name": "Sara Alaoui",
            "role": "Student",
            "email": "student@emsi-edu.ma",
            "password": "studentpassword123"
        })
    else:
        users_data.append({
            "name": "Sara Alaoui",
            "role": "Student",
            "email": "student@emsi-edu.ma",
            "password": "studentpassword123",
            "note": "Already existed"
        })

    # Add Admin to the list just so they have it in the JSON file
    users_data.append({
        "name": "Admin",
        "role": "Admin",
        "email": "admin@example.com",
        "password": "admin"
    })

    # Write to JSON file
    json_path = os.path.join(os.path.dirname(__file__), 'demo_users.json')
    with open(json_path, 'w') as f:
        json.dump(users_data, f, indent=4)
        
    print(f"Successfully created demo users and saved their credentials to {json_path}")

if __name__ == '__main__':
    create_users()
