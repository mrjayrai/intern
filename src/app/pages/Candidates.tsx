import { useEffect, useState } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { api } from '../lib/api';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  FileText,
  Calendar,
  CheckCircle,
  Clock,
  Sparkles,
  XCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react';

type ApplicationStage = {
  key: string;
  label: string;
  status: 'completed' | 'in_progress' | 'pending' | 'failed';
  date?: string;
};

type Referral = {
  id?: string;
  _id?: string;
  name?: string;
  candidateName?: string;
  email?: string;
  candidateEmail?: string;
  phone?: string;
  candidatePhone?: string;
  department?: string;
  location?: string;
  skills?: string[];
  education?: string | any[];
  internshipDuration?: string;
  projectOverview?: string;
  status?: string;
  workflowStage?: string;
  createdAt?: string;
  submittedDate?: string;
  aiScore?: number;
  aiSummary?: string;
  aiRecommendation?: string;
  aiStrengths?: string[];
  aiWeaknesses?: string[];
  aiSkillsExtracted?: string[];
  aiProcessedAt?: string;
  resume?: string;
};

// Business-accurate application lifecycle stages
const APPLICATION_STAGES = [
  { key: 'APPLICATION_RECEIVED', label: 'Application Received' },
  { key: 'AI_RESUME_ANALYSIS', label: 'AI Resume Analysis' },
  { key: 'HR_SCREENING', label: 'HR Screening' },
  { key: 'APPROVED_BY_HR', label: 'Approved by HR' },
  { key: 'DOCUMENTATION_JOINING', label: 'Documentation & Joining' },
  { key: 'OFFER_ONBOARDING', label: 'Offer / Onboarding' },
  { key: 'ACTIVE_INTERNSHIP', label: 'Active Internship' },
];

// Centralized workflow stage to timeline stage mapping
const WORKFLOW_STAGE_MAP: { [key: string]: number } = {
  REFERRED: 0,
  AI_PROCESSING: 1,
  HR_REVIEW_PENDING: 2,
  HR_REVIEW: 2,
  APPROVED: 3,
  HR_APPROVED: 3,
  ONBOARDING_PENDING: 3,
  ONBOARDING_INVITED: 3,
  JOINING_FORM_PENDING: 4,
  NDA_PENDING: 4,
  NON_WORKER_ID_PENDING: 4,
  ACCESS_PROVISIONING: 4,
  READY_TO_START: 5,
  ACTIVE: 6,
  COMPLETED: 6,
  EXTENSION_REQUESTED: 6,
  CERTIFICATE_PENDING: 6,
  CERTIFICATE_ISSUED: 6,
  CERTIFICATE_GENERATED: 6,
  CLOSED: 6,
};

// Normalize status strings to consistent format
function normalizeStatus(status: string | undefined): string {
  if (!status) return '';
  return status.toUpperCase().replace(/[-_\s]/g, '_');
}

