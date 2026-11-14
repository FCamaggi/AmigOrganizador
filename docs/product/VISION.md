# Vision (v2)

## The problem

Getting a group of friends together takes a WhatsApp thread of 60 messages,
and half the time the plan dies in it. People will not maintain a second
calendar for that. v1 asked them to; they didn't. See
[`LESSONS_V1.md`](LESSONS_V1.md).

## The bet

**Don't be a calendar. Be the shortest path from "we should meet up" to a plan
that is in everyone's calendar.**

```
someone says "juntémonos"  ->  shares one link in the group chat
friends open it            ->  see the plan, sign in with one tap (Google or
                               magic link), availability in under 30 seconds
                               (connect calendar, pick a pattern, or tap days)
app proposes 3 options     ->  each with a reason and, optionally, what to do
group reacts / votes       ->  organizer confirms
everyone gets the invite   ->  .ics / Google / Outlook, plus reminders
```

## Principles

1. **Value before sign-in, sign-in in one tap.** Everyone has an account
   (ADR 0003), but a plan link shows the plan before asking to sign in, and
   signing in is Google or a magic link: no passwords, no usernames.
2. **Read, don't replace.** Calendars are the source of truth; we read free/busy
   and write back invites. We never store event titles we don't need.
3. **Unknown is not free.** Show who hasn't answered; nudge them, don't guess.
4. **Live where the group lives.** The chat is the UI's front door: rich link
   previews, one-tap replies, push notifications.
5. **Every screen ends in a decision.** Fewer settings, more defaults.
6. **The engine is pure.** Scheduling logic has no framework or database
   inside it, and is tested first.
7. **Mobile first, installable.** A PWA that feels native before any store app.

## Who it is for

- **Now:** friend groups of 3–15 people in Chile who struggle to meet.
- **Next:** any small recurring group: sports teams, board-game nights, study
  groups, families, clubs.
- **Later:** organizers who run events for many groups (venues, communities).

## North-star metric

**Plans confirmed per week** (a plan with a date that at least 2 people
accepted). Supporting metrics: time from link shared to first plan
confirmed, share of invited friends who respond, and plans repeated by the
same group within 30 days.
