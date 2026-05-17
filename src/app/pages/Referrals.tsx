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

const statusConfig = {
  pending_review: { label: 'Pending Review', variant: 'warning' as const, icon: Clock },
  approved: { label: 'Approved', variant: 'success' as const, icon: CheckCircle },
  ai_processing: { label: 'AI Processing', variant: 'purple' as const, icon: Sparkles },
  rejected: { label: 'Rejected', variant: 'error' as const, icon: XCircle },
};

export function Referrals() {
  const [searchTerm, setSearchTerm] = useState('');
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [statusMessage, setStatusMessage] = useState('Loading referrals...');

  useEffect(() => {
    let isMounted = true;

    api.referrals()
      .then((data) => {
        if (!isMounted) return;
        setReferrals(data);
        setStatusMessage(data.length ? 'Synced with backend' : 'No referrals found');
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
    </div>
  );
}
