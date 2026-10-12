# Implementation Plan - Phone Verification & Page Tracking

## 1. Phone Verification Flow
- **Verify-Mobile Page**: 
    - Keep it as the entry point.
    - Upon submitting, redirect to `phone-otp.tsx`.
    - I will check if "approvals" needs to be changed to "phone otp status" in the database/Firebase logic.
- **Phone-OTP Page**:
    - This page already listens for `phoneOtpApprovalStatus`. I will ensure this is the correct field.
    - Upon approval, it should redirect to `nafath-login.tsx`.

## 2. Page Tracking (Current Page)
- Ensure every page (especially those not yet updated) calls `handleCurrentPage` in its `useEffect` to ensure correct tracking in the sidebar/progress monitoring.

## 3. Repetitive Information Cleanup
- Identify and remove redundant elements from the `VerifyMobilePage` and `PhoneOtpPage` UI.

---
**Next Actions**:
1. Review `verify-mobile.tsx` to identify repetitive info.
2. Review `phone-otp.tsx` and Firebase integrations to confirm the status field name.
3. Apply changes.
