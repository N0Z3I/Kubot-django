from django.utils.deprecation import MiddlewareMixin
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
from django.conf import settings

class JWTAuthenticationMiddleware(MiddlewareMixin):

    def process_request(self, request):
        auth = JWTAuthentication()
        access_token = request.COOKIES.get('access')
        if access_token:
            try:
                validated_token = auth.get_validated_token(access_token)
                request.user = auth.get_user(validated_token)
            except InvalidToken:
                request.user = None
