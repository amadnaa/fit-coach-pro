# Google Play Data Safety Form — Answers

Derived from the actual code (Supabase tables used by the app: profiles, workout_plans/workouts/workout_exercises, workout_logs, workout_sessions, bodyweight_logs, food_logs, step_logs, weekly_check_ins; Supabase Auth; Supabase Storage buckets for avatars and exercise videos).

## Overview questions

| Question | Answer |
|---|---|
| Does your app collect or share any of the required user data types? | **Yes** |
| Is all of the user data collected by your app encrypted in transit? | **Yes** (HTTPS/TLS to Supabase) |
| Do you provide a way for users to request that their data is deleted? | **Yes** (in-app: Profile → Privacy & Security → Delete Account) |

## Data types collected

Mark each as **Collected**, **Not shared**, **Not processed ephemerally**, and purpose **App functionality** unless noted.

**Personal info**
- Name — Collected. Required. App functionality.
- Email address — Collected. Required (login). App functionality, Account management.

**Health and fitness**
- Fitness info — Collected. Required (core feature: workout logs, bodyweight, steps). App functionality.

**Food and drink** (under "Other" grouping in the form: "Food and drink" is not a first-class category — declare nutrition logs under **Health and fitness → Fitness info** or **Other app activity → Other user-generated content**)

**Photos and videos**
- Photos — Collected (profile photo, check-in photos). **Optional** (user chooses to upload). App functionality.
- Videos — Collected only from the coach's account (exercise demos). If in doubt, declare: Collected, Optional, App functionality.

**App activity**
- Other user-generated content — Collected (food logs, check-in notes). App functionality.

**App info and performance / Device IDs**
- **Not collected.** No crash reporting SDK, no analytics SDK, no advertising ID in the merged manifest (verified: only INTERNET and VIBRATE permissions).

## Data NOT collected (answer "No" everywhere else)
Location, contacts, calendar, messages, browsing history, financial info, audio, files/docs (photo/video uploads are declared above), installed apps, device or other IDs.

## Sharing
**No data shared with third parties.** Supabase is a service provider (processor), which Play's definitions exclude from "sharing". Data is visible only to the user and their coach inside the service.

## Security practices section
- Data encrypted in transit: **Yes**
- User can request deletion: **Yes**
- Committed to Play Families Policy: **No** (not a kids' app)
- Independent security review: **No**

## Account deletion URL (now required by Play)
Play also asks for a **web URL** describing account deletion. Point it at the hosted privacy policy's "Your rights → Deletion" section.
