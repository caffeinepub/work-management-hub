# Specification

## Summary
**Goal:** Fix user data retrieval and filtering logic in the user management system by adding a backend query for all users and correcting Motoko variant handling in the frontend.

**Planned changes:**
- Add getAllUsers() query function to backend with admin authorization check
- Update UserManagementPage.tsx to fetch user data from backendActor.getAllUsers()
- Fix status and role filtering logic to properly handle Motoko variants using 'in' operator instead of === comparisons

**User-visible outcome:** Admin users can view accurate user lists with correct filtering for Pending, Internal Active, Partner Active, and Client Active users in the user management page.
