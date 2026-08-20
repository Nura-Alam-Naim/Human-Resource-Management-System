# Phase 7 Execution Checklist

- `[x]` **1. Database Schema**
  - Add `internal_messages` to `db.js` initialization.
  - Run `node db.js` to create the table.

- `[x]` **2. Backend API**
  - Update `messageController.js` to handle targeted messaging and "Admin Pool" logic.
  - Add logic to fetch conversations list (unique contacts) per user.
  - Add unread count endpoint.
  - Route configurations.

- `[x]` **3. Frontend Chat Interface**
  - Refactor `Messages.jsx` into split pane.
  - Add New Message dropdown with logic filtering (Employee -> Manager/Admin, Manager -> Dept/Admin/Managers, Admin -> All).
  - Implement Admin claiming logic and UI lockout.
  - Add polling for real-time updates.

- `[x]` **4. Navbar Integration**
  - Add unread badge.
  - Add polling to Navbar for global unread count.

- `[x]` **5. Directory Integration**
  - Add "Message" buttons to `AllEmployees.jsx` and `DepartmentView.jsx` linking to `Messages.jsx`.
