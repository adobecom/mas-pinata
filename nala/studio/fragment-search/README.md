# Fragment Search Nala Tests

Validates title-based fragment search in MAS Studio — ensures the search input matches fragments by `jcr:title` in addition to full-text content search.

## Required Fixture

These tests depend on a pre-existing AEM Content Fragment:

| Property | Value |
|----------|-------|
| Fragment ID | `287ef7ee-b0e3-4d95-a689-578de492ceae` |
| Title (jcr:title) | `Nala Automation Card` |
| Model | `mas:commerce/CardContent` |
| Location | AEM `/content/dam/nala` folder |

## Setup Instructions

1. Navigate to AEM Author → Assets → `/content/dam/nala`
2. Create a new Content Fragment using model `mas:commerce/CardContent`
3. Set the `jcr:title` to `Nala Automation Card`
4. Ensure the fragment ID matches `287ef7ee-b0e3-4d95-a689-578de492ceae`

> **Warning:** Tests will **FAIL** (not skip) if the fixture fragment is missing. This is intentional to prevent false-green CI runs.
