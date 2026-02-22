# Specification

## Summary
**Goal:** Implement task status management, financial completion triggers, and client view masking for the Work Management Hub.

**Planned changes:**
- Add updateTaskStatus function to manage revision cycles (OnProgress → InQA → ClientReview → Revision → OnProgress)
- Add completeTask function as financial trigger that burns units from layanan.jamOnHold and calculates partner payments based on jamEfektif and partner level (Junior: 35k, Senior: 55k, Expert: 75k)
- Add getClientTasks query function that masks PendingPartner and RejectedByPartner statuses as 'Sedang Didelegasikan' and excludes internalData field from client view

**User-visible outcome:** Account Managers can update task statuses through revision cycles and mark tasks as complete with automated financial calculations. Clients can view their tasks with user-friendly status labels while sensitive rejection information and internal data remain hidden.
