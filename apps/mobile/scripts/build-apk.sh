#!/bin/bash
# Build a signed release APK. Android allows this file to be installed from Chrome.
set -euo pipefail

MOBILE="$(cd "$(dirname "$0")/.." && pwd)"
cd "$MOBILE"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/android-sdk}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"

mkdir -p signing
if [[ ! -f signing/narcodex-release.jks ]]; then
  PASS="$(openssl rand -base64 32 | tr -dc 'A-Za-z0-9' | head -c 24)"
  keytool -genkeypair -noprompt \
    -storetype PKCS12 \
    -keystore signing/narcodex-release.jks \
    -alias narcodex \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass "$PASS" -keypass "$PASS" \
    -dname "CN=NARCODEX, O=NARCODEX, C=US"
  printf 'storePassword=%s\nkeyPassword=%s\nkeyAlias=narcodex\n' "$PASS" "$PASS" > signing/keystore.properties
  chmod 600 signing/keystore.properties signing/narcodex-release.jks
fi

node ./scripts/split-catalogue.mjs
touch .thin-bundle

if [[ ! -d android ]]; then
  npx expo prebuild -p android --no-install
fi

printf 'sdk.dir=%s\n' "$ANDROID_HOME" > android/local.properties
python3 ./scripts/configure-release.py
python3 - << 'PY'
from pathlib import Path
path = Path("android/app/src/main/res/values/strings.xml")
text = path.read_text()
path.write_text(text.replace(">NARCODEX<", ">NARCØDEX<"))
PY

cd android
export NODE_OPTIONS="--max-old-space-size=4096"
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a --no-daemon

APK="app/build/outputs/apk/release/app-release.apk"
test -f "$APK"
cp "$APK" "$MOBILE/public/narcodex.apk"
ls -lh "$MOBILE/public/narcodex.apk"
"$ANDROID_HOME/build-tools/36.0.0/apksigner" verify --verbose "$MOBILE/public/narcodex.apk"
"$ANDROID_HOME/build-tools/36.0.0/aapt" dump badging "$MOBILE/public/narcodex.apk" | head -20
