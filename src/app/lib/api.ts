import axios, {
  AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';

type ApiRequestConfig = AxiosRequestConfig & {
  auth?: boolean;
};

type InternalApiRequestConfig = InternalAxiosRequestConfig & {
  auth?: boolean;
};

export type UserRole =
  | 'superAdmin'
  | 'hr'
  | 'mentor'
  | 'referrer'
  | 'candidate'
  | 'it'
  | 'compliance';

export type AuthUser = {
  id: string;
  _id?: string;
  name: string;
  email: string;
  role: UserRole;
};

export type AuthSession = {
  accessToken: string;
  user: AuthUser;
};

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
};

export type ApiRecord = Record<string, unknown>;

export type ResumeParseResult = {
  parsedData?: {
    fullName?: { value?: string | null; confidence?: number };
    email?: { value?: string | null; confidence?: number };
    phone?: { value?: string | null; confidence?: number };
    skills?: { value?: string[]; confidence?: number };
  };
  confidence?: {
    overall?: number;
    fullName?: number;
    email?: number;
    phone?: number;
    skills?: number;
  };
  validation?: {
    warnings?: string[];
  };
  duplicate?: {
    duplicate?: boolean;
    duplicateReason?: string;
    existingReferralId?: string;
    existingParseId?: string;
  };
};

export type OnboardingAddress = {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
};

export type OnboardingGovernmentId = {
  type?: string;
  idNumber?: string;
  documentPath?: string;
};

export type OnboardingEducation = {
  institution?: string;
  degree?: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  grade?: string;
  notes?: string;
};

export type OnboardingPayload = {
  candidateId?: string;
  referralId?: string;
  candidateEmail?: string;
  candidateName?: string;
  personalDetails?: ApiRecord;
  emergencyContact?: ApiRecord;
  permanentAddress?: OnboardingAddress;
  currentAddress?: OnboardingAddress;
  govtIds?: OnboardingGovernmentId[];
  educationDetails?: OnboardingEducation[];
  declarations?: ApiRecord;
  status?: 'DRAFT' | 'SUBMITTED' | 'HR_APPROVED';
  workflowStage?: string;
};

export type OnboardingFormRecord = OnboardingPayload & {
  _id: string;
  id?: string;
  attachments?: ApiRecord[];
  completionPercentage?: number;
  status: 'DRAFT' | 'SUBMITTED' | 'HR_APPROVED';
  submittedAt?: string;
  updatedAt?: string;
};

export type NonWorkerIdRequest = {
  _id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  employeeId?: string;
  referralId?: string;
  requestStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED';
  requestedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  completedAt?: string;
  slaDeadline?: string;
  notes?: string;
  createdBy?: string;
  updatedBy?: string;
};

export type NonWorkerIdPayload = {
  candidateId?: string;
  candidateName: string;
  candidateEmail: string;
  employeeId?: string;
  referralId?: string;
  notes?: string;
};

export type AccessProvisionRecord = {
  _id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail?: string;
  adAccountCreated: boolean;
  emailProvisioned: boolean;
  vpnAccess: boolean;
  badgeAccess: boolean;
  otpSent: boolean;
  systemAccess: string[];
  provisioningStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  slaDeadline?: string;
  notes?: string;
  createdBy?: string;
  updatedBy?: string;
  completedAt?: string;
  referralId?: string;
};

export type AccessProvisionPayload = {
  candidateId: string;
  candidateName: string;
  candidateEmail?: string;
  systemAccess?: string[];
  notes?: string;
};

export type ReferralRecord = {
  id?: string;
  _id?: string;
  candidateName?: string;
  candidateEmail?: string;
  candidatePhone?: string;
  skills?: string[];
  education?: string;
  internshipDuration?: string;
  projectOverview?: string;
  location?: string;
  status?: string;
  workflowStage?: string;
  referrer?: string;
  mentor?: string;
  submittedBy?: string;
  createdAt?: string;
  updatedAt?: string;
  slaDeadline?: string;
  duplicate?: boolean;
};

export type WorkflowHistoryStage = {
  stage: string;
  status: 'completed' | 'in_progress' | 'pending' | 'overdue' | 'blocked';
  actor?: string;
  role?: string;
  timestamp?: string;
  durationMinutes?: number;
  slaDeadline?: string;
  notes?: string;
  meta?: ApiRecord;
};

export type WorkflowHistoryRecord = {
  _id?: string;
  referralId?: string;
  candidateId?: string;
  candidateName?: string;
  candidateEmail?: string;
  workflowStage?: string;
  workflowStatus?: 'active' | 'delayed' | 'completed' | 'blocked';
  startedAt?: string;
  updatedAt?: string;
  completedAt?: string;
  actor?: string;
  timeline?: WorkflowHistoryStage[];
  slaDeadline?: string;
  durationMinutes?: number;
  bottleneck?: boolean;
  escalationLevel?: 'none' | 'watch' | 'escalated' | 'critical';
  currentOwner?: string;
  notes?: string;
};

