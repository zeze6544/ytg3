#!/bin/bash
# Archive a development-signed IPA on a Mac after a Personal Team or paid team is selected.
# A free Apple ID often cannot export an IPA. Product > Run in Xcode is the install path that works.
# This script does not bypass signing, and the resulting file cannot be installed from Safari.
set -euo pipefail

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "This export has to run on a Mac with Xcode. This machine cannot sign or install the app."
  exit 1
fi

if [[ -z "${DEVELOPMENT_TEAM:-}" ]]; then
  echo "Set DEVELOPMENT_TEAM to the team id shown in Xcode > Settings > Accounts."
  echo "A free Personal Team may still refuse to export an IPA. Use Product > Run onto the connected iPhone."
  exit 1
fi

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ARCHIVE="${ROOT}/ios/build/NARCODEX.xcarchive"
EXPORT="${ROOT}/ios/build/export"
PLIST="${ROOT}/ios/build/ExportOptions.plist"

mkdir -p "${ROOT}/ios/build"
rm -rf "${ARCHIVE}" "${EXPORT}"

xcodebuild \
  -project "${ROOT}/ios/NARCODEX.xcodeproj" \
  -scheme NARCODEX \
  -configuration Release \
  -destination "generic/platform=iOS" \
  -archivePath "${ARCHIVE}" \
  -allowProvisioningUpdates \
  DEVELOPMENT_TEAM="${DEVELOPMENT_TEAM}" \
  archive

cat > "${PLIST}" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>method</key>
  <string>development</string>
  <key>teamID</key>
  <string>${DEVELOPMENT_TEAM}</string>
  <key>signingStyle</key>
  <string>automatic</string>
  <key>compileBitcode</key>
  <false/>
  <key>stripSwiftSymbols</key>
  <true/>
</dict>
</plist>
EOF

xcodebuild \
  -exportArchive \
  -archivePath "${ARCHIVE}" \
  -exportPath "${EXPORT}" \
  -exportOptionsPlist "${PLIST}" \
  -allowProvisioningUpdates

echo "Export finished in ${EXPORT}."
echo "This IPA is a development build for devices in the provisioning profile. It is not an App Store build and Safari cannot install it."
