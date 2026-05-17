import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { api } from '../lib/api';
import {
  Plus,
  Search,
  Filter,
  Upload,
  Sparkles,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';

const fallbackReferrals = [
  {
    id: 1,
    name: 'Sarah Chen',
    email: 'sarah.chen@email.com',
    phone: '+1 (555) 123-4567',
    department: 'Engineering',
    skills: ['React', 'TypeScript', 'Node.js'],
    status: 'pending_review',
    submittedBy: 'John Manager',
    submittedDate: '2026-05-15',
    aiScore: 95,
    duplicate: false,
  },
  {
    id: 2,
    name: 'Michael Rodriguez',
    email: 'michael.r@email.com',
    phone: '+1 (555) 234-5678',
    department: 'Design',
    skills: ['Figma', 'UI/UX', 'Prototyping'],
    status: 'approved',
    submittedBy: 'Lisa Designer',
    submittedDate: '2026-05-14',
    aiScore: 88,
    duplicate: false,
  },
  {
    id: 3,
    name: 'Emma Wilson',
    email: 'emma.w@email.com',
    phone: '+1 (555) 345-6789',
    department: 'Marketing',
    skills: ['Content', 'SEO', 'Analytics'],
    status: 'ai_processing',
    submittedBy: 'Tom Marketing',
    submittedDate: '2026-05-16',
    aiScore: 92,
    duplicate: false,
  },
  {
    id: 4,
    name: 'Alex Kumar',
    email: 'alex.k@email.com',
    phone: '+1 (555) 456-7890',
    department: 'Engineering',
    skills: ['Python', 'Machine Learning', 'Data Science'],
    status: 'rejected',
    submittedBy: 'Sarah Chen',
    submittedDate: '2026-05-13',
    aiScore: 72,
    duplicate: true,
  },
];

const statusConfig = {
  pending_review: { label: 'Pending Review', variant: 'warning' as const, icon: Clock },
  approved: { label: 'Approved', variant: 'success' as const, icon: CheckCircle },
  ai_processing: { label: 'AI Processing', variant: 'purple' as const, icon: Sparkles },
  rejected: { label: 'Rejected', variant: 'error' as const, icon: XCircle },
};

export function Referrals() {
  const [searchTerm, setSearchTerm] = useState('');
  const [referrals, setReferrals] = useState(fallbackReferrals);
  const [statusMessage, setStatusMessage] = useState('Loading referrals...');

  useEffect(() => {
    let isMounted = true;

    api.referrals()
      .then((data) => {
        if (!isMounted) return;
        setReferrals(data.length ? data : fallbackReferrals);
        setStatusMessage(data.length ? 'Synced with backend' : 'Backend returned no referrals; showing sample data');
      })
      .catch((err) => {
        if (!isMounted) return;
        setReferrals(fallbackReferrals);
        setStatusMessage(err instanceof Error ? err.message : 'Unable to load referrals');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const visibleReferrals = referrals.filter((referral) => {
    const query = searchTerm.toLowerCase();
    return [referral.name, referral.email, referral.department, referral.submittedBy]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Referrals</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage candidate referrals and intake process. {statusMessage}
          </p>
        </div>
        <Button variant="primary" className="gap-2">
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

                  return (
                    <tr key={referral.id} className="text-sm">
                      <td className="py-4">
                        <div>
                          <p className="font-medium">{referral.name}</p>
                          <p className="text-xs text-muted-foreground">by {referral.submittedBy}</p>
                          {referral.duplicate && (
                            <Badge variant="error" className="mt-1">
                              Duplicate
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="py-4">
                        <div>
                          <p>{referral.email}</p>
                          <p className="text-xs text-muted-foreground">{referral.phone}</p>
                        </div>
                      </td>
                      <td className="py-4">
                        <Badge variant="default">{referral.department}</Badge>
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
                                referral.aiScore >= 90
                                  ? 'bg-emerald-500'
                                  : referral.aiScore >= 75
                                  ? 'bg-blue-500'
                                  : 'bg-amber-500'
                              }`}
                              style={{ width: `${referral.aiScore}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">{referral.aiScore}%</span>
                        </div>
                      </td>
                      <td className="py-4 text-muted-foreground">{referral.submittedDate}</td>
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
          </div>
        </CardContent>
      </Card>

      <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-purple-900">AI-Powered Referral Processing</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg bg-white p-4 shadow-sm">
              <Upload className="mt-0.5 h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium">Automatic Resume Parsing</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Upload resumes and let AI extract candidate information, skills, and experience
                  automatically with 98% accuracy.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-white p-4 shadow-sm">
              <CheckCircle className="mt-0.5 h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium">Duplicate Detection</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Automatically identifies duplicate candidates across name variations and email
                  addresses to prevent redundant processing.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-white p-4 shadow-sm">
              <Sparkles className="mt-0.5 h-5 w-5 text-purple-600" />
              <div>
                <p className="font-medium">Candidate Matching Score</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  AI analyzes candidate profiles against role requirements and provides a matching
                  score with confidence indicators.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
