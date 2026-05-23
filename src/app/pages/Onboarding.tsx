import { useEffect, useMemo, useState } from 'react';
import { useFieldArray, useForm, type FieldErrors, type Path } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Loader2,
  Plus,
  Save,
  Trash2,
  Upload,
  User,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Progress } from '../components/ui/progress';
import { Textarea } from '../components/ui/textarea';
import { Checkbox } from '../components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { api, getStoredUser, type OnboardingFormRecord, type OnboardingPayload } from '../lib/api';

type OnboardingFormValues = {
  candidateName: string;
  candidateEmail: string;
  personalDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    department: string;
    mentor: string;
    startDate: string;
  };
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
    email: string;
  };
  permanentAddress: {
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
  currentAddress: {
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
  };
  govtIds: {
    type: string;
    idNumber: string;
  }[];
  educationDetails: {
    institution: string;
    degree: string;
    fieldOfStudy: string;
    startDate: string;
    endDate: string;
    grade: string;
    notes: string;
  }[];
  declarations: {
    agreeToPolicies: boolean;
    agreeTerms: boolean;
    signature: string;
    additionalInfo: string;
  };
};

type FormPath = Path<OnboardingFormValues>;

const DRAFT_KEY = 'internflow_onboarding_draft_id';

const steps = [
  { title: 'Personal', icon: User, fields: ['personalDetails.firstName', 'personalDetails.lastName', 'personalDetails.email', 'personalDetails.phone'] },
  { title: 'Emergency', icon: AlertCircle, fields: ['emergencyContact.name', 'emergencyContact.relationship', 'emergencyContact.phone'] },
  { title: 'Address', icon: FileText, fields: ['permanentAddress.addressLine1', 'permanentAddress.city', 'permanentAddress.state', 'permanentAddress.pincode', 'currentAddress.addressLine1', 'currentAddress.city', 'currentAddress.state', 'currentAddress.pincode'] },
  { title: 'Identity', icon: ClipboardCheck, fields: ['govtIds.0.type', 'govtIds.0.idNumber', 'educationDetails.0.institution', 'educationDetails.0.degree'] },
  { title: 'Declarations', icon: CheckCircle2, fields: ['declarations.agreeToPolicies', 'declarations.signature'] },
] as const;

const emptyGovtId: OnboardingFormValues['govtIds'][number] = { type: 'Aadhaar', idNumber: '' };
const emptyEducation: OnboardingFormValues['educationDetails'][number] = {
  institution: '',
  degree: '',
  fieldOfStudy: '',
  startDate: '',
  endDate: '',
  grade: '',
  notes: '',
};

