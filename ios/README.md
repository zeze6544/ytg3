# NARCØDEX for iPhone

Native SwiftUI app. It has its own icon, bundle id, launch screen, and screens for the archive. It does not load the website in a web view.

Bundle id: `app.narcodex.native`  
Display name: NARCØDEX  
Version: 1.0.0 (1)

The public site at https://narcodex.surge.sh is unchanged. This app reads the same catalogue files the site ships: `src/data/archive.json`, `src/data/drugs-extra.json`, and `public/catalogue/`. A build copies them into an on-device database of about 80 MB: 55,888 substances, 30,396 strains, 18 classes, and 151 mix rules.

Saved files and the 18+ gate stay on the phone. The website account is separate. The publishable database key is not in this repository, so this app does not sign in.

## What this environment did not do

This project was prepared on Linux. Xcode is not installed here. No Apple Account was added. No provisioning profile was created. No IPA was signed, exported, or installed, and nothing was verified on an iPhone.

A simulator compile is set up in `.github/workflows/ios-native.yml`. That job turns signing off so it can check that the project builds. An unsigned build is not an installable app.

## What you need

- A Mac with Xcode 16 or newer
- Your iPhone, a cable for the first install, and the iPhone passcode
- The Apple ID you already use. A paid Apple Developer Program membership is not required for this personal install
- The phone signed into the same Apple ID is not required. The Apple ID is added to Xcode

## Install on your iPhone

1. Install Xcode from the Mac App Store and open it once so it can finish installing the iOS tools.
2. On the iPhone, turn on Developer Mode: Settings > Privacy & Security > Developer Mode. The phone restarts. Confirm the prompt.
3. Connect the iPhone. Tap Trust on the phone, and unlock it.
4. On the Mac, open `ios/NARCODEX.xcodeproj`.
5. In Xcode, open Settings > Accounts and add your Apple ID. The team list shows a Personal Team. That is the free team.
6. Select the NARCODEX target, open Signing & Capabilities, check Automatically manage signing, and choose your Personal Team. Leave the bundle id as `app.narcodex.native`. If Xcode says that id is already registered to another team, change the last word and use the new id on this target only.
7. Choose your iPhone as the run destination, not a simulator. Press Run.
8. The first build imports the catalogue. That step is `ios/Scripts/build_catalogue.py`.
9. If the phone says the developer is not trusted: Settings > General > VPN & Device Management, trust the developer certificate, then open NARCØDEX.

The icon is installed by Xcode. It is an app entry with its own bundle, and it appears in Settings. Safari is not part of the install.

## Seven-day expiry

A free Personal Team provisioning profile lasts 7 days. After it expires the icon can remain, and iOS refuses to launch the app.

To renew it, connect the iPhone and press Run in Xcode again. That issues a fresh profile for the same bundle id. You do not create a new Apple ID. Do this any time you want a new build as well.

If Xcode reports that the free account cannot register another app, remove an old personal app from the phone and the account’s registered identifiers, then Run again. The exact cap is reported by Xcode.

## Updating the archive

The database is built from the repository files at compile time. To pick up catalogue changes:

1. Pull the repository so `src/data` and `public/catalogue` are current.
2. Press Run again.

The installed app does not download the website. Reinstalling also refreshes the 7-day profile.

## IPA export

`ios/Scripts/export-development-ipa.sh` archives with your team and asks Xcode to export a development IPA:

```bash
DEVELOPMENT_TEAM=YOUR_TEAM_ID ios/Scripts/export-development-ipa.sh
```

The team id is the short id in Xcode > Settings > Accounts, not the Apple ID email.

A free Personal Team is often not allowed to export an IPA. When that happens, Product > Run is the install that Apple supports. A development IPA, when export does succeed, installs only on devices in that profile. It still will not install from Safari, and it still expires after 7 days on a free team.

A paid membership is what adds Ad Hoc, TestFlight, and App Store export. This repository has not produced any of those.

## Paid membership

These are outside a free Personal Team. The app does not use them.

- App Store distribution and TestFlight
- Ad Hoc or In-House distribution to other people’s phones
- Push notifications
- Sign in with Apple, iCloud, CloudKit, and App Groups
- Associated domains and universal links
- Wallet, CarPlay, and most system extensions
- A provisioning profile that lasts longer than 7 days

Local storage, the catalogue, search, and opening a reference link in Safari do not need a paid membership.

## What the app contains

- Home, with the on-device counts
- Substance files, search, class filter, and an A–Z shelf
- A substance page with overview, pharmacology, risks, stored interactions, and history
- Mix check, using the same pair ranking as the site
- Strain files, including THC and CBD only when the catalogue stored a number
- Classes, timeline, reagent colour charts, and on-device saved files

Strain pages say when a terpene percentage or a medical seller list is not in the file. The app does not invent those figures.

The archive is harm-reduction reference material. It is not medical advice, a dose, a source, or a synthesis guide.
