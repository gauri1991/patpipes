'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Mail, Lock, ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'}/accounts/auth`;

const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const verificationSchema = z.object({
  code: z.string().length(6, 'Verification code must be 6 digits'),
});

const resetSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type EmailFormData = z.infer<typeof emailSchema>;
type VerificationFormData = z.infer<typeof verificationSchema>;
type ResetFormData = z.infer<typeof resetSchema>;

type Step = 'email' | 'verification' | 'reset' | 'success';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
  });

  const verificationForm = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
  });

  const resetForm = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
  });

  const handleEmailSubmit = async (data: EmailFormData) => {
    setIsLoading(true);
    setEmail(data.email);

    try {
      const response = await fetch(`${API_BASE}/forgot-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Verification code sent!', {
          description: `We've sent a 6-digit code to ${data.email}`,
        });
        // For development, show the code in toast
        if (result.code) {
          toast.info(`Development: Your code is ${result.code}`);
        }
        setCurrentStep('verification');
      } else {
        toast.error(result.error || 'Failed to send verification code');
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificationSubmit = async (data: VerificationFormData) => {
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/verify-reset-code/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: data.code }),
      });

      const result = await response.json();

      if (response.ok) {
        setResetToken(result.reset_token);
        toast.success('Code verified!');
        setCurrentStep('reset');
      } else {
        toast.error(result.error || 'Invalid or expired code');
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetSubmit = async (data: ResetFormData) => {
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/reset-password/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reset_token: resetToken, password: data.password }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Password reset successfully!');
        setCurrentStep('success');
      } else {
        toast.error(result.error || 'Failed to reset password');
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    toast.loading('Resending code...', { id: 'resend' });
    try {
      const response = await fetch(`${API_BASE}/resend-reset-code/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success('Code resent successfully!', { id: 'resend' });
        // For development, show the code
        if (result.code) {
          toast.info(`Development: Your new code is ${result.code}`);
        }
      } else {
        toast.error(result.error || 'Failed to resend code', { id: 'resend' });
      }
    } catch (error) {
      toast.error('Something went wrong', { id: 'resend' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-cyan-50 via-white to-blue-50 px-4 relative overflow-hidden">
      {/* Animated Background Elements */}
      <motion.div
        className="absolute top-20 left-10 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-xl opacity-20"
        animate={{
          x: [0, 100, 0],
          y: [0, 50, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute bottom-20 right-10 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20"
        animate={{
          x: [0, -100, 0],
          y: [0, -50, 0],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md space-y-8 relative z-10"
      >
        {/* Logo and Title */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-center"
        >
          <Link href="/">
            <motion.h1
              whileHover={{ scale: 1.05 }}
              className="text-4xl font-bold bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent cursor-pointer"
            >
              PatPipes
            </motion.h1>
          </Link>
          <p className="text-neutral-600 mt-2 text-lg">Reset your password</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="shadow-2xl border border-neutral-200 bg-white backdrop-blur-sm">
            <AnimatePresence mode="wait">
              {/* Step 1: Email Input */}
              {currentStep === 'email' && (
                <motion.div
                  key="email"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)}>
                    <CardHeader>
                      <CardTitle className="text-2xl font-bold text-neutral-900">Forgot Password?</CardTitle>
                      <CardDescription className="text-neutral-600">
                        Enter your email address and we'll send you a verification code
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="your.email@company.com"
                            className="pl-10"
                            {...emailForm.register('email')}
                            disabled={isLoading}
                          />
                        </div>
                        {emailForm.formState.errors.email && (
                          <p className="text-sm text-red-600">{emailForm.formState.errors.email.message}</p>
                        )}
                      </div>
                    </CardContent>

                    <CardFooter className="flex flex-col space-y-4">
                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white transition-all duration-300"
                        size="lg"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending code...
                          </>
                        ) : (
                          <>
                            <Mail className="mr-2 h-4 w-4" />
                            Send Verification Code
                          </>
                        )}
                      </Button>

                      <Link href="/login" className="w-full">
                        <Button variant="ghost" size="lg" className="w-full hover:bg-neutral-100">
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Back to Login
                        </Button>
                      </Link>
                    </CardFooter>
                  </form>
                </motion.div>
              )}

              {/* Step 2: Verification Code */}
              {currentStep === 'verification' && (
                <motion.div
                  key="verification"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <form onSubmit={verificationForm.handleSubmit(handleVerificationSubmit)}>
                    <CardHeader>
                      <CardTitle className="text-2xl font-bold text-neutral-900">Check Your Email</CardTitle>
                      <CardDescription className="text-neutral-600">
                        We sent a 6-digit code to <span className="font-medium text-neutral-900">{email}</span>
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="code">Verification Code</Label>
                        <div className="relative">
                          <KeyRound className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                          <Input
                            id="code"
                            type="text"
                            placeholder="000000"
                            maxLength={6}
                            className="pl-10 text-center text-2xl tracking-widest"
                            {...verificationForm.register('code')}
                            disabled={isLoading}
                          />
                        </div>
                        {verificationForm.formState.errors.code && (
                          <p className="text-sm text-red-600">{verificationForm.formState.errors.code.message}</p>
                        )}
                      </div>

                      <div className="text-center">
                        <button
                          type="button"
                          onClick={handleResendCode}
                          className="text-sm text-cyan-600 hover:text-cyan-700 hover:underline"
                        >
                          Didn't receive the code? Resend
                        </button>
                      </div>
                    </CardContent>

                    <CardFooter className="flex flex-col space-y-4">
                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white transition-all duration-300"
                        size="lg"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          'Verify Code'
                        )}
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="lg"
                        className="w-full hover:bg-neutral-100"
                        onClick={() => setCurrentStep('email')}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Change Email
                      </Button>
                    </CardFooter>
                  </form>
                </motion.div>
              )}

              {/* Step 3: Reset Password */}
              {currentStep === 'reset' && (
                <motion.div
                  key="reset"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <form onSubmit={resetForm.handleSubmit(handleResetSubmit)}>
                    <CardHeader>
                      <CardTitle className="text-2xl font-bold text-neutral-900">Create New Password</CardTitle>
                      <CardDescription className="text-neutral-600">
                        Choose a strong password for your account
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="password">New Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                          <Input
                            id="password"
                            type="password"
                            placeholder="Enter new password"
                            className="pl-10"
                            {...resetForm.register('password')}
                            disabled={isLoading}
                          />
                        </div>
                        {resetForm.formState.errors.password && (
                          <p className="text-sm text-red-600">{resetForm.formState.errors.password.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirm Password</Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                          <Input
                            id="confirmPassword"
                            type="password"
                            placeholder="Confirm new password"
                            className="pl-10"
                            {...resetForm.register('confirmPassword')}
                            disabled={isLoading}
                          />
                        </div>
                        {resetForm.formState.errors.confirmPassword && (
                          <p className="text-sm text-red-600">{resetForm.formState.errors.confirmPassword.message}</p>
                        )}
                      </div>

                      <div className="text-sm text-neutral-600 bg-neutral-50 p-3 rounded-lg">
                        Password must contain at least 8 characters
                      </div>
                    </CardContent>

                    <CardFooter>
                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white transition-all duration-300"
                        size="lg"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Resetting password...
                          </>
                        ) : (
                          'Reset Password'
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </motion.div>
              )}

              {/* Step 4: Success */}
              {currentStep === 'success' && (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <CardHeader>
                    <div className="flex justify-center mb-4">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center"
                      >
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                      </motion.div>
                    </div>
                    <CardTitle className="text-2xl font-bold text-neutral-900 text-center">Password Reset Successfully!</CardTitle>
                    <CardDescription className="text-neutral-600 text-center">
                      Your password has been changed. You can now sign in with your new password.
                    </CardDescription>
                  </CardHeader>

                  <CardFooter>
                    <Link href="/login" className="w-full">
                      <Button
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white transition-all duration-300"
                        size="lg"
                      >
                        Continue to Login
                      </Button>
                    </Link>
                  </CardFooter>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center text-sm text-neutral-600"
        >
          <p>© 2024 PatPipes. All rights reserved.</p>
          <div className="mt-2 space-x-4">
            <Link href="/privacy" className="hover:text-cyan-600 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-cyan-600 transition-colors">Terms of Service</Link>
            <Link href="/contact" className="hover:text-cyan-600 transition-colors">Contact Support</Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
