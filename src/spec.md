# Specification

## Summary
**Goal:** Enable self-registration for users and unlock profile checking without authorization restrictions.

**Planned changes:**
- Remove AccessControl authorization check from getCallerUserProfile function so any authenticated user can query their own profile
- Add selfRegisterClient function allowing anonymous users to register as client with pending status
- Add selfRegisterPartner function allowing anonymous users to register as partner with pending status
- Add selfRegisterInternal function allowing anonymous users to register as internal staff (admin, finance, concierge, asistenmu, strategicPartner) with pending status and role validation

**User-visible outcome:** Users can check their own profile without restrictions and self-register for client, partner, or internal staff roles with pending approval status. Registration attempts by already-registered users will be rejected with appropriate error messages in Indonesian.