// Determine current application stage based on backend workflow
function getApplicationStage(referral: Referral): {
  currentStageIndex: number;
  isFailed: boolean;
  currentStageName: string;
} {
  if (!referral) {
    console.log('[Workflow Stage] No referral data, defaulting to stage 0');
    return { currentStageIndex: 0, isFailed: false, currentStageName: 'APPLICATION_RECEIVED' };
  }

  const status = normalizeStatus(referral.status);
  const workflowStage = normalizeStatus(referral.workflowStage);

  console.log('[Workflow Stage] Raw data:', {
    status: referral.status,
    workflowStage: referral.workflowStage,
    aiProcessedAt: referral.aiProcessedAt,
  });
  console.log('[Workflow Stage] Normalized:', { status, workflowStage });

  // Check for rejection/decline first
  if (status === 'REJECTED' || status === 'DECLINED' || workflowStage === 'HR_REJECTED') {
    // Determine at which stage rejection occurred
    let stageIndex = 0;

    if (workflowStage === 'HR_REJECTED' || workflowStage === 'HR_REVIEW' || workflowStage === 'HR_REVIEW_PENDING') {
      stageIndex = 2; // Rejected during HR screening
    } else if (referral.aiProcessedAt) {
      stageIndex = 1; // Rejected after AI analysis
    } else {
      stageIndex = 0; // Rejected at application stage
    }

    console.log('[Workflow Stage] REJECTED at stage', stageIndex, ':', APPLICATION_STAGES[stageIndex].label);
    return {
      currentStageIndex: stageIndex,
      isFailed: true,
      currentStageName: APPLICATION_STAGES[stageIndex].key
    };
  }

  // Handle missing workflowStage gracefully
  if (!workflowStage) {
    console.log('[Workflow Stage] Missing workflowStage, checking AI status');
    // Fallback: check if AI has processed
    if (referral.aiProcessedAt) {
      console.log('[Workflow Stage] AI processed, defaulting to HR_SCREENING stage');
      return { currentStageIndex: 2, isFailed: false, currentStageName: 'HR_SCREENING' };
    }
    console.log('[Workflow Stage] No AI processing, defaulting to APPLICATION_RECEIVED');
    return { currentStageIndex: 0, isFailed: false, currentStageName: 'APPLICATION_RECEIVED' };
  }

  // Use centralized mapping
  const stageIndex = WORKFLOW_STAGE_MAP[workflowStage];

  if (stageIndex !== undefined) {
    console.log('[Workflow Stage] Mapped', workflowStage, '→ Stage', stageIndex, ':', APPLICATION_STAGES[stageIndex].label);
    console.log('[Timeline Stage] Current stage index:', stageIndex);
    console.log('[Resolved Stage Index]', stageIndex, '-', APPLICATION_STAGES[stageIndex].label);

    return {
      currentStageIndex: stageIndex,
      isFailed: false,
      currentStageName: APPLICATION_STAGES[stageIndex].key,
    };
  }

  // Fallback for unmapped stages
  console.warn('[Workflow Stage] Unknown workflowStage:', workflowStage, '- defaulting to stage 0');
  return { currentStageIndex: 0, isFailed: false, currentStageName: 'APPLICATION_RECEIVED' };
}

function buildApplicationTimeline(referral: Referral | null): ApplicationStage[] {
  if (!referral) {
    console.log('[Application Timeline] No referral, showing initial state');
    return APPLICATION_STAGES.map((stage, index) => ({
      ...stage,
      status: index === 0 ? 'in_progress' : 'pending',
      date: index === 0 ? new Date().toISOString() : undefined,
    }));
  }

  const { currentStageIndex, isFailed } = getApplicationStage(referral);

  console.log('[Application Timeline] Building timeline:', {
    currentStageIndex,
    isFailed,
    currentStage: APPLICATION_STAGES[currentStageIndex].label,
  });

  return APPLICATION_STAGES.map((stage, index) => {
    let status: 'completed' | 'in_progress' | 'pending' | 'failed' = 'pending';
    let date: string | undefined;

    // Handle rejection at current stage
    if (isFailed && index === currentStageIndex) {
      status = 'failed';
      date = 'Rejected';
      console.log('[Application Timeline] Stage', index, '- FAILED:', stage.label);
    }
    // All stages before current stage are completed
    else if (index < currentStageIndex) {
      status = 'completed';

      // Add timestamps for stages where we have data
      if (index === 0 && referral.createdAt) {
        date = referral.createdAt;
      } else if (index === 1 && referral.aiProcessedAt) {
        date = referral.aiProcessedAt;
      }

      console.log('[Application Timeline] Stage', index, '- COMPLETED:', stage.label);
    }
    // Current active stage (not failed)
    else if (index === currentStageIndex && !isFailed) {
      status = 'in_progress';
      date = 'Current';
      console.log('[Application Timeline] Stage', index, '- IN_PROGRESS:', stage.label);
    }
    // All future stages remain pending
    else {
      status = 'pending';
      console.log('[Application Timeline] Stage', index, '- PENDING:', stage.label);
    }

    return {
      ...stage,
      status,
      date,
    };
  });
}

