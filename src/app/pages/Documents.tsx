import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { api } from '../lib/api';
import {
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  Clock,
  AlertCircle,
  Upload,
  Edit,
  Send
} from 'lucide-react';

const fallbackDocuments = [
  {
    id: 1,
    candidateName: 'Sarah Chen',
    documentType: 'NDA',
    status: 'signed',
    signedDate: '2026-05-12',
    sentDate: '2026-05-11',
    expiryDate: '2027-05-12',
  },
  {
    id: 2,
    candidateName: 'Michael Rodriguez',
    documentType: 'NDA',
    status: 'pending',
    sentDate: '2026-05-14',
    expiryDate: null,
  },
  {
    id: 3,
    candidateName: 'Emma Wilson',
    documentType: 'Confidentiality Agreement',
    status: 'signed',
    signedDate: '2026-05-10',
    sentDate: '2026-05-09',
    expiryDate: '2027-05-10',
  },
  {
    id: 4,
    candidateName: 'Alex Kumar',
    documentType: 'NDA',
    status: 'overdue',
    sentDate: '2026-05-05',
    expiryDate: null,
  },
  {
    id: 5,
    candidateName: 'Jordan Lee',
    documentType: 'IP Agreement',
    status: 'signed',
    signedDate: '2026-05-13',
    sentDate: '2026-05-12',
    expiryDate: '2027-05-13',
  },
];

const statusConfig = {
  signed: { label: 'Signed', variant: 'success' as const, icon: CheckCircle },
  pending: { label: 'Pending Signature', variant: 'warning' as const, icon: Clock },
  overdue: { label: 'Overdue', variant: 'error' as const, icon: AlertCircle },
};

