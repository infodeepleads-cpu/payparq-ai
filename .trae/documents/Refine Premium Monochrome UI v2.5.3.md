I will implement the following UI refinements:

1. **Premium Gray Update**: Change `sidebarBackground` to `#3D3D3D` in [theme.dart](file:///c:/Users/karlo/OneDrive/Pictures/Desktop/payparq.ai/apps/mobile-scanner/lib/theme.dart).
2. **Header Reorganization**:
   - In [main_scaffold.dart](file:///c:/Users/karlo/OneDrive/Pictures/Desktop/payparq.ai/apps/mobile-scanner/lib/main_scaffold.dart), move the `_buildTopLocationSelector` logic into the top black header.
   - Remove the "Deploy" button from the top header.
   - Delete the `_buildTopLocationSelector` widget and its container from the main content column.
3. **Dashboard Cleanup**:
   - In [admin_dashboard_screen.dart](file:///c:/Users/karlo/OneDrive/Pictures/Desktop/payparq.ai/apps/mobile-scanner/lib/screens/admin/admin_dashboard_screen.dart), remove the "Deploy" button next to the Dashboard title.

Shall I execute these changes?