import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Progress } from '../components/ui/progress';
import { Textarea } from '../components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { api, getStoredUser, type AuthUser } from '../lib/api';
import { canApproveReferral, canRejectReferral } from '../config/rbac';
import {
  Plus,
  Search,
  Filter,
  Sparkles,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Edit,
  Trash2,
  UploadCloud,
  AlertTriangle,
  Loader2,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

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
  status?: string;
  workflowStage?: string;
  submittedBy?: string;
  referrer?: string;
  submittedDate?: string;
  createdAt?: string;
  aiScore?: number;
  aiSummary?: string;
  aiRecommendation?: 'STRONG_FIT' | 'GOOD_FIT' | 'MODERATE_FIT' | 'WEAK_FIT' | 'NOT_RECOMMENDED';
  aiStrengths?: string[];
  aiWeaknesses?: string[];
  aiSkillsExtracted?: string[];
  aiProcessedAt?: string;
  duplicate?: boolean;
  education?: string;
  internshipDuration?: string;
  projectOverview?: string;
};

type ReferralFormData = {
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  skills: string;
  education: string;
  internshipDuration: string;
  projectOverview: string;
  location: string;
  resume: File | null;
};

type AiParseState = {
  confidence: number | null;
  warnings: string[];
  duplicateWarning: string;
};

const statusConfig = {
  pending_review: { label: 'Pending Review', variant: 'warning' as const, icon: Clock },
  APPROVED: { label: 'Approved', variant: 'success' as const, icon: CheckCircle },
  REJECTED: { label: 'Rejected', variant: 'error' as const, icon: XCircle },
  HR_REVIEW_PENDING: { label: 'HR Review Pending', variant: 'warning' as const, icon: Clock },
  HR_APPROVED: { label: 'HR Approved', variant: 'success' as const, icon: CheckCircle },
  HR_REJECTED: { label: 'HR Rejected', variant: 'error' as const, icon: XCircle },
  ONBOARDING_PENDING: { label: 'Onboarding Pending', variant: 'purple' as const, icon: Sparkles },
  approved: { label: 'Approved', variant: 'success' as const, icon: CheckCircle },
  ai_processing: { label: 'AI Processing', variant: 'purple' as const, icon: Sparkles },
  rejected: { label: 'Rejected', variant: 'error' as const, icon: XCircle },
};

const aiRecommendationConfig: Record<string, { label: string; variant: 'success' | 'warning' | 'error' | 'purple' }> = {
  STRONG_FIT: { label: 'Strong Fit', variant: 'success' },
  MODERATE_FIT: { label: 'Moderate Fit', variant: 'warning' },
  GOOD_FIT: { label: 'Good Fit', variant: 'purple' },
  WEAK_FIT: { label: 'Weak Fit', variant: 'error' },
  NOT_RECOMMENDED: { label: 'Not Recommended', variant: 'error' },
};

const initialReferralForm: ReferralFormData = {
  candidateName: '',
  candidateEmail: '',
  candidatePhone: '',
  skills: '',
  education: '',
  internshipDuration: '',
  projectOverview: '',
  location: '',
  resume: null,
};

const initialAiParseState: AiParseState = {
  confidence: null,
  warnings: [],
  duplicateWarning: '',
};

const formatConfidence = (value?: number | null) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return null;
  return Math.round(value <= 1 ? value * 100 : value);
};

const duplicateReasonLabels: Record<string, string> = {
  REFERRAL_EMAIL_MATCH: 'A referral already exists with this email address.',
  REFERRAL_PHONE_MATCH: 'A referral already exists with this phone number.',
  TEXT_HASH_MATCH: 'This resume appears to have been parsed before.',
};

