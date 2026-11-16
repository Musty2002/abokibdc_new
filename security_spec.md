# Aboki BDC Firestore Security Specification (`security_spec.md`)

## 1. Data Invariants & Access Model

1. **Public Reference Collections (`cities`, `currencies`, `branches`, `branch_rates`, `reviews`)**:
   - Anyone can read active cities, currencies, branches, branch rates, and branch reviews so the public mobile/web app displays exchange rates without requiring customer login.
   - Only verified Super Admins (`isAdmin()`) can create, update, or delete `cities`, `currencies`, and `branches`.
   - `branch_rates` can be created/updated/deleted by `isAdmin()` OR by a verified `branch_admin` (`isBranchAdminFor(branchId)`).
   - Every write must pass strict key allowlists (`hasAll` + `hasOnly`), string length bounds (`.size()`), and valid path ID regex (`isValidId()`).

2. **PII & Admin Access Control Collections (`profiles`, `user_roles`, `branch_admins`, `notification_logs`)**:
   - `profiles/{userId}` contains PII (`email`, `full_name`) and is strictly isolated: readable only by the profile owner (`request.auth.uid == userId`) or `isAdmin()`.
   - `user_roles/{roleId}` and `branch_admins/{assignmentId}` can only be mutated by `isAdmin()` (preventing self-assigned privilege escalation). Users can only read their own role/assignment or all if `isAdmin()`.
   - `notification_logs/{logId}` is strictly restricted to `isAdmin()`.

3. **Customer Subscription & Alert Collections (`push_subscriptions`, `rate_alerts`)**:
   - `push_subscriptions/{subId}` and `rate_alerts/{alertId}` validate schema keys and string/number bounds strictly on creation and update.

## 2. The "Dirty Dozen" Adversarial Payloads

1. **Shadow Field Injection on `cities`**: `{ "name": "Abuja", "is_active": true, "isAdmin": true }` → Denied by `hasOnly`.
2. **Unverified Admin Email Spoof**: Token with `email: "mustaphashehuyana@gmail.com"` and `email_verified: false` attempting to write to `/cities/city-1` → Denied by `email_verified == true`.
3. **Self-Assigned Super Admin Role**: Non-admin user creating `/user_roles/role-hack` with `{ "user_id": "attacker", "role": "super_admin" }` → Denied by `isAdmin()`.
4. **PII Profile Scraping**: Authenticated user `uid_A` attempting `get` or `list` on `/profiles/uid_B` → Denied by `isOwner(userId) || isAdmin()`.
5. **Denial-of-Wallet Oversized String on `branches`**: `address` field with 5,000 characters → Denied by `data.address.size() <= 300`.
6. **ID Poisoning Attack**: Creating a document with path ID containing spaces or special characters → Denied by `isValidId(id)`.
7. **Negative / Invalid Rate Poisoning on `branch_rates`**: `{ "branch_id": "b1", "currency_id": "c1", "buy_rate": -500, "sell_rate": "invalid" }` → Denied by `buy_rate is number && buy_rate >= 0`.
8. **Unauthorized Branch Rate Modification**: Authenticated non-admin user attempting to update `/branch_rates/rate-1` → Denied by `isAdmin() || isBranchAdmin()`.
9. **Invalid Enum on `rate_alerts`**: `alert_type: "sideways"` → Denied by `data.alert_type in ['above', 'below']`.
10. **Ghost Key Update on `currencies`**: Updating `/currencies/curr-usd` with an extra key `hacked: 1` → Denied by `isValidCurrency(incoming())` and `hasOnly`.
11. **Out-of-Range Rating on `reviews`**: Submitting a review with `rating: 99` or empty `comment` → Denied by `data.rating >= 1 && data.rating <= 5 && data.comment.size() >= 1`.
12. **Unprotected Catch-All Path Access**: Reading or writing `/unregistered_collection/doc1` → Denied by global catch-all `allow read, write: if false;`.
