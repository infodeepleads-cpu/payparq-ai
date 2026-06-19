@echo off
set KEYSTORE_PASSWORD=PayParq2024!
set KEY_ALIAS=payparq
set KEY_PASSWORD=PayParq2024!
call gradlew.bat bundleRelease
