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
import requests as req_lib  # ใช้สำหรับจัดการ exceptions

class LoginWithMykuSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=255)
    password = serializers.CharField(max_length=128, write_only=True)

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        try:
            # Debug logging เพื่อช่วยตรวจสอบข้อมูลที่เข้ามา
            print(f"Attempting MyKU login with username: {username}")

            # ส่ง username และ password เข้า Client()
            client = Client(username=username, password=password)
            client.login()

            # ดึงข้อมูลนักศึกษา (เช่นข้อมูลส่วนตัว) หลังจากล็อกอินสำเร็จ
            student_data = client.fetch_student_personal()

            # คุณสามารถใช้ข้อมูลนี้เพื่อเชื่อมโยงกับบัญชีเว็บของคุณได้
            attrs['student_data'] = student_data
        except Exception as e:
            # เพิ่ม logging เพื่อดูรายละเอียดข้อผิดพลาด
            print(f"Failed to login to MyKU: {str(e)}")
            raise serializers.ValidationError(f"Failed to log in to MyKU: {str(e)}")

        return attrs


class RegisterAndLoginStudentSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=255)
    password = serializers.CharField(max_length=255, write_only=True)
    access_token = serializers.CharField(max_length=255, read_only=True)
    refresh_token = serializers.CharField(max_length=255, read_only=True)
    student_code = serializers.CharField(max_length=255, read_only=True)
    first_name_th = serializers.CharField(max_length=255, read_only=True)
    last_name_th = serializers.CharField(max_length=255, read_only=True)
    schedule = serializers.SerializerMethodField()
    group_course = serializers.SerializerMethodField()
    announce = serializers.SerializerMethodField()
    enroll = serializers.SerializerMethodField()
    gpax = serializers.SerializerMethodField()
    grades = serializers.SerializerMethodField()
    student_address = serializers.SerializerMethodField()
    student_education = serializers.SerializerMethodField()
    student_personal = serializers.SerializerMethodField()
    total_credit = serializers.SerializerMethodField()

    class Meta:
        fields = ['username', 'password', 'access_token', 'refresh_token', 'student_code', 'first_name_th', 'last_name_th', 'schedule', 'group_course', 'announce', 'enroll', 'gpax', 'grades', 'student_address', 'student_education', 'student_personal', 'total_credit']

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        print("Received username:", username)  # Debug print
        print("Received password:", password)  # Debug print

        try:
            # Create a Client instance and log in
            client = Client(username, password)
            response = client.login()

            if response.status_code != 200:
                raise ValidationError("Login failed with status code: {}".format(response.status_code))

            response_data = response.json()
            print("Response data: ", json.dumps(response_data, indent=4, ensure_ascii=False))  # Debug print

            # Extract tokens and other necessary fields from the response
            access_token = response_data.get('accesstoken')
            refresh_token = response_data.get('renewtoken')
            user_data = response_data.get('user', {})
            student_data = user_data.get('student', {})

            student_code = student_data.get('idCode')
            first_name_th = student_data.get('firstNameTh')
            last_name_th = student_data.get('lastNameTh')

            if not access_token or not refresh_token:
                raise ValidationError("Failed to retrieve tokens from login response.")

            attrs['access_token'] = access_token
            attrs['refresh_token'] = refresh_token
            attrs['student_code'] = student_code
            attrs['first_name_th'] = first_name_th
            attrs['last_name_th'] = last_name_th

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
        first_name_th = validated_data['first_name_th']
        last_name_th = validated_data['last_name_th']

        # Logic to create or update user in the database
        user, created = User.objects.get_or_create(
            email=username,
            defaults={
                'first_name': first_name_th,  # Replace with actual data if available
                'last_name': last_name_th,
                'is_active': True,
                'is_verified': True,
            }
        )
        user.set_password(password)
        user.save()

        return validated_data

    def get_schedule(self, obj):
        return self.fetch_data(obj, "fetch_schedule")

    def get_group_course(self, obj):
        return self.fetch_data(obj, "fetch_group_course")

    def get_announce(self, obj):
        return self.fetch_data(obj, "fetch_announce")

    def get_enroll(self, obj):
        return self.fetch_data(obj, "fetch_enroll")

    def get_gpax(self, obj):
        return self.fetch_data(obj, "fetch_gpax")

    def get_grades(self, obj):
        return self.fetch_data(obj, "fetch_grades")

    def get_student_address(self, obj):
        return self.fetch_data(obj, "fetch_student_address")

    def get_student_education(self, obj):
        return self.fetch_data(obj, "fetch_student_education")

    def get_student_personal(self, obj):
        return self.fetch_data(obj, "fetch_student_personal")

    def get_total_credit(self, obj):
        return self.fetch_data(obj, "get_total_credit")

    def fetch_data(self, obj, method_name):
        try:
            # Initialize the Client instance
            client = Client(obj['username'], obj['password'])

            # Dynamically call the appropriate method
            method = getattr(client, method_name)
            data = method()

            print(f"{method_name.capitalize()} : ", json.dumps(data, indent=4, ensure_ascii=False))  # Debug print
            return data

        except Exception as err:
            raise ValidationError(f"Error occurred while fetching {method_name}: {err}")


        
    

    
    



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
        fields = ['email', 'password', 'full_name', 'access_token', 'refresh_token']
        
    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        request = self.context.get('request')

        # ตรวจสอบข้อมูลล็อกอิน
        user = authenticate(request, email=email, password=password)
        if not user:
            raise AuthenticationFailed("Invalid credentials, try again.")
        if not user.is_verified:
            raise AuthenticationFailed("Email is not verified.")

        # ดึง JWT tokens จาก user
        user_tokens = user.tokens()

        # คืนค่าข้อมูล
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