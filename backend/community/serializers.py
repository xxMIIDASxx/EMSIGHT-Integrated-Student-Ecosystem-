from rest_framework import serializers
from .models import Post, Event, JobOffer, CVAnalysis, Message
from accounts.models import CustomUser

class AuthorSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'first_name', 'last_name', 'username', 'role', 'profile_picture']

class PostSerializer(serializers.ModelSerializer):
    author_detail = AuthorSerializer(source='author', read_only=True)
    validators = AuthorSerializer(source='validated_by', many=True, read_only=True)
    
    class Meta:
        model = Post
        fields = ['id', 'author', 'author_detail', 'content', 'media', 'created_at', 'validators']
        read_only_fields = ['author', 'validators']

class EventSerializer(serializers.ModelSerializer):
    author_detail = AuthorSerializer(source='author', read_only=True)

    class Meta:
        model = Event
        fields = ['id', 'title', 'description', 'event_date', 'location', 'author', 'author_detail', 'created_at']
        read_only_fields = ['author']

class JobOfferSerializer(serializers.ModelSerializer):
    author_detail = AuthorSerializer(source='author', read_only=True)
    expiration_date = serializers.DateField(required=False, allow_null=True)

    class Meta:
        model = JobOffer
        fields = ['id', 'title', 'company', 'description', 'requirements', 'location', 'job_type', 'expiration_date', 'author', 'author_detail', 'created_at']
        read_only_fields = ['author']

    def validate_expiration_date(self, value):
        if value == "" or value is None:
            return None
        return value

class CVAnalysisSerializer(serializers.ModelSerializer):
    user_detail = AuthorSerializer(source='user', read_only=True)
    job_offer_detail = JobOfferSerializer(source='job_offer', read_only=True)

    class Meta:
        model = CVAnalysis
        fields = ['id', 'user', 'user_detail', 'job_offer', 'job_offer_detail', 'cv_name', 'cv_text', 'score', 'suggestions', 'created_at']
        read_only_fields = ['user', 'score', 'suggestions']

class MessageSerializer(serializers.ModelSerializer):
    sender = AuthorSerializer(read_only=True)
    sender_id = serializers.IntegerField(write_only=True, required=False)
    receiver_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Message
        fields = ['id', 'sender', 'sender_id', 'receiver', 'receiver_id', 'content', 'timestamp', 'is_read']
        read_only_fields = ['receiver']

    def create(self, validated_data):
        receiver_id = validated_data.pop('receiver_id')
        sender_id = validated_data.pop('sender_id', None)
        message = Message.objects.create(
            receiver_id=receiver_id,
            sender_id=sender_id,
            content=validated_data.get('content', '')
        )
        return message
