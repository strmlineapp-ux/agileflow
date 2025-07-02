# AgileFlow: Design System & UI Patterns

This document outlines the established UI patterns and design choices that ensure a consistent and intuitive user experience across the AgileFlow application. These patterns serve as a guide for both current and future development.

## Core UI Patterns

---

### 1. Inline Editor

This pattern allows for seamless, direct text editing within the main application layout, avoiding disruptive dialog boxes or popovers for simple text changes.

- **Trigger:** Clicking directly on a text element (e.g., a section title, a role name).
- **Interaction:**
    - The text element transforms into an input field.
    - The input field must be styled to perfectly match the font, size, weight, and color of the original text element it replaces.
    - **Crucially, the input must have a transparent background and no borders or box-shadow**, ensuring it blends seamlessly into the UI.
- **Behavior:**
    - Typing modifies the text value.
    - Clicking anywhere outside the input field (`onBlur`) or pressing 'Enter' saves the changes and reverts the input back to a standard text element.
    - Pressing 'Escape' cancels the edit without saving.
- **Application:** Used for editing entity names, labels, and other simple text fields directly in the UI.

---

### 2. Compact Search Input

This pattern provides a clean, minimal interface for search functionality, especially in UIs where space is a consideration or a full search bar is not always needed.

- **Trigger:** Clicking a search icon (`search`).
- **Interaction:**
  - The search icon is replaced by an inline search input field, with the search icon now appearing inside the input's bounds to maintain context.
  - The input field appears with a transparent background and no borders or box-shadow, to maintain a minimal, "inline text" look.
  - The input field automatically gains focus.
- **Behavior:**
  - Typing into the field filters the relevant content on the page in real-time.
  - Clicking outside the input (`onBlur`) when it is empty will cause it to revert back to the simple search icon. If the field contains text, it remains visible.
- **Application:** Used for filtering lists of icons, users, or other filterable content within popovers and other compact spaces.

---

### 3. Text-based Inputs

This pattern transforms standard form inputs into minimalist, text-like elements, creating a cleaner and more compact interface. It is primarily used for authentication forms.

-   **Appearance**:
    -   Initially, the input appears as plain text (a placeholder, like "Email" or "Password") next to an icon. It has no visible border or background.
    -   It uses a muted color to indicate it's an interactive, but unfocused, element.
-   **Interaction**:
    -   Clicking on the text or icon transforms the element into a live input field.
    -   The icon remains visible, and the placeholder text is replaced by the user's cursor.
    -   The input field itself remains borderless and transparent to maintain the clean aesthetic.
-   **Behavior**:
    -   Standard input behavior applies once focused.
    -   Pressing 'Enter' or 'Tab' in one field (e.g., Email) should seamlessly transition focus to the next logical field (e.g., Password) without requiring an extra click.
    -   Losing focus (`onBlur`) without entering any text will revert the element to its initial placeholder state.
-   **Application**: Used for the login and sign-up forms to create a more modern and less cluttered user experience.

---

### 4. Integrated Add Button

This pattern replaces large, card-style "Add New" buttons with a more compact and contextually relevant control.

- **Appearance:** A circular button containing a plus (`+`) or `add_circle` icon.
- **Placement:** Positioned directly adjacent to the title of the section or list it pertains to.
- **Behavior:** Clicking the button initiates the process of adding a new item, typically by opening a dialog or form, or by creating a new default item directly in the list. A prime example is on the "Calendar Management" page, where clicking the "Add" button instantly creates a new calendar card in the list without an intermediary dialog.
- **Application:** Used for creating new items in a list or grid, such as adding a new team, calendar, priority strategy, or a badge to a collection.

---

### 5. Icon & Color Editing Flow

This is the consistent reference pattern for allowing a user to change both an icon and its color.

- **Trigger:** A single, interactive unit composed of a primary icon button and a smaller color swatch badge overlaid on its corner.
- **Interaction:**
  - Clicking the main part of the button opens an icon picker popover. This popover uses the **Compact Search Input** pattern for filtering.
  - Clicking the color swatch badge opens a color picker popover.
- **Application:** Used for editing team icons/colors, admin group icons/colors, and shared group icons/colors.

---

### 6. Entity Sharing & Linking

This pattern describes how a single entity (like a Badge or Badge Collection) can exist in multiple contexts while maintaining a single source of truth.

- **Mechanism**: Implemented via drag-and-drop or an explicit "Share" action. This creates a shared instance, not a copy.
- **Visual Cues**:
  - **Owned & Shared Externally (`upload`)**: An item created by the current team but also being used in at least one other team is marked with an `upload` icon overlay. This indicates it is the "source of truth." **The color of this icon badge matches the owner team's color.**
  - **Internally Linked (`change_circle`)**: An item that is used in multiple places within the *same* team (e.g., a badge appearing in two collections) is marked with a `change_circle` icon overlay on its linked instances. The original instance does not get this icon unless it is also shared externally. **The color of this icon badge matches the owner team's color.**
  - **Shared-to-You (`downloading`)**: An item created in another team and being used in the current context is marked with a `downloading` icon overlay. **The color of this icon badge matches the source team's color.**
  - **Owned and Not Shared/Linked**: An item that is owned and exists only in its original location does not get an icon.
- **Behavior**:
  - Editing a shared or linked item (e.g., changing its name or icon) modifies the original "source of truth" item, and the changes are instantly reflected in all other places where it is used.
  - **Smart Deletion**: Deleting an item follows contextual rules:
    - Deleting a *shared-to-you* or *internally linked* instance only removes that specific instance. The action is immediate and confirmed with a toaster notification.
    - Deleting the *original, shared* item (i.e., an item that is currently linked elsewhere) will trigger a confirmation dialog to prevent accidental removal of a widely-used resource.
    - Deleting an *original, un-shared* item is immediate and confirmed with a toaster notification.
