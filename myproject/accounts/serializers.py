from rest_framework import serializers
from .models import User
from django.contrib.auth import authenticate
from rest_framework.exceptions import AuthenticationFailed, ValidationError
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.contrib.sites.shortcuts import get_current_site
from django.utils.encoding import smart_str, smart_bytes
from django.urls import reverse
from .utils import send_normal_email
from rest_framework_simplejwt.tokens import RefreshToken, Token
from pymyku import Client, requests
import json
import pymyku


class RegisterAndLoginStudentSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=255)
    password = serializers.CharField(max_length=255, write_only=True)
    access_token = serializers.CharField(max_length=255, read_only=True)
    refresh_token = serializers.CharField(max_length=255, read_only=True)
    student_code = serializers.CharField(max_length=255, read_only=True)
    first_name_th = serializers.CharField(max_length=255, read_only=True)
    last_name_th = serializers.CharField(max_length=255, read_only=True)
    schedule = serializers.JSONField(read_only=True)
    group_course = serializers.JSONField(read_only=True)

    class Meta:
        fields = ['username', 'password', 'access_token', 'refresh_token', 'student_code', 'first_name_th', 'last_name_th', 'schedule', 'group_course']

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        print("Received username:", username)  # Debug print
        print("Received password:", password)  # Debug print

        try:
            # Perform login and get response object
            response = pymyku.requests.login(username, password)
            print("Login response: ///666//", response)
            response_data = response.json()  # Convert response to JSON
            print("Response data: ", json.dumps(response_data, indent=4, ensure_ascii=False))  # Debug print

            # Check if the response is successful
            if response.status_code != 200:
                raise ValidationError("Login failed with status code: {}".format(response.status_code))

            # Extract tokens and other necessary fields from the response
            access_token = response_data.get('accesstoken')
            refresh_token = response_data.get('renewtoken')
            user_data = response_data.get('user', {})
            student_data = user_data.get('student', {})

            student_code = user_data.get('idCode')
            first_name_th = user_data.get('firstNameTh')
            last_name_th = user_data.get('lastNameTh')
            user_type = user_data.get('userType')
            campus_code = student_data.get('campusCode')
            faculty_code = student_data.get('facultyCode')
            major_code = student_data.get('majorCode')
            student_status_code = student_data.get('studentStatusCode')
            
            first_name_en = user_data.get('firstNameEn')
            last_name_en = user_data.get('lastNameEn')

            if not access_token or not refresh_token:
                raise ValidationError("Failed to retrieve tokens from login response.")

            # Fetch the schedule using pymyku
            schedule_response = pymyku.requests.get_schedule(
                access_token=access_token,
                user_type=user_type,
                campus_code=campus_code,
                faculty_code=faculty_code,
                major_code=major_code,
                student_status_code=student_status_code,
                login_response=response_data
            )

            if schedule_response.status_code != 200:
                raise ValidationError("Failed to retrieve schedule with status code: {}".format(schedule_response.status_code))

            schedule_data = schedule_response.json()
            print("Schedule data: ", json.dumps(schedule_data, indent=4, ensure_ascii=False))  # Debug print

            std_id = student_data.get('stdId')
            academic_year = schedule_data.get('academicYr'),
            semester = schedule_data.get('semester'),
            
            group_course_response = pymyku.requests.get_group_course(
                access_token=access_token,
                std_id=std_id,
                academic_year=academic_year,
                semester=semester,
                login_response=response_data,
                schedule_response=schedule_response
            )

            if group_course_response.status_code != 200:
                raise ValidationError("Failed to retrieve group course with status code: {}".format(group_course_response.status_code))

            group_course_data = group_course_response.json()
            print("Courses data: ", json.dumps(group_course_data, indent=4, ensure_ascii=False))  # Debug print
            
            attrs['access_token'] = access_token
            attrs['refresh_token'] = refresh_token
            attrs['student_code'] = student_code
            attrs['first_name_en'] = first_name_en
            attrs['last_name_en'] = last_name_en
            attrs['schedule'] = schedule_data
            attrs['group_course'] = group_course_data

        except Exception as e:
            print("Exception during validation:", str(e))  # Debug print
            raise ValidationError({'error': str(e)})

        return attrs

    def create(self, validated_data):
        username = validated_data['username']
        password = validated_data['password']
        access_token = validated_data['access_token']
        refresh_token = validated_data['refresh_token']
        student_code = validated_data['student_code']
        first_name_en = validated_data['first_name_en']
        last_name_en = validated_data['last_name_en']
        schedule = validated_data['schedule']

        # Logic to create or update user in the database
        user, created = User.objects.get_or_create(
            email=username,
            defaults={
                'first_name': first_name_en,  # Replace with actual data if available
                'last_name': last_name_en,
                'is_active': True,
                'is_verified': True,
            }
        )
        user.set_password(password)
        user.save()

        return validated_data



