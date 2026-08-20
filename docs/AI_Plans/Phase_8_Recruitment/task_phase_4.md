# HRMS Phase 4: System Reliability, Validation & DevOps

## 1. Docker Containerization (DevOps)
- `[x]` Create `docker-compose.yml` (Root)
- `[x]` Create `backend/Dockerfile`
- `[x]` Create `frontend/Dockerfile`
- `[x]` Configure env files for Docker setup

## 2. Leave Balance Restoration (Business Logic Fix)
- `[x]` Modify `backend/controllers/employee/leavesController.js` (Restore balance on user cancellation)
- `[x]` Modify `backend/controllers/manager/leavesController.js` (Restore balance if a manager changes an approved leave to rejected)
- `[x]` Modify `backend/controllers/admin/leavesController.js` (Restore balance on admin revocation)

## 3. Backend Input Validation
- `[x]` Add `express-validator` middleware
- `[x]` Create `backend/middleware/validators.js` (Rules for Leave Application)
- `[x]` Apply validators in `backend/routes/employee/leavesRoute.js`

## 4. Frontend Error Boundaries
- `[x]` Create `frontend/src/components/ErrorBoundary.jsx`
- `[x]` Wrap application in `ErrorBoundary` inside `frontend/src/App.jsx`
