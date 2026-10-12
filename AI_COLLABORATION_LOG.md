# AI Collaboration Log

## Tools Used

- HTML, CSS, and vanilla JavaScript
- `localStorage` for saved favorites
- `navigator.clipboard.writeText` for sharing a recommendation
- VS Code validation and a local Python HTTP server

## Learning Moments

- A dropdown must use the exact mood values from `songs.json` so filtering works.
- `JSON.stringify` stores an array as text, while `JSON.parse` turns it back into usable JavaScript data.
- `try/catch` keeps localStorage and clipboard failures from crashing the app.
- Real buttons, visible focus states, and descriptive `aria-label` values make the features easier to use with a keyboard or assistive technology.

## Challenges

- Keeping new favorites, Spotify, and share actions connected to the existing result card without changing the recommendation logic.
- Supporting corrupted or unavailable browser storage with a friendly empty state.
- Making six mood themes feel coordinated while preserving readable contrast.

## How My Prompting Evolved

I started with a broad visual design request, then used smaller follow-up requests to add and verify specific features. The focused requests made it easier to preserve existing IDs and behavior while checking each feature independently.

## Significant Conversations

- Redesigned the app around the 1989-inspired Swiftie aesthetic.
- Added favorites that persist across refreshes and can be removed.
- Added Spotify search and clipboard sharing links to the result card.
- Updated the mood dropdown to match all moods in `songs.json`.
