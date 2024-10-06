from django.shortcuts import render
from rest_framework.generics import GenericAPIView
from .serializers import UserRegisterSerializer, LoginUserSerializer, SetNewPasswordSerializer, PasswordResetRequestSerializer, LogoutUserSerializer, RegisterAndLoginStudentSerializer
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from .utils import send_code_to_user
from .models import OneTimePassword, User
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

from .serializers import LoginWithMykuSerializer

User = get_user_model()

from django.contrib.auth import get_user_model
from rest_framework.permissions import AllowAny
import logging
import jwt
from django.conf import settings

logger = logging.getLogger(__name__)
User = get_user_model()

class MykuLoginView(GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = LoginWithMykuSerializer

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            try:
                # ตรวจสอบว่า header 'Authorization' มีอยู่หรือไม่
                if 'Authorization' not in request.headers:
                    return Response({'error': 'Authorization header is required for this request.'},
                                    status=status.HTTP_401_UNAUTHORIZED)

                auth_header = request.headers.get('Authorization')
                token = auth_header.split(" ")[1]  # ดึง JWT token (Bearer <token>)
                decoded_token = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
                user_id = decoded_token.get('user_id')

                if user_id:
                    try:
                        # ดึงผู้ใช้จากฐานข้อมูลโดยใช้ user_id
                        user = User.objects.get(id=user_id)

                        # รับข้อมูลนักศึกษาและข้อมูลการเข้าสู่ระบบ MyKU จาก serializer
                        student_data = serializer.validated_data['student_data']
                        schedule_data = serializer.validated_data['schedule_data']
                        announce_data = serializer.validated_data['announce_data']
                        grades_data = serializer.validated_data['grades_data']
                        group_course_data = serializer.validated_data['group_course_data']
                        student_education_data = serializer.validated_data['student_education_data']
                        gpax_data = serializer.validated_data['gpax_data']

                        # บันทึกข้อมูลของผู้ใช้
                        myku_username = serializer.validated_data['username']
                        myku_password = serializer.validated_data['password']
                        user.myku_username = myku_username
                        user.myku_password = myku_password
                        user.save()

                        # สร้าง response_data เพื่อส่งกลับไปให้ Frontend
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
                            'message': 'Successfully linked MyKU and fetched additional data.'
                        }

                        return Response(response_data, status=status.HTTP_200_OK)

                    except User.DoesNotExist:
                        return Response({'error': 'User does not exist.'}, status=status.HTTP_404_NOT_FOUND)

                else:
                    return Response({'error': 'Invalid JWT token.'}, status=status.HTTP_401_UNAUTHORIZED)

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







@method_decorator(csrf_exempt, name='dispatch')
class RegisterAndLoginStudentView(GenericAPIView):
    serializer_class = RegisterAndLoginStudentSerializer

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data

        # Generate JWT token
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)

        # Add tokens to the response
        data = serializer.data
        data['access_token'] = access_token
        data['refresh_token'] = str(refresh)

        return Response(data, status=status.HTTP_201_CREATED)
    
    

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

class ScheduleView(GenericAPIView):
    # You can define queryset and serializer_class if needed
    # queryset = ...
    # serializer_class = ...

    def get(self, request, *args, **kwargs):
        # Example schedule data
        schedule = {
            "Monday": "Math",
            "Tuesday": "Science",
            "Wednesday": "History"
        }
        return Response(schedule)