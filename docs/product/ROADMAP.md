# Roadmap (v2)

Each phase has one goal and one exit test. Nothing in a later phase starts
before the earlier exit test passes with real friends.

## Phase 0 — Foundation (current)

Goal: a clean repo the agentic workflow can build on.
Exit: stack decided (ADR 0002), monorepo scaffold, pure engine package with
tests, CI green, deploy preview on every push.

## Phase 1 — "One link, one plan" (MVP)

Goal: a real group goes from link to confirmed plan without help.

- Create a plan in one screen: title, rough range ("next 2 weeks"), duration.
- Guest participation by link: name + availability, no account.
- Availability input: tap/drag days and times; reusable weekly pattern.
- Engine: ranked options with reasons; free / busy / unknown states.
- Confirm a plan; `.ics` download and "add to Google Calendar" link.
- Shareable link preview (Open Graph) made for WhatsApp.

Exit: 3 real friend groups confirm a plan; median time to fill availability
under 60 seconds.

## Phase 2 — "It just knows"

Goal: people stop typing availability.

- Optional account via magic link or Google sign-in; guests can claim their history.
- Live calendar connection (Google, Microsoft, any ICS URL), free/busy only.
- Persistent groups with a default pattern per member.
- Push notifications (PWA) and reminders; nudges to people who haven't answered.
- Quick reactions on options (👍 / 🤷 / 👎) instead of a formal vote.

Exit: 50% of active participants have a calendar connected or a saved pattern.

## Phase 3 — "What do we do?"

Goal: the plan includes the activity, not just the date.

- Suggestions per option: events (tickets), places to eat or drink, activities.
- Pluggable sources behind one port: event APIs, Google Places, curated
  lists, partner promotions. Scheduled ingestion, not manual scraping.
- Group taste profile from past plans (categories, budget, area).
- Splitting costs and RSVPs with a +1.

Exit: 30% of confirmed plans include a suggested activity.

## Phase 4 — Scale and beyond

Ideas, not commitments, ranked by how much they help the north star:

- **Recurring plans:** "every other Thursday, padel" with automatic slot finding.
- **WhatsApp / Telegram bot:** create and answer plans without leaving the chat.
- **AI assistant:** "find a Friday dinner for the uni group under 15 lucas near
  Ñuñoa" runs the engine plus suggestions and drafts the message.
- **Venues and partners:** promotions for groups on low-demand days; a
  marketplace where places compete for confirmed groups. Main revenue path.
- **Premium for organizers:** large groups, recurring events, analytics.
- **Native apps** once PWA limits hurt (widgets, background calendar sync).
- **Other markets:** i18n is in from day one; Spanish (Chile) first.
