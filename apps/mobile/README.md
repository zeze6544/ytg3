# NARCØDEX for iPhone

Adult harm-reduction reference. Same public archive as the website: files, mixes, strains, classes, timeline, reagent colour notes, and optional saved entries.

Not medical advice. Not a dosing tool. Not a shop.

## Run it here

```bash
cd apps/mobile
cp .env.example .env.local
# fill EXPO_PUBLIC_SUPABASE_KEY with the public Supabase key
npm run web
```

## App Store

Apple review needs a paid Apple Developer account. The submit script reads credentials from the environment and does not store them in git.

```bash
npm run submit:ios
```

Required names: `EXPO_TOKEN`, `EXPO_PUBLIC_SUPABASE_KEY`, `ASC_API_KEY_ID`, `ASC_ISSUER_ID`, `ASC_PRIVATE_KEY`, `APPLE_TEAM_ID`, `APPLE_REVIEW_FIRST_NAME`, `APPLE_REVIEW_LAST_NAME`, `APPLE_REVIEW_EMAIL`, `APPLE_REVIEW_PHONE`.

Optional: `ASC_APP_ID` (the App Store Connect Apple ID), `EXPO_APPLE_TEAM_TYPE` (`INDIVIDUAL` or `COMPANY_OR_ORGANIZATION`), `EXPO_PUBLIC_SUPABASE_URL`.

The bundle id is `com.narcodex.archive`. The first launch asks for an 18+ confirmation. Reviewers can browse without an account.
