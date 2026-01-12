# PayParq Mobile Scanner

## Prerequisites
1.  **Flutter SDK**: You must have Flutter installed. [Install Flutter](https://flutter.dev/docs/get-started/install)
2.  **Device/Simulator**: Have an Android Emulator, iOS Simulator, or physical device connected.

## How to Run

1.  **Navigate to this directory**:
    ```bash
    cd apps/mobile-scanner
    ```

2.  **Install Dependencies**:
    ```bash
    flutter pub get
    ```

3.  **Run the App**:
    ```bash
    flutter run
    ```
    *   To choose a specific device, run `flutter devices` to list them, then `flutter run -d <device_id>`.

## Troubleshooting
*   **"flutter not recognized"**: Ensure Flutter is added to your System PATH variables.
*   **Supabase Connection**: Ensure `lib/main.dart` has the correct `url` and `anonKey` (already configured).
