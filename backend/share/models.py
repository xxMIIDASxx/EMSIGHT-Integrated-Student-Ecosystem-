from django.db import models
from django.conf import settings


class Resource(models.Model):
    RESOURCE_TYPE_CHOICES = (
        ("course", "Cours"),
        ("exercise_without_solution", "Exercice sans correction"),
        ("exercise_with_solution", "Exercice avec correction"),
    )

    title = models.CharField(max_length=200)
    subject = models.CharField(max_length=120)
    description = models.TextField(blank=True)
    resource_type = models.CharField(max_length=40, choices=RESOURCE_TYPE_CHOICES)
    file = models.FileField(upload_to="shared_resources/")
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="shared_resources"
    )
    validated_by = models.ManyToManyField(
        settings.AUTH_USER_MODEL,
        related_name="validated_resources",
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.title} - {self.author_id}"


class ResourceFavorite(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="resource_favorites"
    )
    resource = models.ForeignKey(
        Resource, on_delete=models.CASCADE, related_name="favorites"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "resource")
        ordering = ["-created_at"]


class ResourceReport(models.Model):
    reporter = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="resource_reports"
    )
    resource = models.ForeignKey(
        Resource, on_delete=models.CASCADE, related_name="reports"
    )
    reason = models.CharField(max_length=300)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("reporter", "resource")
        ordering = ["-created_at"]
