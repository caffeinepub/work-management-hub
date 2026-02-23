# Specification

## Summary
**Goal:** Fix user approval synchronization between Dashboard and User Management page, and ensure backend correctly assigns roles based on requestedRole during approval.

**Planned changes:**
- Remove manual status filtering in UserManagementPage.tsx for pending users, display data directly from actor.listApprovals()
- Update backend approveUser function to extract requestedRole from user profile, set status to active, and assign the role to match requestedRole
- Add query invalidation in UserManagementTable.tsx after approveUser to automatically refresh both ['allUsers'] and ['approvals'] data

**User-visible outcome:** When a Superadmin approves a pending user, the user immediately moves from the "User Pending" card to the correct role category card without manual refresh, and pending counts match between Dashboard and User Management page.
