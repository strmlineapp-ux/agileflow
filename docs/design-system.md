
# AgileFlow: Design System & UI Patterns

This document outlines the established UI patterns and design choices that ensure a consistent and intuitive user experience across the AgileFlow application. These patterns serve as a guide for both current and future development.

## Core UI Patterns

---

### 1. Inline Editor

This pattern allows for seamless, direct text editing within the main application layout, avoiding disruptive dialog boxes or popovers for simple text changes.

- **Trigger:** Clicking directly on a text element (e.g., a section title, a role name).
- **Interaction:**
    - The text element transforms into an input field.
    - The input field perfectly matches the font, size, and weight of the original text, ensuring no visual layout shift.
    - There is no underline or other distracting styling on the input field.
- **Behavior:**
    - Typing modifies the text value.
    - Clicking anywhere outside the input field (`onBlur`) or pressing 'Enter' saves the changes and reverts the input back to a standard text element.
    - Pressing 'Escape' cancels the edit without saving.
- **Application:** Used for editing entity names, labels, and other simple text fields directly in the UI.

---

### 2. Integrated Add Button

This pattern replaces large, card-style "Add New" buttons with a more compact and contextually relevant control.

- **Appearance:** A circular button containing a plus (`+`) or `add_circle` icon.
- **Placement:** Positioned directly adjacent to the title of the section or list it pertains to.
- **Behavior:** Clicking the button initiates the process of adding a new item, typically by opening a dialog or form, or by creating a new default item directly in the list.
- **Application:** Used for creating new items in a list or grid, such as adding a new team, calendar, priority strategy, or a badge to a collection.

---

### 3. Compact Edit Popover

This is a minimal, title-less popover for quick, focused editing actions, typically for an icon and its associated color. This is the reference to follow for any popover that will only feature an icon picker, a color picker, and a cancel/delete/unlink action.

- **Trigger:** An icon button, often with a color badge overlay (see "Icon & Color Editing Flow").
- **Interaction:**
  - The popover appears without a header or title.
  - It contains icon-only buttons for its actions.
  - Actions are arranged horizontally. Common actions include an icon picker, a color picker (as a badge on the icon picker), and a cancel/delete/unlink action.
- **Application:** Used for editing linked group properties.

---

### 4. Icon & Color Editing Flow

This is the consistent reference pattern for allowing a user to change both an icon and its color.

- **Trigger:** A single, interactive unit composed of a primary icon button and a smaller color swatch badge overlaid on its corner.
- **Interaction:**
  - Clicking the main part of the button opens an icon picker popover.
  - Clicking the color swatch badge opens a color picker popover.
- **Application:** Used for editing team role icons/colors, custom admin role icons/colors, and linked group icons/colors.

---

### 5. Entity Linking & Sharing

This pattern describes how a single entity (like a Badge) can exist in multiple contexts (like different Badge Collections) while maintaining a single source of truth.

- **Mechanism**: Implemented via drag-and-drop. Dragging an item from its "home" collection to another creates a shared link, not a copy.
- **Visual Cues**:
  - A linked item is visually distinguished by a `link` icon overlay on its main icon.
  - The color of this link overlay is inherited from the badge's **original parent collection**, indicating its source.
  - The original item (the source of truth) does not have this icon.
- **Behavior**:
  - Editing a linked item (e.g., changing its name, icon, or color) modifies the original item, and the changes are instantly reflected in all other places where it is linked.
  - Deleting a *linked* item only removes the link from that specific context. The original and all other links remain untouched.
  - Deleting the *original* item is a permanent action that removes the item and all of its links across the entire application.
- **Application**: Used for sharing Badges between Badge Collections.

---

### 6. Drag-to-Duplicate

This pattern provides a fast, intuitive way for users to duplicate complex entities using a drag-and-drop gesture, significantly speeding up configuration workflows.

-   **Trigger**: Dragging a configured entity (e.g., a "Page" card).
-   **Interaction**: A designated "Add New" icon or button acts as a drop zone. While an entity is being dragged, this drop zone becomes highlighted (e.g., with a colored ring) to indicate it can accept a drop.
-   **Behavior**:
    -   Dropping the entity onto the zone creates a deep, independent copy of the original.
    -   The new entity is given a new unique ID and a modified name (e.g., with `(Copy)` appended) to distinguish it from the original.
    -   The new entity is typically placed immediately after the original in the list.
-   **Application**: Used for duplicating Pages or other complex entities to serve as a starting point for a new configuration.

## Visual & Theming Elements

### Icons & Hover Effects

- **Icon Set**: We exclusively use **Google Material Symbols** via the `<GoogleSymbol />` component. This ensures a consistent visual language.
- **Hover Behavior**: The color of icons on hover is typically determined by their parent element. For example, an icon inside a `<Button variant="ghost">` will change to the primary theme color on hover because the button's text color changes, and the icon inherits that color. This creates a clean and predictable interaction.
- **Destructive Actions**: Delete or other destructive action icons (like `delete`, `close`, `cancel`) are `text-muted-foreground` by default and become `text-destructive` on hover to provide a clear but not overwhelming visual warning.
- **Tooltips for Clarity**: Icon-only buttons (those without visible text) should always be wrapped in a `<Tooltip>` to provide context on their function. This is crucial for accessibility and user experience.

### Theming & Button Styles

- **Multi-Theme Support**: The application supports multiple themes (`light`, `dark`, `high-visibility`, `firebase`), which are defined in `src/app/globals.css`. This allows users to choose their preferred visual mode.
- **Primary Button Gradient**: Primary buttons have a special gradient effect on hover, which is unique to each theme. This provides a subtle but polished visual feedback for key actions.

### Subtle Visual Cues

- **Lunch Break Pattern**: A subtle diagonal line pattern is used in calendar views to visually block out the typical lunch period (12:00 - 14:30). This serves as a non-intrusive reminder to avoid scheduling meetings during that time.
- **Icon as Badge**: An icon displayed as a small, circular overlay on another element (e.g., an Avatar or another icon) to provide secondary information. The size of the icon within the badge should be large enough to be clearly identifiable while fitting neatly within its container.
    - **Appearance**: A circular badge (e.g., `h-5 w-5`) with a `border-2` of the parent element's background color (e.g., `border-card` or `border-background`) to create a "punched out" effect. The icon inside should be sized appropriately (e.g., `font-size: 14px` or similar, depending on container).
    - **Placement**: Typically positioned on the bottom-right or top-right corner of the parent element.
    - **Application**: Used for displaying a user's role on their avatar, a linked group status on a role icon, or a `link` icon on a shared Badge.
