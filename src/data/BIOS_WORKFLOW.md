# Bio Management Workflow

Character bios are now stored in markdown files for easier editing and syncing from Notion.

## Structure

```
src/data/
├── bios/                    # Character bios as markdown
│   ├── curator.md
│   ├── duchess.md
│   ├── florist.md
│   └── oracle.md
├── bios.js                  # Auto-generated from markdown
├── characters.js            # References bios.js
└── sync-bios.js            # Script to generate bios.js
```

## Workflow: Update a Character Bio

1. **Edit the markdown file**
   ```
   vim src/data/bios/curator.md
   ```
   - Separate paragraphs with blank lines
   - Single-paragraph bios are stored as strings
   - Multi-paragraph bios are stored as arrays

2. **Sync to bios.js**
   ```bash
   npm run sync-bios
   ```
   This reads all `.md` files in `bios/` and generates `bios.js`

3. **Test in browser**
   ```bash
   npm run dev
   ```
   Navigate to `/character/curator` to verify the bio displays correctly

4. **Commit**
   ```bash
   git add src/data/bios/*.md src/data/bios.js
   git commit -m "Update Curator bio"
   ```

## Adding a New Character Bio

1. Create `src/data/bios/[slug].md`
   ```markdown
   First paragraph here.

   Second paragraph here.

   Third paragraph here.
   ```

2. Update `src/data/characters.js`:
   ```javascript
   {
     // ... other fields
     bio: bios.yourSlug,
     // ...
   }
   ```

3. Sync and test:
   ```bash
   npm run sync-bios
   npm run dev
   ```

## Format Rules

- **Florist** (1 paragraph → string):
  ```markdown
  Single paragraph of bio text...
  ```

- **Curator, Duchess, Oracle** (5 paragraphs → array):
  ```markdown
  Paragraph 1...

  Paragraph 2...

  Paragraph 3...

  Paragraph 4...

  Paragraph 5...
  ```

- Each paragraph should be 2-4 sentences for readability
- Preserve tone and narrative flow when breaking into paragraphs

## Notes

- `bios.js` is **auto-generated** — do not edit it directly
- Always run `npm run sync-bios` after updating markdown files
- The Character component handles both string and array bios automatically
