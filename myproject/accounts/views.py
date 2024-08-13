from django.shortcuts import render
from rest_framework.generics import GenericAPIView
from .serializers import UserRegisterSerializer, LoginUserSerializer, SetNewPasswordSerializer, PasswordResetRequestSerializer, LogoutUserSerializer, RegisterAndLoginStudentSerializer
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
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

import logging

logger = logging.getLogger(__name__)

@method_decorator(csrf_exempt, name='dispatch')
class RegisterAndLoginStudentView(GenericAPIView):
    serializer_class = RegisterAndLoginStudentSerializer

    def post(self, request):
        logger.debug("Received data: %s", request.data)
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid(raise_exception=True):
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        logger.error("Validation failed: %s", serializer.errors)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
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

        response = Response(serializer.data, status=status.HTTP_200_OK)
        refresh = serializer.validated_data.get('refresh')
        access = serializer.validated_data.get('access')
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
            return Response({'success': True, 'message': 'credentials is valid', 'uidb64': uidb64, 'token': token}, status=status.HTTP_200_OK)

        except DjangoUnicodeDecodeError:
            return Response({'message': 'token is invalid or has expired'}, status=status.HTTP_401_UNAUTHORIZED)

class SetNewPassword(GenericAPIView):
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
        serializer.save()

        response = Response(status=status.HTTP_200_OK)
        response.delete_cookie('refresh')
        response.delete_cookie('access')
        return response