class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(max_length=68, min_length=6, write_only=True)
    password2 = serializers.CharField(max_length=68, min_length=6, write_only=True)
    
    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'password', 'password2']
        
    def validate(self, attrs):
        password = attrs.get('password', '')
        password2 = attrs.get('password2', '')
        if password != password2:
            raise serializers.ValidationError('Passwords do not match')
        
        return attrs
    
    def create(self, validated_data):
        user = User.objects.create_user(
            email = validated_data['email'],
            first_name = validated_data.get('first_name'),
            last_name = validated_data.get('last_name'),
            password = validated_data.get('password')

        )
        return user

class LoginUserSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(max_length=255, min_length=6)
    password = serializers.CharField(max_length=68, write_only=True)
    full_name = serializers.CharField(max_length=255, read_only=True)
    access_token = serializers.CharField(max_length=255, read_only=True)
    refresh_token = serializers.CharField(max_length=255, read_only=True)
    
    class Meta:
        model = User
        fields = ['email','password','full_name','access_token','refresh_token']
        
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        request = self.context.get('request')
        user = authenticate(request, email=email, password=password)
        if not user:
            raise AuthenticationFailed("invalid credentials try again")
        if not user.is_verified:
            raise AuthenticationFailed("Email is not verified")
        user_tokens=user.tokens()
            
        
        return {
        'email': user.email,
        'full_name': user.get_full_name,
        'access_token': str(user_tokens.get('access')),
        'refresh_token': str(user_tokens.get('refresh'))
    }

class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(max_length=255)

    class Meta:
        fields = ['email']
        
    def validate(self, attrs):
        email = attrs.get('email')
        if User.objects.filter(email=email).exists():
            user = User.objects.get(email=email)
            uidb64 = urlsafe_base64_encode(smart_bytes(user.id))
            token = PasswordResetTokenGenerator().make_token(user)
            request = self.context.get('request')
            site_domain = 'localhost:5173'
            relative_link = f'/password-reset-confirm/{uidb64}/{token}/'
            abslink = f"http://{site_domain}{relative_link}"
            email_body = f"Hi use the link below to reset your password \n{abslink}"
            data = {
                'email_body': email_body,
                'email-subject':"Reset your password",
                'to_email': user.email,
            }
            send_normal_email(data)
        return super().validate(attrs)
    
class SetNewPasswordSerializer(serializers.Serializer):
    password = serializers.CharField(max_length=100, min_length=6, write_only=True)
    confirm_password = serializers.CharField(max_length=100, min_length=6, write_only=True)
    uidb64 = serializers.CharField(write_only=True)
    token = serializers.CharField(write_only=True)
    
    class Meta:
        fields = ['password', 'confirm_password', 'uidb64', 'token']
        
    def validate(self, attrs):
        try:
            token = attrs.get('token')
            uidb64 = attrs.get('uidb64')
            password = attrs.get('password')
            confirm_password = attrs.get('confirm_password')
            
            # Debug: Print the received values
            print(f"Token: {token}, UIDB64: {uidb64}")

            user_id = smart_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(id=user_id)

            # Debug: Print the user information
            print(f"User ID: {user_id}, User: {user}")

            if not PasswordResetTokenGenerator().check_token(user, token):
                raise AuthenticationFailed('The reset link is invalid or has expired', 401)

            if password != confirm_password:
                raise AuthenticationFailed('Password and confirm password do not match', 401)

            user.set_password(password)
            user.save()
            return user
        except User.DoesNotExist:
            raise AuthenticationFailed('The user does not exist', 401)
        except Exception as e:
            print(f"Exception: {e}")
            raise AuthenticationFailed('The reset link is invalid or has expired', 401)
        
class LogoutUserSerializer(serializers.Serializer):
    refresh_token = serializers.CharField()
    
    default_error_messages = {
        'bad_token': ('Token is expired or invalid'),
    }
    
    def validate(self, attrs):
        self.token = attrs.get('refresh_token')
        return attrs
    
    def save(self, **kwargs):
        try:
            token = RefreshToken(self.token)
            token.blacklist()
        except TokenError:
            return self.fail('bad_token')