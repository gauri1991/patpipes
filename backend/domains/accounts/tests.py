"""
Tests for Accounts Domain - including 2FA
"""

from django.test import TestCase
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
import pyotp

from .models import User, Organization, TwoFactorAuth, UserSettings


class TwoFactorAuthModelTests(TestCase):
    """Tests for TwoFactorAuth model"""

    def setUp(self):
        self.organization = Organization.objects.create(
            name='Test Org',
            domain='test.com',
            industry='tech',
            size='small'
        )
        self.user = User.objects.create_user(
            email='test@test.com',
            password='testpass123',
            first_name='Test',
            last_name='User',
            organization=self.organization,
            status='active'
        )

    def test_twofactor_creation(self):
        """Test creating a 2FA record"""
        secret = pyotp.random_base32()
        twofa = TwoFactorAuth.objects.create(
            user=self.user,
            secret_key=secret,
            is_verified=False
        )
        self.assertEqual(twofa.user, self.user)
        self.assertFalse(twofa.is_verified)

    def test_generate_backup_codes(self):
        """Test generating backup codes"""
        secret = pyotp.random_base32()
        twofa = TwoFactorAuth.objects.create(
            user=self.user,
            secret_key=secret
        )
        codes = twofa.generate_backup_codes(count=5)
        self.assertEqual(len(codes), 5)
        self.assertEqual(len(twofa.backup_codes), 5)

    def test_use_backup_code(self):
        """Test using a backup code"""
        secret = pyotp.random_base32()
        twofa = TwoFactorAuth.objects.create(
            user=self.user,
            secret_key=secret
        )
        codes = twofa.generate_backup_codes(count=5)
        code_to_use = codes[0]

        # Valid code should work
        result = twofa.use_backup_code(code_to_use)
        self.assertTrue(result)
        self.assertEqual(len(twofa.backup_codes), 4)

        # Same code shouldn't work twice
        result = twofa.use_backup_code(code_to_use)
        self.assertFalse(result)

    def test_totp_verification(self):
        """Test TOTP code verification"""
        secret = pyotp.random_base32()
        twofa = TwoFactorAuth.objects.create(
            user=self.user,
            secret_key=secret
        )

        # Generate valid TOTP code
        totp = pyotp.TOTP(secret)
        valid_code = totp.now()

        # Verify with pyotp (same logic as our views)
        self.assertTrue(totp.verify(valid_code))

        # Invalid code should fail
        self.assertFalse(totp.verify('000000'))


