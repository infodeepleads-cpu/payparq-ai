I will transform the **User Web App** into a fully functional dashboard and clean up the build artifacts.

1. **Clean Build Artifacts**:

   * Run `Remove-Item -Recurse -Force .next` in `apps/admin-dashboard`.

   * Run `Remove-Item -Recurse -Force .next` in `apps/user-web-app`.

2. **Implement User Home Dashboard (`apps/user-web-app/src/app/page.tsx`)**:

   * **Layout**: Create a responsive layout with a fixed **Left Sidebar** and **Main Content Area**.

   * **Sidebar**: Add navigation items (Home, History, Payment, Vehicles).

   * **Main Content**:

     * **Active Session Card**: Highlight the current parking status with a timer and "Extend" action.

     * **History Section**: Display a detailed list of past parking sessions (Zone, Duration, Cost).

   * **Style**: Apply the shared **Tactical Theme** (Dark Indigo/Violet) for consistency.

