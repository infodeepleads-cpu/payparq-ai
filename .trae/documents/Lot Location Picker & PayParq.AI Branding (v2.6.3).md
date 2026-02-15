I will implement the **Lot Location Picker** widget and update the platform branding to **PayParq.AI**.

### **1. Core Infrastructure & Branding**
- **Dependencies**: Add `flutter_map`, `latlong2`, `geolocator`, and `http` to `pubspec.yaml` to enable professional, free mapping and geolocation features.
- **Branding Update**: Systematically update all UI references from `payparq.ai` to **PayParq.AI** across the [Main Scaffold](file:///c:/Users/karlo/OneDrive/Pictures/Desktop/payparq.ai/apps/mobile-scanner/lib/main_scaffold.dart), [Auth Screen](file:///c:/Users/karlo/OneDrive/Pictures/Desktop/payparq.ai/apps/mobile-scanner/lib/screens/auth_screen.dart), [Settings](file:///c:/Users/karlo/OneDrive/Pictures/Desktop/payparq.ai/apps/mobile-scanner/lib/screens/settings_screen.dart), and [Loading Screen](file:///c:/Users/karlo/OneDrive/Pictures/Desktop/payparq.ai/apps/mobile-scanner/lib/widgets/pulsating_loading_screen.dart).

### **2. Lot Location Picker Widget**
- **New Widget**: Create a dedicated `LotLocationPicker` widget using `flutter_map` with OpenStreetMap (OSM) tiles.
- **Features**:
    - **Free Address Search**: Integrated search bar using the Nominatim API (free) to find and snap to addresses.
    - **Interactive Map**: Display a marker at the selected location.
    - **Marker Precision**: Allow users to long-press or drag the marker to fine-tune the exact Latitude and Longitude.
    - **Current Location**: A "Snap to My Position" button using the device's GPS (`geolocator`).
- **Data Integration**: Automatically update the `lat` and `lng` values in the "Add Lot" form when the map position changes.

### **3. Locations Screen Integration**
- **Form Upgrade**: Replace the basic address text field in the [Add Location Dialog](file:///c:/Users/karlo/OneDrive/Pictures/Desktop/payparq.ai/apps/mobile-scanner/lib/features/management/screens/locations_screen.dart) with the new interactive map picker.
- **Database Save**: Ensure the precise coordinates captured by the map are saved to the Supabase `locations` table alongside the `lotName`.

### **4. Deployment**
- Build the updated web application and deploy to Firebase Hosting.

Shall I begin implementing this free, high-precision mapping solution?