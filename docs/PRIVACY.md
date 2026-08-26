# Privacy Policy — Board on Dashboard

_Last updated: 26 August 2026_

## Summary

**Board on Dashboard does not collect, store, or transmit any personal data.**

The app is built on Atlassian Forge and runs entirely inside Atlassian's
infrastructure. It qualifies for the
[Runs on Atlassian](https://go.atlassian.com/runs-on-atlassian) program,
which means no data leaves the Atlassian cloud.

## What the app does with your data

| Data | How it is used | Where it is stored |
|---|---|---|
| Board configuration (columns, statuses) | Read to group work items into columns | Not stored |
| Work item fields (key, summary, status, assignee name, priority, type) | Read to render cards | Not stored |
| Selected board ID | Saved as gadget configuration | Atlassian (gadget config) |

All Jira data is fetched **on demand** when the gadget renders, and is
discarded when rendering finishes. The app keeps no database, no cache,
and no logs of your content.

## Permissions

The app requests read-only scopes:

- `read:project:jira`
- `read:board-scope:jira-software`
- `read:board-scope.admin:jira-software`
- `read:issue-details:jira`
- `read:sprint:jira-software`
- `read:jira-work`

The app has **no write permissions**. It cannot create, modify, or delete
anything in your Jira instance.

## Third parties

None. The app makes no external network calls.

## Contact

Questions about this policy:

- Email: ping@se0ng.dev
- GitHub: https://github.com/osh0678/jira-board-gadget/issues
