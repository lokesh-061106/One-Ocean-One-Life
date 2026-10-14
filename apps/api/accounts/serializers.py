from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, Profile

# Map User.role → Profile.contributor_type so "I am a…" from registration
# becomes the default identity on every contribution.
ROLE_TO_CONTRIBUTOR_TYPE = {
    'FISHERMAN': 'fisher',
    'RESEARCHER': 'researcher',
    'VOLUNTEER': 'volunteer',
    'EDUCATOR': 'student',
    'COMMUNITY_ORGANIZATION': 'organisation',
    'NGO': 'organisation',
}


def contributor_type_for_role(role):
    return ROLE_TO_CONTRIBUTOR_TYPE.get((role or '').upper(), '')


class LoginSerializer(TokenObtainPairSerializer):
    """Accepts either a username or an email in the username field."""

    def validate(self, attrs):
        username = attrs.get(self.username_field)
        if username and '@' in str(username):
            user = User.objects.filter(email__iexact=str(username)).first()
            if user is not None:
                attrs[self.username_field] = getattr(user, self.username_field)
        return super().validate(attrs)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'phone', 'role', 'is_verified', 'is_superuser', 'preferred_language', 'date_joined']
        read_only_fields = ['id', 'role', 'is_verified', 'is_superuser', 'date_joined']


class ProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    village_name = serializers.CharField(source='village.name', read_only=True, default=None)
    district_name = serializers.CharField(source='village.district.name', read_only=True, default=None)
    zone_name = serializers.CharField(source='village.district.zone.name', read_only=True, default=None)

    class Meta:
        model = Profile
        fields = [
            'id', 'user', 'photo', 'village', 'village_name', 'district_name', 'zone_name',
            'occupation', 'organization', 'contributor_type', 'bio', 'location_precision',
            'contribution_score', 'member_status', 'total_contributions',
            'total_verified', 'total_events', 'latitude', 'longitude', 'last_active_at'
        ]
        read_only_fields = ['id', 'contribution_score', 'member_status', 'total_contributions', 'total_verified', 'total_events']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES, required=False, default='COMMUNITY_MEMBER')

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'password_confirm', 'first_name', 'last_name', 'phone', 'role']

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        role = validated_data.pop('role', 'COMMUNITY_MEMBER') or 'COMMUNITY_MEMBER'
        validated_data['role'] = role
        user = User.objects.create_user(**validated_data)
        Profile.objects.create(user=user, contributor_type=contributor_type_for_role(role))
        return user


class UserCreateSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, validators=[validate_password])
    first_name = serializers.CharField(max_length=150, required=False, default='')
    last_name = serializers.CharField(max_length=150, required=False, default='')
    phone = serializers.CharField(max_length=20, required=False, default='')
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES, default='COMMUNITY_MEMBER')
    village = serializers.IntegerField(required=False, allow_null=True)
    occupation = serializers.CharField(max_length=100, required=False, default='')
    bio = serializers.CharField(required=False, default='')

    def create(self, validated_data):
        from locations.models import Village
        village_id = validated_data.pop('village', None)
        profile_fields = {}
        for field in ['occupation', 'bio']:
            profile_fields[field] = validated_data.pop(field, None)

        role = validated_data.get('role', 'COMMUNITY_MEMBER')
        user = User.objects.create_user(**validated_data)
        village = Village.objects.filter(id=village_id).first() if village_id else None
        Profile.objects.create(
            user=user, village=village,
            contributor_type=contributor_type_for_role(role),
            **profile_fields,
        )
        return user


class UserUpdateSerializer(serializers.Serializer):
    occupation = serializers.CharField(max_length=100, required=False)
    bio = serializers.CharField(required=False)
    member_status = serializers.ChoiceField(choices=Profile.MEMBER_STATUS_CHOICES, required=False)
    role = serializers.ChoiceField(choices=User.ROLE_CHOICES, required=False)
    is_verified = serializers.BooleanField(required=False)
    first_name = serializers.CharField(max_length=150, required=False)
    last_name = serializers.CharField(max_length=150, required=False)
    email = serializers.EmailField(required=False)

    def update(self, instance, validated_data):
        user_fields = ['role', 'is_verified', 'first_name', 'last_name', 'email']
        for field in user_fields:
            if field in validated_data:
                setattr(instance.user, field, validated_data.pop(field))
        instance.user.save()

        profile_fields = ['occupation', 'bio', 'member_status']
        for field in profile_fields:
            if field in validated_data:
                setattr(instance, field, validated_data.pop(field))
        instance.save()
        return instance


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True, validators=[validate_password])

    def validate_old_password(self, value):
        if not self.context['request'].user.check_password(value):
            raise serializers.ValidationError('Old password is incorrect.')
        return value
