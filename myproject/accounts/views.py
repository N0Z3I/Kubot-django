from django.shortcuts import render
from rest_framework.generics import GenericAPIView
from .serializers import UserRegisterSerializer, LoginUserSerializer, SetNewPasswordSerializer, PasswordResetRequestSerializer, LogoutUserSerializer
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from .utils import send_code_to_user
from .models import OneTimePassword, User, StudentProfile, Schedule, Grade, GroupCourse, StudentEducation, GPAX, Announcement, DiscordProfile
from django.utils.http import urlsafe_base64_decode
from django.utils.encoding import smart_str, DjangoUnicodeDecodeError
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from rest_framework_simplejwt.tokens import RefreshToken

from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from rest_framework.exceptions import ValidationError, AuthenticationFailed
from pymyku import Client
import jwt
from django.conf import settings
from django.contrib.auth import get_user_model
import logging
logger = logging.getLogger(__name__)

from .serializers import LoginWithMykuSerializer, DiscordConnectSerializer

User = get_user_model()
from rest_framework.permissions import AllowAny
import requests

class DiscordConnectView(GenericAPIView):
    serializer_class = DiscordConnectSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            try:
                # รับ authorization code และแลกเปลี่ยนเป็น access token
                code = serializer.validated_data['code']
                redirect_uri = "http://localhost:8000/api/v1/auth/discord/callback/"

                # แลกเปลี่ยน code เป็น access token
                token_response = requests.post(
                    "https://discord.com/api/oauth2/token",
                    data={
                        "client_id": settings.DISCORD_CLIENT_ID,
                        "client_secret": settings.DISCORD_CLIENT_SECRET,
                        "grant_type": "authorization_code",
                        "code": code,
                        "redirect_uri": redirect_uri,
                    },
                    headers={
                        "Content-Type": "application/x-www-form-urlencoded"
                    }
                )

                if token_response.status_code != 200:
                    return Response({"error": "Failed to retrieve access token"}, status=status.HTTP_400_BAD_REQUEST)

                token_data = token_response.json()
                access_token = token_data.get('access_token')
                refresh_token = token_data.get('refresh_token')
                expires_in = token_data.get('expires_in')  # ไม่ใช้ None ในการกำหนดค่า

                if expires_in is None or expires_in == '':
                    expires_in = 0  # ใช้ค่า 0 แทนค่า None หรือ ''

                # ดึงข้อมูลผู้ใช้จาก Discord API
                user_response = requests.get(
                    "https://discord.com/api/users/@me",
                    headers={
                        "Authorization": f"Bearer {access_token}"
                    }
                )

                if user_response.status_code != 200:
                    return Response({"error": "Failed to retrieve user data"}, status=status.HTTP_400_BAD_REQUEST)

                discord_user_data = user_response.json()

                # บันทึกข้อมูลลงในฐานข้อมูล
                discord_user, created = DiscordProfile.objects.update_or_create(
                    user=request.user,
                    defaults={
                        'discord_id': discord_user_data['id'],
                        'discord_username': discord_user_data['username'],
                        'discord_discriminator': discord_user_data['discriminator'],
                        'avatar_url': f"https://cdn.discordapp.com/avatars/{discord_user_data['id']}/{discord_user_data['avatar']}.png",
                        'access_token': access_token,
                        'refresh_token': refresh_token or '',  # ถ้า refresh_token ไม่มีค่าให้เป็น ''
                        'expires_in': expires_in,  # บันทึก expires_in ที่ได้รับมา
                    }
                )

                return Response({"message": "Successfully connected to Discord"}, status=status.HTTP_200_OK)

            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class DiscordCallbackView(GenericAPIView):
    def get(self, request):
        code = request.GET.get('code')

        if not code:
            return Response({'error': 'Authorization code not provided'}, status=400)

        # ตั้งค่าข้อมูลเพื่อแลกเปลี่ยน authorization code เป็น access token
        data = {
            'client_id': settings.DISCORD_CLIENT_ID,
            'client_secret': settings.DISCORD_CLIENT_SECRET,
            'grant_type': 'authorization_code',
            'code': code,
            'redirect_uri': 'http://localhost:8000/api/v1/auth/discord/callback/',  # URL ที่ Discord จะ redirect กลับมา
        }

        headers = {
            'Content-Type': 'application/x-www-form-urlencoded'
        }

        token_url = 'https://discord.com/api/oauth2/token'
        response = requests.post(token_url, data=data, headers=headers)

        if response.status_code == 200:
            token_data = response.json()
            return Response(token_data)
        else:
            return Response({'error': 'Failed to get access token'}, status=400)

