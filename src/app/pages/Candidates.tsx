import { useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  GraduationCap,
  FileText,
  Award,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Sparkles
} from 'lucide-react';

type ReferralCandidateState = {
  referral?: {
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
    education?: string;
    internshipDuration?: string;
    projectOverview?: string;
    status?: string;
    workflowStage?: string;
    createdAt?: string;
    submittedDate?: string;
    aiScore?: number;
  };
};

export function Candidates() {
  const location = useLocation();
  const referral = (location.state as ReferralCandidateState | null)?.referral;
  const fallbackCandidate = {
    name: 'Sarah Chen',
    email: 'sarah.chen@email.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
    department: 'Engineering',
    position: 'Software Engineering Intern',
    startDate: '2026-06-01',
    endDate: '2026-08-31',
    mentor: 'John Doe',
    skills: ['React', 'TypeScript', 'Node.js', 'Python', 'GraphQL', 'AWS'],
    education: [
      {
        degree: 'BS Computer Science',
        school: 'Stanford University',
        year: '2024-2028',
        gpa: '3.9',
      },
    ],
    experience: [
      {
        title: 'Software Development Intern',
        company: 'Tech Startup Inc',
        period: 'Summer 2025',
        description: 'Built full-stack web applications using React and Node.js',
      },
    ],
    documents: [
      { name: 'Resume.pdf', uploaded: '2026-05-10', status: 'verified' },
      { name: 'Transcript.pdf', uploaded: '2026-05-10', status: 'verified' },
      { name: 'NDA-Signed.pdf', uploaded: '2026-05-12', status: 'verified' },
      { name: 'Government-ID.pdf', uploaded: '2026-05-11', status: 'pending' },
    ],
    timeline: [
      { stage: 'Referral Submitted', date: '2026-05-10', status: 'completed' },
      { stage: 'AI Screening', date: '2026-05-10', status: 'completed' },
      { stage: 'Manager Review', date: '2026-05-11', status: 'completed' },
      { stage: 'NDA Signed', date: '2026-05-12', status: 'completed' },
      { stage: 'ID Creation', date: '2026-05-14', status: 'in_progress' },
      { stage: 'Access Provisioning', date: 'Pending', status: 'pending' },
      { stage: 'Onboarding Complete', date: 'Pending', status: 'pending' },
    ],
    aiSummary: 'Strong technical background with relevant internship experience. Excellent academic performance and demonstrated proficiency in required tech stack. High match for Software Engineering internship role (95% confidence).',
    riskFlags: [],
  };
  const candidate = referral
    ? {
        ...fallbackCandidate,
        name: referral.name || referral.candidateName || 'Unknown candidate',
        email: referral.email || referral.candidateEmail || '-',
        phone: referral.phone || referral.candidatePhone || '-',
        location: referral.location || '-',
        department: referral.department || referral.location || '-',
        skills: referral.skills?.length ? referral.skills : [],
        education: referral.education
          ? [
              {
                degree: referral.education,
                school: 'From referral profile',
                year: '-',
                gpa: '-',
              },
            ]
          : [],
        startDate: referral.createdAt || referral.submittedDate || '-',
        endDate: referral.internshipDuration || '-',
        aiSummary:
          referral.projectOverview ||
          `Referral profile for ${referral.name || referral.candidateName || 'this candidate'} is available from the referral workflow.`,
        timeline: [
          {
            stage: 'Referral Submitted',
            date: referral.submittedDate || referral.createdAt || '-',
            status: 'completed',
          },
          {
            stage: referral.workflowStage || referral.status || 'Review',
            date: 'Current',
            status: 'in_progress',
          },
        ],
        documents: [],
        riskFlags: [],
        matchScore: referral.aiScore ?? 0,
      }
    : { ...fallbackCandidate, matchScore: 95 };
  const initials = candidate.name
    .split(' ')
    .map((name) => name[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Candidate Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Detailed candidate information and status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">Export PDF</Button>
          <Button variant="primary">Edit Profile</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Candidate Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700">
                  {initials || 'CN'}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold">{candidate.name}</h2>
                  <p className="text-muted-foreground">{candidate.position}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {candidate.skills.map((skill) => (
                      <Badge key={skill} variant="info">
                        {skill}
                      </Badge>
                    ))}
                    {!candidate.skills.length && (
                      <span className="text-sm text-muted-foreground">No skills listed</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="font-medium">{candidate.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="font-medium">{candidate.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Location</p>
                    <p className="font-medium">{candidate.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Briefcase className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Department</p>
                    <p className="font-medium">{candidate.department}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Start Date</p>
                    <p className="font-medium">{candidate.startDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Mentor</p>
                    <p className="font-medium">{candidate.mentor}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                Education
              </CardTitle>
            </CardHeader>
            <CardContent>
              {candidate.education.length ? candidate.education.map((edu, index) => (
                <div key={index} className="border-l-2 border-blue-500 pl-4">
                  <h4 className="font-semibold">{edu.degree}</h4>
                  <p className="text-sm text-muted-foreground">{edu.school}</p>
                  <p className="text-sm text-muted-foreground">
                    {edu.year} • GPA: {edu.gpa}
                  </p>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground">No education details available.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Experience
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {candidate.experience.map((exp, index) => (
                <div key={index} className="border-l-2 border-blue-500 pl-4">
                  <h4 className="font-semibold">{exp.title}</h4>
                  <p className="text-sm text-muted-foreground">
                    {exp.company} • {exp.period}
                  </p>
                  <p className="mt-1 text-sm">{exp.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {candidate.documents.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-xs text-muted-foreground">Uploaded {doc.uploaded}</p>
                      </div>
                    </div>
                    {doc.status === 'verified' ? (
                      <Badge variant="success">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Verified
                      </Badge>
                    ) : (
                      <Badge variant="warning">
                        <Clock className="mr-1 h-3 w-3" />
                        Pending
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <CardTitle className="text-purple-900">AI Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-purple-900">{candidate.aiSummary}</p>
              <div className="mt-4 rounded-lg bg-white p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Match Score</span>
                  <span className="text-lg font-bold text-purple-600">{candidate.matchScore}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-purple-200">
                  <div className="h-full bg-purple-600" style={{ width: `${candidate.matchScore}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Internship Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {candidate.timeline.map((item, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          item.status === 'completed'
                            ? 'bg-emerald-100'
                            : item.status === 'in_progress'
                            ? 'bg-blue-100'
                            : 'bg-gray-100'
                        }`}
                      >
                        {item.status === 'completed' && (
                          <CheckCircle className="h-4 w-4 text-emerald-600" />
                        )}
                        {item.status === 'in_progress' && (
                          <Clock className="h-4 w-4 text-blue-600" />
                        )}
                        {item.status === 'pending' && (
                          <div className="h-2 w-2 rounded-full bg-gray-400" />
                        )}
                      </div>
                      {index < candidate.timeline.length - 1 && (
                        <div
                          className={`h-full w-0.5 ${
                            item.status === 'completed' ? 'bg-emerald-300' : 'bg-gray-300'
                          }`}
                        />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="font-medium">{item.stage}</p>
                      <p className="text-xs text-muted-foreground">{item.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Compliance Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Background Check</span>
                <Badge variant="success">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Complete
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">NDA Signed</span>
                <Badge variant="success">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Complete
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Unpaid Consent</span>
                <Badge variant="success">
                  <CheckCircle className="mr-1 h-3 w-3" />
                  Confirmed
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Eligibility Verified</span>
                <Badge variant="warning">
                  <Clock className="mr-1 h-3 w-3" />
                  In Progress
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