- **Application**: Used for sharing Badges and Badge Collections between Teams.

---

### 7. Drag-to-Duplicate

This pattern provides a fast, intuitive way for users to duplicate complex entities using a drag-and-drop gesture, significantly speeding up configuration workflows.

-   **Trigger**: Dragging a configured entity (e.g., a "Page" card, "Calendar" card, or "Badge").
-   **Interaction**: A designated "Add New" icon or button acts as a drop zone. While an entity is being dragged, this drop zone becomes highlighted (e.g., with a colored ring) to indicate it can accept a drop.
-   **Behavior**:
    -   Dropping the entity onto the zone creates a deep, independent copy of the original.
    -   The new entity is given a new unique ID and a modified name (e.g., with `(Copy)` appended) to distinguish it from the original.
    -   The new entity is typically placed immediately after the original in the list.
-   **Application**: Used for duplicating Pages, Calendars, Teams, and Badges to serve as a starting point for a new configuration.

---

### 8. Compact Deletion Dialog

When a destructive action requires user confirmation (like deleting a shared resource), this pattern provides a minimal, focused dialog.

- **Appearance**: A compact, title-less dialog.
- **Interaction**:
    - The primary action (e.g., delete) is represented by an icon-only button in the header.
    - A brief, descriptive text explains the consequences of the action.
    - There are no footer buttons.
- **Behavior**: Clicking outside the dialog or pressing 'Escape' cancels the operation. Clicking the action icon confirms it.
- **Application**: Used for confirming the deletion of shared Badges or Badge Collections.

---

### 9. Icon Tabs for Page Navigation

- **Description**: For primary navigation within a page (e.g., switching between "Admin Groups" and "Pages" on the Admin Management screen), tabs should be clear, full-width, and provide strong visual cues.
- **Appearance**:
  - Each tab trigger must include both an icon and a text label.
  - The icon should be visually aligned with the text and use the default text color. Icons should *not* be colored separately.
  - The active tab is indicated by colored text and a thin underline, which is applied via a custom `underline` variant on the `Tabs` component.
  - The entire tab list should have a subtle divider underneath it, separating it from the content below.
- **Application**: Used for all main page-level tab navigation, such as on the Admin, Service Delivery, and Team Management pages.

## Visual & Theming Elements

### Icons & Hover Effects

- **Icon Set**: We exclusively use **Google Material Symbols** via the `<GoogleSymbol />` component. This ensures a consistent visual language. The font library is a variable font, which means we can adjust its properties.
- **Icon Styles**: The application loads the `Outlined`, `Rounded`, and `Sharp` styles from Google's library. You can specify which one to use with the `variant` prop. The `Outlined` style is the default.
  - `<GoogleSymbol name="star" variant="rounded" />`
  - `<GoogleSymbol name="star" variant="sharp" />`
- **Filled Icons**: To use the filled style of an icon, pass the `filled` prop to the component: `<GoogleSymbol name="star" filled />`. This works with any of the three main styles.
- **Hover Behavior**: The color of icons on hover is typically determined by their parent element. For example, an icon inside a `<Button variant="ghost">` will change to the primary theme color on hover because the button's text color changes, and the icon inherits that color. This creates a clean and predictable interaction.
- **Destructive Actions**: Delete or other destructive action icons (like `delete`, `close`, `cancel`) are `text-muted-foreground` by default and become `text-destructive` on hover to provide a clear but not overwhelming visual warning.
- **Tooltips for Clarity**: Icon-only buttons (those without visible text) must always be wrapped in a `<Tooltip>` to provide context on their function. This is crucial for accessibility and user experience.

### Theming & Button Styles

- **Multi-Theme Support**: The application supports multiple themes (`light`, `dark`, `high-visibility`, `firebase`), which are defined in `src/app/globals.css`. This allows users to choose their preferred visual mode.
- **Primary Button Gradient**: Primary buttons have a special gradient effect on hover, which is unique to each theme. This provides a subtle but polished visual feedback for key actions.

### User Notifications

- **Toaster Notifications**: Used for providing brief, non-blocking feedback for user actions (e.g., "Badge Deleted").
    - **Appearance**: Simple, clean, and without a close button.
    - **Behavior**:
        - Automatically dismisses after a short period (e.g., 2 seconds).
        - Can be dismissed instantly by clicking anywhere on the notification.

### Subtle Visual Cues

- **Lunch Break Pattern**: A subtle diagonal line pattern is used in calendar views to visually block out the typical lunch period (12:00 - 14:30). This serves as a non-intrusive reminder to avoid scheduling meetings during that time.
- **Icon as Badge**: An icon displayed as a small, circular overlay on another element (e.g., an Avatar or another icon) to provide secondary information. The size of the icon within the badge should be large enough to be clearly identifiable while fitting neatly within its container.
    - **Appearance**: A circular badge (e.g., `h-5 w-5`) with a `border-2` of the parent element's background color (e.g., `border-card` or `border-background`) to create a "punched out" effect. The icon inside should be sized appropriately (e.g., `font-size: 14px` or similar, depending on container).
    - **Placement**: Typically positioned on the bottom-right or top-right corner of the parent element.
    - **Application**: Used for displaying a user's admin group on their avatar, a shared group status on a role icon, or a `share` icon on a shared Badge.
