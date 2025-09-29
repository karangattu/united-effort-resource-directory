# Questionnaire Configuration Guide

This guide explains how to modify the benefit navigator questionnaire **without touching HTML or JavaScript code**. All questions, answers, and navigation are controlled by the `questionnaire.json` file.

## Quick Start

Edit the `questionnaire.json` file to:

- Add new questions
- Change existing questions or answers
- Modify the flow/sequence
- Update contact information
- Add or remove benefits

## File Structure Overview

```json
{
  "steps": {
    "1": { ... },
    "2": { ... },
    "3": { ... }
  },
  "settings": { ... }
}
```

## Step Types

### 1. Choice Question (`"type": "choice"`)

A question with multiple answer buttons. User clicks one to proceed.

```json
{
  "id": "1",
  "title": "Your Question Title",
  "questionText": "The main question to ask?",
  "helpText": "Optional explanatory text",
  "type": "choice",
  "answers": [
    {
      "text": "✅ Answer 1",
      "value": true,
      "nextStep": "2",
      "cssClass": "yes-btn"
    },
    {
      "text": "❌ Answer 2",
      "value": false,
      "nextStep": "3",
      "cssClass": "no-btn"
    }
  ]
}
```

**Fields:**

- `title`: Heading shown at top of card
- `questionText`: The actual question
- `helpText`: (Optional) Additional context
- `answers`: Array of button options
  - `text`: Button label (can use emojis!)
  - `value`: Internal value (any type)
  - `nextStep`: Which step ID to go to next
  - `cssClass`: (Optional) Custom styling class

### 2. Info/Link Step (`"type": "info"`)

Shows information with an external link and navigation buttons.

```json
{
  "id": "2",
  "title": "Check Eligibility",
  "questionText": "Let's check what you qualify for.",
  "type": "info",
  "infoBox": {
    "text": "Description of what to do",
    "linkText": "🔍 Click Here",
    "linkUrl": "https://example.com",
    "linkTarget": "_blank"
  },
  "navigation": {
    "showBack": true,
    "backStep": "1",
    "showContinue": true,
    "continueStep": "3",
    "continueText": "Continue →"
  }
}
```

**Fields:**

- `infoBox`: Contains link information
  - `text`: Descriptive text before the link
  - `linkText`: Text for the button/link
  - `linkUrl`: URL to open
  - `linkTarget`: `"_blank"` for new tab
- `navigation`: Control which buttons appear
  - `showBack`: true/false
  - `backStep`: Step ID to return to
  - `showContinue`: true/false
  - `continueStep`: Next step ID
  - `continueText`: Label for continue button

### 3. Result Page (`"type": "result"`)

Final page showing benefits and contact info.

```json
{
  "id": "4-housed",
  "title": "Your Benefits",
  "type": "result",
  "benefits": [
    {
      "icon": "🏡",
      "title": "Benefit Name",
      "description": "Description with <strong>HTML</strong> allowed",
      "checklist": ["Requirement 1", "Requirement 2"]
    }
  ],
  "contact": {
    "title": "📞 Contact Us",
    "description": "How we can help",
    "organizationName": "Organization Name",
    "email": "email@example.com",
    "phone": "+1 (123) 456-7890",
    "address": {
      "line1": "Address Line 1",
      "line2": "City, State ZIP",
      "line3": "Additional info"
    }
  },
  "navigation": {
    "showBack": true,
    "backStep": "3",
    "showRestart": true
  }
}
```

**Fields:**

- `benefits`: Array of benefit boxes
  - `icon`: Emoji or text icon
  - `title`: Benefit name
  - `description`: Details (HTML allowed)
  - `checklist`: (Optional) Array of bullet points
  - `type`: (Optional) `"conditional"` for interactive benefits
- `contact`: Organization contact card
- `navigation`: Usually back + restart buttons

### 4. Conditional Benefit

Inside a result page, you can have interactive benefits:

