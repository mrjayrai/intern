import { useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { Sparkles, Mail, Lock, User, Shield } from 'lucide-react';
import { api, setSession, getStoredSession, type UserRole } from '../lib/api';

type RegisterableRole = Extract<UserRole, 'candidate' | 'employee' | 'hr' | 'mentor' | 'it'>;

const ROLE_OPTIONS: { value: RegisterableRole; label: string }[] = [
  { value: 'candidate', label: 'Candidate' },
  { value: 'employee', label: 'Employee' },
  { value: 'hr', label: 'HR' },
  { value: 'mentor', label: 'Mentor' },
  { value: 'it', label: 'IT' },
];

const RESTRICTED_ROLES: RegisterableRole[] = ['hr', 'mentor', 'it'];
const INTERNFLOW_DOMAIN = '@internflowsystem';

type FormErrors = {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
};

export function Register() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<RegisterableRole>('candidate');
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (getStoredSession()) {
    return <Navigate to="/" replace />;
  }

  const isRestricted = RESTRICTED_ROLES.includes(role);

  function validate(): FormErrors {
    const errs: FormErrors = {};

    if (!name.trim() || name.trim().length < 2) {
      errs.name = 'Name must be at least 2 characters';
    }

    if (!email.trim()) {
      errs.email = 'Email is required';
    } else if (isRestricted && !email.includes(INTERNFLOW_DOMAIN)) {
      errs.email = `HR, Mentor, and IT accounts require an ${INTERNFLOW_DOMAIN} email address`;
    }

    if (!password) {
      errs.password = 'Password is required';
    } else if (password.length < 8) {
      errs.password = 'Password must be at least 8 characters';
    }

    if (!confirmPassword) {
      errs.confirmPassword = 'Please confirm your password';
    } else if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    return errs;
  }

  const handleChange = () => {
    if (Object.keys(errors).length > 0) {
      setErrors({});
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setIsSubmitting(true);
    try {
      // Check if this email has a pending onboarding invitation
      console.log('[Register] Checking for pending invite:', email.trim());
      const inviteCheck = await api.onboardingInvites.checkPendingInvite(email.trim());

      if (inviteCheck.data.hasPendingInvite) {
        console.log('[Register] Email has pending invite, blocking registration');
        toast.error(
          'This email has a pending onboarding invitation. Please check your email and use the activation link provided.',
          { duration: 6000 }
        );
        setIsSubmitting(false);
        return;
      }

      console.log('[Register] No pending invite, proceeding with registration');
      const session = await api.register({ name: name.trim(), email: email.trim(), password, role });
      setSession(session.accessToken, session.user);
      toast.success('Account created successfully! Welcome to Intern Flow.');
      navigate('/', { replace: true });
    } catch (err) {
      console.error('[Register] Error:', err);
      toast.error(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    name.trim().length >= 2 &&
    email.trim().length > 0 &&
    (!isRestricted || email.includes(INTERNFLOW_DOMAIN)) &&
    password.length >= 8 &&
    password === confirmPassword;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#3b82f6] to-[#8b5cf6] shadow-lg">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">Intern Flow</h1>
          <p className="mt-2 text-sm text-gray-600">AI-Powered Internship Program Management</p>
        </div>

        <Card className="shadow-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Create your account</CardTitle>
            <CardDescription>Fill in the details below to get started</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4" onChange={handleChange}>
              {/* Name */}
              <div className="space-y-1">
                <label htmlFor="name" className="text-sm font-medium">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
                {errors.name && (
                  <p className="text-xs text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Role */}
              <div className="space-y-1">
                <label htmlFor="role" className="text-sm font-medium">
                  Role
                </label>
                <div className="relative">
                  <Shield className="absolute left-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                  <select
                    id="role"
                    value={role}
                    onChange={(e) => setRole(e.target.value as RegisterableRole)}
                    className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                {isRestricted && (
                  <p className="text-xs text-amber-600">
                    This role requires an <strong>{INTERNFLOW_DOMAIN}</strong> email address
                  </p>
                )}
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label htmlFor="email" className="text-sm font-medium">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={isRestricted ? `john${INTERNFLOW_DOMAIN}.com` : 'john.doe@company.com'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label htmlFor="password" className="text-sm font-medium">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
                {errors.password && (
                  <p className="text-xs text-red-600">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-600">{errors.confirmPassword}</p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                variant="primary"
                disabled={isSubmitting || !isFormValid}
              >
                {isSubmitting ? 'Creating account...' : 'Create account'}
              </Button>
            </form>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p className="text-xs text-blue-800">
                <strong>Approved candidate?</strong> If you received an onboarding invitation email from HR,
                please use the activation link provided in your email instead of registering here.
              </p>
            </div>

            <p className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-500">
          Protected by enterprise security. Copyright 2026 Intern Flow. All rights reserved.
        </p>
      </div>
    </div>
  );
}