function parseEducation(education: any): Array<{ degree: string; school: string; year: string; gpa?: string }> {
  console.log('[Candidates] Parsing education:', education);

  if (!education) return [];

  // If it's already an array
  if (Array.isArray(education)) {
    return education.map((edu) => ({
      degree: edu.degree || edu.qualification || edu.field || 'Unknown Degree',
      school: edu.school || edu.institution || edu.institute || 'Unknown Institution',
      year: edu.year || `${edu.startDate || ''} - ${edu.endDate || ''}`.trim() || 'N/A',
      gpa: edu.gpa || edu.grade || edu.marks,
    }));
  }

  // If it's a string, try to parse it
  if (typeof education === 'string') {
    try {
      const parsed = JSON.parse(education);
      if (Array.isArray(parsed)) {
        return parseEducation(parsed);
      }
    } catch (e) {
      // Not JSON, treat as single entry
      return [
        {
          degree: education,
          school: 'As per resume',
          year: 'N/A',
        },
      ];
    }
  }

  return [];
}

function parseExperience(experience: any): Array<{ title: string; company: string; period: string; description?: string }> {
  console.log('[Candidates] Parsing experience:', experience);

  if (!experience) return [];

  // If it's already an array
  if (Array.isArray(experience)) {
    return experience.map((exp) => ({
      title: exp.title || exp.role || exp.position || 'Unknown Position',
      company: exp.company || exp.organization || exp.employer || 'Unknown Company',
      period: exp.period || `${exp.startDate || ''} - ${exp.endDate || ''}`.trim() || 'N/A',
      description: exp.description || exp.responsibilities || exp.details,
    }));
  }

  // If it's a string, try to parse it
  if (typeof experience === 'string') {
    try {
      const parsed = JSON.parse(experience);
      if (Array.isArray(parsed)) {
        return parseExperience(parsed);
      }
    } catch (e) {
      // Not JSON
      console.log('[Candidates] Could not parse experience string');
    }
  }

  return [];
}