```json
{
  "icon": "💡",
  "title": "Utility Assistance",
  "type": "conditional",
  "questionText": "Do you pay utilities?",
  "answers": [
    {
      "text": "✅ Yes",
      "value": true,
      "showInfo": true,
      "infoText": "You may qualify for <strong>$193/month</strong>!"
    },
    {
      "text": "❌ No",
      "value": false,
      "showInfo": false
    }
  ]
}
```

## Common Tasks

### Add a New Question

1. Choose an unused step ID (e.g., `"5"`)
2. Add it to the `steps` object:

```json
"5": {
  "id": "5",
  "title": "New Question",
  "questionText": "Your question here?",
  "type": "choice",
  "answers": [
    {
      "text": "Option A",
      "value": "a",
      "nextStep": "6"
    },
    {
      "text": "Option B",
      "value": "b",
      "nextStep": "7"
    }
  ]
}
```

3. Update the previous step's `nextStep` or answer to point to `"5"`

### Change Question Order

Just update the `nextStep` values in each answer or navigation section.

Example: Skip step 2, go directly from 1 to 3:

```json
"1": {
  "answers": [
    {
      "text": "Yes",
      "nextStep": "3"  // Changed from "2"
    }
  ]
}
```

### Update Contact Information

Find the `contact` section in any result step and edit:

```json
"contact": {
  "email": "newemail@example.com",
  "phone": "+1 (999) 888-7777",
  "address": {
    "line1": "New Address",
    "line2": "New City, ST 12345"
  }
}
```

### Add a Benefit

In a result step, add to the `benefits` array:

```json
"benefits": [
  {
    "icon": "🎓",
    "title": "Education Assistance",
    "description": "New benefit description here"
  }
]
```

### Hide a Step Temporarily

You can't truly "hide" a step, but you can skip it by changing the `nextStep` values around it to bypass it completely.

### Change Button Text

Edit the `text` field in any answer:

```json
"answers": [
  {
    "text": "👍 New Button Text",
    "value": true,
    "nextStep": "2"
  }
]
```

## Validation Tips

1. **Check JSON syntax**: Use a JSON validator (jsonlint.com) before saving
2. **Step IDs must match**: If `nextStep: "5"`, there must be a `"5": {...}` in steps
3. **Quote everything**: All property names and string values need quotes
4. **Commas matter**: Items in arrays/objects need commas between them (but not after the last one)
5. **Test the flow**: Click through after changes to ensure navigation works

## Emojis

You can use any emoji in text fields. Common ones:

- 🏠 🏡 🏕️ (housing)
- ✅ ❌ ❓ (answers)
- 📞 ✉️ 📧 (contact)
- 💰 💵 💳 (money)
- 💡 ⚡ (utilities)
- 🎓 📚 (education)
- 🏥 ⚕️ (health)

## HTML in Text

Fields like `description` and `infoText` support basic HTML:

- `<strong>bold</strong>`
- `<em>italic</em>`
- `<br>` for line breaks

## Getting Help

If something breaks:

1. Check the browser console (F12) for error messages
2. Validate your JSON syntax
3. Make sure all `nextStep` values point to existing step IDs
4. Ensure every step has required fields for its type

## Example: Simple Three-Step Flow

```json
{
  "steps": {
    "1": {
      "id": "1",
      "title": "Welcome",
      "questionText": "Do you need help?",
      "type": "choice",
      "answers": [
        { "text": "Yes", "nextStep": "2" },
        { "text": "No", "nextStep": "3" }
      ]
    },
    "2": {
      "id": "2",
      "title": "Getting Help",
      "type": "result",
      "benefits": [
        {
          "icon": "📞",
          "title": "Call Us",
          "description": "We're here to help!"
        }
      ],
      "navigation": { "showRestart": true }
    },
    "3": {
      "id": "3",
      "title": "Thank You",
      "type": "result",
      "benefits": [
        {
          "icon": "👋",
          "title": "Have a great day!",
          "description": "Come back if you need us."
        }
      ],
      "navigation": { "showRestart": true }
    }
  },
  "settings": {
    "startStep": "1",
    "totalSteps": 3
  }
}
```