class TwoFactorAPITests(APITestCase):
    """Tests for 2FA API endpoints"""

    def setUp(self):
        self.organization = Organization.objects.create(
            name='Test Org',
            domain='test.com',
            industry='tech',
            size='small'
        )
        self.user = User.objects.create_user(
            email='test@test.com',
            password='testpass123',
            first_name='Test',
            last_name='User',
            organization=self.organization,
            status='active'
        )
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_setup_2fa(self):
        """Test initiating 2FA setup"""
        response = self.client.post('/api/v1/accounts/auth/2fa/setup/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertIn('secret', response.data['data'])
        self.assertIn('qr_code', response.data['data'])

        # Verify TwoFactorAuth record was created
        self.assertTrue(TwoFactorAuth.objects.filter(user=self.user).exists())

    def test_get_2fa_status_disabled(self):
        """Test getting 2FA status when disabled"""
        response = self.client.get('/api/v1/accounts/auth/2fa/status/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertFalse(response.data['data']['enabled'])

    def test_get_2fa_status_enabled(self):
        """Test getting 2FA status when enabled"""
        secret = pyotp.random_base32()
        TwoFactorAuth.objects.create(
            user=self.user,
            secret_key=secret,
            is_verified=True,
            backup_codes=['CODE1', 'CODE2']
        )
        response = self.client.get('/api/v1/accounts/auth/2fa/status/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['data']['enabled'])
        self.assertEqual(response.data['data']['backup_codes_count'], 2)

    def test_verify_2fa_with_valid_code(self):
        """Test verifying 2FA with valid code"""
        secret = pyotp.random_base32()
        TwoFactorAuth.objects.create(
            user=self.user,
            secret_key=secret,
            is_verified=False
        )

        totp = pyotp.TOTP(secret)
        valid_code = totp.now()

        response = self.client.post('/api/v1/accounts/auth/2fa/verify/', {
            'code': valid_code
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])

        # Verify 2FA is now enabled
        twofa = TwoFactorAuth.objects.get(user=self.user)
        self.assertTrue(twofa.is_verified)

    def test_verify_2fa_with_invalid_code(self):
        """Test verifying 2FA with invalid code"""
        secret = pyotp.random_base32()
        TwoFactorAuth.objects.create(
            user=self.user,
            secret_key=secret,
            is_verified=False
        )

        response = self.client.post('/api/v1/accounts/auth/2fa/verify/', {
            'code': '000000'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(response.data['success'])

    def test_disable_2fa(self):
        """Test disabling 2FA"""
        secret = pyotp.random_base32()
        TwoFactorAuth.objects.create(
            user=self.user,
            secret_key=secret,
            is_verified=True
        )
        UserSettings.objects.create(
            user=self.user,
            two_factor_enabled=True
        )

        response = self.client.post('/api/v1/accounts/auth/2fa/disable/', {
            'password': 'testpass123'
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])

        # Verify 2FA record is deleted
        self.assertFalse(TwoFactorAuth.objects.filter(user=self.user).exists())

    def test_disable_2fa_wrong_password(self):
        """Test disabling 2FA with wrong password"""
        secret = pyotp.random_base32()
        TwoFactorAuth.objects.create(
            user=self.user,
            secret_key=secret,
            is_verified=True
        )

        response = self.client.post('/api/v1/accounts/auth/2fa/disable/', {
            'password': 'wrongpassword'
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_regenerate_backup_codes(self):
        """Test regenerating backup codes"""
        secret = pyotp.random_base32()
        TwoFactorAuth.objects.create(
            user=self.user,
            secret_key=secret,
            is_verified=True,
            backup_codes=['OLD1', 'OLD2']
        )

        totp = pyotp.TOTP(secret)
        valid_code = totp.now()

        response = self.client.post('/api/v1/accounts/auth/2fa/backup-codes/', {
            'code': valid_code
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(response.data['success'])
        self.assertEqual(len(response.data['backup_codes']), 10)

        # Verify old codes are replaced
        twofa = TwoFactorAuth.objects.get(user=self.user)
        self.assertNotIn('OLD1', twofa.backup_codes)


class UserModelTests(TestCase):
    """Tests for User model"""

    def setUp(self):
        self.organization = Organization.objects.create(
            name='Test Org',
            domain='test.com',
            industry='tech',
            size='small'
        )

    def test_create_user(self):
        """Test creating a regular user"""
        user = User.objects.create_user(
            email='test@test.com',
            password='testpass123',
            first_name='Test',
            last_name='User'
        )
        self.assertEqual(user.email, 'test@test.com')
        self.assertTrue(user.check_password('testpass123'))
        self.assertEqual(user.role, User.Role.GUEST)

    def test_create_superuser(self):
        """Test creating a superuser"""
        admin = User.objects.create_superuser(
            email='admin@test.com',
            password='adminpass123',
            first_name='Admin',
            last_name='User'
        )
        self.assertTrue(admin.is_superuser)
        self.assertTrue(admin.is_staff)
        self.assertEqual(admin.role, User.Role.ADMIN)

    def test_full_name_property(self):
        """Test full_name property"""
        user = User.objects.create_user(
            email='test@test.com',
            password='testpass123',
            first_name='John',
            last_name='Doe'
        )
        self.assertEqual(user.full_name, 'John Doe')

    def test_has_role(self):
        """Test has_role method"""
        user = User.objects.create_user(
            email='test@test.com',
            password='testpass123',
            first_name='Test',
            last_name='User',
            role=User.Role.ANALYST
        )
        self.assertTrue(user.has_role(User.Role.ANALYST))
        self.assertFalse(user.has_role(User.Role.ADMIN))
