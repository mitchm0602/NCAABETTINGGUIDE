# NCAA Round 1 Complete

This version replaces the fallback-only demo with a more functional live build:

- `/api/teams` parses ESPN's resume table and imports SOR, SOS, NC SOS, quality wins, wins, and losses.
- `/api/odds` parses ESPN's current odds board.
- The frontend compares any two loaded teams and outputs:
  - projected spread
  - projected favorite/underdog score
  - projected total
  - edge vs current line
  - edge vs current total

## Deploy

1. Replace your current project files with the files in this folder.
2. Commit to GitHub.
3. Redeploy on Vercel.

## Notes

- This model is a resume-driven projection engine. It is not a possession-based efficiency model.
- ESPN page structures can change; if a parser returns too few rows, the route will return an error so you can see it quickly.
