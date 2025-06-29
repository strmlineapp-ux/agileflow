# AgileFlow: Design System & UI Patterns

This document outlines the established UI patterns and design choices that ensure a consistent and intuitive user experience across the AgileFlow application. These patterns serve as a guide for both current and future development.

## Core UI Patterns

### 1. Custom Color Picker

This pattern provides a consistent, browser-agnostic way for users to select colors.

- **Trigger:** A circular color badge or another designated UI element.
- **Interaction:**
    - Clicking the trigger opens a popover.
    - The popover displays a grid of predefined, theme-aligned color swatches.
    - An option to open the native system color picker is included for custom color selection.
- **Behavior:**
    - Selecting a predefined swatch applies the color and immediately closes the popover.
    - Clicking anywhere outside the popover dismisses it without applying any changes.
- **Application:** Used for setting colors for roles, calendars, priority levels, etc.

---

### 2. Inline Editor

This pattern allows for seamless, direct text editing within the main application layout, avoiding disruptive dialog boxes or popovers for simple text changes.

- **Trigger:** Clicking directly on a text element (e.g., a section title, a role name).
- **Interaction:**
    - The text element transforms into an input field.
    - The input field perfectly matches the font, size, and weight of the original text, ensuring no visual layout shift.
    - There is no underline or other distracting styling on the input field.
- **Behavior:**
    - Typing modifies the text value.
    - Clicking anywhere outside the input field (or pressing 'Enter') saves the changes and reverts the input back to a standard text element.
    - Pressing 'Escape' cancels the edit.
- **Application:** Used for editing entity names, labels, and other simple text fields directly in the UI.

---

### 3. Integrated Add Button

This pattern replaces large, card-style "Add New" buttons with a more compact and contextually relevant control.

- **Appearance:** A circular button containing a plus (`+`) or `add_circle` icon.
- **Placement:** Positioned directly adjacent to the title of the section or list it pertains to.
- **Behavior:** Clicking the button initiates the process of adding a new item, typically by opening a dialog or form.
- **Application:** Used for creating new items in a list or grid, such as adding a new team, calendar, priority strategy, or event template.
