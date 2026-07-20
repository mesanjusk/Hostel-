export interface CountedValue {
  value: string;
  count: number;
}

export interface DateRangeDTO {
  start: string;
  end: string;
}

export interface OverviewResponse {
  range: DateRangeDTO;
  visitors: { totalVisitors: number; uniqueVisitors: number; newVisitors: number; returningVisitors: number };
  activity: { activeToday: number; activeYesterday: number; activeThisWeek: number; activeThisMonth: number; onlineNow: number };
  sessions: {
    sessionCount: number;
    avgSessionDurationSeconds: number;
    bounceRate: number;
    pagesPerSession: number;
    entryPages: CountedValue[];
    exitPages: CountedValue[];
    landingPages: CountedValue[];
  };
}

export interface EngagementResponse {
  range: DateRangeDTO;
  pages: {
    mostVisited: CountedValue[];
    leastVisited: CountedValue[];
    avgScroll: { page: string; avgScrollPercent: number }[];
    avgTimeOnPage: { page: string; avgSeconds: number }[];
  };
  interactions: {
    mostClickedButtons: CountedValue[];
    deadClickCount: number;
    formInteractions: CountedValue[];
  };
}

export interface TechResponse {
  range: DateRangeDTO;
  tech: {
    devices: CountedValue[];
    browsers: CountedValue[];
    os: CountedValue[];
    languages: CountedValue[];
    timezones: CountedValue[];
    screenResolutions: CountedValue[];
  };
}

export interface GeoResponse {
  range: DateRangeDTO;
  geo: { countries: CountedValue[]; states: CountedValue[]; cities: CountedValue[] };
}

export interface ReferralResponse {
  range: DateRangeDTO;
  referral: {
    referralSources: CountedValue[];
    campaignPerformance: {
      campaign: string;
      source: string | null;
      medium: string | null;
      visitors: number;
      conversions: number;
      conversionRate: number;
    }[];
  };
}

export interface IdentityResponse {
  range: DateRangeDTO;
  identity: {
    newAnonymousUsers: number;
    returningAnonymousUsers: number;
    newRegisteredUsers: number;
    returningRegisteredUsers: number;
    totalAnonymousUsers: number;
    totalRegisteredUsers: number;
  };
}

export interface FunnelStep {
  key: string;
  label: string;
  users: number;
  conversionFromStart: number;
  dropOffFromPrevious: number;
  avgTimeFromPreviousSeconds: number | null;
}

export interface RegistrationFunnelResponse {
  range: DateRangeDTO;
  funnel: {
    steps: FunnelStep[];
    detected: {
      openedRegistrationButLeft: number;
      enteredMobileButClosed: number;
      otpFailed: number;
      otpTimeout: number;
      registrationAbandoned: number;
      registrationSuccess: number;
    };
  };
}

export interface LoginResponse {
  range: DateRangeDTO;
  login: {
    loginSuccess: number;
    loginFailed: number;
    forgotPasswordRequests: number;
    otpLoginSuccess: number;
    usersWithMultipleFailedAttempts: number;
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    inactiveUsers: number;
    totalRegisteredUsers: number;
    totalAnonymousUsers: number;
  };
}

export interface BehaviorResponse {
  range: DateRangeDTO;
  pageLoad: {
    pages: { page: string; avgLoadMs: number; samples: number }[];
    slowPages: { page: string; avgLoadMs: number; samples: number }[];
  };
  navigation: {
    transitions: CountedValue[];
    commonPaths: CountedValue[];
    firstPages: CountedValue[];
    lastPages: CountedValue[];
  };
}

export interface RetentionResponse {
  retention: {
    retention: { windowDays: number; eligibleVisitors: number; retainedVisitors: number; retentionRate: number }[];
    returningUsers: number;
    totalVisitorsInWindow: number;
    cohorts: { cohortWeek: string; cohortSize: number; weeks: { weekIndex: number; retentionRate: number }[] }[];
  };
}

export interface BusinessResponse {
  range: DateRangeDTO;
  business: {
    /** Has actually linked a mobile number — excludes still-anonymous accounts. */
    registeredUsers: number;
    anonymousUsers: number;
    newRegisteredUsersToday: number;
    newAnonymousUsersToday: number;
    activeUsers: number;
    inactiveUsers: number;
    conversionRates: { visitorToRegistration: number; registrationToLogin: number; loginToActivation: number };
    repeatUsersRate: number;
  };
}

export interface RealtimeResponse {
  realtime: {
    onlineCount: number;
    liveVisitors: {
      visitorId: string;
      page: string | null;
      country: string | null;
      device: string | null;
      browser: string | null;
      loggedIn: boolean;
      lastSeen: string;
    }[];
    recentRegistrations: { timestamp: string; country: string | null; device: string | null }[];
    recentLogins: { timestamp: string; country: string | null; device: string | null }[];
  };
}