export type ActivityFeedItem = {
  _id?: string;
  id?: string;
  type:
    | 'onboarding_update'
    | 'approval_action'
    | 'provisioning_update'
    | 'certificate_issued'
    | 'escalation'
    | 'workflow_transition'
    | 'extension_request';
  title: string;
  description?: string;
  candidateName?: string;
  actor?: string;
  stage?: string;
  status?: string;
  timestamp: string;
  referralId?: string;
  workflowId?: string;
  slaDeadline?: string;
  severity?: 'low' | 'medium' | 'high';
};

export type ExtensionRequestRecord = {
  _id: string;
  candidateId: string;
  reason: string;
  requestedDays: number;
  approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  comments?: string;
  approvedBy?: string;
  createdAt?: string;
  updatedAt?: string;
};

type StoredUser = Partial<AuthUser> & {
  _id?: string;
};

const API_BASE_URL = ((import.meta as ImportMeta).env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const TOKEN_KEY = 'internflow_access_token';
const USER_KEY = 'internflow_user';
const AUTH_REDIRECT_EVENT = 'internflow:auth-redirect';

let isRedirectingToLogin = false;

class AuthRequiredError extends Error {
  constructor() {
    super('Authentication required');
    this.name = 'AuthRequiredError';
  }
}

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): AuthUser | null {
  const storedUser = localStorage.getItem(USER_KEY);
  if (!storedUser) return null;

  try {
    const user = JSON.parse(storedUser) as StoredUser;
    const id = user.id || user._id;
    if (!id || !user.email || !user.role) {
      clearSession();
      return null;
    }

    return { ...user, id } as AuthUser;
  } catch {
    clearSession();
    return null;
  }
}

export function getStoredSession(): AuthSession | null {
  const accessToken = getAccessToken();
  const user = getStoredUser();

  if (!accessToken || !user) {
    clearSession();
    return null;
  }

  return { accessToken, user };
}

export function initializeAuthState() {
  return getStoredSession();
}

export function setSession(accessToken: string, user: AuthUser) {
  const normalizedUser = { ...user, id: user.id || user._id };

  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(USER_KEY, JSON.stringify(normalizedUser));
  isRedirectingToLogin = false;
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function redirectToLogin() {
  if (isRedirectingToLogin || window.location.pathname === '/login') return;

  isRedirectingToLogin = true;
  window.dispatchEvent(new Event(AUTH_REDIRECT_EVENT));
  window.location.assign('/login');
}

export function clearSessionAndRedirect() {
  clearSession();
  redirectToLogin();
}

export async function logoutAndRedirect() {
  const token = getAccessToken();

  try {
    if (token) {
      await apiClient.post('/api/auth/logout', undefined, { auth: false });
    }
  } finally {
    clearSessionAndRedirect();
  }
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL || undefined,
  withCredentials: false,
});

apiClient.interceptors.request.use((config: InternalApiRequestConfig) => {
  const requiresAuth = config.auth !== false;

  if (!requiresAuth) {
    return config;
  }

  const token = getAccessToken();
  if (!token) {
    throw new AuthRequiredError();
  }

  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse<unknown>> | AuthRequiredError) => {
    if (error instanceof AuthRequiredError) {
      clearSessionAndRedirect();
      return Promise.reject(error);
    }

    const status = error.response?.status;
    const requestUrl = error.config?.url || '';
    const isLoginRequest = requestUrl.includes('/api/auth/login');

    if (status === 401 && !isLoginRequest) {
      clearSessionAndRedirect();
    }

    return Promise.reject(error);
  },
);

export async function apiRequest<T>(path: string, options: ApiRequestConfig = {}): Promise<T> {
  try {
    const response = await apiClient.request<ApiResponse<T> | T>({
      url: path,
      ...options,
    });
    const payload = response.data;

    if (payload && typeof payload === 'object' && 'success' in payload) {
      const apiPayload = payload as ApiResponse<T>;
      if (apiPayload.success === false) {
        throw new Error(apiPayload.message || 'Request failed');
      }

      return apiPayload.data;
    }

    return payload as T;
  } catch (error) {
    if (axios.isAxiosError<ApiResponse<unknown>>(error)) {
      const message = error.response?.data?.message || error.message || 'Request failed';
      throw new Error(message);
    }

    throw error;
  }
}

export function apiUrl(path: string) {
  return `${API_BASE_URL}${path}`;
}

