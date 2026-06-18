import os
import django
import random

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'emsight_backend.settings')
django.setup()

from portal.models import ReportCard, Grade
from django.contrib.auth import get_user_model

User = get_user_model()
students = User.objects.filter(role='student')

years = ['2023-2024', '2024-2025']
semesters = ['S1', 'S2']
subjects = ['Mathematics', 'Physics', 'Java Programming', 'Database Systems', 'Web Development', 'Networking', 'English', 'French', 'Data Science', 'Cloud Computing', 'Operating Systems', 'Algorithms']

for student in students:
    for year in years:
        for sem in semesters:
            rc, created = ReportCard.objects.get_or_create(
                student=student,
                academic_year=year,
                semester=sem,
                defaults={'general_average': 0.0}
            )
            
            if not created:
                rc.grades.all().delete()
            
            selected_subjects = random.sample(subjects, random.randint(5, 7))
            
            total = 0
            for sub in selected_subjects:
                val = round(random.uniform(8.0, 19.5), 2)
                total += val
                Grade.objects.create(
                    report_card=rc,
                    subject=sub,
                    evaluation_type=random.choice(['CC', 'Examen']),
                    value=val,
                    is_rattrapage=(val < 10)
                )
            
            rc.general_average = round(total / len(selected_subjects), 2)
            rc.save()

print("Random grades for past years 2023-2024 and 2024-2025 have been added for all students.")
