# HRMS Phase 5: Employee Profiles & Document Management

## 1. Database Migration
- `[x]` Add `documents` table creation to `backend/db.js`
- `[x]` Add `profile_picture` column to `users` table via `backend/db.js`

## 2. Backend API Adjustments
- `[x]` Update `backend/controllers/employee/documentsController.js` to handle profile picture uploads
- `[x]` Add delete document endpoint logic
- `[x]` Ensure `backend/routes/employee/documentsRoute.js` has all necessary endpoints

## 3. Frontend UI: My Documents
- `[x]` Add "My Documents" section in `frontend/src/pages/UserProfile.jsx`
- `[x]` Create `frontend/src/components/DocumentUploadModal.jsx` (or handle inline)

## 4. Profile Pictures
- `[x]` Display user avatar in `frontend/src/components/Navbar.jsx`
- `[x]` Allow avatar upload in `frontend/src/pages/UserProfile.jsx`