const defaultValues: OnboardingFormValues = {
  candidateName: '',
  candidateEmail: '',
  personalDetails: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    department: '',
    mentor: '',
    startDate: '',
  },
  emergencyContact: {
    name: '',
    relationship: '',
    phone: '',
    email: '',
  },
  permanentAddress: {
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
  },
  currentAddress: {
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
  },
  govtIds: [{ ...emptyGovtId }],
  educationDetails: [{ ...emptyEducation }],
  declarations: {
    agreeToPolicies: false,
    agreeTerms: false,
    signature: '',
    additionalInfo: '',
  },
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stringValue(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function booleanValue(value: unknown) {
  return value === true;
}

function arrayValue(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function dateValue(value: unknown) {
  if (!value) return '';
  if (typeof value === 'string') return value.slice(0, 10);
  return '';
}

function buildInitialValues(user = getStoredUser()): OnboardingFormValues {
  return {
    ...defaultValues,
    candidateName: user?.name || '',
    candidateEmail: user?.email || '',
    personalDetails: {
      ...defaultValues.personalDetails,
      email: user?.email || '',
    },
  };
}

function normalizeOnboardingForm(form: OnboardingFormRecord, fallbackUser = getStoredUser()): OnboardingFormValues {
  const personalDetails = asRecord(form.personalDetails);
  const emergencyContact = asRecord(form.emergencyContact);
  const permanentAddress = asRecord(form.permanentAddress);
  const currentAddress = asRecord(form.currentAddress);
  const declarations = asRecord(form.declarations);
  const govtIds = arrayValue(form.govtIds).map((item) => {
    const govtId = asRecord(item);
    return {
      type: stringValue(govtId.type) || emptyGovtId.type,
      idNumber: stringValue(govtId.idNumber),
    };
  });
  const educationDetails = arrayValue(form.educationDetails).map((item) => {
    const education = asRecord(item);
    return {
      institution: stringValue(education.institution),
      degree: stringValue(education.degree),
      fieldOfStudy: stringValue(education.fieldOfStudy),
      startDate: dateValue(education.startDate),
      endDate: dateValue(education.endDate),
      grade: stringValue(education.grade),
      notes: stringValue(education.notes),
    };
  });

  return {
    candidateName: stringValue(form.candidateName) || fallbackUser?.name || '',
    candidateEmail: stringValue(form.candidateEmail) || fallbackUser?.email || '',
    personalDetails: {
      firstName: stringValue(personalDetails.firstName),
      lastName: stringValue(personalDetails.lastName),
      email: stringValue(personalDetails.email) || stringValue(form.candidateEmail) || fallbackUser?.email || '',
      phone: stringValue(personalDetails.phone),
      dateOfBirth: dateValue(personalDetails.dateOfBirth),
      department: stringValue(personalDetails.department),
      mentor: stringValue(personalDetails.mentor),
      startDate: dateValue(personalDetails.startDate),
    },
    emergencyContact: {
      name: stringValue(emergencyContact.name),
      relationship: stringValue(emergencyContact.relationship),
      phone: stringValue(emergencyContact.phone),
      email: stringValue(emergencyContact.email),
    },
    permanentAddress: {
      addressLine1: stringValue(permanentAddress.addressLine1),
      addressLine2: stringValue(permanentAddress.addressLine2),
      city: stringValue(permanentAddress.city),
      state: stringValue(permanentAddress.state),
      country: stringValue(permanentAddress.country) || defaultValues.permanentAddress.country,
      pincode: stringValue(permanentAddress.pincode),
    },
    currentAddress: {
      addressLine1: stringValue(currentAddress.addressLine1),
      addressLine2: stringValue(currentAddress.addressLine2),
      city: stringValue(currentAddress.city),
      state: stringValue(currentAddress.state),
      country: stringValue(currentAddress.country) || defaultValues.currentAddress.country,
      pincode: stringValue(currentAddress.pincode),
    },
    govtIds: govtIds.length ? govtIds : [{ ...emptyGovtId }],
    educationDetails: educationDetails.length ? educationDetails : [{ ...emptyEducation }],
    declarations: {
      agreeToPolicies: booleanValue(declarations.agreeToPolicies),
      agreeTerms: booleanValue(declarations.agreeTerms),
      signature: stringValue(declarations.signature),
      additionalInfo: stringValue(declarations.additionalInfo),
    },
  };
}

function getError(errors: FieldErrors<OnboardingFormValues>, path: string) {
  return path.split('.').reduce<unknown>((value, key) => {
    if (!value || typeof value !== 'object') return undefined;
    return (value as Record<string, unknown>)[key];
  }, errors) as { message?: string } | undefined;
}

function buildFormData(values: OnboardingFormValues, files: FileList | null) {
  const payload: OnboardingPayload = {
    candidateName: values.candidateName || `${values.personalDetails.firstName} ${values.personalDetails.lastName}`.trim(),
    candidateEmail: values.candidateEmail || values.personalDetails.email,
    personalDetails: { ...values.personalDetails },
    emergencyContact: { ...values.emergencyContact },
    permanentAddress: { ...values.permanentAddress },
    currentAddress: { ...values.currentAddress },
    govtIds: values.govtIds.map((govtId) => ({ ...govtId })),
    educationDetails: values.educationDetails.map((education) => ({ ...education })),
    declarations: { ...values.declarations },
  };

  const formData = new FormData();
  formData.append('payload', JSON.stringify(payload));
  Array.from(files || []).forEach((file) => formData.append('attachments', file));
  return formData;
}

function Field({
  label,
  name,
  register,
  errors,
  type = 'text',
  required = true,
  placeholder,
}: {
  label: string;
  name: FormPath;
  register: ReturnType<typeof useForm<OnboardingFormValues>>['register'];
  errors: FieldErrors<OnboardingFormValues>;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  const error = getError(errors, name);

  return (
    <label className="space-y-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <Input
        type={type}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        {...register(name, {
          required: required ? `${label} is required` : false,
          pattern: type === 'email' ? { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email address' } : undefined,
        })}
      />
      {error?.message && <p className="text-xs text-red-600">{error.message}</p>}
    </label>
  );
}

export function Onboarding() {
  const navigate = useNavigate();
  const storedUser = useMemo(() => getStoredUser(), []);
  const [activeStep, setActiveStep] = useState(0);
  const [draftId, setDraftId] = useState(() => localStorage.getItem(DRAFT_KEY) || '');
  const [attachments, setAttachments] = useState<FileList | null>(null);
  const [savedForm, setSavedForm] = useState<OnboardingFormRecord | null>(null);
  const [isDraftLoading, setIsDraftLoading] = useState(Boolean(localStorage.getItem(DRAFT_KEY)));
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    trigger,
    watch,
    reset,
    setValue,
    control,
    formState: { errors },
  } = useForm<OnboardingFormValues>({
    defaultValues: buildInitialValues(storedUser),
    mode: 'onBlur',
    shouldUnregister: false,
  });

  const govtIdFields = useFieldArray({ control, name: 'govtIds' });
  const educationFields = useFieldArray({ control, name: 'educationDetails' });

  const values = watch();

  useEffect(() => {
    if (!draftId) {
      reset(buildInitialValues(storedUser));
      setIsDraftLoading(false);
      return;
    }

    let isActive = true;

    async function loadDraft() {
      setIsDraftLoading(true);
      setServerError('');

      try {
        const form = await api.getOnboardingDraft(draftId);
        if (!isActive) return;

        setSavedForm(form);
        reset(normalizeOnboardingForm(form, storedUser));
        toast.success('Onboarding draft loaded');
      } catch (error) {
        if (!isActive) return;

        const message = error instanceof Error ? error.message : 'Unable to load onboarding draft';
        setServerError(message);
        toast.error(message);
        localStorage.removeItem(DRAFT_KEY);
        setDraftId('');
        reset(buildInitialValues(storedUser));
      } finally {
        if (isActive) setIsDraftLoading(false);
      }
    }

    loadDraft();

    return () => {
      isActive = false;
    };
  }, [draftId, reset, storedUser]);

  const completion = useMemo(() => {
    const checks = [
      values.personalDetails.firstName,
      values.personalDetails.lastName,
      values.personalDetails.email,
      values.personalDetails.phone,
      values.emergencyContact.name,
      values.emergencyContact.relationship,
      values.emergencyContact.phone,
      values.permanentAddress.addressLine1,
      values.permanentAddress.city,
      values.permanentAddress.state,
      values.permanentAddress.pincode,
      values.currentAddress.addressLine1,
      values.currentAddress.city,
      values.currentAddress.state,
      values.currentAddress.pincode,
      values.govtIds?.[0]?.type,
      values.govtIds?.[0]?.idNumber,
      values.educationDetails?.[0]?.institution,
      values.educationDetails?.[0]?.degree,
      values.declarations.agreeToPolicies,
      values.declarations.signature,
      attachments?.length,
    ];

    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [attachments?.length, values]);

  const saveDraft = async (valuesToSave: OnboardingFormValues) => {
    setIsSaving(true);
    setNotice('');
    setServerError('');

    try {
      const data = buildFormData(valuesToSave, attachments);
      const form = draftId
        ? await api.updateOnboardingDraft(draftId, data)
        : await api.createOnboardingDraft(data);

      const id = form._id || form.id || draftId;
      if (id) {
        setDraftId(id);
        localStorage.setItem(DRAFT_KEY, id);
      }
      setSavedForm(form);
      setNotice('Draft saved successfully.');
      toast.success('Onboarding draft saved');
      return form;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save onboarding draft';
      setServerError(message);
      toast.error(message);
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const goNext = async () => {
    const isStepValid = await trigger(steps[activeStep].fields as readonly FormPath[]);
    if (isStepValid) setActiveStep((step) => Math.min(step + 1, steps.length - 1));
  };

  const submit = async (formValues: OnboardingFormValues) => {
    setIsSubmitting(true);
    setNotice('');
    setServerError('');

    try {
      const draft = await saveDraft(formValues);
      const id = draft?._id || draft?.id || draftId;
      if (!id) throw new Error('Save a draft before submitting onboarding.');

      const submitted = await api.submitOnboarding(id);
      setSavedForm(submitted);
      setNotice('Onboarding submitted for HR review.');
      toast.success('Onboarding submitted for HR review');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to submit onboarding';
      setServerError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sameAddress = () => {
    setValue('currentAddress', values.permanentAddress, { shouldDirty: true, shouldValidate: true });
  };

  const deleteDraft = async () => {
    if (!draftId) return;

    setIsDeleting(true);
    setServerError('');

    try {
      await api.deleteOnboardingDraft(draftId);
      localStorage.removeItem(DRAFT_KEY);
      setDraftId('');
      setSavedForm(null);
      setAttachments(null);
      setIsDeleteDialogOpen(false);
      reset(buildInitialValues(storedUser));
      toast.success('Onboarding draft deleted');
      navigate('/');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to delete onboarding draft';
      setServerError(message);
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="default" className="bg-blue-100 text-blue-800">Enterprise workflow</Badge>
              <Badge variant="default" className={draftId ? 'bg-slate-200 text-slate-800' : 'bg-emerald-100 text-emerald-800'}>
                {draftId ? 'Edit mode' : 'Create mode'}
              </Badge>
              {savedForm?.status && <Badge variant="success">{savedForm.status}</Badge>}
            </div>
            <h1 className="mt-3 text-2xl font-bold text-slate-950 sm:text-3xl">Onboarding Form</h1>
            <p className="mt-1 text-sm text-slate-600">Complete candidate details, compliance declarations, and document uploads.</p>
          </div>
          <div className="grid min-w-full grid-cols-2 gap-3 sm:min-w-80">
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-medium text-slate-500">Completion</p>
                <p className="mt-1 text-2xl font-bold text-slate-950">{savedForm?.completionPercentage ?? completion}%</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <p className="text-xs font-medium text-slate-500">Documents</p>
                <p className="mt-1 text-2xl font-bold text-slate-950">{attachments?.length || savedForm?.attachments?.length || 0}</p>
              </CardContent>
            </Card>
          </div>
          {draftId && (
            <Button
              type="button"
              variant="destructive"
              disabled={isDraftLoading || isDeleting}
              onClick={() => setIsDeleteDialogOpen(true)}
              className="lg:self-end"
            >
              <Trash2 className="h-4 w-4" />
              Delete draft
            </Button>
          )}
        </div>

        <Card>
          <CardContent className="p-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
              <div className="flex-1">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">Onboarding completion</span>
                  <span className="font-semibold text-slate-950">{completion}%</span>
                </div>
                <Progress value={completion} className="h-2" />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-5 lg:min-w-[620px]">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = index === activeStep;
                  const isDone = index < activeStep;
                  return (
                    <button
                      key={step.title}
                      type="button"
                      disabled={isDraftLoading}
                      onClick={() => setActiveStep(index)}
                      className={`flex min-h-16 items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition ${
                        isActive
                          ? 'border-blue-600 bg-blue-50 text-blue-800'
                          : isDone
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="font-medium">{step.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {(notice || serverError) && (
          <div className={`rounded-lg border px-4 py-3 text-sm ${serverError ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
            {serverError || notice}
          </div>
        )}

        {isDraftLoading && (
          <Card>
            <CardContent className="flex items-center gap-3 p-5 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin text-blue-700" />
              Loading saved onboarding draft...
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit(submit)} className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <Card>
            <CardHeader>
              <CardTitle>{steps[activeStep].title} Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {activeStep === 0 && (
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="First name" name="personalDetails.firstName" register={register} errors={errors} />
                  <Field label="Last name" name="personalDetails.lastName" register={register} errors={errors} />
                  <Field label="Email" name="personalDetails.email" type="email" register={register} errors={errors} />
                  <Field label="Phone" name="personalDetails.phone" register={register} errors={errors} />
                  <Field label="Date of birth" name="personalDetails.dateOfBirth" type="date" register={register} errors={errors} required={false} />
                  <Field label="Department" name="personalDetails.department" register={register} errors={errors} required={false} />
                  <Field label="Mentor" name="personalDetails.mentor" register={register} errors={errors} required={false} />
                  <Field label="Start date" name="personalDetails.startDate" type="date" register={register} errors={errors} required={false} />
                </div>
              )}

              {activeStep === 1 && (
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Contact name" name="emergencyContact.name" register={register} errors={errors} />
                  <Field label="Relationship" name="emergencyContact.relationship" register={register} errors={errors} />
                  <Field label="Phone" name="emergencyContact.phone" register={register} errors={errors} />
                  <Field label="Email" name="emergencyContact.email" type="email" register={register} errors={errors} required={false} />
                </div>
              )}

              {activeStep === 2 && (
                <div className="space-y-6">
                  <section className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900">Permanent address</h3>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Address line 1" name="permanentAddress.addressLine1" register={register} errors={errors} />
                      <Field label="Address line 2" name="permanentAddress.addressLine2" register={register} errors={errors} required={false} />
                      <Field label="City" name="permanentAddress.city" register={register} errors={errors} />
                      <Field label="State" name="permanentAddress.state" register={register} errors={errors} />
                      <Field label="Country" name="permanentAddress.country" register={register} errors={errors} required={false} />
                      <Field label="Pincode" name="permanentAddress.pincode" register={register} errors={errors} />
                    </div>
                  </section>
                  <section className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="font-semibold text-slate-900">Current address</h3>
                      <Button type="button" variant="outline" size="sm" onClick={sameAddress}>Use permanent address</Button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Address line 1" name="currentAddress.addressLine1" register={register} errors={errors} />
                      <Field label="Address line 2" name="currentAddress.addressLine2" register={register} errors={errors} required={false} />
                      <Field label="City" name="currentAddress.city" register={register} errors={errors} />
                      <Field label="State" name="currentAddress.state" register={register} errors={errors} />
                      <Field label="Country" name="currentAddress.country" register={register} errors={errors} required={false} />
                      <Field label="Pincode" name="currentAddress.pincode" register={register} errors={errors} />
                    </div>
                  </section>
                </div>
              )}

              {activeStep === 3 && (
                <div className="space-y-6">
                  <section className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="font-semibold text-slate-900">Government IDs</h3>
                      <Button type="button" variant="outline" size="sm" onClick={() => govtIdFields.append({ ...emptyGovtId })}>
                        <Plus className="h-4 w-4" />
                        Add ID
                      </Button>
                    </div>
                    {govtIdFields.fields.map((field, index) => (
                      <div key={field.id} className="grid gap-4 rounded-lg border border-slate-200 p-4 md:grid-cols-[1fr_1fr_auto]">
                        <Field label="Government ID type" name={`govtIds.${index}.type` as FormPath} register={register} errors={errors} />
                        <Field label="Government ID number" name={`govtIds.${index}.idNumber` as FormPath} register={register} errors={errors} />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="self-end text-red-600 hover:text-red-700"
                          disabled={govtIdFields.fields.length === 1}
                          onClick={() => govtIdFields.remove(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </section>
                  <section className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="font-semibold text-slate-900">Education details</h3>
                      <Button type="button" variant="outline" size="sm" onClick={() => educationFields.append({ ...emptyEducation })}>
                        <Plus className="h-4 w-4" />
                        Add education
                      </Button>
                    </div>
                    {educationFields.fields.map((field, index) => (
                      <div key={field.id} className="grid gap-4 rounded-lg border border-slate-200 p-4 md:grid-cols-2">
                        <Field label="Institution" name={`educationDetails.${index}.institution` as FormPath} register={register} errors={errors} />
                        <Field label="Degree" name={`educationDetails.${index}.degree` as FormPath} register={register} errors={errors} />
                        <Field label="Field of study" name={`educationDetails.${index}.fieldOfStudy` as FormPath} register={register} errors={errors} required={false} />
                        <Field label="Grade" name={`educationDetails.${index}.grade` as FormPath} register={register} errors={errors} required={false} />
                        <Field label="Start date" name={`educationDetails.${index}.startDate` as FormPath} type="date" register={register} errors={errors} required={false} />
                        <Field label="End date" name={`educationDetails.${index}.endDate` as FormPath} type="date" register={register} errors={errors} required={false} />
                        <label className="space-y-1.5 md:col-span-2">
                          <span className="text-sm font-medium text-slate-700">Notes</span>
                          <Textarea rows={3} {...register(`educationDetails.${index}.notes` as FormPath)} />
                        </label>
                        <div className="md:col-span-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            disabled={educationFields.fields.length === 1}
                            onClick={() => educationFields.remove(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Remove education
                          </Button>
                        </div>
                      </div>
                    ))}
                  </section>
                  <label className="block space-y-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5">
                    <span className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                      <Upload className="h-4 w-4" />
                      Upload ID, address proof, and education documents
                    </span>
                    <Input type="file" multiple onChange={(event) => setAttachments(event.target.files)} />
                    <span className="block text-xs text-slate-500">Files are sent as onboarding attachments when you save or submit.</span>
                  </label>
                </div>
              )}

              {activeStep === 4 && (
                <div className="space-y-5">
                  <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-4">
                    <Checkbox
                      checked={values.declarations.agreeToPolicies}
                      onCheckedChange={(checked) => setValue('declarations.agreeToPolicies', checked === true, { shouldValidate: true })}
                    />
                    <span className="text-sm text-slate-700">I confirm that I have read and accepted company policies, confidentiality obligations, and onboarding requirements.</span>
                  </label>
                  {getError(errors, 'declarations.agreeToPolicies')?.message && <p className="text-xs text-red-600">Policy acceptance is required</p>}
                  <label className="flex items-start gap-3 rounded-lg border border-slate-200 p-4">
                    <Checkbox
                      checked={values.declarations.agreeTerms}
                      onCheckedChange={(checked) => setValue('declarations.agreeTerms', checked === true, { shouldValidate: true })}
                    />
                    <span className="text-sm text-slate-700">I certify that the information provided is true and can be used for HR verification.</span>
                  </label>
                  <Field label="Digital signature" name="declarations.signature" register={register} errors={errors} placeholder="Type your full legal name" />
                  <label className="space-y-1.5">
                    <span className="text-sm font-medium text-slate-700">Additional information</span>
                    <Textarea rows={4} {...register('declarations.additionalInfo')} />
                  </label>
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
                <Button type="button" variant="outline" disabled={activeStep === 0 || isDraftLoading} onClick={() => setActiveStep((step) => Math.max(step - 1, 0))}>
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button type="button" variant="outline" disabled={isDraftLoading || isSaving || isSubmitting} onClick={handleSubmit(saveDraft)}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save draft
                  </Button>
                  {activeStep < steps.length - 1 ? (
                    <Button type="button" disabled={isDraftLoading} onClick={goNext}>
                      Continue
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={isDraftLoading || isSaving || isSubmitting}>
                      {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                      Submit onboarding
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <aside className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Workflow Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-slate-100 p-4">
                  <p className="text-xs font-medium uppercase text-slate-500">Draft ID</p>
                  <p className="mt-1 break-all text-sm font-semibold text-slate-900">{draftId || 'Not created yet'}</p>
                </div>
                <div className="space-y-3">
                  {steps.map((step, index) => (
                    <div key={step.title} className="flex items-center gap-3 text-sm">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-full ${index <= activeStep ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                        {index + 1}
                      </span>
                      <span className="font-medium text-slate-700">{step.title}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Submission Checks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-slate-600">
                <p>Required backend checks include personal details, emergency contact, both addresses, one government ID, one education record, policy acceptance, and signature.</p>
                <p>Drafts can be saved at any stage; final submission runs full server validation.</p>
              </CardContent>
            </Card>
          </aside>
        </form>

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete onboarding draft?</DialogTitle>
              <DialogDescription>
                This removes the saved onboarding draft immediately. Submitted or approved forms cannot be deleted.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="outline" disabled={isDeleting} onClick={() => setIsDeleteDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="button" variant="destructive" disabled={isDeleting} onClick={deleteDraft}>
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Delete draft
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
