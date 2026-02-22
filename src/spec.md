# Specification

## Summary
**Goal:** Fix user approval flow by properly mapping requestedRole between backend and frontend, and update user management UI to display complete user information with personalized client dashboard.

**Planned changes:**
- Transform backend requestedRole strings (lowercase) to Title Case labels in UI display ('client' → 'Client', 'asistenmu' → 'Asistenmu', 'admin' → 'Admin')
- Fix Approve button to send principalId with lowercase requestedRole to backend and add loading spinner during blockchain transaction
- Update user management table to display all user details: Name, Business, City, WhatsApp, Requested Role, and Principal ID (monospace font)
- Integrate getCurrentUser() in Client Dashboard to display personalized greeting with user's name (fallback to 'Client' if unavailable)
- Implement task metrics in Client Dashboard by fetching from getClientTasks() and counting by status: 'Client Review', 'Sedang Dikerjakan', and 'Completed'
- Maintain Boutique theme consistency (bg-[#FDFCFB], thin gold shadows, Midnight Slate text) across all updated components

**User-visible outcome:** Admins can successfully approve pending users without "Invalid requested role" errors, see complete user information in the management table with proper role labels, and clients see personalized dashboard with their name and accurate task metrics based on task status.
