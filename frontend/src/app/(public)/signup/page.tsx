'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, Mail, Lock, User, Building2, Briefcase, Check, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

// Step 1: Account Info
const accountSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Step 2: Company Info
const companySchema = z.object({
  companyName: z.string().min(2, 'Company name is required'),
  jobTitle: z.string().min(2, 'Job title is required'),
  companySize: z.enum(['1-10', '11-50', '51-200', '201-500', '501+']),
});

// Step 3: Use Case
const useCaseSchema = z.object({
  useCase: z.enum(['patent-search', 'patent-drafting', 'analytics', 'infringement', 'all']),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
});

type AccountFormData = z.infer<typeof accountSchema>;
type CompanyFormData = z.infer<typeof companySchema>;
type UseCaseFormData = z.infer<typeof useCaseSchema>;

type Step = 1 | 2 | 3;

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form data storage
  const [accountData, setAccountData] = useState<AccountFormData | null>(null);
  const [companyData, setCompanyData] = useState<CompanyFormData | null>(null);

  const accountForm = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
  });

  const companyForm = useForm<CompanyFormData>({
    resolver: zodResolver(companySchema),
  });

  const useCaseForm = useForm<UseCaseFormData>({
    resolver: zodResolver(useCaseSchema),
  });

  const handleAccountSubmit = (data: AccountFormData) => {
    setAccountData(data);
    setCurrentStep(2);
  };

  const handleCompanySubmit = (data: CompanyFormData) => {
    setCompanyData(data);
    setCurrentStep(3);
  };

  const handleUseCaseSubmit = async (data: UseCaseFormData) => {
    if (!accountData || !companyData) {
      toast.error('Please complete all previous steps');
      return;
    }

    setIsLoading(true);

    try {
      // Parse full name into first and last name
      const nameParts = accountData.fullName.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || nameParts[0];

      // Call signup API
      await signup({
        email: accountData.email,
        password: accountData.password,
        firstName,
        lastName,
        companyName: companyData.companyName,
        phoneNumber: '', // Optional field
        role: 'user', // Default role
        industry: data.useCase,
      });

      toast.success('Account created successfully!', {
        description: 'Please wait for admin approval before signing in.',
      });

      // Redirect to login page
      setTimeout(() => {
        router.push('/login?registered=true');
      }, 2000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const calculatePasswordStrength = (password: string): number => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.length >= 12) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    return Math.min(strength, 100);
  };

  const passwordStrength = accountForm.watch('password')
    ? calculatePasswordStrength(accountForm.watch('password'))
    : 0;

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 50) return 'bg-red-500';
    if (passwordStrength < 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength < 50) return 'Weak';
    if (passwordStrength < 75) return 'Good';
    return 'Strong';
  };

  const useCaseOptions = [
    {
      value: 'patent-search',
      icon: '🔍',
      title: 'Prior Art Search',
      description: 'Find relevant patents and publications',
    },
    {
      value: 'patent-drafting',
      icon: '📝',
      title: 'Patent Drafting',
      description: 'AI-powered patent application drafting',
    },
    {
      value: 'analytics',
      icon: '📊',
      title: 'Landscape Analytics',
      description: 'Technology trends and competitive intelligence',
    },
    {
      value: 'infringement',
      icon: '🛡️',
      title: 'Infringement Analysis',
      description: '10-phase workflow with claim charting',
    },
    {
      value: 'all',
      icon: '✨',
      title: 'All Features',
      description: 'Complete patent management platform',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-blue-50 relative overflow-hidden flex flex-col">
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

      <div className="flex items-center justify-center px-4 py-8 min-h-[calc(100vh-64px)]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-2xl relative z-10"
        >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="shadow-2xl border border-neutral-200 bg-white backdrop-blur-sm">
            <AnimatePresence mode="wait">
              {/* Step 1: Account Info */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <form onSubmit={accountForm.handleSubmit(handleAccountSubmit)}>
                    <CardHeader className="space-y-1 pb-4">
                      <CardTitle className="text-xl font-bold text-neutral-900">Account Information</CardTitle>
                      <CardDescription className="text-sm text-neutral-600">
                        Let's start with your basic details
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      {/* Full Name and Email - Side by Side */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Full Name */}
                        <div className="space-y-2">
                          <Label htmlFor="fullName">Full Name</Label>
                          <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                            <Input
                              id="fullName"
                              type="text"
                              placeholder="John Doe"
                              className="pl-10"
                              {...accountForm.register('fullName')}
                            />
                          </div>
                          {accountForm.formState.errors.fullName && (
                            <p className="text-sm text-red-600">{accountForm.formState.errors.fullName.message}</p>
                          )}
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                          <Label htmlFor="email">Email Address</Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                            <Input
                              id="email"
                              type="email"
                              placeholder="john.doe@company.com"
                              className="pl-10"
                              {...accountForm.register('email')}
                            />
                          </div>
                          {accountForm.formState.errors.email && (
                            <p className="text-sm text-red-600">{accountForm.formState.errors.email.message}</p>
                          )}
                        </div>
                      </div>

                      {/* Password Fields - Side by Side */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Password */}
                        <div className="space-y-2">
                          <Label htmlFor="password">Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                            <Input
                              id="password"
                              type={showPassword ? 'text' : 'password'}
                              placeholder="Create a strong password"
                              className="pl-10 pr-10"
                              {...accountForm.register('password')}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-900 transition-colors"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          {accountForm.formState.errors.password && (
                            <p className="text-sm text-red-600">{accountForm.formState.errors.password.message}</p>
                          )}
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword">Confirm Password</Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                            <Input
                              id="confirmPassword"
                              type={showConfirmPassword ? 'text' : 'password'}
                              placeholder="Confirm your password"
                              className="pl-10 pr-10"
                              {...accountForm.register('confirmPassword')}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-3 text-neutral-500 hover:text-neutral-900 transition-colors"
                            >
                              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                          {accountForm.formState.errors.confirmPassword && (
                            <p className="text-sm text-red-600">{accountForm.formState.errors.confirmPassword.message}</p>
                          )}
                        </div>
                      </div>

                      {/* Password Strength Meter */}
                      {accountForm.watch('password') && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-neutral-600">Password strength:</span>
                            <span className={`font-medium ${
                              passwordStrength < 50 ? 'text-red-600' :
                              passwordStrength < 75 ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {getPasswordStrengthText()}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-neutral-200 rounded-full overflow-hidden">
                            <motion.div
                              className={`h-full ${getPasswordStrengthColor()}`}
                              initial={{ width: 0 }}
                              animate={{ width: `${passwordStrength}%` }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                        </div>
                      )}

                    </CardContent>

                    <CardFooter className="flex flex-col space-y-3 pt-4">
                      <Button
                        type="submit"
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white transition-all duration-300"
                      >
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>

                      {/* Social Signup */}
                      <div className="relative w-full">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-white px-2 text-neutral-500">Or continue with</span>
                        </div>
                      </div>

                      <Button variant="outline" type="button" className="w-full hover:border-cyan-500 hover:text-cyan-500 transition-colors">
                        <svg className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                        LinkedIn
                      </Button>

                      <div className="text-center text-xs">
                        Already have an account?{' '}
                        <Link href="/login" className="text-cyan-600 hover:text-cyan-700 hover:underline font-medium transition-colors">
                          Sign in
                        </Link>
                      </div>
                    </CardFooter>
                  </form>
                </motion.div>
              )}

              {/* Step 2: Company Info */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <form onSubmit={companyForm.handleSubmit(handleCompanySubmit)}>
                    <CardHeader className="space-y-1 pb-4">
                      <CardTitle className="text-xl font-bold text-neutral-900">Company Information</CardTitle>
                      <CardDescription className="text-sm text-neutral-600">
                        Tell us about your organization
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      {/* Company Name */}
                      <div className="space-y-2">
                        <Label htmlFor="companyName">Company Name</Label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                          <Input
                            id="companyName"
                            type="text"
                            placeholder="Acme Corporation"
                            className="pl-10"
                            {...companyForm.register('companyName')}
                          />
                        </div>
                        {companyForm.formState.errors.companyName && (
                          <p className="text-sm text-red-600">{companyForm.formState.errors.companyName.message}</p>
                        )}
                      </div>

                      {/* Job Title */}
                      <div className="space-y-2">
                        <Label htmlFor="jobTitle">Job Title</Label>
                        <div className="relative">
                          <Briefcase className="absolute left-3 top-3 h-4 w-4 text-neutral-500" />
                          <Input
                            id="jobTitle"
                            type="text"
                            placeholder="Patent Attorney"
                            className="pl-10"
                            {...companyForm.register('jobTitle')}
                          />
                        </div>
                        {companyForm.formState.errors.jobTitle && (
                          <p className="text-sm text-red-600">{companyForm.formState.errors.jobTitle.message}</p>
                        )}
                      </div>

                      {/* Company Size */}
                      <div className="space-y-2">
                        <Label htmlFor="companySize">Company Size</Label>
                        <select
                          id="companySize"
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2"
                          {...companyForm.register('companySize')}
                        >
                          <option value="">Select company size</option>
                          <option value="1-10">1-10 employees</option>
                          <option value="11-50">11-50 employees</option>
                          <option value="51-200">51-200 employees</option>
                          <option value="201-500">201-500 employees</option>
                          <option value="501+">501+ employees</option>
                        </select>
                        {companyForm.formState.errors.companySize && (
                          <p className="text-sm text-red-600">{companyForm.formState.errors.companySize.message}</p>
                        )}
                      </div>
                    </CardContent>

                    <CardFooter className="flex gap-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 hover:bg-neutral-100"
                        onClick={() => setCurrentStep(1)}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white transition-all duration-300"
                      >
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardFooter>
                  </form>
                </motion.div>
              )}

              {/* Step 3: Use Case */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <form onSubmit={useCaseForm.handleSubmit(handleUseCaseSubmit)}>
                    <CardHeader className="space-y-1 pb-3">
                      <CardTitle className="text-xl font-bold text-neutral-900">What brings you to PatPipes?</CardTitle>
                      <CardDescription className="text-sm text-neutral-600">
                        Select your primary use case
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      {/* Use Case Selection - Two Columns */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {useCaseOptions.map((option) => (
                          <label
                            key={option.value}
                            className={`
                              relative flex items-start p-3 border-2 rounded-lg cursor-pointer transition-all
                              hover:border-cyan-400 hover:bg-cyan-50
                              ${useCaseForm.watch('useCase') === option.value ? 'border-cyan-500 bg-cyan-50' : 'border-neutral-200'}
                            `}
                          >
                            <input
                              type="radio"
                              value={option.value}
                              {...useCaseForm.register('useCase')}
                              className="sr-only"
                            />
                            <div className="flex items-start gap-2 w-full">
                              <div className="text-xl mt-0.5">{option.icon}</div>
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-neutral-900 text-sm">{option.title}</div>
                                <div className="text-xs text-neutral-600 mt-0.5">{option.description}</div>
                              </div>
                              {useCaseForm.watch('useCase') === option.value && (
                                <Check className="h-4 w-4 text-cyan-600 shrink-0 mt-0.5" />
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                      {useCaseForm.formState.errors.useCase && (
                        <p className="text-sm text-red-600">{useCaseForm.formState.errors.useCase.message}</p>
                      )}

                      {/* Terms and Conditions */}
                      <div className="space-y-2 pt-2">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            className="mt-1 h-4 w-4 rounded border-neutral-300 text-cyan-600 focus:ring-cyan-500"
                            {...useCaseForm.register('agreeToTerms')}
                          />
                          <span className="text-sm text-neutral-600">
                            I agree to the{' '}
                            <Link href="/terms" className="text-cyan-600 hover:underline" target="_blank">
                              Terms of Service
                            </Link>
                            {' '}and{' '}
                            <Link href="/privacy" className="text-cyan-600 hover:underline" target="_blank">
                              Privacy Policy
                            </Link>
                          </span>
                        </label>
                        {useCaseForm.formState.errors.agreeToTerms && (
                          <p className="text-sm text-red-600">{useCaseForm.formState.errors.agreeToTerms.message}</p>
                        )}
                      </div>
                    </CardContent>

                    <CardFooter className="flex gap-3 pt-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 hover:bg-neutral-100"
                        onClick={() => setCurrentStep(2)}
                        disabled={isLoading}
                      >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white transition-all duration-300"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating account...
                          </>
                        ) : (
                          <>
                            Create Account
                            <Check className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </motion.div>
        </motion.div>
      </div>

      {/* Footer */}
      <footer className="border-t border-neutral-200 bg-neutral-50 mt-auto">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-neutral-600">
            <p>© 2024 PatPipes. All rights reserved.</p>
            <div className="flex gap-4">
              <Link href="/privacy" className="hover:text-neutral-900 hover:underline transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-neutral-900 hover:underline transition-colors">Terms of Service</Link>
              <Link href="/contact" className="hover:text-neutral-900 hover:underline transition-colors">Contact Support</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
