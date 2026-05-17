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

type DocumentRecord = {
  id?: string;
  _id?: string;
  candidateName?: string;
  documentType?: string;
  status?: string;
  signedDate?: string | null;
  sentDate?: string | null;
  expiryDate?: string | null;
};

const statusConfig = {
  signed: { label: 'Signed', variant: 'success' as const, icon: CheckCircle },
  pending: { label: 'Pending Signature', variant: 'warning' as const, icon: Clock },
  overdue: { label: 'Overdue', variant: 'error' as const, icon: AlertCircle },
};

export function Documents() {
  const [searchTerm, setSearchTerm] = useState('');
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [statusMessage, setStatusMessage] = useState('Loading documents...');

  useEffect(() => {
    let isMounted = true;

    api.ndas()
      .then((data) => {
        if (!isMounted) return;
        setDocuments(data);
        setStatusMessage(data.length ? 'Synced with backend' : 'No documents found');
      })
      .catch((err) => {
        if (!isMounted) return;
        setDocuments([]);
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
                    <tr key={doc.id || doc._id || doc.candidateName} className="text-sm">
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
                          <Button variant="ghost" size="sm">
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
            {!visibleDocuments.length && (
              <div className="py-10 text-center text-sm text-muted-foreground">
                No documents to display.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
