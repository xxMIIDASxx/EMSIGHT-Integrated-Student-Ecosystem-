from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import Post, Event, JobOffer, CVAnalysis
from .serializers import PostSerializer, EventSerializer, JobOfferSerializer, CVAnalysisSerializer
from .ai_service import analyze_cv
from accounts.models import CustomUser

class PostViewSet(viewsets.ModelViewSet):
    queryset = Post.objects.all()
    serializer_class = PostSerializer

    def perform_create(self, serializer):
        user_id = self.request.data.get('user_id')
        author = CustomUser.objects.filter(id=user_id).first() if user_id else None
        serializer.save(author=author)

    @action(detail=True, methods=['post'], url_path='toggle-validate')
    def toggle_validate(self, request, pk=None):
        post = self.get_object()
        user_id = request.data.get('user_id')
        user = CustomUser.objects.filter(id=user_id).first() if user_id else None
        
        if not user or user.role != 'teacher':
            return Response({"error": "Only teachers can validate posts."}, status=status.HTTP_403_FORBIDDEN)
            
        if user in post.validated_by.all():
            post.validated_by.remove(user)
            serializer = self.get_serializer(post)
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            post.validated_by.add(user)
            serializer = self.get_serializer(post)
            return Response(serializer.data, status=status.HTTP_200_OK)

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer

    def perform_create(self, serializer):
        user_id = self.request.data.get('user_id')
        author = CustomUser.objects.filter(id=user_id).first() if user_id else None
        serializer.save(author=author)

class JobOfferViewSet(viewsets.ModelViewSet):
    queryset = JobOffer.objects.all()
    serializer_class = JobOfferSerializer

    def perform_create(self, serializer):
        user_id = self.request.data.get('user_id')
        author = CustomUser.objects.filter(id=user_id).first() if user_id else None
        serializer.save(author=author)

class CVAnalysisViewSet(viewsets.ModelViewSet):
    queryset = CVAnalysis.objects.all()
    serializer_class = CVAnalysisSerializer

    def get_queryset(self):
        user_id = self.request.query_params.get('user_id')
        if user_id:
            return CVAnalysis.objects.filter(user_id=user_id)
        return CVAnalysis.objects.all()

    def create(self, request, *args, **kwargs):
        cv_text = request.data.get('cv_text')
        job_offer_id = request.data.get('job_offer')
        user_id = request.data.get('user_id')
        
        if not cv_text:
            return Response({"error": "cv_text is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        job_offer = None
        job_requirements = ""
        if job_offer_id:
            try:
                job_offer = JobOffer.objects.get(id=job_offer_id)
                job_requirements = job_offer.requirements
            except JobOffer.DoesNotExist:
                return Response({"error": "Job offer not found"}, status=status.HTTP_404_NOT_FOUND)
        else:
            # If no job offer is selected, use a broad set of general requirements
            job_requirements = (
                "communication teamwork leadership problem solving critical thinking "
                "project management time management adaptability creativity collaboration "
                "python javascript java html css sql react django node.js angular vue "
                "c++ php ruby swift kotlin typescript go rust "
                "git github version control docker kubernetes "
                "database postgresql mysql mongodb "
                "machine learning data analysis artificial intelligence "
                "web development mobile development software engineering "
                "agile scrum rest api cloud computing aws azure "
                "linux networking cybersecurity devops "
                "microsoft office excel word powerpoint "
                "photoshop figma design ui ux "
                "english french arabic spanish german"
            )

        # Call AI service
        score, suggestions = analyze_cv(cv_text, job_requirements)
        
        user = CustomUser.objects.filter(id=user_id).first() if user_id else None
        
        analysis = CVAnalysis.objects.create(
            user=user,
            job_offer=job_offer,
            cv_text=cv_text,
            score=score,
            suggestions=suggestions
        )
        
        serializer = self.get_serializer(analysis)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
