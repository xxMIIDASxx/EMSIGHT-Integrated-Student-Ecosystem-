from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PostViewSet, EventViewSet, JobOfferViewSet, CVAnalysisViewSet

router = DefaultRouter()
router.register(r'posts', PostViewSet)
router.register(r'events', EventViewSet)
router.register(r'job-offers', JobOfferViewSet)
router.register(r'cv-analysis', CVAnalysisViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
