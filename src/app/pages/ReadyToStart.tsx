import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../components/ui/alert-dialog';
import { Rocket, CheckCircle, Clock, Calendar, Search, RefreshCcw, UserCheck } from 'lucide-react';
import { api, getStoredUser, type ReferralRecord } from '../lib/api';

type ActivationFormValues = {
  startDate: string;
  notes?: string;
};

export function ReadyToStart() {
  const storedUser = getStoredUser();
  const userRole = storedUser?.role;
  const canManage = userRole === 'hr' || userRole === 'superAdmin';

  const [candidates, setCandidates] = useState<ReferralRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isActivateOpen, setIsActivateOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<ReferralRecord | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const { register, handleSubmit, reset, formState } = useForm<ActivationFormValues>({
    defaultValues: {
      startDate: new Date().toISOString().split('T')[0],
      notes: '',
    },
  });

  const fetchCandidates = async () => {
    if (!canManage) {
      setCandidates([]);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const allReferrals = await api.referrals<ReferralRecord[]>();
      const readyToStart = allReferrals.filter(
        (ref) => ref.workflowStage === 'READY_TO_START'
      );
      setCandidates(readyToStart);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to load candidates';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [userRole]);

  const filteredCandidates = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return candidates.filter((candidate) => {
      if (!normalizedSearch) return true;
      return [candidate.candidateName, candidate.candidateEmail, candidate.skills?.join(' ')]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalizedSearch));
    });
  }, [candidates, searchTerm]);

  const handleActivate = async (values: ActivationFormValues) => {
    if (!selectedCandidate) return;

    try {
      await api.activateInternship(
        selectedCandidate._id || selectedCandidate.id || '',
        values.startDate,
        values.notes
      );

      setCandidates((current) =>
        current.filter((c) => (c._id || c.id) !== (selectedCandidate._id || selectedCandidate.id))
      );

      toast.success('Internship activated successfully');
      reset();
      setIsActivateOpen(false);
      setSelectedCandidate(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to activate internship';
      toast.error(message);
    }
  };

  const metrics = useMemo(() => {
    const total = candidates.length;
    const today = new Date();
    const pending = candidates.filter((c) => {
      if (!c.slaDeadline) return false;
      return new Date(c.slaDeadline) > today;
    }).length;
    const overdue = candidates.filter((c) => {
      if (!c.slaDeadline) return false;
      return new Date(c.slaDeadline) <= today;
    }).length;
    return { total, pending, overdue };
  }, [candidates]);

  const canShowEmpty = !isLoading && !error && filteredCandidates.length === 0;

  if (!canManage) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <UserCheck className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-lg font-semibold">Access Restricted</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Only HR and Admins can manage internship activation.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Ready to Start</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Candidates ready to begin their internship. Activate them to mark as live.
          </p>
        </div>
        <Button variant="outline" onClick={fetchCandidates}>
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ready to start</p>
                <p className="mt-1 text-2xl font-bold">{metrics.total}</p>
              </div>
              <Rocket className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Within SLA</p>
                <p className="mt-1 text-2xl font-bold text-green-600">{metrics.pending}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="mt-1 text-2xl font-bold text-red-600">{metrics.overdue}</p>
              </div>
              <Clock className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>Candidates queue</CardTitle>
            <div className="relative w-full md:w-80">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search candidates..."
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {error ? (
            <div className="space-y-4 rounded-lg border border-red-200 bg-red-50 p-6">
              <p className="font-medium text-red-900">Unable to load candidates</p>
              <p className="text-sm text-red-700">{error}</p>
              <Button variant="outline" onClick={fetchCandidates}>
                Retry
              </Button>
            </div>
          ) : isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full rounded-md" />
              <Skeleton className="h-32 w-full rounded-md" />
            </div>
          ) : canShowEmpty ? (
            <div className="space-y-4 rounded-lg border border-dashed border-border bg-background p-8 text-center">
              <Rocket className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-semibold">No candidates ready to start</p>
              <p className="text-sm text-muted-foreground">
                Candidates will appear here after completing all onboarding steps.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCandidates.map((candidate) => {
                const isOverdue =
                  candidate.slaDeadline && new Date(candidate.slaDeadline) <= new Date();

                return (
                  <Card key={candidate._id || candidate.id} className="border-border">
                    <CardContent className="p-6">
                      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold">{candidate.candidateName}</h3>
                            <Badge variant="default">Ready to Start</Badge>
                            {isOverdue && <Badge variant="destructive">Overdue</Badge>}
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {candidate.candidateEmail}
                          </p>

                          {candidate.skills && candidate.skills.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {candidate.skills.slice(0, 5).map((skill, idx) => (
                                <Badge key={idx} variant="secondary">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          )}

                          {candidate.slaDeadline && (
                            <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>
                                SLA Deadline:{' '}
                                {new Date(candidate.slaDeadline).toLocaleDateString()}
                              </span>
                            </div>
                          )}
                        </div>

                        <Button
                          variant="primary"
                          onClick={() => {
                            setSelectedCandidate(candidate);
                            setIsActivateOpen(true);
                          }}
                        >
                          <Rocket className="mr-2 h-4 w-4" />
                          Activate Internship
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isActivateOpen} onOpenChange={(open) => { setIsActivateOpen(open); if (!open) reset(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Activate Internship</DialogTitle>
            <DialogDescription>
              Set the start date and activate {selectedCandidate?.candidateName}'s internship.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit(handleActivate)} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Start Date <span className="text-red-500">*</span>
              </label>
              <Input {...register('startDate', { required: true })} type="date" />
              {formState.errors.startDate && (
                <p className="mt-1 text-xs text-red-600">Start date is required</p>
              )}
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Notes (optional)
              </label>
              <Textarea
                {...register('notes')}
                rows={3}
                placeholder="Any additional notes or instructions..."
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={formState.isSubmitting}>
                <Rocket className="mr-2 h-4 w-4" />
                Activate Internship
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsActivateOpen(false);
                  reset();
                }}
              >
                Cancel
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
