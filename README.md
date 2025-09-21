# United Effort Resource Directory

An interactive web directory of social services and resources. Find benefits, housing assistance, employment support, veterans' services, and other essential community resources.

## Editing resources (no code changes required)

All resources now live in `resources.json`. Update this file to add, edit, or remove items. The page loads it at runtime and renders everything dynamically.

### JSON structure

Top-level shape:

```json
{
  "categories": [
    {
      "key": "benefits",          // machine key used for filtering
      "label": "Benefits",         // display label for the filter button
      "items": [
        {
          "title": "...",
          "description": "...",
          "provider": "...",
          "difficulty": "low|medium|high",
          "canDo": "...",
          "location": "Onsite/Offsite|Onsite|Offsite|Refer out"
        }
      ]
    }
  ]
}
```

Notes:

- Add new categories by appending to `categories` with a unique `key` and a human-friendly `label`.
- Add new resources by appending objects to a category's `items` array.
- The UI builds filter buttons dynamically from categories and shows counts automatically.

## Running locally

Because the page fetches `resources.json`, you need to serve it from a local server (most browsers block file:// fetches).

Pick any static server. A couple of options:

Using Python 3 (macOS comes with it):

```bash
python3 -m http.server 8000
```

Using Node (if you have npm):

```bash
npx serve . -l 8000
```

Then open:

```text
http://localhost:8000/index.html
```

## Grouping and sorting

### Optional grouping within categories

You can optionally group items inside a category by adding a `groups` array alongside (or instead of) `items`:

```json
{
  "key": "housing",
  "label": "Housing",
  "groups": [
    {
      "label": "Subsidy Programs",
      "items": [
        { "title": "Section 8 Housing Choice Voucher", "description": "...", "provider": "Housing Authority", "difficulty": "medium", "canDo": "Onsite volunteer or Housing specialist", "location": "Onsite/Offsite" },
        { "title": "HUD-VASH Housing Voucher", "description": "...", "provider": "VA and Housing Authority", "difficulty": "high", "canDo": "Veteran service specialist", "location": "Onsite/Offsite" }
      ]
    },
    {
      "label": "Utilities",
      "items": [
        { "title": "LIHEAP (Energy Assistance)", "description": "...", "provider": "County Social Services", "difficulty": "low", "canDo": "Onsite volunteer", "location": "Onsite" },
        { "title": "CARE (Energy Rate Assistance)", "description": "...", "provider": "PG&E and other utilities", "difficulty": "low", "canDo": "Onsite volunteer", "location": "Onsite" }
      ]
    }
  ],
  "items": [
    { "title": "Home Sharing Programs", "description": "...", "provider": "Local Housing Organizations", "difficulty": "medium", "canDo": "Onsite volunteer or Housing specialist", "location": "Onsite/Offsite" }
  ]
}
```

Notes:

- The Group control appears only when the selected category has `groups`.
- You can mix `items` at the category root and `groups`.

### Sorting controls

The UI provides Sort by (Title, Difficulty, Provider) and Order (Ascending/Descending). Difficulty is ordered as `low < medium < high`.

## Data validation

On load, a lightweight schema validator checks for common data issues (missing fields, invalid difficulty values, empty categories). Any problems are shown in a red notice on the page so you can quickly fix `resources.json`.


