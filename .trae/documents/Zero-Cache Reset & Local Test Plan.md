## **Zero-Cache Deployment & Local Verification Plan**

To break the stale code cycle and ensure the **Return Button** is visible, I will perform a "Nuclear" reset and local verification before going live.

### **Phase 1: Environment Reset**
1.  **Stop Hanging Terminals**: Kill all active terminal processes (Ctrl+C equivalent) to free up system resources and clear the "Terminal Reset" hang.
2.  **Clean Wipe**: Manually delete the `build/web` folder and run `flutter clean` in [mobile-scanner](file:///c:/Users/karlo/OneDrive/Pictures/Desktop/payparq.ai/apps/mobile-scanner) to remove all cached build artifacts.

### **Phase 2: Local Verification (No-Cache Build)**
1.  **Generate Fresh Build**: Build the web app with the `--pwa-strategy=none` flag. This is the "magic" flag that prevents the browser from loading an old version via service workers.
2.  **Local Preview**: Start a local web server from the `build/web` directory and provide a **Preview URL**. This allows you to verify the **Return Button** exists in a clean local environment before we fight the Firebase CDN cache.

### **Phase 3: "Nuclear" Firebase Deploy**
1.  **Verified Deployment**: Once confirmed locally, I will run the final `firebase deploy --only hosting`.
2.  **Cache Control Verification**: I will verify that [firebase.json](file:///c:/Users/karlo/OneDrive/Pictures/Desktop/payparq.ai/apps/mobile-scanner/firebase.json) correctly forces `no-cache` headers for all critical entry points (`index.html`, `main.dart.js`, etc.).

**Ready to proceed?** I will start by killing the stuck terminals and cleaning the project.