import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'emsight_backend.settings')
django.setup()

from portal.models import Grade, ReportCard

bad_grades = Grade.objects.filter(value__gt=20)
print('Deleting bad grades:', [(g.id, g.subject, g.value) for g in bad_grades])
bad_grades.delete()

for rc in ReportCard.objects.all():
    grades = rc.grades.all()
    if grades.exists():
        avg = sum(g.value for g in grades) / grades.count()
        rc.general_average = round(avg, 2)
    else:
        rc.general_average = 0
    rc.save()

print('Report cards updated.')