export function Referrals() {
  const [searchTerm, setSearchTerm] = useState('');
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [statusMessage, setStatusMessage] = useState('Loading referrals...');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingReferralId, setEditingReferralId] = useState<string | null>(null);
  const [expandedSkillsReferralId, setExpandedSkillsReferralId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ReferralFormData>(initialReferralForm);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingReferralId, setDeletingReferralId] = useState<string | null>(null);
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [parsingProgress, setParsingProgress] = useState(0);
  const [aiParse, setAiParse] = useState<AiParseState>(initialAiParseState);
  const [approvingReferralId, setApprovingReferralId] = useState<string | null>(null);
  const [rejectingReferralId, setRejectingReferralId] = useState<string | null>(null);
  const [approvalTarget, setApprovalTarget] = useState<Referral | null>(null);
  const [rejectionTarget, setRejectionTarget] = useState<Referral | null>(null);
  const [approvalReason, setApprovalReason] = useState('HR approved candidate');
  const [rejectionReason, setRejectionReason] = useState('');
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    setCurrentUser(getStoredUser());
  }, []);

  const canApprove = currentUser ? canApproveReferral(currentUser.role) : false;
  const canReject = currentUser ? canRejectReferral(currentUser.role) : false;

  const applyReferrals = (data: Referral[]) => {
    setReferrals(data);
    setStatusMessage(data.length ? 'Synced with backend' : 'No referrals found');
  };

  useEffect(() => {
    let isMounted = true;

    api.referrals()
      .then((data) => {
        if (!isMounted) return;
        applyReferrals(data);
      })
      .catch((err) => {
        if (!isMounted) return;
        setReferrals([]);
        setStatusMessage(err instanceof Error ? err.message : 'Unable to load referrals');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const visibleReferrals = referrals.filter((referral) => {
    const query = searchTerm.toLowerCase();
    return [
      referral.name,
      referral.candidateName,
      referral.email,
      referral.candidateEmail,
      referral.department,
      referral.location,
      referral.submittedBy,
      referral.referrer,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  const updateFormField = (field: keyof ReferralFormData, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const getReferralId = (referral: Referral) => referral.id || referral._id || '';

  const openCandidateProfile = (referral: Referral) => {
    const referralId = getReferralId(referral);
    navigate(referralId ? `/candidates?referralId=${referralId}` : '/candidates', {
      state: { referral },
    });
  };

  const openCreateReferral = () => {
    setEditingReferralId(null);
    setFormData(initialReferralForm);
    setAiParse(initialAiParseState);
    setUploadProgress(0);
    setParsingProgress(0);
    setFormError('');
    setIsCreateOpen(true);
  };

  const openEditReferral = (referral: Referral) => {
    const referralId = getReferralId(referral);
    if (!referralId) {
      setFormError('Unable to edit referral without an ID.');
      return;
    }

    setEditingReferralId(referralId);
    setFormData({
      candidateName: referral.name || referral.candidateName || '',
      candidateEmail: referral.email || referral.candidateEmail || '',
      candidatePhone: referral.phone || referral.candidatePhone || '',
      skills: (referral.skills || []).join(', '),
      education: '',
      internshipDuration: '',
      projectOverview: '',
      location: referral.location || referral.department || '',
      resume: null,
    });
    setAiParse(initialAiParseState);
    setUploadProgress(0);
    setParsingProgress(0);
    setFormError('');
    setIsCreateOpen(true);
  };

  const updateResumeFile = async (file: File | null) => {
    setFormData((current) => ({ ...current, resume: file }));
    setFormError('');
    setAiParse(initialAiParseState);
    setUploadProgress(0);
    setParsingProgress(0);

    if (!file) return;

    const payload = new FormData();
    payload.append('resume', file);

    setIsParsingResume(true);

    try {
      const result = await api.parseResume(payload, (event) => {
        const total = event.total || file.size;
        const nextUploadProgress = total ? Math.round((event.loaded * 100) / total) : 0;
        setUploadProgress(Math.min(nextUploadProgress, 100));
        setParsingProgress(Math.min(65, Math.round(nextUploadProgress * 0.65)));
      });

      setParsingProgress(85);

      const parsed = result.parsedData || {};
      const nextFields: Partial<ReferralFormData> = {};
      const name = parsed.fullName?.value;
      const email = parsed.email?.value;
      const phone = parsed.phone?.value;
      const skills = parsed.skills?.value;

      if (name) nextFields.candidateName = name;
      if (email) nextFields.candidateEmail = email;
      if (phone) nextFields.candidatePhone = phone;
      if (skills?.length) nextFields.skills = skills.join(', ');

      setFormData((current) => ({ ...current, ...nextFields, resume: file }));

      const confidence = formatConfidence(result.confidence?.overall);
      const duplicateReason = result.duplicate?.duplicateReason || '';
      setAiParse({
        confidence,
        warnings: result.validation?.warnings || [],
        duplicateWarning: result.duplicate?.duplicate
          ? duplicateReasonLabels[duplicateReason] || 'This candidate may already exist in referrals.'
          : '',
      });
      setUploadProgress(100);
      setParsingProgress(100);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to parse resume');
      setParsingProgress(0);
    } finally {
      setIsParsingResume(false);
    }
  };

  const handleCreateReferral = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError('');

    if (!formData.candidateName.trim() || !formData.candidateEmail.trim() || !formData.candidatePhone.trim()) {
      setFormError('Candidate name, email, and phone are required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = new FormData();
      payload.append('candidateName', formData.candidateName.trim());
      payload.append('candidateEmail', formData.candidateEmail.trim());
      payload.append('candidatePhone', formData.candidatePhone.trim());
      if (formData.skills.trim()) payload.append('skills', formData.skills.trim());
      if (formData.education.trim()) payload.append('education', formData.education.trim());
      if (formData.internshipDuration.trim()) payload.append('internshipDuration', formData.internshipDuration.trim());
      if (formData.projectOverview.trim()) payload.append('projectOverview', formData.projectOverview.trim());
      if (formData.location.trim()) payload.append('location', formData.location.trim());
      if (formData.resume) payload.append('resume', formData.resume);

      if (editingReferralId) {
        await api.updateReferral(editingReferralId, payload);
      } else {
        await api.createReferral(payload);
      }
      const referralsData = await api.referrals();
      applyReferrals(referralsData);
      setFormData(initialReferralForm);
      setEditingReferralId(null);
      setAiParse(initialAiParseState);
      setUploadProgress(0);
      setParsingProgress(0);
      setIsCreateOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to create referral');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReferral = async (referral: Referral) => {
    const referralId = getReferralId(referral);
    if (!referralId) {
      setStatusMessage('Unable to delete referral without an ID');
      return;
    }

    const candidateName = referral.name || referral.candidateName || 'this referral';
    if (!window.confirm(`Delete ${candidateName}? This cannot be undone.`)) return;

    setDeletingReferralId(referralId);

    try {
      await api.deleteReferral(referralId);
      const referralsData = await api.referrals();
      applyReferrals(referralsData);
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : 'Unable to delete referral');
    } finally {
      setDeletingReferralId(null);
    }
  };

  const handleApproveReferral = async (referral: Referral) => {
    const referralId = getReferralId(referral);
    if (!referralId) {
      setStatusMessage('❌ Unable to approve referral without an ID');
      return;
    }

    const candidateName = referral.name || referral.candidateName || 'this candidate';
    if (!window.confirm(`✅ Approve ${candidateName} for internship?\n\nThis will move the candidate to the next stage of onboarding.`)) return;

    console.log('[HR Action] Approving referral:', referralId);
    setApprovingReferralId(referralId);

    try {
      await api.approveReferral(referralId, 'HR approved candidate');
      console.log('[HR Action] Referral approved successfully');

      const referralsData = await api.referrals();
      applyReferrals(referralsData);
      setStatusMessage(`✅ ${candidateName} approved successfully - workflow updated`);
    } catch (err) {
      console.error('[HR Action] Approval failed:', err);
      setStatusMessage(`❌ ${err instanceof Error ? err.message : 'Unable to approve referral'}`);
    } finally {
      setApprovingReferralId(null);
    }
  };

  const handleRejectReferral = async (referral: Referral) => {
    const referralId = getReferralId(referral);
    if (!referralId) {
      setStatusMessage('❌ Unable to reject referral without an ID');
      return;
    }

    const candidateName = referral.name || referral.candidateName || 'this candidate';
    const reason = window.prompt(`❌ Reject ${candidateName}?\n\nPlease provide a reason for rejection:`);
    if (reason === null) return; // User cancelled

    console.log('[HR Action] Rejecting referral:', referralId, 'Reason:', reason);
    setRejectingReferralId(referralId);

    try {
      await api.rejectReferral(referralId, reason || 'No reason provided');
      console.log('[HR Action] Referral rejected successfully');

      const referralsData = await api.referrals();
      applyReferrals(referralsData);
      setStatusMessage(`❌ ${candidateName} rejected - candidate notified`);
    } catch (err) {
      console.error('[HR Action] Rejection failed:', err);
      setStatusMessage(`❌ ${err instanceof Error ? err.message : 'Unable to reject referral'}`);
    } finally {
      setRejectingReferralId(null);
    }
  };

  const executeApproval = async () => {
    if (!approvalTarget) return;
    const referralId = getReferralId(approvalTarget);
    const candidateName = approvalTarget.name || approvalTarget.candidateName || 'this candidate';
    setApprovingReferralId(referralId);

    try {
      await api.approveReferral(referralId, approvalReason || 'HR approved candidate');
      const referralsData = await api.referrals();
      applyReferrals(referralsData);
      setStatusMessage(`${candidateName} approved successfully - workflow updated`);
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : 'Unable to approve referral');
    } finally {
      setApprovingReferralId(null);
      setApprovalTarget(null);
    }
  };

  const executeRejection = async () => {
    if (!rejectionTarget) return;
    const referralId = getReferralId(rejectionTarget);
    const candidateName = rejectionTarget.name || rejectionTarget.candidateName || 'this candidate';
    setRejectingReferralId(referralId);

    try {
      await api.rejectReferral(referralId, rejectionReason || 'No reason provided');
      const referralsData = await api.referrals();
      applyReferrals(referralsData);
      setStatusMessage(`${candidateName} rejected - candidate notified`);
    } catch (err) {
      setStatusMessage(err instanceof Error ? err.message : 'Unable to reject referral');
    } finally {
      setRejectingReferralId(null);
      setRejectionTarget(null);
    }
  };

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Referrals</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage candidate referrals and intake process. {statusMessage}
          </p>
        </div>
        <Button variant="primary" className="gap-2" onClick={openCreateReferral}>
          <Plus className="h-4 w-4" />
          New Referral
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Referrals</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search referrals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 pl-10"
                />
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-left text-sm font-medium text-muted-foreground">
                  <th className="pb-3">Candidate</th>
                  <th className="pb-3">Contact</th>
                  <th className="pb-3">Department</th>
                  <th className="pb-3">Skills</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">AI Score</th>
                  <th className="pb-3">Submitted</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visibleReferrals.map((referral) => {
                  const statusInfo = statusConfig[referral.status as keyof typeof statusConfig] || statusConfig.pending_review;
                  const StatusIcon = statusInfo.icon;
                  const candidateName = referral.name || referral.candidateName || 'Unknown candidate';
                  const email = referral.email || referral.candidateEmail || '-';
                  const phone = referral.phone || referral.candidatePhone || '-';
                  const submittedBy = referral.submittedBy || referral.referrer || 'Unknown';
                  const submittedDate = referral.submittedDate || referral.createdAt || '-';
                  const department = referral.department || referral.location || '-';
                  const score = referral.aiScore;
                  const hasAiScore = typeof score === 'number' && score >= 0;

                  return (
                    <tr key={referral.id || referral._id || email} className="text-sm">
                      <td className="py-4">
                        <div>
                          <p className="font-medium">{candidateName}</p>
                          <p className="text-xs text-muted-foreground">by {submittedBy}</p>
                          {referral.duplicate && (
                            <Badge variant="error" className="mt-1">
                              Duplicate
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        <div>
                          <p>{email}</p>
                          <p className="text-xs text-muted-foreground">{phone}</p>
                        </div>
                      </td>
                      <td className="py-4">
                        <Badge variant="default">{department}</Badge>
                      </td>
                      <td className="py-4">
                        <div className="flex max-w-[14rem] flex-wrap gap-1">
                          {(() => {
                            const referralId = getReferralId(referral);
                            const skills = referral.skills || [];
                            const isExpanded = expandedSkillsReferralId === referralId;
                            const visibleSkills = isExpanded ? skills : skills.slice(0, 2);

                            return (
                              <>
                                {visibleSkills.map((skill) => (
                                  <Badge key={skill} variant="info" className="max-w-full truncate text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                                {skills.length > 2 && (
                                  <button
                                    type="button"
                                    className="inline-flex h-6 items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 text-xs font-medium text-blue-700 transition-colors hover:bg-blue-100"
                                    onClick={() => setExpandedSkillsReferralId(isExpanded ? null : referralId)}
                                  >
                                    {isExpanded ? (
                                      <>
                                        Show less <ChevronUp className="h-3 w-3" />
                                      </>
                                    ) : (
                                      <>
                                        +{skills.length - 2} more <ChevronDown className="h-3 w-3" />
                                      </>
                                    )}
                                  </button>
                                )}
                                {!skills.length && (
                                  <span className="text-xs text-muted-foreground">-</span>
                                )}
                              </>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="py-4">
                        <div className="space-y-2">
                          <Badge variant={statusInfo.variant} className="gap-1">
                            <StatusIcon className="h-3 w-3" />
                            {statusInfo.label}
                          </Badge>
                          {referral.workflowStage ? (
                            <Badge variant="default" className="text-[11px] font-medium">
                              {referral.workflowStage.replace(/_/g, ' ')}
                            </Badge>
                          ) : null}
                        </div>
                      </td>
                      <td className="py-4">
                        {hasAiScore ? (
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-20 overflow-hidden rounded-full bg-gray-200">
                              <div
                                className={`h-full transition-all ${
                                  score! >= 80
                                    ? 'bg-green-500'
                                    : score! >= 60
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                                }`}
                                style={{ width: `${score}%` }}
                              />
                            </div>
                            <span
                              className={`text-xs font-semibold ${
                                score! >= 80 ? 'text-green-600' : score! >= 60 ? 'text-yellow-600' : 'text-red-600'
                              }`}
                            >
                              {score}
                            </span>
                            {referral.aiRecommendation ? (
                              <Badge variant={aiRecommendationConfig[referral.aiRecommendation]?.variant || 'outline'} className="text-[11px]">
                                {aiRecommendationConfig[referral.aiRecommendation]?.label || referral.aiRecommendation}
                              </Badge>
                            ) : null}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-purple-500 animate-pulse" />
                            <span className="text-xs text-muted-foreground">AI analysis pending</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 text-muted-foreground">{submittedDate}</td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" title="View candidate profile" onClick={() => openCandidateProfile(referral)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canApprove && canReject && referral.workflowStage === 'HR_REVIEW_PENDING' && (
                            <>
                              <Button
                                variant="primary"
                                size="sm"
                                title="Approve referral"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                disabled={approvingReferralId === getReferralId(referral)}
                                onClick={() => setApprovalTarget(referral)}
                              >
                                {approvingReferralId === getReferralId(referral) ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                title="Reject referral"
                                disabled={rejectingReferralId === getReferralId(referral)}
                                onClick={() => setRejectionTarget(referral)}
                              >
                                {rejectingReferralId === getReferralId(referral) ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <XCircle className="h-4 w-4" />
                                )}
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="sm" title="Edit referral" onClick={() => openEditReferral(referral)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            title="Delete referral"
                            disabled={deletingReferralId === getReferralId(referral)}
                            onClick={() => void handleDeleteReferral(referral)}
                          >
                            {deletingReferralId === getReferralId(referral) ? (
                              <Loader2 className="h-4 w-4 animate-spin text-red-600" />
                            ) : (
                              <Trash2 className="h-4 w-4 text-red-600" />
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {!visibleReferrals.length && (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No referrals to display.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          setIsCreateOpen(open);
          if (!open) {
            setFormError('');
            setEditingReferralId(null);
          }
        }}
      >
        <DialogContent className="grid max-h-[calc(100dvh-2rem)] grid-rows-[auto_minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:max-w-2xl">
          <DialogHeader className="px-4 pb-3 pt-5 sm:px-6">
            <DialogTitle>{editingReferralId ? 'Edit Referral' : 'New Referral'}</DialogTitle>
            <DialogDescription>
              {editingReferralId
                ? 'Update candidate details and save the referral.'
                : 'Add candidate details and submit the referral to the workflow.'}
            </DialogDescription>
          </DialogHeader>

          <form className="flex min-h-0 flex-col" onSubmit={handleCreateReferral}>
            <div className="grid min-h-0 grid-cols-1 gap-4 overflow-y-auto px-4 pb-5 sm:px-6 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="candidateName" className="text-sm font-medium">
                  Candidate name
                </label>
                <Input
                  id="candidateName"
                  value={formData.candidateName}
                  onChange={(event) => updateFormField('candidateName', event.target.value)}
                  placeholder="Full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="candidateEmail" className="text-sm font-medium">
                  Candidate email
                </label>
                <Input
                  id="candidateEmail"
                  type="email"
                  value={formData.candidateEmail}
                  onChange={(event) => updateFormField('candidateEmail', event.target.value)}
                  placeholder="candidate@company.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="candidatePhone" className="text-sm font-medium">
                  Phone
                </label>
                <Input
                  id="candidatePhone"
                  value={formData.candidatePhone}
                  onChange={(event) => updateFormField('candidatePhone', event.target.value)}
                  placeholder="+91 98765 43210"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="location" className="text-sm font-medium">
                  Location
                </label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(event) => updateFormField('location', event.target.value)}
                  placeholder="Bengaluru"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="skills" className="text-sm font-medium">
                  Skills
                </label>
                <Input
                  id="skills"
                  value={formData.skills}
                  onChange={(event) => updateFormField('skills', event.target.value)}
                  placeholder="React, TypeScript, Node.js"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="education" className="text-sm font-medium">
                  Education
                </label>
                <Input
                  id="education"
                  value={formData.education}
                  onChange={(event) => updateFormField('education', event.target.value)}
                  placeholder="B.Tech Computer Science"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="internshipDuration" className="text-sm font-medium">
                  Internship duration
                </label>
                <Input
                  id="internshipDuration"
                  value={formData.internshipDuration}
                  onChange={(event) => updateFormField('internshipDuration', event.target.value)}
                  placeholder="Jun 2026 - Aug 2026"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="resume" className="text-sm font-medium">
                  Resume
                </label>
                <Input
                  id="resume"
                  type="file"
                  accept=".pdf,.docx"
                  disabled={isParsingResume || isSubmitting}
                  onChange={(event) => void updateResumeFile(event.target.files?.[0] || null)}
                />
                <p className="text-xs text-muted-foreground">
                  Upload a PDF or DOCX resume up to 5 MB.
                </p>
              </div>
              {(isParsingResume || uploadProgress > 0 || aiParse.confidence !== null) && (
                <div className="space-y-3 rounded-md border border-border bg-muted/30 p-4 md:col-span-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      {isParsingResume ? (
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      ) : (
                        <UploadCloud className="h-4 w-4 text-primary" />
                      )}
                      AI resume parsing
                    </div>
                    {aiParse.confidence !== null && (
                      <Badge variant="info">Confidence {aiParse.confidence}%</Badge>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Upload progress</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Parsing progress</span>
                      <span>{parsingProgress}%</span>
                    </div>
                    <Progress value={parsingProgress} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Parsed fields are autofilled below and can be edited before submission.
                  </p>
                </div>
              )}
              {aiParse.duplicateWarning && (
                <Alert className="border-amber-200 bg-amber-50 text-amber-900 md:col-span-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Possible duplicate</AlertTitle>
                  <AlertDescription>{aiParse.duplicateWarning}</AlertDescription>
                </Alert>
              )}
              {aiParse.warnings.length > 0 && (
                <Alert className="md:col-span-2">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>AI parsing warnings</AlertTitle>
                  <AlertDescription>
                    {aiParse.warnings.map((warning) => (
                      <p key={warning}>{warning}</p>
                    ))}
                  </AlertDescription>
                </Alert>
              )}
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="projectOverview" className="text-sm font-medium">
                  Project overview
                </label>
                <Textarea
                  id="projectOverview"
                  value={formData.projectOverview}
                  onChange={(event) => updateFormField('projectOverview', event.target.value)}
                  className="min-h-24"
                  placeholder="Briefly describe the internship project"
                />
              </div>
            </div>

            {formError && (
              <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {formError}
              </div>
            )}

            <DialogFooter className="border-t border-border bg-background px-4 py-3 sm:px-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting || isParsingResume}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting
                  ? editingReferralId
                    ? 'Saving...'
                    : 'Submitting...'
                  : isParsingResume
                  ? 'Parsing resume...'
                  : editingReferralId
                  ? 'Save Changes'
                  : 'Submit Referral'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(approvalTarget)} onOpenChange={(open) => !open && setApprovalTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve referral</DialogTitle>
            <DialogDescription>Approve this referral and initiate onboarding?</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Approval note</label>
            <Textarea value={approvalReason} onChange={(e) => setApprovalReason(e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApprovalTarget(null)} disabled={approvingReferralId === getReferralId(approvalTarget || {})}>
              Cancel
            </Button>
            <Button onClick={() => void executeApproval()} disabled={approvingReferralId === getReferralId(approvalTarget || {})}>
              {approvingReferralId === getReferralId(approvalTarget || {}) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(rejectionTarget)} onOpenChange={(open) => !open && setRejectionTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject referral</DialogTitle>
            <DialogDescription>Reject this referral?</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">Rejection reason</label>
            <Textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows={3} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectionTarget(null)} disabled={rejectingReferralId === getReferralId(rejectionTarget || {})}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => void executeRejection()} disabled={rejectingReferralId === getReferralId(rejectionTarget || {})}>
              {rejectingReferralId === getReferralId(rejectionTarget || {}) ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
