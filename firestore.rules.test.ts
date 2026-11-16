/**
 * Security Rules Verification Suite for Aboki BDC Firestore Rules
 * Verifies that all Dirty Dozen adversarial payloads are rejected with PERMISSION_DENIED.
 */

export interface SecurityTestCase {
  id: number;
  name: string;
  collection: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  auth: { uid: string; email?: string; email_verified?: boolean } | null;
  payload?: Record<string, unknown>;
  expected: 'PERMISSION_DENIED';
}

export const dirtyDozenTests: SecurityTestCase[] = [
  {
    id: 1,
    name: 'Shadow Field Injection on cities',
    collection: 'cities/city-abuja',
    operation: 'create',
    auth: { uid: 'admin-1', email: 'mustaphashehuyana@gmail.com', email_verified: true },
    payload: { name: 'Abuja', is_active: true, shadow_field: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Unverified Admin Email Spoof',
    collection: 'cities/city-abuja',
    operation: 'create',
    auth: { uid: 'spoof-1', email: 'mustaphashehuyana@gmail.com', email_verified: false },
    payload: { name: 'Abuja', is_active: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Self-Assigned Super Admin Role',
    collection: 'user_roles/role-hack',
    operation: 'create',
    auth: { uid: 'attacker-1', email: 'attacker@example.com', email_verified: true },
    payload: { user_id: 'attacker-1', role: 'super_admin' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'PII Profile Scraping by Non-Owner',
    collection: 'profiles/victim-uid',
    operation: 'get',
    auth: { uid: 'attacker-1', email: 'attacker@example.com', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'Oversized String on branches',
    collection: 'branches/branch-1',
    operation: 'create',
    auth: { uid: 'admin-1', email: 'mustaphashehuyana@gmail.com', email_verified: true },
    payload: {
      city_id: 'city-1',
      name: 'Office',
      address: 'A'.repeat(1000),
      operating_hours: '8AM-5PM',
      is_active: true,
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Invalid Path ID Poisoning',
    collection: 'cities/invalid id with spaces!',
    operation: 'create',
    auth: { uid: 'admin-1', email: 'mustaphashehuyana@gmail.com', email_verified: true },
    payload: { name: 'Lagos', is_active: true },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Negative Rate Poisoning on branch_rates',
    collection: 'branch_rates/rate-1',
    operation: 'create',
    auth: { uid: 'admin-1', email: 'mustaphashehuyana@gmail.com', email_verified: true },
    payload: { branch_id: 'b1', currency_id: 'c1', buy_rate: -100, sell_rate: 1600 },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Unauthorized Branch Rate Update',
    collection: 'branch_rates/rate-1',
    operation: 'update',
    auth: { uid: 'random-user', email: 'user@example.com', email_verified: true },
    payload: { branch_id: 'b1', currency_id: 'c1', buy_rate: 1500, sell_rate: 1600 },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Invalid Enum on rate_alerts',
    collection: 'rate_alerts/alert-1',
    operation: 'create',
    auth: null,
    payload: {
      subscription_id: 'sub-1',
      currency: 'USD',
      target_rate: 1500,
      alert_type: 'invalid_enum',
      enabled: true,
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Ghost Key Update on currencies',
    collection: 'currencies/curr-usd',
    operation: 'update',
    auth: { uid: 'admin-1', email: 'mustaphashehuyana@gmail.com', email_verified: true },
    payload: { code: 'USD', name: 'US Dollar', is_active: true, ghost: 'injected' },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Out-of-Range Rating on reviews',
    collection: 'reviews/rev-1',
    operation: 'create',
    auth: null,
    payload: {
      branch_id: 'abuja-wuse',
      userId: 'u1',
      userName: 'Tester',
      rating: 10,
      comment: 'Invalid star rating',
      date: '2026-11-09',
      helpful: 0,
    },
    expected: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Unprotected Catch-All Collection Access',
    collection: 'unknown_collection/doc-1',
    operation: 'get',
    auth: { uid: 'admin-1', email: 'mustaphashehuyana@gmail.com', email_verified: true },
    expected: 'PERMISSION_DENIED',
  },
];
