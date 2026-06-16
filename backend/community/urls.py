from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PostViewSet, EventViewSet, JobOfferViewSet, CVAnalysisViewSet, MessageViewSet

router = DefaultRouter()
router.register(r'posts', PostViewSet)
router.register(r'events', EventViewSet)
router.register(r'job-offers', JobOfferViewSet)
router.register(r'cv-analysis', CVAnalysisViewSet)
router.register(r'messages', MessageViewSet, basename='message')

urlpatterns = [
    path('', include(router.urls)),
]
