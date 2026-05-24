import { useEffect, useState } from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './ui/command';
import { cn } from './ui/utils';
import { api, type ReferralRecord } from '../lib/api';

export type CandidateOption = {
  id: string;
  candidateName: string;
  candidateEmail: string;
  referralId: string;
  workflowStage?: string;
  status?: string;
};

type CandidateSelectProps = {
  value?: string;
  onChange?: (candidate: CandidateOption | null) => void;
  disabled?: boolean;
  placeholder?: string;
};

function getReferralId(r: ReferralRecord): string {
  return ((r._id || r.id) as string | undefined) ?? '';
}

export function CandidateSelect({
  value,
  onChange,
  disabled,
  placeholder = 'Select candidate...',
}: CandidateSelectProps) {
  const [open, setOpen] = useState(false);
  const [candidates, setCandidates] = useState<CandidateOption[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    api
      .referrals<ReferralRecord[]>()
      .then((referrals) => {
        const seen = new Set<string>();
        const options: CandidateOption[] = referrals
          .filter((r) => r.candidateName && r.candidateEmail)
          .reduce<CandidateOption[]>((acc, r) => {
            const rid = getReferralId(r);
            if (!seen.has(rid)) {
              seen.add(rid);
              acc.push({
                id: rid,
                candidateName: r.candidateName ?? '',
                candidateEmail: r.candidateEmail ?? '',
                referralId: rid,
                workflowStage: r.workflowStage,
                status: r.status,
              });
            }
            return acc;
          }, []);
        setCandidates(options);
      })
      .catch(() => {
        /* silently fail — empty list shown */
      })
      .finally(() => setIsLoading(false));
  }, []);

  const selected = candidates.find((c) => c.id === value) ?? null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled || isLoading}
          className="w-full justify-between font-normal"
        >
          {isLoading ? (
            <span className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading candidates...
            </span>
          ) : selected ? (
            <span className="truncate">
              {selected.candidateName} &mdash; {selected.candidateEmail}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0" align="start" style={{ width: '400px' }}>
        <Command>
          <CommandInput placeholder="Search by name or email..." />
          <CommandList>
            <CommandEmpty>No candidates found.</CommandEmpty>
            <CommandGroup>
              {candidates.map((candidate) => (
                <CommandItem
                  key={candidate.id}
                  value={`${candidate.candidateName} ${candidate.candidateEmail}`}
                  onSelect={() => {
                    const next = candidate.id === value ? null : candidate;
                    onChange?.(next);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4 shrink-0',
                      value === candidate.id ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <span className="flex flex-col">
                    <span className="font-medium">{candidate.candidateName}</span>
                    <span className="text-xs text-muted-foreground">
                      {candidate.candidateEmail}
                      {candidate.status ? ` · ${candidate.status}` : ''}
                    </span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
