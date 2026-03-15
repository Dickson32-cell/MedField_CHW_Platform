# Role-Based Dashboard Implementation

## Summary
Implemented role-based dashboard views for the MedField CHW Platform, showing different interfaces based on user role (CHW/Field Officer vs Supervisor/Admin).

## Backend Changes (Aegis)

### 1. JWT Token Enhancement
**File:** `backend/src/routes/auth.js`
- Modified `generateTokens()` to include user role in JWT payload
- Both access and refresh tokens now contain: `{ userId, role }`

### 2. Auth Middleware Update
**File:** `backend/src/middleware/auth.js`
- Added `req.userRole` to store role for easy access in routes
- Role is extracted from JWT and attached to request object

### 3. Role-Based Dashboard Stats Endpoint
**File:** `backend/src/server.js`
- Enhanced `/api/dashboard/stats` to return role-specific data:
  - **CHW**: Shows assigned patients, households, personal visits/tasks
  - **Supervisor/Admin**: Shows system-wide statistics

### 4. New CHW-Specific Endpoints
**File:** `backend/src/server.js`
- `GET /api/dashboard/chw/assigned-patients` - Returns CHW's assigned patients
- `GET /api/dashboard/chw/today-tasks` - Returns tasks due today for CHW
- `GET /api/dashboard/chw/quick-patient-search` - Quick patient search for CHWs

## Frontend Changes (Athena)

### 1. Type Definitions Updated
**File:** `dashboard/src/types/index.ts`
- Added `CHWDashboardStats` interface
- Added `SupervisorDashboardStats` interface
- Updated `User` role to include `district_officer`
- Created union type `DashboardStats = CHWDashboardStats | SupervisorDashboardStats`

### 2. CHW Dashboard Component Created
**File:** `dashboard/src/pages/CHWDashboard.tsx`
- New component with CHW-specific view:
  - Assigned patients count
  - Assigned households count
  - Today's visits
  - Pending tasks
  - Today's tasks table
  - My patients list (top 5)
  - Quick action buttons (Log Visit, Search Patient, etc.)

### 3. Main Dashboard Updated
**File:** `dashboard/src/pages/Dashboard.tsx`
- Detects user role from auth state
- Renders `CHWDashboard` for CHW role
- Renders original dashboard for supervisor/admin roles

### 4. API Service Extended
**File:** `dashboard/src/services/api.ts`
- Added `getAssignedPatients()` method
- Added `getTodayTasks()` method
- Added `quickPatientSearch()` method

### 5. Sidebar Made Role-Aware
**File:** `dashboard/src/components/Sidebar.tsx`
- Different menu items based on role:
  - **Supervisor**: Full menu (Dashboard, Patients, CHWs, Visits, Tasks, Referrals, Reports, Map)
  - **CHW**: Simplified menu (Dashboard, My Patients, Log Visit, My Tasks, Referrals, Map)
- Dynamic header text based on role

### 6. App Router Updated
**File:** `dashboard/src/App.tsx`
- Added role-based route access control
- CHW users cannot access `/chws` and `/reports` routes
- Type-safe user state management

### 7. Custom Hooks Added
**File:** `dashboard/src/hooks/useQueries.ts`
- `useAssignedPatients()` - Fetch CHW's assigned patients
- `useTodayTasks()` - Fetch CHW's tasks for today

### 8. Visit Logging Form Created
**File:** `dashboard/src/pages/VisitLogForm.tsx`
- New component for CHWs to log patient visits
- Features:
  - Patient search with autocomplete
  - Visit type selection
  - Symptom checkboxes
  - Notes textarea
  - Form validation

### 9. Visits Page Enhanced
**File:** `dashboard/src/pages/Visits.tsx`
- CHW view shows "Log Visit" button and recent visits
- Supervisor view shows all visits
- Integrated VisitLogForm for CHWs

### 10. Login Page Updated
**File:** `dashboard/src/pages/Login.tsx`
- Changed subtitle from "Supervisor Dashboard" to "CHW Platform"

## Testing

### To Test:
1. **Start Backend:**
   ```bash
   cd "E:\programable file for school\development\MedField_CHW_Platform\backend"
   npm start
   # Or restart Docker: docker-compose restart medfield-api
   ```

2. **Start Dashboard:**
   ```bash
   cd "E:\programable file for school\development\MedField_CHW_Platform\dashboard"
   npm run dev
   # Or restart Docker: docker-compose restart medfield-dashboard
   ```

3. **Test as CHW:**
   - Login with CHW credentials
   - Should see simplified dashboard with:
     - Assigned Patients stat
     - Households stat
     - Today's Visits
     - Pending Tasks
     - Today's Tasks table
     - My Patients list
     - Quick action buttons
   - Sidebar should show CHW menu
   - Cannot access CHWs management page
   - Cannot access Reports page

4. **Test as Supervisor:**
   - Login with supervisor credentials
   - Should see original dashboard with:
     - Total CHWs stat
     - Total Patients stat
     - Total Households stat
     - System-wide stats
   - Sidebar shows full menu
   - Can access all pages

## API Response Examples

### CHW Login Response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "...",
      "username": "chw_user",
      "role": "chw",
      ...
    },
    "accessToken": "jwt_with_role_claim",
    "refreshToken": "jwt_with_role_claim"
  }
}
```

### CHW Dashboard Stats:
```json
{
  "success": true,
  "data": {
    "assigned_patients": 45,
    "assigned_households": 38,
    "today_visits": 5,
    "pending_tasks": 3,
    "pending_referrals": 2,
    "completed_visits_month": 42,
    "role": "chw"
  }
}
```

### Supervisor Dashboard Stats:
```json
{
  "success": true,
  "data": {
    "total_chws": 24,
    "total_patients": 450,
    "total_households": 380,
    "today_visits": 67,
    "pending_tasks": 89,
    "pending_referrals": 23,
    "completed_visits_month": 520,
    "role": "supervisor"
  }
}
```

## Security Notes
- Role is embedded in JWT token (signed, cannot be tampered)
- Backend validates role on every request via auth middleware
- CHW endpoints return 403 for non-CHW users
- Frontend route protection prevents unauthorized access
- Patient/task queries are filtered by CHW ID for data isolation

## Next Steps (Optional Enhancements)
1. Add patient assignment UI for supervisors
2. Implement visit scheduling calendar for CHWs
3. Add offline mode support for field workers
4. Create CHW performance analytics dashboard for supervisors
5. Add push notifications for task assignments
