# Specification

## Summary
**Goal:** Fix authorization in user role assignment and approval workflow to allow Superadmin access alongside Admin.

**Planned changes:**
- Update the role assignment helper function authorization logic to accept both 'superadmin' and 'admin' roles (case-insensitive)
- Audit and fix all helper functions in the user approval/rejection workflow to allow both 'superadmin' and 'admin' roles
- Ensure case-insensitive role comparison using lowercase string values

**User-visible outcome:** Superadmin users can now successfully assign roles and perform user approval/rejection actions without authorization errors.
