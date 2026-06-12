from django.db import models
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import CalendarEvent, Notification, ReportCard, Grade, Absence, DocumentRequest, ClassSchedule
from .serializers import CalendarEventSerializer, NotificationSerializer, ReportCardSerializer, GradeSerializer, AbsenceSerializer, DocumentRequestSerializer, ClassScheduleSerializer

class CalendarEventViewSet(viewsets.ModelViewSet):
    serializer_class = CalendarEventSerializer
    
    def get_queryset(self):
        user = self.request.user
        queryset = CalendarEvent.objects.all().order_by('start_time')
        
        if not user.is_authenticated:
            return queryset.none()
            
        if user.role == 'admin':
            return queryset
        elif user.role == 'teacher':
            return queryset.filter(models.Q(professor=user) | models.Q(created_by=user))
        elif user.role == 'student':
            filiere = user.student_profile.filiere if hasattr(user, 'student_profile') else None
            if filiere:
                # Basic string inclusion for simplicity (e.g. "1A_IIR" in "1A_IIR, 2A_IIR")
                return queryset.filter(models.Q(target_classes='All Classes') | models.Q(target_classes__icontains=filiere))
            return queryset.filter(target_classes='All Classes')
            
        return queryset

class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all().order_by('-date_envoi')
    serializer_class = NotificationSerializer

class ReportCardViewSet(viewsets.ModelViewSet):
    queryset = ReportCard.objects.all()
    serializer_class = ReportCardSerializer

class GradeViewSet(viewsets.ModelViewSet):
    queryset = Grade.objects.all()
    serializer_class = GradeSerializer

    @action(detail=False, methods=['post'])
    def bulk_submit_grades(self, request):
        academic_year = request.data.get('academic_year', '2023-2024')
        semester = request.data.get('semester', 'S1')
        subject = request.data.get('subject')
        evaluation_type = request.data.get('evaluation_type', 'Examen')
        grades_data = request.data.get('grades', [])

        if not subject:
            return Response({'error': 'Subject is required'}, status=status.HTTP_400_BAD_REQUEST)

        updated_count = 0
        for grade_entry in grades_data:
            student_id = grade_entry.get('student_id')
            value = grade_entry.get('value')
            
            if student_id is None or value is None:
                continue
                
            try:
                val = float(value)
            except ValueError:
                continue

            # Get or create ReportCard for this student, year, and semester
            rc, created = ReportCard.objects.get_or_create(
                student_id=student_id,
                academic_year=academic_year,
                semester=semester
            )
            
            # Update or create the Grade
            Grade.objects.update_or_create(
                report_card=rc,
                subject=subject,
                evaluation_type=evaluation_type,
                defaults={'value': val}
            )
            
            # Recalculate average for the report card
            all_grades = Grade.objects.filter(report_card=rc)
            if all_grades.exists():
                avg = sum(g.value for g in all_grades) / all_grades.count()
                rc.general_average = round(avg, 2)
                rc.save()
                
            updated_count += 1

        return Response({'message': f'Successfully updated {updated_count} grades'}, status=status.HTTP_200_OK)

class AbsenceViewSet(viewsets.ModelViewSet):
    queryset = Absence.objects.all().order_by('-date_seance')
    serializer_class = AbsenceSerializer

class DocumentRequestViewSet(viewsets.ModelViewSet):
    queryset = DocumentRequest.objects.all().order_by('-created_at')
    serializer_class = DocumentRequestSerializer

class ClassScheduleViewSet(viewsets.ModelViewSet):
    queryset = ClassSchedule.objects.all()
    serializer_class = ClassScheduleSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        target_class = self.request.query_params.get('target_class', None)
        if target_class:
            queryset = queryset.filter(target_class=target_class)
        return queryset
