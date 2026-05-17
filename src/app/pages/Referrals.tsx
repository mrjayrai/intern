import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { api } from '../lib/api';
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
  Trash2
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
  duplicate?: boolean;
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

const statusConfig = {
  pending_review: { label: 'Pending Review', variant: 'warning' as const, icon: Clock },
  approved: { label: 'Approved', variant: 'success' as const, icon: CheckCircle },
  ai_processing: { label: 'AI Processing', variant: 'purple' as const, icon: Sparkles },
  rejected: { label: 'Rejected', variant: 'error' as const, icon: XCircle },
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

export function Referrals() {
  const [searchTerm, setSearchTerm] = useState('');
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [statusMessage, setStatusMessage] = useState('Loading referrals...');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState<ReferralFormData>(initialReferralForm);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const updateResumeFile = (file: File | null) => {
    setFormData((current) => ({ ...current, resume: file }));
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

      await api.createReferral(payload);
      const referralsData = await api.referrals();
      applyReferrals(referralsData);
      setFormData(initialReferralForm);
      setIsCreateOpen(false);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Unable to create referral');
    } finally {
      setIsSubmitting(false);
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
        <Button variant="primary" className="gap-2" onClick={() => setIsCreateOpen(true)}>
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
                  const score = referral.aiScore ?? 0;

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
                        <div className="flex flex-wrap gap-1">
                          {(referral.skills || []).slice(0, 2).map((skill) => (
                            <Badge key={skill} variant="info" className="text-xs">
                              {skill}
                            </Badge>
                          ))}
                          {(referral.skills || []).length > 2 && (
                            <Badge variant="info" className="text-xs">
                              +{(referral.skills || []).length - 2}
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        <Badge variant={statusInfo.variant} className="gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {statusInfo.label}
                        </Badge>
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-20 overflow-hidden rounded-full bg-gray-200">
                            <div
                              className={`h-full ${
                                score >= 90
                                  ? 'bg-emerald-500'
                                  : score >= 75
                                  ? 'bg-blue-500'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${score}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">{score}%</span>
                        </div>
                      </td>
                      <td className="py-4 text-muted-foreground">{submittedDate}</td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4 text-red-600" />
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

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>New Referral</DialogTitle>
            <DialogDescription>
              Add candidate details and submit the referral to the workflow.
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-5" onSubmit={handleCreateReferral}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                  onChange={(event) => updateResumeFile(event.target.files?.[0] || null)}
                />
                <p className="text-xs text-muted-foreground">
                  Upload a PDF or DOCX resume up to 5 MB.
                </p>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="projectOverview" className="text-sm font-medium">
                  Project overview
                </label>
                <textarea
                  id="projectOverview"
                  value={formData.projectOverview}
                  onChange={(event) => updateFormField('projectOverview', event.target.value)}
                  className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="Briefly describe the internship project"
                />
              </div>
            </div>

            {formError && (
              <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {formError}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Referral'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
