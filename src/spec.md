# Specification

## Summary
**Goal:** Add pending user approval feature to the Internal Dashboard for admins and superadmins.

**Planned changes:**
- Add state management for pending users list and loading state
- Implement function to fetch pending user registration requests
- Add approval handler that approves user and refreshes list
- Add rejection handler with confirmation dialog that removes user and refreshes list
- Replace Admin Panel card placeholder with table/list showing pending users with their name, requested role, and action buttons
- Display empty state message when no pending requests exist
- Only fetch and display pending users for admin and superadmin roles

**User-visible outcome:** Admins and superadmins can view pending user registration requests in the Admin Panel card and approve or reject them with action buttons. The list updates automatically after each action.