class MykuLoginView(GenericAPIView):
    serializer_class = LoginWithMykuSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            try:
                # รับข้อมูลจาก serializer ที่ validate แล้ว
                student_data = serializer.validated_data['student_data']
                schedule_data = serializer.validated_data['schedule_data']
                announce_data = serializer.validated_data['announce_data']
                grades_data = serializer.validated_data['grades_data']
                group_course_data = serializer.validated_data['group_course_data']
                student_education_data = serializer.validated_data['student_education_data']
                gpax_data = serializer.validated_data['gpax_data']

                # ดึงหรือสร้าง StudentProfile จาก User
                student_results = student_data['results']['stdPersonalModel']
                student_profile, created = StudentProfile.objects.update_or_create(
                    user=request.user,
                    defaults={
                        'std_id': student_results['stdId'],
                        'name_th': student_results['nameTh'],
                        'name_en': student_results['nameEn'],
                        'birth_date': student_results['birthDate'],
                        'gender': student_results['genderTh'],
                        'religion': student_results['religionTh'],
                        'phone': student_results['phone'],
                        'email': student_results['email'],
                    }
                )

                # บันทึกข้อมูลตารางเรียน (Schedule)
                if schedule_data and 'results' in schedule_data:
                    for schedule in schedule_data['results']:
                        Schedule.objects.update_or_create(
                            student_profile=student_profile,
                            academic_year=schedule['academicYr'],
                            semester=schedule['semester'],
                        )

                # บันทึกข้อมูลประกาศ (Announcement)
                if announce_data and 'results' in announce_data:
                    for announcement in announce_data['results']:
                        # สามารถบันทึกข้อมูลประกาศเพิ่มเติมได้ หากต้องการ
                        pass

                # บันทึกข้อมูลเกรด (Grade)
                if grades_data and 'results' in grades_data:
                    for semester in grades_data['results']:
                        for course in semester['grade']:
                            Grade.objects.update_or_create(
                                student_profile=student_profile,
                                academic_year=semester['academicYear'],
                                subject_code=course['subject_code'],
                                defaults={
                                    'subject_name': course['subject_name_th'],
                                    'credit': course['credit'],
                                    'grade': course['grade'],
                                }
                            )

                # บันทึกข้อมูลกลุ่มวิชา (GroupCourse)
                if group_course_data and 'results' in group_course_data:
                    for group in group_course_data['results']:
                        for course in group['course']:
                            GroupCourse.objects.update_or_create(
                                student_profile=student_profile,
                                subject_code=course['subject_code'],
                                defaults={
                                    'period_date': group['peroid_date'],
                                    'subject_name': course['subject_name_th'],
                                    'teacher_name': course['teacher_name'],
                                }
                            )

                # บันทึกข้อมูลการศึกษา (StudentEducation)
                if student_education_data and 'results' in student_education_data:
                    for edu in student_education_data['results']['education']:
                        StudentEducation.objects.update_or_create(
                            student_profile=student_profile,
                            defaults={
                                'faculty_name_th': edu['facultyNameTh'],
                                'major_name_th': edu['majorNameTh'],
                                'status': edu['statusNameTh'],
                                'degree_name': edu['degreeNameTh'],
                            }
                        )

                # บันทึกข้อมูล GPAX
                if gpax_data and 'results' in gpax_data:
                    for gpax in gpax_data['results']:
                        GPAX.objects.update_or_create(
                            student_profile=student_profile,
                            defaults={
                                'gpax': gpax['gpax'],
                                'total_credit': gpax['total_credit'],
                            }
                        )

                return Response({
                    'student_data': student_data,
                    'message': 'Successfully linked MyKU and saved all data.'
                }, status=status.HTTP_200_OK)

            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class MykuDataView(GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # ดึงข้อมูลผู้ใช้ที่ล็อกอินอยู่
            user = request.user

            # สมมติว่า User model เก็บ username และ password ที่ใช้กับ MyKU
            myku_username = user.myku_username
            myku_password = user.myku_password

            # ตรวจสอบข้อมูล MyKU ว่ามีครบถ้วนหรือไม่
            if not myku_username or not myku_password:
                raise ValidationError("MyKU credentials are not available for the user.")

            # ใช้ username และ password ที่ดึงมาจากฐานข้อมูลเพื่อเข้าสู่ระบบ MyKU
            client = Client(username=myku_username, password=myku_password)
            client.login()  # Login ด้วยข้อมูลที่มี

            # ดึงข้อมูลของนักศึกษาจาก MyKU
            student_data = client.fetch_student_personal()
            schedule_data = client.fetch_schedule()
            announce_data = client.fetch_announce()
            grades_data = client.fetch_grades()
            group_course_data = client.fetch_group_course()
            student_education_data = client.fetch_student_education()
            gpax_data = client.fetch_gpax()

            # เตรียมข้อมูลสำหรับการตอบกลับ
            response_data = {
                'student_data': student_data,
                'results': {
                    'schedule_data': schedule_data if schedule_data else [],
                    'announce_data': announce_data if announce_data else [],
                    'grades_data': grades_data if grades_data else [],
                    'group_course_data': group_course_data if group_course_data else [],
                    'student_education_data': student_education_data if student_education_data else None,
                    'gpax_data': gpax_data if gpax_data else []
                },
                'message': 'Successfully fetched all MyKU data.'
            }

            return Response(response_data, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error in MykuDataView: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

class RegisterUserView(GenericAPIView):
    serializer_class = UserRegisterSerializer

    def post(self, request):
        user_data = request.data
        serializer = self.serializer_class(data=user_data)
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            user = serializer.data
            send_code_to_user(user['email'])
            # send email function user['email']
            print(user)
            return Response({
                'data': user,
                'message': f'hi thanks for signing up a passcode has be sent to verify your email'
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VerifyUserEmail(GenericAPIView):
    def post(self, request):
        otpcode = request.data.get('otp')
        try:
            user_code_obj = OneTimePassword.objects.get(code=otpcode)
            user = user_code_obj.user
            if not user.is_verified:
                user.is_verified = True
                user.save()
                return Response({
                    'message': 'account email verified successfully'
                }, status=status.HTTP_200_OK)
            return Response({
                'message': 'code is invalid user already verified'
            }, status=status.HTTP_204_NO_CONTENT)

        except OneTimePassword.DoesNotExist:
            return Response({'message': 'passcode not provided'}, status=status.HTTP_400_NOT_FOUND)

class LoginUserView(GenericAPIView):
    serializer_class = LoginUserSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        # ดึง refresh และ access tokens จาก serializer
        refresh = serializer.validated_data.get('refresh_token')
        access = serializer.validated_data.get('access_token')

        # สร้าง response พร้อมข้อมูล
        response = Response(serializer.data, status=status.HTTP_200_OK)

        # ตั้งคุกกี้สำหรับ refresh และ access tokens
        response.set_cookie('refresh', refresh, httponly=True)
        response.set_cookie('access', access, httponly=True)

        return response

class TestAuthenticationView(GenericAPIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        data = {
            'msg': 'its works'
        }
        return Response(data, status=status.HTTP_200_OK)

class PasswordResetRequestView(GenericAPIView):
    serializer_class = PasswordResetRequestSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        return Response({'message': "a link has been sent to your email to reset your password"}, status=status.HTTP_200_OK)

class PasswordResetConfirm(GenericAPIView):
    def get(self, request, uidb64, token):
        try:
            user_id = smart_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(id=user_id)
            if not PasswordResetTokenGenerator().check_token(user, token):
                return Response({'message': 'token is invalid or has expired'}, status=status.HTTP_401_UNAUTHORIZED)
            return Response({'success': True, 'message': 'credentials valid', 'uidb64': uidb64, 'token': token}, status=status.HTTP_200_OK)
        except DjangoUnicodeDecodeError as e:
            return Response({'message': 'token is invalid or has expired'}, status=status.HTTP_401_UNAUTHORIZED)

class SetNewPasswordView(GenericAPIView):
    serializer_class = SetNewPasswordSerializer

    def patch(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response({'message': 'password reset successful'}, status=status.HTTP_200_OK)

class LogoutUserView(GenericAPIView):
    serializer_class = LogoutUserSerializer
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        refresh_token = request.COOKIES.get('refresh')
        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except Exception as e:
                return Response({'message': 'An error occurred during logout'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        response = Response({'message': 'logout successful'}, status=status.HTTP_200_OK)
        response.delete_cookie('refresh')
        response.delete_cookie('access')
        return response