export function Documents() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [documents, setDocuments] = useState(fallbackDocuments);
  const [statusMessage, setStatusMessage] = useState('Loading documents...');

  useEffect(() => {
    let isMounted = true;

    api.ndas()
      .then((data) => {
        if (!isMounted) return;
        setDocuments(data.length ? data : fallbackDocuments);
        setStatusMessage(data.length ? 'Synced with backend' : 'Backend returned no documents; showing sample data');
      })
      .catch((err) => {
        if (!isMounted) return;
        setDocuments(fallbackDocuments);
        setStatusMessage(err instanceof Error ? err.message : 'Unable to load documents');
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const visibleDocuments = documents.filter((doc) => {
    const query = searchTerm.toLowerCase();
    return [doc.candidateName, doc.documentType, doc.status]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  const signedCount = documents.filter((doc) => doc.status === 'signed').length;
  const pendingCount = documents.filter((doc) => doc.status === 'pending').length;
  const overdueCount = documents.filter((doc) => doc.status === 'overdue').length;

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">NDA & Documents</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage legal documents and e-signatures. {statusMessage}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Upload Template
          </Button>
          <Button variant="primary">
            <Send className="mr-2 h-4 w-4" />
            Send NDA
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Documents</p>
                <p className="mt-1 text-2xl font-bold">{documents.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Signed</p>
                <p className="mt-1 text-2xl font-bold text-emerald-600">{signedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="mt-1 text-2xl font-bold text-amber-600">{pendingCount}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="mt-1 text-2xl font-bold text-red-600">{overdueCount}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Documents</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search documents..."
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
                  <th className="pb-3">Candidate Name</th>
                  <th className="pb-3">Document Type</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Sent Date</th>
                  <th className="pb-3">Signed Date</th>
                  <th className="pb-3">Expiry Date</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visibleDocuments.map((doc) => {
                  const statusInfo = statusConfig[doc.status as keyof typeof statusConfig] || statusConfig.pending;
                  const StatusIcon = statusInfo.icon;

                  return (
                    <tr key={doc.id} className="text-sm">
                      <td className="py-4">
                        <p className="font-medium">{doc.candidateName}</p>
                      </td>
                      <td className="py-4">
                        <Badge variant="default">{doc.documentType}</Badge>
                      </td>
                      <td className="py-4">
                        <Badge variant={statusInfo.variant} className="gap-1">
                          <StatusIcon className="h-3 w-3" />
                          {statusInfo.label}
                        </Badge>
                      </td>
                      <td className="py-4 text-muted-foreground">{doc.sentDate}</td>
                      <td className="py-4 text-muted-foreground">
                        {doc.signedDate || '-'}
                      </td>
                      <td className="py-4 text-muted-foreground">
                        {doc.expiryDate || '-'}
                      </td>
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setShowPreview(true)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                          {doc.status === 'pending' && (
                            <Button variant="ghost" size="sm">
                              <Send className="h-4 w-4" />
                            </Button>
                          )}
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

      {showPreview && (
        <Card className="border-2 border-blue-500">
          <CardHeader className="bg-blue-50">
            <div className="flex items-center justify-between">
              <CardTitle>NDA Preview</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)}>
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-4 rounded-lg bg-white p-6 shadow-inner">
              <div className="text-center">
                <h2 className="text-2xl font-bold">NON-DISCLOSURE AGREEMENT</h2>
                <p className="mt-2 text-sm text-muted-foreground">Effective Date: May 11, 2026</p>
              </div>

              <div className="space-y-4 text-sm">
                <p>
                  This Non-Disclosure Agreement is entered into by and between <strong>[Company Name]</strong> and <strong>Sarah Chen</strong> for the purpose of protecting proprietary and confidential information.
                </p>

                <div>
                  <h3 className="font-semibold">1. Definition of Confidential Information</h3>
                  <p className="mt-1 text-muted-foreground">
                    For purposes of this Agreement, Confidential Information shall include all information or material that has or could have commercial value...
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold">2. Non-Disclosure Obligations</h3>
                  <p className="mt-1 text-muted-foreground">
                    The Receiving Party agrees to hold and maintain the Confidential Information in strictest confidence...
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold">3. Term</h3>
                  <p className="mt-1 text-muted-foreground">
                    This Agreement shall remain in effect for a period of one (1) year from the Effective Date...
                  </p>
                </div>
              </div>

              <div className="mt-8 border-t border-border pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Signature Required</p>
                    <p className="text-xs text-muted-foreground">Click below to request e-signature</p>
                  </div>
                  <Button variant="primary">
                    <Send className="mr-2 h-4 w-4" />
                    Send for Signature
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Document Templates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              'Standard NDA Template',
              'IP Assignment Agreement',
              'Confidentiality Agreement',
              'Code of Conduct',
            ].map((template, index) => (
              <div key={index} className="flex items-center justify-between rounded-lg border border-border p-3">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">{template}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm">
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Signing Activity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { name: 'Sarah Chen', action: 'Signed NDA', time: '10 minutes ago', status: 'signed' },
              { name: 'Michael Rodriguez', action: 'Opened NDA', time: '1 hour ago', status: 'viewed' },
              { name: 'Emma Wilson', action: 'Reminder sent', time: '2 hours ago', status: 'reminded' },
              { name: 'Alex Kumar', action: 'NDA sent', time: '3 hours ago', status: 'sent' },
            ].map((activity, index) => (
              <div key={index} className="flex items-start gap-3 border-b border-border pb-3 last:border-0">
                <div
                  className={`mt-1 rounded-full p-2 ${
                    activity.status === 'signed'
                      ? 'bg-emerald-100'
                      : activity.status === 'viewed'
                      ? 'bg-blue-100'
                      : activity.status === 'reminded'
                      ? 'bg-amber-100'
                      : 'bg-gray-100'
                  }`}
                >
                  <FileText
                    className={`h-4 w-4 ${
                      activity.status === 'signed'
                        ? 'text-emerald-600'
                        : activity.status === 'viewed'
                        ? 'text-blue-600'
                        : activity.status === 'reminded'
                        ? 'text-amber-600'
                        : 'text-gray-600'
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.name}</p>
                  <p className="text-xs text-muted-foreground">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