export const api = {
  login: (email: string, password: string) =>
    apiRequest<AuthSession>('/api/auth/login', {
      auth: false,
      method: 'POST',
      data: { email, password },
    }),
  logout: () => apiRequest('/api/auth/logout', { method: 'POST' }),
  dashboard: <T = ApiRecord>() => apiRequest<T>('/api/dashboard'),
  referrals: <T = ReferralRecord[]>() => apiRequest<T>('/api/referrals'),
  createReferral: (data: FormData) =>
    apiRequest('/api/referrals', {
      method: 'POST',
      data,
    }),
  updateReferral: (id: string, data: FormData) =>
    apiRequest(`/api/referrals/${id}`, {
      method: 'PUT',
      data,
    }),
  deleteReferral: (id: string) =>
    apiRequest(`/api/referrals/${id}`, {
      method: 'DELETE',
    }),
  parseResume: (data: FormData, onUploadProgress?: ApiRequestConfig['onUploadProgress']) =>
    apiRequest<ResumeParseResult>('/api/resumes/parse', {
      method: 'POST',
      data,
      onUploadProgress,
    }),
  ndas: <T = ApiRecord[]>() => apiRequest<T>('/api/nda'),
  submitNda: (data: ApiRecord) =>
    apiRequest('/api/nda', {
      method: 'POST',
      data,
    }),
  certificates: <T = ApiRecord[]>() => apiRequest<T>('/api/certificates'),
  issueCertificate: (data: ApiRecord) =>
    apiRequest('/api/certificates/issue', {
      method: 'POST',
      data,
    }),
  certificateDownloadUrl: (id: string) => apiUrl(`/api/certificates/download/${id}`),
  notifications: <T = ApiRecord[]>() => apiRequest<T>('/api/notifications'),
  notificationUnreadCount: <T = { unreadCount: number }>() => apiRequest<T>('/api/notifications/unread-count'),
  markNotificationRead: <T = ApiRecord>(id: string) =>
    apiRequest<T>(`/api/notifications/${id}/read`, {
      method: 'PUT',
    }),
  markAllNotificationsRead: <T = ApiRecord>() =>
    apiRequest<T>('/api/notifications/read-all', {
      method: 'PUT',
    }),
  ids: {
    list: <T = NonWorkerIdRequest[]>(params?: Record<string, string>) =>
      apiRequest<T>('/api/ids', {
        method: 'GET',
        params,
      }),
    create: (data: NonWorkerIdPayload) =>
      apiRequest<NonWorkerIdRequest>('/api/ids', {
        method: 'POST',
        data,
      }),
    approve: (id: string, comment?: string) =>
      apiRequest<NonWorkerIdRequest>(`/api/ids/${id}/approve`, {
        method: 'POST',
        data: { comment },
      }),
    reject: (id: string, reason?: string) =>
      apiRequest<NonWorkerIdRequest>(`/api/ids/${id}/reject`, {
        method: 'POST',
        data: { reason },
      }),
    complete: (id: string) =>
      apiRequest<NonWorkerIdRequest>(`/api/ids/${id}/complete`, {
        method: 'POST',
      }),
  },
  access: {
    list: <T = AccessProvisionRecord[]>(params?: Record<string, string>) =>
      apiRequest<T>('/api/access', {
        method: 'GET',
        params,
      }),
    create: (data: AccessProvisionPayload) =>
      apiRequest<AccessProvisionRecord>('/api/access', {
        method: 'POST',
        data,
      }),
    update: (id: string, data: Partial<AccessProvisionPayload & { provisioningStatus?: string }>) =>
      apiRequest<AccessProvisionRecord>(`/api/access/${id}`, {
        method: 'PUT',
        data,
      }),
    start: (id: string) =>
      apiRequest<AccessProvisionRecord>(`/api/access/${id}/start`, {
        method: 'POST',
      }),
    complete: (id: string) =>
      apiRequest<AccessProvisionRecord>(`/api/access/${id}/complete`, {
        method: 'POST',
      }),
  },
  createOnboardingDraft: (data: FormData) =>
  apiRequest<OnboardingFormRecord>('/api/onboarding', {
      method: 'POST',
      data,
    }),
  getOnboardingDraft: (id: string) =>
    apiRequest<OnboardingFormRecord>(`/api/onboarding/${id}`),
  updateOnboardingDraft: (id: string, data: FormData) =>
    apiRequest<OnboardingFormRecord>(`/api/onboarding/${id}`, {
      method: 'PUT',
      data,
    }),
  deleteOnboardingDraft: (id: string) =>
    apiRequest<{ id: string }>(`/api/onboarding/${id}`, {
      method: 'DELETE',
    }),
  submitOnboarding: (id: string) =>
    apiRequest<OnboardingFormRecord>(`/api/onboarding/${id}/submit`, {
      method: 'POST',
    }),
  tracking: {
    getWorkflowHistory: (referralId: string) =>
      apiRequest<WorkflowHistoryRecord>(`/api/tracking/workflow-history/${referralId}`),
    getActivityFeed: (params?: { limit?: number; since?: string }) =>
      apiRequest<ActivityFeedItem[]>('/api/tracking/activity-feed', {
        params,
      }),
    getCandidateTracking: (candidateId: string) =>
      apiRequest<ApiRecord>(`/api/tracking/${candidateId}`),
    requestExtension: (data: { candidateId: string; reason: string; requestedDays: number }) =>
      apiRequest<ExtensionRequestRecord>('/api/tracking/extension-request', {
        method: 'POST',
        data,
      }),
    approveExtension: (id: string, comments?: string) =>
      apiRequest<ExtensionRequestRecord>(`/api/tracking/extension-request/${id}/approve`, {
        method: 'POST',
        data: { comments },
      }),
    rejectExtension: (id: string, comments?: string) =>
      apiRequest<ExtensionRequestRecord>(`/api/tracking/extension-request/${id}/reject`, {
        method: 'POST',
        data: { comments },
      }),
  },
};
