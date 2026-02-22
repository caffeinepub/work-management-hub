# Specification

## Summary
**Goal:** Create a self-contained service activation form modal with reactive calculations for Finance/Superadmin users.

**Planned changes:**
- Build ActivateServiceModal component using React State and Tailwind CSS with semi-transparent overlay
- Add five form fields in order: Client dropdown (PT Maju, CV Sejahtera), Asistenmu dropdown (Budi, Siti), Service Type dropdown (Tenang, Rapi, Fokus, Jaga, Efisien), Unit Quantity input, Price Per Unit input
- Display reactive helper text below Unit Quantity showing "Setara dengan [Units * 2] Jam Efektif" in gray
- Display reactive GMV calculation below Price input showing "Total Tagihan (GMV): Rp [Units * Price]" in bold primary color with thousand separators
- Auto-format Price input display with thousand separators (dots) while maintaining numeric state
- Implement validation: all fields required, unit quantity ≥ 1, price > 0
- Add "Batal" button (outline/ghost) to close modal and "Aktifkan Layanan" button (solid primary) with TODO comment for backend integration
- Style with clean, minimalist design using generous spacing and smooth borders

**User-visible outcome:** Finance and Superadmin users can open a modal form to activate services by selecting clients, staff, service types, specifying quantities and prices, with real-time calculations showing effective hours and total billing amount with proper thousand separator formatting.
