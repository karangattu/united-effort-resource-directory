# United Effort Resource Directory

An interactive web application providing two key services:

1. **Benefit Navigator** - A guided questionnaire that helps users discover General Assistance (GA) and housing benefits they may qualify for
2. **Resource Directory** - A searchable directory of social services and community resources

Both components are fully JSON-driven, making them easy to maintain without coding knowledge.

---

## 🎯 Benefit Navigator (Questionnaire)

### Overview

The Benefit Navigator is an interactive questionnaire that guides users through a series of questions to determine their eligibility for:

- General Assistance (GA) cash benefits
- Housing assistance programs
- Utility assistance
- Shelter placement exceptions

### Key Features

- ✅ **Mobile-optimized** with responsive header that compacts during navigation
- ✅ **JSON-driven** - all content and logic in `questionnaire.json`
- ✅ **Multilingual** ready with Google Translate integration
- ✅ **Dynamic rendering** - no hardcoded questions in HTML
- ✅ **Non-technical maintenance** - edit questions without touching code

### Editing the questionnaire (no code changes required)

All questionnaire content lives in `questionnaire.json`. Update this file to:

- Add or edit questions
- Change answer options
- Modify navigation flow
- Update benefits information
- Change contact details

📚 **For detailed guidance**, see `QUESTIONNAIRE_GUIDE.md` - a comprehensive guide for non-technical users.

### Questionnaire JSON structure

```json
{
  "steps": {
    "1": {
      "id": "1",
      "type": "choice",
      "title": "Question Title",
      "questionText": "Your question text here",
      "helpText": "Optional help text",
      "answers": [
        {
          "text": "Answer option",
          "value": "yes",
          "nextStep": "2",
          "cssClass": "yes-btn"
        }
      ]
    }
  },
  "settings": {
    "startStep": "1",
    "totalSteps": 4
  }
}
```

**Step Types:**

- `choice` - Multiple choice questions
- `info` - Informational pages with external links
- `result` - Final pages showing benefits and contact info

For complete documentation, see `QUESTIONNAIRE_GUIDE.md`.

---

## 📚 Resource Directory

### About the Resource Directory

A searchable, filterable directory of social services and community resources including benefits, housing, employment, veterans' services, and more.

### Editing resources (no code changes required)

All resources now live in `resources.json`. Update this file to add, edit, or remove items. The page loads it at runtime and renders everything dynamically.

### JSON structure

Top-level shape:

```json
{
  "categories": [
    {
      "key": "benefits", // machine key used for filtering
      "label": "Benefits", // default display label (English)
      "label_es": "Beneficios", // optional Spanish label (if present, shown when Spanish is active)
      "label_zh": "福利", // optional Mandarin label (if present)
      "items": [
        {
          "title": "...", // default English fields
          "title_es": "...", // optional Spanish
          "title_zh": "...", // optional Mandarin
          "description": "...",
          "description_es": "...",
          "description_zh": "...",
          "provider": "...",
          "provider_es": "...",
          "provider_zh": "...",
          "difficulty": "low|medium|high",
          "canDo": "...",
          "canDo_es": "...",
          "canDo_zh": "...",
          "location": "Onsite/Offsite|Onsite|Offsite|Refer out",
          "location_es": "...",
          "location_zh": "..."
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
- To localize, add `label_es`/`label_zh` on categories and per-item translated fields like `title_es`, `description_es`, `provider_es`, `canDo_es`, `location_es` (and `_zh` variants). If a translation is missing, the app gracefully falls back to the default field.

You can also localize group labels when using `groups` by setting `label_es` and/or `label_zh` on each group object.

---

## 🚀 Running locally

Because the application fetches JSON files (`questionnaire.json`), you need to serve it from a local server (most browsers block file:// fetches).

Pick any static server. A couple of options:

Using Python 3:

```bash
python3 -m http.server 8000
```

Using Node (if you have npm):

```bash
npx serve . -l 8000
```

Then open:

```text
http://localhost:8000/index.html    # Benefit Navigator (questionnaire)
http://localhost:8000/resources.html # Resource Directory
```

---

### How it works

**Benefit Navigator:**

1. Page loads with loading message
2. `app.js` fetches `questionnaire.json`
3. First step renders dynamically
4. User interactions trigger navigation
5. Each step renders on-demand from JSON

## 🌐 Internationalization

Both components support multiple languages:

- **Benefit Navigator**: Uses Google Translate widget for on-page translation
- **Resource Directory**: Supports built-in translations via `_es` and `_zh` suffixed fields

---

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
      "label_es": "Programas de subsidio",
      "label_zh": "补贴项目",
      "items": [
        {
          "title": "Section 8 Housing Choice Voucher",
          "description": "...",
          "provider": "Housing Authority",
          "difficulty": "medium",
          "canDo": "Onsite volunteer or Housing specialist",
          "location": "Onsite/Offsite"
        },
        {
          "title": "HUD-VASH Housing Voucher",
          "description": "...",
          "provider": "VA and Housing Authority",
          "difficulty": "high",
          "canDo": "Veteran service specialist",
          "location": "Onsite/Offsite"
        }
      ]
    },
    {
      "label": "Utilities",
      "label_es": "Servicios públicos",
      "label_zh": "公共事业",
      "items": [
        {
          "title": "LIHEAP (Energy Assistance)",
          "description": "...",
          "provider": "County Social Services",
          "difficulty": "low",
          "canDo": "Onsite volunteer",
          "location": "Onsite"
        },
        {
          "title": "CARE (Energy Rate Assistance)",
          "description": "...",
          "provider": "PG&E and other utilities",
          "difficulty": "low",
          "canDo": "Onsite volunteer",
          "location": "Onsite"
        }
      ]
    }
  ],
  "items": [
    {
      "title": "Home Sharing Programs",
      "description": "...",
      "provider": "Local Housing Organizations",
      "difficulty": "medium",
      "canDo": "Onsite volunteer or Housing specialist",
      "location": "Onsite/Offsite"
    }
  ]
}
```

Notes:

- The Group control appears only when the selected category has `groups`.
- You can mix `items` at the category root and `groups`.

---

### Non-Technical Users

1. Edit `questionnaire.json` to update the benefit navigator
2. Refer to `QUESTIONNAIRE_GUIDE.md` for detailed instructions
3. Test your changes locally before deploying
