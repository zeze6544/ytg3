#!/usr/bin/env python3
"""Point the generated release build at the local signing key and one ABI."""

from pathlib import Path

mobile = Path(__file__).resolve().parents[1]
props = {}
for line in (mobile / "signing/keystore.properties").read_text().splitlines():
    key, value = line.split("=", 1)
    props[key] = value

gradle = mobile / "android/app/build.gradle"
text = gradle.read_text()
if 'signingConfig signingConfigs.release' not in text:
    text = text.replace(
        "            signingConfig signingConfigs.debug\n            def enableShrinkResources",
        "            signingConfig signingConfigs.release\n            def enableShrinkResources",
        1,
    )
if 'storeFile file("../../signing/narcodex-release.jks")' not in text:
    block = f"""        release {{
            storeFile file("../../signing/narcodex-release.jks")
            storePassword "{props["storePassword"]}"
            keyAlias "{props["keyAlias"]}"
            keyPassword "{props["keyPassword"]}"
        }}
    }}"""
    marker = "            keyPassword 'android'\n        }\n    }"
    if marker not in text:
        raise SystemExit("debug signing block was not in the expected shape")
    text = text.replace(marker, "            keyPassword 'android'\n        }\n" + block, 1)
gradle.write_text(text)

properties = mobile / "android/gradle.properties"
prop_text = properties.read_text()
prop_text = prop_text.replace(
    "reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64",
    "reactNativeArchitectures=arm64-v8a",
)
properties.write_text(prop_text)
