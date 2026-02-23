# Specification

## Summary
**Goal:** Fix access-control.mo to properly recognize and authorize Superadmin role from main.mo role system.

**Planned changes:**
- Add #superadmin variant to UserRole enum in backend/access-control.mo
- Update isAdmin function to return true for both #admin and #superadmin roles
- Implement state synchronization to ensure Superadmin Principal is assigned #superadmin role in AccessControlState, bypassing isAdmin check when caller is Superadmin from main.mo

**User-visible outcome:** Superadmin users can successfully perform admin operations without authorization traps, particularly when assigning roles through the assignRole function.
