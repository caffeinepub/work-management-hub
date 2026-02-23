# Specification

## Summary
**Goal:** Fix the superadmin claim authorization issue by adding the #superadmin role variant to the access-control module and updating authorization logic to recognize superadmin privileges.

**Planned changes:**
- Add #superadmin variant to the UserRole enum in backend/access-control.mo
- Update the isAdmin function to return true for both #admin and #superadmin roles
- Ensure the Superadmin principal is automatically assigned the #superadmin role in AccessControlState when claiming superadmin privileges, either through AccessControl.assignRole after role assignment or by implementing a bypass mechanism for the initial superadmin claim

**User-visible outcome:** The first superadmin can successfully claim their privileges without encountering the "Unauthorized: Only admins can assign user roles" error, and all subsequent role assignments by the superadmin work correctly.
