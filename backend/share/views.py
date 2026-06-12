from django.db.models import Count, Exists, OuterRef, Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from accounts.models import CustomUser
from .models import Resource, ResourceFavorite, ResourceReport
from .serializers import ResourceSerializer


class ResourceViewSet(viewsets.ModelViewSet):
    serializer_class = ResourceSerializer

    def _get_actor(self):
        user_id = self.request.data.get("user_id") or self.request.query_params.get("user_id")
        if not user_id:
            return None
        return CustomUser.objects.filter(id=user_id).first()

    def get_queryset(self):
        q = self.request.query_params.get("q", "").strip()
        resource_type = self.request.query_params.get("resource_type", "").strip()
        only_reported = self.request.query_params.get("only_reported", "").strip().lower()
        actor = self._get_actor()

        queryset = Resource.objects.select_related("author").prefetch_related("validated_by").annotate(
            report_count=Count("reports", distinct=True)
        )
        if actor:
            queryset = queryset.annotate(
                is_favorited=Exists(
                    ResourceFavorite.objects.filter(user=actor, resource=OuterRef("pk"))
                ),
                is_reported_by_user=Exists(
                    ResourceReport.objects.filter(reporter=actor, resource=OuterRef("pk"))
                ),
            )
        else:
            queryset = queryset.annotate(
                is_favorited=Exists(ResourceFavorite.objects.none()),
                is_reported_by_user=Exists(ResourceReport.objects.none()),
            )

        if q:
            queryset = queryset.filter(Q(title__icontains=q) | Q(subject__icontains=q))
        if resource_type:
            queryset = queryset.filter(resource_type=resource_type)
        if only_reported == "true":
            queryset = queryset.filter(reports__isnull=False)
        return queryset.distinct()

    def create(self, request, *args, **kwargs):
        actor = self._get_actor()
        if not actor:
            return Response({"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        if actor.role == "admin":
            return Response({"error": "Admins cannot share resources"}, status=status.HTTP_403_FORBIDDEN)

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(author=actor)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        actor = self._get_actor()
        if not actor:
            return Response({"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        resource = self.get_object()
        if actor.role != "admin" and resource.author_id != actor.id:
            return Response({"error": "Unauthorized"}, status=status.HTTP_403_FORBIDDEN)
        resource.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=["post"])
    def validate_resource(self, request, pk=None):
        actor = self._get_actor()
        if not actor:
            return Response({"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        if actor.role != "teacher":
            return Response({"error": "Only teachers can validate resources"}, status=status.HTTP_403_FORBIDDEN)
        resource = self.get_object()
        
        if actor in resource.validated_by.all():
            resource.validated_by.remove(actor)
        else:
            resource.validated_by.add(actor)
            
        return Response(self.get_serializer(resource).data)

    @action(detail=True, methods=["post"])
    def toggle_favorite(self, request, pk=None):
        actor = self._get_actor()
        if not actor:
            return Response({"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        resource = self.get_object()
        favorite, created = ResourceFavorite.objects.get_or_create(user=actor, resource=resource)
        if not created:
            favorite.delete()
        return Response({"is_favorited": created})

    @action(detail=True, methods=["post"])
    def report_resource(self, request, pk=None):
        actor = self._get_actor()
        if not actor:
            return Response({"error": "user_id is required"}, status=status.HTTP_400_BAD_REQUEST)
        reason = request.data.get("reason", "").strip()
        if not reason:
            return Response({"error": "reason is required"}, status=status.HTTP_400_BAD_REQUEST)

        resource = self.get_object()
        _, created = ResourceReport.objects.get_or_create(
            reporter=actor, resource=resource, defaults={"reason": reason}
        )
        if not created:
            return Response({"error": "You already reported this resource"}, status=status.HTTP_400_BAD_REQUEST)
        return Response({"message": "Resource reported"}, status=status.HTTP_201_CREATED)
