$buildDate = Get-Date -Format o
flutter build web --release --dart-define=ENV=prod --dart-define=PROD_GUARD=1 --dart-define=BUILD_DATE=$buildDate
