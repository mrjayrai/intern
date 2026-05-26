import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { api } from '../lib/api';
import {
  Loader2,
  CheckCircle,
  XCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Calendar,
  MapPin,
  Briefcase,
  User,
  Mail,
} from 'lucide-react';
import { Alert } from '../components/ui/alert';

type InviteData = {
  email: string;
  candidateName: string;
  department: string;
  role: string;
  internshipDuration: string;
  location: string;
  expiresAt: string;
  onboarding: {
    mentor: string;
    project: string;
    startDate: string;
  };
};

export default function OnboardingAccept() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Validate token on mount
  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link. No token provided.');
      setValidating(false);
      setLoading(false);
      return;
    }

    validateInviteToken();
  }, [token]);

  const validateInviteToken = async () => {
    try {
      setValidating(true);
      setError(null);
      const response = await api.onboardingInvites.validateToken(token!);
      setInviteData(response.data);
      console.log('[OnboardingAccept] Invite validated:', response.data);
    } catch (err: any) {
      console.error('[OnboardingAccept] Validation failed:', err);
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Failed to validate invitation. The link may be expired or invalid.'
      );
    } finally {
      setValidating(false);
      setLoading(false);
    }
  };

  const validatePassword = (): boolean => {
    setPasswordError('');

    if (!password) {
      setPasswordError('Password is required');
      return false;
    }

    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleAcceptInvite = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePassword()) {
      return;
    }

    try {
      setAccepting(true);
      setError(null);

      const response = await api.onboardingInvites.acceptInvite({
        token: token!,
        password,
      });

      console.log('[OnboardingAccept] Invitation accepted:', response.data);
      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login', {
          state: {
            message: 'Account activated successfully! Please log in with your credentials.',
            email: inviteData?.email,
          },
        });
      }, 2000);
    } catch (err: any) {
      console.error('[OnboardingAccept] Accept failed:', err);
      setError(
        err?.response?.data?.message ||
        err?.message ||
        'Failed to activate your account. Please try again.'
      );
    } finally {
      setAccepting(false);
    }
  };

  // Loading state
  if (loading || validating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-600" />
            <p className="mt-4 text-lg text-gray-600">Validating your invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state (invalid/expired token)
  if (error && !inviteData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md border-red-200">
          <CardContent className="py-12 text-center">
            <XCircle className="mx-auto h-16 w-16 text-red-600" />
            <h2 className="mt-4 text-xl font-bold text-gray-900">Invalid Invitation</h2>
            <p className="mt-2 text-gray-600">{error}</p>
            <div className="mt-6">
              <Button onClick={() => navigate('/login')} variant="outline">
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md border-green-200">
          <CardContent className="py-12 text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-600" />
            <h2 className="mt-4 text-xl font-bold text-gray-900">Account Activated!</h2>
            <p className="mt-2 text-gray-600">
              Your account has been successfully activated. Redirecting to login...
            </p>
            <div className="mt-4">
              <Loader2 className="mx-auto h-6 w-6 animate-spin text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main activation form
  return (
    <div className="flex min-h-screen bg-gray-50 px-4 py-12">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        {/* Welcome Banner */}
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="py-8 text-center">
            <div className="mb-4 flex justify-center">
              <Sparkles className="h-16 w-16 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome to Intern Flow, {inviteData?.candidateName}! 🎉
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Congratulations! Your application has been approved.
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Complete the activation below to access your onboarding portal.
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Internship Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Your Internship Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <User className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Candidate Name</p>
                  <p className="font-medium">{inviteData?.candidateName}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{inviteData?.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Briefcase className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Department</p>
                  <p className="font-medium">{inviteData?.department}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Duration</p>
                  <p className="font-medium">{inviteData?.internshipDuration}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Location</p>
                  <p className="font-medium">{inviteData?.location}</p>
                </div>
              </div>
              {inviteData?.onboarding?.mentor && (
                <div className="flex items-start gap-3">
                  <User className="mt-0.5 h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Mentor</p>
                    <p className="font-medium">{inviteData.onboarding.mentor}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Account Activation Form */}
          <Card>
            <CardHeader>
              <CardTitle>Activate Your Account</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAcceptInvite} className="space-y-4">
                {error && (
                  <Alert variant="error">
                    <AlertCircle className="h-4 w-4" />
                    <span className="ml-2">{error}</span>
                  </Alert>
                )}

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Create Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      minLength={6}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Minimum 6 characters</p>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Confirm Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm your password"
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {passwordError && (
                  <p className="text-sm text-red-600">{passwordError}</p>
                )}

                <div className="rounded-md bg-blue-50 p-4">
                  <p className="text-xs text-blue-800">
                    <AlertCircle className="mr-1 inline h-3 w-3" />
                    This invitation expires on{' '}
                    <strong>
                      {new Date(inviteData?.expiresAt || '').toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </strong>
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={accepting}
                  className="w-full"
                  variant="primary"
                >
                  {accepting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Activating Account...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Activate My Account
                    </>
                  )}
                </Button>

                <p className="text-center text-xs text-gray-500">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="text-blue-600 hover:underline"
                  >
                    Log in here
                  </button>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Next Steps Info */}
        <Card>
          <CardHeader>
            <CardTitle>What Happens Next?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex flex-col items-center text-center">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <span className="text-xl font-bold text-blue-600">1</span>
                </div>
                <h4 className="font-semibold">Complete Joining Forms</h4>
                <p className="text-sm text-gray-600">
                  Fill out required documentation and personal information
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <span className="text-xl font-bold text-blue-600">2</span>
                </div>
                <h4 className="font-semibold">Sign Documents</h4>
                <p className="text-sm text-gray-600">
                  Review and sign NDA and other necessary documents
                </p>
              </div>
              <div className="flex flex-col items-center text-center">
                <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <span className="text-xl font-bold text-blue-600">3</span>
                </div>
                <h4 className="font-semibold">Start Your Journey</h4>
                <p className="text-sm text-gray-600">
                  Get your credentials and begin your internship
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
