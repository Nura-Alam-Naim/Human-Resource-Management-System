# Secure Password Management Implementation Plan

This plan outlines the migration from plain-text passwords to secure hashes, and the implementation of a forced password reset for users logging in with the default password.

## 1. Backend: Password Hashing Integration
- **Dependency**: Install `bcryptjs` for secure password hashing.
- **Login Controller (`authController.js`)**: 
  - Update the `login` logic to verify passwords using `bcrypt.compare`.
  - **Migration Support**: For existing database entries that are still plain-text, if the hash check fails, we will check if the database string directly equals the provided password. 
  - If the user's password resolves to the default `'123456'`, the login response will include a `requiresPasswordChange: true` flag along with the standard `success: true`.
- **Change Password Controller (`authController.js`)**: 
  - Update `changePassword` to verify the old password (handling both hashed and plain-text fallbacks).
  - Hash the `newPassword` using `bcrypt.hash` before saving it to the database.
- **User Creation Controllers (`adminRoutes.js`)**:
  - Update the logic in `createStudent`, `createFaculty`, and `createAdmin` to generate a `bcrypt` hash of the default `'123456'` password before inserting it into the database.

## 2. Frontend: Enforced Password Change Flow
- **Auth Context (`AuthContext.jsx`)**: 
  - Update the state to track `requiresPasswordChange`. The `/api/me` endpoint will also evaluate if the user's password is the default and pass this flag down on page refresh.
- **New Page (`ForceChangePassword.jsx`)**: 
  - Create a dedicated, unskippable page that displays the `ChangePassword` component.
- **Routing Protection (`App.jsx` / `AuthContext.jsx`)**:
  - Implement a routing interceptor: if a user is authenticated but `requiresPasswordChange` is `true`, any attempt to access their dashboard will forcefully redirect them to the `/force-change-password` page.
  - Once the password is successfully changed, the flag is cleared, and the user is redirected to their respective dashboard.

## Verification Plan
1. **New User Hash**: Create a new student/faculty via the Admin panel and verify the database now contains a hashed string instead of `'123456'`.
2. **Forced Reset Trigger**: Log in with an account using the default password and verify the system intercepts the dashboard load and forces the password change screen.
3. **Bypass Check**: Attempt to manually change the URL to `/dashboard` while the password change is required, and ensure the app redirects back.
4. **Successful Reset**: Complete the password reset, verify the database now stores the new hash, and ensure the user is seamlessly logged into their dashboard.
