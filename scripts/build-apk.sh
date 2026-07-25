#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "=== Removing route handlers incompatible with static export ==="
mkdir -p .route-bak
cp src/app/auth/callback/route.ts .route-bak/auth-callback-route.ts 2>/dev/null || true
cp "src/app/serwist/[path]/route.ts" ".route-bak/serwist-route.ts" 2>/dev/null || true
rm -f src/app/auth/callback/route.ts "src/app/serwist/[path]/route.ts"

echo "=== Building static export ==="
NEXT_PUBLIC_STATIC_EXPORT=true npx next build

echo "=== Restoring route handlers ==="
mkdir -p src/app/auth/callback
cp .route-bak/auth-callback-route.ts src/app/auth/callback/route.ts 2>/dev/null || true
mkdir -p "src/app/serwist/[path]"
cp .route-bak/serwist-route.ts "src/app/serwist/[path]/route.ts" 2>/dev/null || true
rm -rf .route-bak

echo "=== Syncing to Capacitor ==="
npx cap sync

echo "=== Building APK ==="
export JAVA_HOME="$HOME/Applications/java/jdk-21.0.4+7/Contents/Home"
cd android && ./gradlew assembleDebug && cd ..

echo "=== Done! APK at android/app/build/outputs/apk/debug/app-debug.apk ==="
