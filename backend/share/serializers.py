from rest_framework import serializers
from accounts.models import CustomUser
from .models import Resource, ResourceFavorite, ResourceReport


class ShareUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ["id", "first_name", "last_name", "role", "profile_picture"]


class ResourceSerializer(serializers.ModelSerializer):
    author_detail = ShareUserSerializer(source="author", read_only=True)
    validators_detail = ShareUserSerializer(source="validated_by", many=True, read_only=True)
    is_validated = serializers.SerializerMethodField()
    report_count = serializers.IntegerField(read_only=True)
    is_favorited = serializers.BooleanField(read_only=True)
    is_reported_by_user = serializers.BooleanField(read_only=True)

    class Meta:
        model = Resource
        fields = [
            "id",
            "title",
            "subject",
            "description",
            "resource_type",
            "file",
            "author",
            "author_detail",
            "is_validated",
            "validated_by",
            "validators_detail",
            "report_count",
            "is_favorited",
            "is_reported_by_user",
            "created_at",
        ]
        read_only_fields = ["author", "validated_by", "is_validated"]

    def get_is_validated(self, obj):
        return obj.validated_by.exists()


class ResourceFavoriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResourceFavorite
        fields = ["id", "user", "resource", "created_at"]


class ResourceReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResourceReport
        fields = ["id", "reporter", "resource", "reason", "created_at"]