export function Candidates() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [referral, setReferral] = useState<Referral | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReferral = async () => {
      try {
        // Try to get referral from router state first
        const stateReferral = (location.state as any)?.referral;

        if (stateReferral) {
          console.log('[Candidates] Loaded referral from router state:', stateReferral);
          setReferral(stateReferral);
          setLoading(false);
          return;
        }

        // Try to get referral ID from query params
        const referralId = searchParams.get('referralId');
        if (referralId) {
          console.log('[Candidates] Fetching referral by ID:', referralId);
          const response = await api.referrals();
          const found = response.find((r: any) => r._id === referralId || r.id === referralId);

          if (found) {
            console.log('[Candidates] Found referral:', found);
            setReferral(found);
          } else {
            setError('Referral not found');
          }
        } else {
          setError('No referral specified');
        }
      } catch (err) {
        console.error('[Candidates] Failed to load referral:', err);
        setError(err instanceof Error ? err.message : 'Failed to load candidate data');
      } finally {
        setLoading(false);
      }
    };

    loadReferral();
  }, [location, searchParams]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-600" />
          <p className="mt-4 text-sm text-muted-foreground">Loading candidate data...</p>
        </div>
      </div>
    );
  }

  if (error || !referral) {
    return (
      <div className="flex min-h-screen items-center justify-center p-8">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="mx-auto h-12 w-12 text-yellow-600" />
              <h2 className="mt-4 text-xl font-semibold">No Candidate Data</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {error || 'Please select a candidate from the referrals page.'}
              </p>
              <Button className="mt-4" onClick={() => window.history.back()}>
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const candidateName = referral.name || referral.candidateName || 'Unknown Candidate';
  const candidateEmail = referral.email || referral.candidateEmail || 'No email provided';
  const candidatePhone = referral.phone || referral.candidatePhone || 'No phone provided';
  const candidateLocation = referral.location || 'Not specified';
  const candidateDepartment = referral.department || referral.location || 'General';
  const skills = referral.aiSkillsExtracted?.length
    ? referral.aiSkillsExtracted
    : referral.skills?.length
    ? referral.skills
    : [];

  const education = parseEducation(referral.education);
  const experience = parseExperience(null); // TODO: Add experience field to referral model

  const timeline = buildApplicationTimeline(referral);

  console.log('[Candidates] Timeline generated:', timeline);

  const aiScore = referral.aiScore ?? null;
  const aiSummary = referral.aiSummary || referral.projectOverview || 'No AI summary available';
  const aiRecommendation = referral.aiRecommendation;

  const initials = candidateName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const getRecommendationBadge = () => {
    if (!aiRecommendation) return null;

    const config: Record<string, { label: string; variant: any }> = {
      STRONG_FIT: { label: 'Strong Fit', variant: 'success' },
      GOOD_FIT: { label: 'Good Fit', variant: 'info' },
      MODERATE_FIT: { label: 'Moderate Fit', variant: 'warning' },
      WEAK_FIT: { label: 'Weak Fit', variant: 'error' },
      NOT_RECOMMENDED: { label: 'Not Recommended', variant: 'error' },
    };

    const rec = config[aiRecommendation] || { label: aiRecommendation, variant: 'default' };
    return <Badge variant={rec.variant}>{rec.label}</Badge>;
  };

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Candidate Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Detailed candidate information and application status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.history.back()}>
            Back to Referrals
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Content - Left Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Candidate Information */}
          <Card>
            <CardHeader>
              <CardTitle>Candidate Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700">
                  {initials}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">{candidateName}</h2>
                  <p className="text-muted-foreground">{candidateDepartment} Intern</p>
                  {aiRecommendation && (
                    <div className="mt-2">{getRecommendationBadge()}</div>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {skills.length > 0 ? (
                      skills.map((skill) => (
                        <Badge key={skill} variant="info">
                          {skill}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No skills extracted</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{candidateEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="font-medium">{candidatePhone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="font-medium">{candidateLocation}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Briefcase className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Department</p>
                    <p className="font-medium">{candidateDepartment}</p>
                  </div>
                </div>
                {referral.internshipDuration && (
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="font-medium">{referral.internshipDuration}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Applied On</p>
                    <p className="font-medium">
                      {referral.createdAt
                        ? new Date(referral.createdAt).toLocaleDateString()
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Education Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Education
              </CardTitle>
            </CardHeader>
            <CardContent>
              {education.length > 0 ? (
                <div className="space-y-4">
                  {education.map((edu, index) => (
                    <div key={index} className="border-l-2 border-blue-500 pl-4">
                      <h4 className="font-semibold">{edu.degree}</h4>
                      <p className="text-sm text-muted-foreground">{edu.school}</p>
                      <div className="mt-1 flex gap-3 text-sm text-muted-foreground">
                        <span>{edu.year}</span>
                        {edu.gpa && <span>• GPA: {edu.gpa}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
                  <GraduationCap className="mx-auto h-10 w-10 text-gray-400" />
                  <p className="mt-2 text-sm font-medium text-gray-600">No education data available</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Education details will appear here once resume is processed
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Experience Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Experience
              </CardTitle>
            </CardHeader>
            <CardContent>
              {experience.length > 0 ? (
                <div className="space-y-4">
                  {experience.map((exp, index) => (
                    <div key={index} className="border-l-2 border-blue-500 pl-4">
                      <h4 className="font-semibold">{exp.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {exp.company} • {exp.period}
                      </p>
                      {exp.description && <p className="mt-1 text-sm">{exp.description}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
                  <Briefcase className="mx-auto h-10 w-10 text-gray-400" />
                  <p className="mt-2 text-sm font-medium text-gray-600">No experience data available</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Work experience details will appear here once resume is processed
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Strengths and Weaknesses */}
          {(referral.aiStrengths?.length || referral.aiWeaknesses?.length) && (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {referral.aiStrengths && referral.aiStrengths.length > 0 && (
                <Card className="border-green-200 bg-green-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-900">
                      <CheckCircle className="h-5 w-5" />
                      Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {referral.aiStrengths.map((strength, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-green-800">
                          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green-600" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {referral.aiWeaknesses && referral.aiWeaknesses.length > 0 && (
                <Card className="border-orange-200 bg-orange-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-orange-900">
                      <AlertCircle className="h-5 w-5" />
                      Areas for Development
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {referral.aiWeaknesses.map((weakness, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-orange-800">
                          <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-orange-600" />
                          {weakness}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        {/* Sidebar - Right Column */}
        <div className="space-y-6">
          {/* AI Score Card */}
          {aiScore !== null && (
            <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <CardTitle className="text-purple-900">AI Evaluation</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-purple-900">{aiSummary}</p>
                <div className="mt-4 rounded-lg bg-white p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Match Score</span>
                    <span className="text-lg font-bold text-purple-600">{aiScore}/100</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-purple-200">
                    <div
                      className={`h-full transition-all ${
                        aiScore >= 80
                          ? 'bg-green-500'
                          : aiScore >= 50
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${aiScore}%` }}
                    />
                  </div>
                </div>
                {referral.aiProcessedAt && (
                  <p className="mt-3 text-xs text-purple-700">
                    Analyzed on {new Date(referral.aiProcessedAt).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Application Flow Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Application Flow</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {timeline.map((stage, index) => (
                  <div key={stage.key} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          stage.status === 'completed'
                            ? 'bg-emerald-100'
                            : stage.status === 'in_progress'
                            ? 'bg-blue-100'
                            : stage.status === 'failed'
                            ? 'bg-red-100'
                            : 'bg-gray-100'
                        }`}
                      >
                        {stage.status === 'completed' && (
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                        )}
                        {stage.status === 'in_progress' && (
                          <Clock className="h-4 w-4 text-blue-600 animate-pulse" />
                        )}
                        {stage.status === 'failed' && (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                        {stage.status === 'pending' && (
                          <div className="h-2 w-2 rounded-full bg-gray-400" />
                        )}
                      </div>
                      {index < timeline.length - 1 && (
                        <div
                          className={`mt-1 h-8 w-0.5 ${
                            stage.status === 'completed'
                              ? 'bg-emerald-300'
                              : stage.status === 'failed'
                              ? 'bg-red-300'
                              : 'bg-gray-300'
                          }`}
                        />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p
                        className={`font-medium ${
                          stage.status === 'in_progress'
                            ? 'text-blue-600'
                            : stage.status === 'failed'
                            ? 'text-red-600'
                            : ''
                        }`}
                      >
                        {stage.label}
                      </p>
                      {stage.date && (
                        <p className="text-xs text-muted-foreground">
                          {stage.date === 'Current'
                            ? 'Current Stage'
                            : stage.date === 'Rejected'
                            ? 'Application Rejected'
                            : new Date(stage.date).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Current Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Application Stage</span>
                <Badge variant="info">
                  {timeline.find(s => s.status === 'in_progress' || s.status === 'failed')?.label || 'Unknown'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Status</span>
                <Badge
                  variant={
                    normalizeStatus(referral.status) === 'APPROVED' || normalizeStatus(referral.status).includes('APPROVED')
                      ? 'success'
                      : normalizeStatus(referral.status) === 'REJECTED' || normalizeStatus(referral.status) === 'DECLINED'
                      ? 'error'
                      : 'warning'
                  }
                >
                  {referral.status || 'Pending Review'}
                </Badge>
              </div>
              {referral.aiScore !== null && referral.aiScore !== undefined && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">AI Match Score</span>
                  <Badge variant={referral.aiScore >= 70 ? 'success' : referral.aiScore >= 50 ? 'warning' : 'error'}>
                    {referral.aiScore}/100
                  </Badge>
                </div>
              )}
              {referral.resume && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Resume</span>
                  <Badge variant="success">
                    <FileText className="mr-1 h-3 w-3" />
                    Uploaded
                  </Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
