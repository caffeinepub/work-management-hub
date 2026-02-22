# Specification

## Summary
**Goal:** Fix infinite loading spinner bug in user management page and upgrade service activation dropdowns to searchable comboboxes for better scalability.

**Planned changes:**
- Wrap all backend data fetch calls in UserManagementPage component with try-catch-finally blocks to prevent infinite loading states
- Display error messages via toast notifications when data fetching fails
- Convert "Pilih Client" dropdown in ActivateServiceModal to searchable/autocomplete combobox that filters users by name while submitting user ID
- Convert "Pilih Asistenmu" dropdown in ActivateServiceModal to searchable/autocomplete combobox that filters users by name while submitting user ID

**User-visible outcome:** User management page loads properly without getting stuck on loading spinner, and service activation form dropdowns support typing to search and filter users by name, making it easier to select from large user lists.
