"""
Rate throttles for authentication endpoints.

Defends the unauthenticated login + OTP-verification endpoints against brute
force. Login is throttled per client IP; OTP verification is throttled per
(IP, target user) with both a burst and a sustained limit, since that endpoint
is the brute-force surface for 6-digit TOTP / backup codes.

Rates live in settings.REST_FRAMEWORK['DEFAULT_THROTTLE_RATES'].
"""

from rest_framework.throttling import SimpleRateThrottle


class LoginRateThrottle(SimpleRateThrottle):
    """Throttle password-login attempts per client IP."""
    scope = 'login'

    def get_cache_key(self, request, view):
        return self.cache_format % {'scope': self.scope, 'ident': self.get_ident(request)}


class _OtpVerifyThrottle(SimpleRateThrottle):
    """Base: key OTP verification by client IP + the targeted user_id so an
    attacker can't spread guesses across the IP pool or many accounts cheaply."""
    def get_cache_key(self, request, view):
        ident = self.get_ident(request)
        user_id = request.data.get('user_id') or 'anon'
        return self.cache_format % {'scope': self.scope, 'ident': f'{ident}:{user_id}'}


class OtpVerifyBurstThrottle(_OtpVerifyThrottle):
    scope = 'otp_verify_burst'


class OtpVerifySustainedThrottle(_OtpVerifyThrottle):
    scope = 'otp_verify_sustained'
