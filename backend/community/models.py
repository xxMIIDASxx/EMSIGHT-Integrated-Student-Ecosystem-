from django.db import models
from django.conf import settings

class Post(models.Model):
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='community_posts')
    content = models.TextField()
    media = models.FileField(upload_to='community/posts/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    validated_by = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='validated_posts', blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Post by {self.author.username} at {self.created_at}"

class Event(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    event_date = models.DateTimeField()
    location = models.CharField(max_length=255, blank=True, null=True)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='organized_events')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-event_date']

    def __str__(self):
        return self.title

class JobOffer(models.Model):
    JOB_TYPES = (
        ('internship', 'Internship'),
        ('full_time', 'Full-time'),
        ('part_time', 'Part-time'),
        ('freelance', 'Freelance'),
    )
    title = models.CharField(max_length=255)
    company = models.CharField(max_length=255)
    description = models.TextField()
    requirements = models.TextField(help_text="Keywords and skills required")
    location = models.CharField(max_length=255)
    job_type = models.CharField(max_length=20, choices=JOB_TYPES, default='full_time')
    expiration_date = models.DateField(blank=True, null=True)
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='posted_jobs')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} at {self.company}"

class CVAnalysis(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='cv_analyses')
    job_offer = models.ForeignKey(JobOffer, on_delete=models.SET_NULL, null=True, blank=True)
    cv_text = models.TextField(help_text="Extracted text from CV")
    score = models.FloatField(help_text="Relevance score out of 100")
    suggestions = models.TextField(help_text="Tips for optimization")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Analysis for {self.user.username} on {self.created_at}"
