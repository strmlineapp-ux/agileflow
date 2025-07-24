

# AgileFlow: Design System & UI Patterns

This document outlines the established UI patterns and design choices that ensure a consistent and intuitive user experience across the AgileFlow application. These patterns serve as a guide for both current and future development.

## Core UI Patterns

---

### 1. Card & Content Padding
The application favors a compact, information-dense layout. Card components are the primary building block for displaying content.

-   **Gold Standard**: The login form (`/login`) serves as the ideal example of "perfect" padding. It has a larger header area and tighter content padding (`p-2`) which makes the card feel like a single, cohesive unit.
-   **Global Default**: To align with this, the global default `CardContent` padding has been reduced from `p-6` to a tighter `p-4`. This affects all cards in the app, creating a more consistent look.
-   **Card Backgrounds**: Cards use a `bg-transparent` background, relying on their `border` for definition. This creates a lighter, more modern UI.
-   **Text Wrapping**: Card titles and descriptions should gracefully handle long text by wrapping. The `break-words` utility should be used on titles to prevent layout issues from long, unbroken strings.

---

### 2. Inline Editor
This pattern allows for seamless, direct text editing within the main application layout, avoiding disruptive dialog boxes or popovers for simple text changes.

- **Trigger:** Clicking directly on a text element (e.g., a section title, a badge name).
- **Interaction:**
    - The text element transforms into an input field.
    - The input field must be styled to perfectly match the font, size, weight, and color of the original text element it replaces (e.g., using the `font-headline font-thin` classes).
    - **Crucially, the input must have a transparent background and no borders or box-shadow**, ensuring it blends seamlessly into the UI.
- **Behavior:**
    - Typing modifies the text value. Pressing the spacebar correctly adds spaces for multi-word names.
    - Pressing 'Enter' saves the changes and reverts the input back to a standard text element.
    - Pressing 'Escape' cancels the edit without saving.
    - **A `useEffect` hook must be implemented to add a 'mousedown' event listener to the document. This listener should check if the click occurred outside the input field's ref and, if so, trigger the save function. This ensures that clicking anywhere else on the page correctly dismisses and saves the editor.**
- **Conflict Prevention**: See the "Preventing Interaction Conflicts" section within the **Draggable Card Management blueprint** for the required implementation when using this pattern inside a draggable item.
- **Application:** Used for editing entity names, labels, and other simple text fields directly in the UI.

---

### 3. Compact Search Input
This pattern provides a clean, minimal interface for search functionality, especially in UIs where space is a consideration or a full search bar is not always needed. It is encapsulated in the reusable `/src/components/common/compact-search-input.tsx` component.

- **Interaction:**
  - The search input is initially hidden behind an icon-only button (e.g., `<GoogleSymbol name="search" />`), which **must have a tooltip**.
  - Clicking the button reveals the input field.
  - **Crucially, the input must have a transparent background and no borders or box-shadow**, ensuring it blends seamlessly into the UI.
- **Behavior:**
  - **Automatic Focus**: To trigger focus when a parent element (like a side panel) becomes visible, pass an `autoFocus={isPanelOpen}` prop to the component. The component's internal `useEffect` hook will then focus the input a single time when the panel opens.
  - **Manual Focus**: Clicking the search icon will always expand the input and focus it.
  - **Collapse on Blur**: The input always collapses back to its icon-only state when it loses focus (`onBlur`) and the field is empty.
- **Application:** Used for filtering lists of icons, users, or other filterable content within popovers and management pages like the Admin screen.

---

### 4. Text-based Inputs
This pattern transforms standard form inputs into minimalist, text-like elements, creating a cleaner and more compact interface. It is primarily used for authentication forms and simple dialogs.

-   **Appearance**:
    -   Initially, the input may appear as plain text (a placeholder, like "Email" or "Password") next to an icon. It has no visible border or background. It uses a muted color to indicate it's interactive but unfocused.
    -   In other contexts (like a dialog), it can be a simple input field with **no border or box shadow**, using only a `focus-visible:ring-0` style to remain unobtrusive.
-   **Interaction**:
    -   Clicking on the text or icon transforms the element into a live input field with the user's cursor.
    -   The input field itself remains borderless and transparent to maintain the clean aesthetic.
-   **Behavior**:
    -   Standard input behavior applies once focused.
    -   Losing focus (`onBlur`) without entering any text may revert the element to its initial placeholder state.
-   **Application**: Used for login/sign-up forms and for simple, single-field dialogs like linking a Google Calendar.

---

### 5. Integrated Add Button
This pattern replaces large, card-style "Add New" buttons with a more compact and contextually relevant control.

- **Appearance:** A circular button containing a plus (`+`) or `add_circle` icon. It uses `text-4xl` and `weight={100}` for a large but light appearance.
- **Placement:** Positioned directly adjacent to the title of the section or list it pertains to.
- **Behavior:** Clicking the button initiates the process of adding a new item, typically by opening a dialog or form.
- **Application:** Used for creating new items in a list or grid, such as adding a new team, priority strategy, or a badge to a collection.

---

### 6. Icon & Color Editing Flow
This is the consistent reference pattern for allowing a user to change both an icon and its color.

- **Trigger:** A single, interactive unit composed of a primary icon button and a smaller color swatch badge overlaid on its corner.
- **Icon Sizing**: The trigger button's icon should be large and prominent, specifically using a `h-10 w-12` button. The `GoogleSymbol` inside should have its `style={{fontSize: '36px'}}`, `opticalSize={20}`, and `grade={-25}` to create a "large but thin" aesthetic.
- **Interaction:**
  - **Icon Picker**: Clicking the main part of the button opens an icon picker popover. This popover uses the **Compact Search Input** pattern for filtering. The icons inside this picker are rendered at `text-4xl` with `weight={100}` inside `h-8 w-8` buttons for clarity and ease of selection.
  - **Color Picker**: Clicking the color swatch badge opens the standard color picker popover.
- **Color Picker UI**: The popover must contain three elements for a comprehensive user experience:
    1.  A color wheel and saturation box using the `react-colorful` library's `<HexColorPicker />`.
    2.  A text input for the HEX color code using `<HexColorInput />`.
    3.  A grid of predefined color swatches for quick selection.
    A final "Set Color" button applies the chosen color.
- **Application:** This is the required pattern for editing the icon and color of any major entity, such as Pages, Calendars, Teams, and Badge Collections.

---

### 7. Entity Sharing & Linking
This pattern describes how a single entity (like a **Team**, **Calendar**, or **Badge Collection**) can exist in multiple contexts while maintaining a single source of truth. It works in tandem with the **Draggable Card Management blueprint**.

- **Mechanism**:
    - **Sharing via Side Panel**: The primary UI for sharing is a side panel that acts as a "discovery pool". The owner of an item can share it by dragging its card from their main management board and dropping it into this "Shared Items" panel.
        - **Behavior**: This action sets an `isShared` flag on the item but **does not remove it from the owner's board**. The item's visual state updates to show it is shared. **Dropping it back on the panel will unshare it.**
        - **Side Panel Content**: The side panel displays all items shared by *other* users/teams, allowing the current user to discover and link them. It does **not** show items that the current user already has on their own management board.
    - **Linking (Contextual)**: This action's behavior depends on the context of the management page.
        - **Contextual Management (e.g., Badge Collections within a Team)**: A user can link a shared item to their own context by dragging it from the "Shared Items" panel and dropping it onto their management board. This creates a *link* to the original item, not a copy.
        - **Global Management (e.g., Teams, Calendars)**: For top-level entities, "linking" is an explicit action. Dragging a shared item from the panel to the main board adds the item's ID to the current user's corresponding `linked...Ids` array, bringing it into their management scope without making them a member or owner.
- **Visual Cues**:
  - **Owned by you & Shared**: An item created by the current user/team that has been explicitly shared with others is marked with a `change_circle` icon overlay. This indicates it is the "source of truth." **The color of this icon badge matches the owner's primary color.**
  - **Linked (from another user)**: An item created elsewhere and being used in the current context is marked with a `link` icon overlay. **The color of this icon badge matches the original owner's primary color.**
  - **Owned and Not Shared/Linked**: An item that is owned and exists only in its original location does not get an icon.
- **Behavior**:
  - **Full Context**: When an item is linked, it should display all of its original properties (name, icon, color, description, etc.) to give the linking user full context.
  - **Editing Source of Truth**: Editing a shared item (e.g., changing a team's name) modifies the original "source of truth" item, and the changes are instantly reflected in all other places where it is used.
  - **Local Overrides**: For linked Badge Collections, the `applications` (e.g., "Team Members", "Events") can be modified locally without affecting the original, allowing teams to customize how they use a shared resource.
  - **Smart Deletion & Unlinking**: Clicking the "delete" icon on a *linked* item (like a Team, Calendar, or Badge) simply unlinks it from the current context, and the original item is unaffected. This is a low-risk action. Deleting an item *owned* by the user is confirmed via a `Compact Action Dialog`.
- **Application**: This is the required pattern for sharing **Teams**, **Calendars**, and **Badge Collections**.

---

### 8. Draggable Card Management blueprint
This is the application's perfected, gold-standard pattern for managing a collection of entities displayed as cards. It provides a fluid, intuitive, and grid-responsive way for users to reorder, duplicate, and assign items. It is the required pattern for managing Pages, Calendars, Teams, and Badge Collections. The core of this pattern is a successful migration to the **`@dnd-kit`** library, which proved more robust for responsive layouts.

-   **Layout**: Entities are presented in a responsive grid of cards. To ensure stability during drag operations, especially across multiple rows, the container must use a `flex flex-wrap` layout instead of CSS Grid. Each draggable card item is then given a responsive `basis` property (e.g., `basis-full sm:basis-[calc(50%-1rem)] md:basis-[calc(33.333%-1rem)] lg:basis-[calc(25%-1rem)] xl:basis-[calc(20%-1rem)] 2xl:basis-[calc(16.666%-1rem)]`) to create the columns. A negative margin (e.g., `-m-2`) on the container and a matching positive padding (e.g., `p-2`) on the items creates the gutter. This pattern also applies *within* cards, such as for the `detailed` view of a `BadgeCollectionCard`, to organize their contents into a responsive grid.
-   **Critical Stability Properties**:
    -   **`@dnd-kit` is the required library.** The older `react-beautiful-dnd` library was found to be incompatible with this type of responsive layout.
    -   `flex-grow-0` and `flex-shrink-0` **must** be used on draggable items. This prevents the remaining items in a row from expanding or shrinking, which causes the grid to reflow unstably when an item is being dragged.
-   **Initiating a Drag**: To provide a clean interface without extra UI elements, the drag action is initiated by holding down a user-configurable modifier key (`Shift`, `Alt`, `Ctrl`, or `Meta`) while clicking and dragging any non-interactive part of a card. This modifier key is set in the user's Account Settings.
-   **Drag-Ready State**: When the drag modifier key is held down, the application enters a "drag-ready" state to provide clear visual feedback and prevent accidental actions.
    - **Hide Interactive Elements**: All interactive elements within draggable cards—such as delete buttons, popover triggers, and expand/collapse icons—**must be hidden**. This is typically achieved by adding a `.hidden` class based on a global `isDragModifierPressed` state from the `UserContext`.
    - **Disable Editing**: Inline editing functionality must be disabled to prevent text from being selected or edited during a drag attempt.
-   **Expand/Collapse**: Cards are collapsed by default. To expand a card and view its details, the user must click a dedicated `expand_more` icon button, positioned at `absolute -bottom-1 right-0`. This provides a clear, unambiguous affordance and avoids conflicts with other click actions on the card.
-   **Preventing Interaction Conflicts**: The primary mechanism for preventing accidental drags is the **modifier key activation**. Since a drag action only begins when the modifier key is held, normal clicks on buttons, popovers, and other controls inside a draggable card function as expected without interference. For components with internal keyboard interactions (like an **Inline Editor**), the `useSortable` hook for the draggable card **must** be temporarily disabled while the internal component is in an editing state by passing `disabled: isEditing`.
-   **Visual Feedback**: To provide feedback without disrupting layout, visual changes (like a `shadow` or `opacity`) should be applied directly to the inner component based on the `isDragging` prop provided by `dnd-kit`'s `useSortable` hook. The draggable wrapper itself should remain untouched.
-   **Internal Card Layout**: Each card is structured for clarity. The header contains the primary entity identifier (icon and name) and contextual controls. To keep cards compact, headers and content areas should use minimal padding (e.g., `p-2`). Titles should be configured to wrap gracefully to handle longer text. **All icon-only buttons inside a card MUST have a `<Tooltip>`**.
-   **User Item Display**: When users are displayed as items within a management card (e.g., `TeamCard`), they are presented **without a border**. Each user item must display their avatar, full name, and professional title underneath the name for consistency.
-   **Unique Draggable IDs**: It is critical that every `Draggable` component has a globally unique `draggableId`. If the same item (e.g., a user) can appear in multiple lists, you must create a unique ID for each instance. A common pattern is to combine the list's ID with the item's ID (e.g., `draggableId={'${list.id}-${item.id}'}`). This prevents the drag-and-drop library from trying to move all instances of the item simultaneously.
-   **Draggable & Pinned States**:
    -   **Draggable Cards**: Most cards can be freely reordered within the grid. The `useSortable` hook allows this.
    -   **Pinned Cards**: Certain core system cards (e.g., "Admin", "Settings") are designated as "pinned" and cannot be dragged. This is achieved by disabling the `useSortable` hook for those specific items (`disabled: true`). They act as fixed anchors in the layout.
-   **Reordering with Guardrails**:
    -   **Interaction**: Users can drag any non-pinned card and drop it between other non-pinned cards to change its order. The grid reflows smoothly to show the drop position.
    -   **Guardrail Logic**: The `onDragEnd` handler must contain logic to prevent reordering pinned items. A non-pinned item cannot be dropped into a position occupied by or between pinned items. This ensures the core page order is always maintained.
-   **Drop Zone Highlighting**: Drop zones provide visual feedback when an item is dragged over them. To maintain a clean UI, highlights must **only** use rings without background fills.
    -   **Standard & Duplication Zones (Reordering, Moving, Duplicating):** The drop area must be highlighted with a `1px` inset, colorless ring using the standard border color. The required class is `ring-1 ring-border ring-inset`. This is the universal style for all non-destructive drop actions, and colored backgrounds or borders **must not** be used.
    -   **Destructive Zones (Deleting):** The drop area must be highlighted with a `1px` ring in the destructive theme color (`ring-1 ring-destructive`).
-   **Contextual Hover Actions (Critical Implementation)**: To prevent unwanted cascading hover effects (e.g., hovering a parent card triggering actions on all child items), hover effects must be strictly scoped.
    - **Card-level Actions**: To show an action icon (like delete) for the entire card, place the action button (and its `<TooltipProvider>`) **inside the `<CardHeader>`**. Then, apply the `group` class to the `<CardHeader>` itself. This correctly scopes the `group-hover:opacity-100` effect to the header area, preventing it from activating when the user hovers over the card's content. The standard icon for deleting a card is a circular `cancel` icon that appears on hover, absolutely positioned to the corner of the card.
    - **Item-level Actions**: For actions on individual items *within* a card (like Badges in a Collection or Users in a Team), apply the `group` class to the immediate container of **each individual item**. The action button inside that container uses `group-hover:opacity-100`. This ensures that hovering one item only reveals its own actions.
-   **Drag-to-Duplicate & Create**:
    -   **Interaction**: A designated "Add New" icon (`<Button>`) acts as a drop zone, implemented using the `useDroppable` hook from `dnd-kit`. While a card is being dragged, this zone becomes highlighted to indicate it can accept a drop.
    -   **Behavior (Duplicate)**: Dropping any card (pinned or not, from the main board or the shared panel) creates a deep, independent copy of the original. The new card is given a unique ID, a modified name (e.g., with `(Copy)`), and a unique URL path. It is placed immediately after the original in the list. Its ownership is assigned to the current user's context.
    -   **Behavior (Create)**: Clicking the "Add New" button will create a fresh, default item. The item is intelligently placed *before* any pinned items, preserving the integrity of the core page structure.
    -   **Smart Unlinking**: If the duplicated card was a *linked* item (e.g., a shared calendar from another user), the original linked item is automatically removed from the user's board after the copy is created. This provides a clean "copy and replace" workflow.
-   **Drag-to-Assign**: This pattern allows sub-items (like **Users** or **Badges**) to be moved between different parent cards.
    - **Interaction**: A user can drag an item (e.g., a User) from one card's list.
    - **Behavior**: As the item is dragged over another card, that card's drop zone (using `useDroppable`) becomes highlighted. Dropping the item assigns it to the new card's collection. The original item may be removed or remain, depending on the context. This is handled by the `onDragEnd` logic.
-   **Layout Stability**: To prevent "janky" or shifting layouts during a drag operation (especially when dragging an item out of one card and over another), ensure that the container cards (e.g., `TeamCard`) maintain a consistent height. This is achieved by making the card a `flex flex-col` container and giving its main content area `flex-grow` to make it fill the available space, even when a draggable item is temporarily removed. A `ScrollArea` can be used within the content to manage overflow if the list is long.
-   **Application**: This is the required pattern for managing Pages, Calendars, Teams, and Badge Collections.

---

### 9. Compact Action Dialog
This is a minimalist dialog for focused actions, such as entering a code or a short piece of information, or for low-risk confirmations where a full-screen modal is unnecessary.

- **Component**: Uses the standard `<Dialog>` component, which allows the user to dismiss the action by clicking the overlay or pressing 'Escape'.
- **Appearance**:
    - No footer buttons ("Cancel", "Save").
    - **Standard Action**: The primary action (e.g., Save, Verify) is represented by a single, icon-only button (e.g., `<GoogleSymbol name="check" />`) positioned in the top-right corner.
    - **Destructive Action**: For low-risk deletions, the primary action button is a large `delete` icon styled with the destructive color on hover (`text-destructive hover:bg-transparent`). This creates a clear, consistent visual language for deletion.
    - The content is focused and minimal, often using other compact patterns like "Text-based Inputs" for a clean interface.
- **Behavior**:
    - Clicking the action icon in the corner performs the primary action.
    - Clicking the overlay dismisses the dialog without performing the action.
    - **When a dialog is triggered from a draggable element, its `<DialogContent>` must capture pointer events using `onPointerDownCapture={(e) => e.stopPropagation()}`. This prevents a click inside the dialog from being interpreted as a drag action on the underlying card.**
- **Application**: Used for Two-Factor Authentication, quick edits, and for confirming lower-risk destructive actions, such as deleting a **Page**, a **Team**, a **Calendar**, a **Workstation**, or an un-shared **Badge Collection**.

---

### 10. Compact Deletion Dialog
This pattern is **deprecated**. All deletion confirmations now use the **Compact Action Dialog** for a more consistent and streamlined user experience. This avoids the use of the intentionally modal `AlertDialog` for actions within the main application flow.

---

### 11. Icon Tabs for Page Navigation
- **Description**: For primary navigation within a page (e.g., switching between "Admin Groups" and "Pages" on the Admin Management screen), tabs should be clear, full-width, and provide strong visual cues.
- **Appearance**:
  - Each tab trigger includes both an icon and a text label.
  - The icon is `text-4xl` with a `weight={100}` for a large but light appearance.
  - The active tab is indicated by colored text (`text-primary`).
  - The entire tab list has a subtle divider underneath it, separating it from the content below.
- **Application**: Used for all main page-level tab navigation, such as on the Admin, Service Delivery, and Team Management pages.

---

### 12. Seamless Single-Tab Pages

- **Description**: This pattern ensures a streamlined user experience for pages that contain only a single content tab. Instead of displaying a redundant page header, the tab's content becomes the page itself.
- **Behavior**:
  - When a page is configured with exactly one associated tab, the main page layout does not render its own title or icon.
  - The single tab's component is rendered directly within the main content area.
  - The tab's component is responsible for displaying the page's title and icon, effectively promoting its header to become the page's header. This is especially true for pages like "Overview," "Settings," and "Notifications" where the content *is* the page.
- **Application**: Applied automatically to any page in the dynamic routing system (`/dashboard/[...page]`) that meets the single-tab condition. This creates a more integrated and less cluttered UI.

---

### 13. Responsive Layout with Collapsible Panel
This pattern describes how to create a two-column layout where one column (a side panel) can be expanded and collapsed without causing horizontal overflow or scrollbars on the main page. This is the required layout for pages that use the **Entity Sharing & Linking** pattern.

- **Structure**: The page should be contained within a main flex container (`<div className="flex h-full gap-4">`).
- **Main Content Area**: The primary content area must be wrapped in a container that allows it to grow while managing its own overflow.
  - The wrapper `div` should have `flex-1` (to grow) and `overflow-hidden` (to prevent its contents from causing a page-level scrollbar).
  - The direct child of this wrapper should be a `div` with `h-full` and `overflow-y-auto` to allow the content inside to scroll vertically if needed.
- **Collapsible Side Panel**:
  - The panel `div` should have a fixed width when open (e.g., `w-96`) and `w-0` when closed.
  - **Crucially, padding must also be conditional.** The panel should have padding (e.g., `p-2`) only when it is open. When closed, it must have `p-0` to ensure it occupies zero space.
- **Application**: Used on the **Badge Management**, **Calendar Management**, and **Team Management** pages to ensure a smooth and clean layout when the "Shared Items" panel is toggled.

---

### 14. Compact Badge Pills
This pattern is a specialized, ultra-compact version of the standard `<Badge>` component, used for displaying multiple badges in a dense layout, such as the "Compact" view mode in Badge Collections.

- **Appearance**: A very thin, pill-shaped badge with minimal padding. It contains a small icon and a short text label.
- **Sizing**:
    - The pill has a reduced height and horizontal padding (`py-0 px-1`).
    - The icon inside is small, with its size set via `style={{ fontSize: '28px' }}`.
    - The text label is small (e.g., `text-sm`).
- **Interaction**: A small, circular `cancel` icon appears on hover, allowing the user to remove the badge.
- **Application**: Used in the "Compact" view of **Badge Collections** to display many badges in a compact, scannable format.

---
### 15. Team Member Badge Assignment
This pattern describes the user interface for assigning and unassigning badges to team members.
- **Layout**: Within each `TeamMemberCard`, badges are grouped visually by their parent `BadgeCollection`. Each collection is displayed with its name as a sub-header.
- **Interaction**:
    - **Click to Toggle**: A user with the correct permissions can click on any badge pill—assigned or unassigned—to toggle its state for that team member.
    - **Visual States**:
        - **Assigned Badges**: Appear with a solid, colored border and a filled background, indicating a "selected" state.
        - **Unassigned Badges**: Appear with a dashed border and a transparent background, indicating an "available" but unselected state.
- **Application**: Used on the **Team Members** tab within each team's management page.

---
### 16. Compact Preferences Row
This pattern provides a dense, icon-driven interface for managing a series of user-specific settings. It is designed to be placed within a user's card or profile view, offering quick access without taking up significant vertical space.

- **Appearance**: A horizontal row of icon-only buttons.
- **Interaction**:
    - **Tooltip on Hover**: Hovering over any icon button **must** display a `<Tooltip>` that clearly describes the setting and its current value (e.g., "Theme: Dark" or "Easy Booking: On"). This is critical for usability as the icons alone do not convey the current state.
    - **Popover on Click**: Clicking an icon button opens a compact `<Popover>` containing the options for that setting.
    - **Instant Application**: Selecting an option within the popover immediately applies the change and closes the popover. There is no separate "Save" button.
    - **Custom Color Picker**: The palette icon opens the standard color picker popover, as defined in the **Icon & Color Editing Flow** pattern. Selecting a predefined swatch or clicking "Set Color" with a custom color applies the change and closes the popover.
- **Application**: Used on the **Account Settings** page to manage the current user's theme, primary color, default calendar view, time format, and other boolean preferences.

## Visual & Theming Elements

### Typography
- **Font**: The application exclusively uses the **Roboto** font family for a clean and consistent look.
- **Headline Font**: All major titles (pages, tabs, prominent cards) use the `font-headline` utility class, which is configured to use a `font-thin` weight (`font-weight: 100`).
- **Body Font**: All standard body text, labels, and buttons now use a `font-thin` weight.

### Icons & Hover Effects
- **Icon Set**: We exclusively use **Google Material Symbols** via the `<GoogleSymbol />` component. This ensures a consistent visual language. The font library is a variable font, which means we can adjust its properties.
- **Icon Sizing & Weight**:
  - A `weight={100}` and `grade={-25}` is used for **all icons** to maintain a light, clean aesthetic.
  - Icons inside pickers (like the icon picker) are `text-4xl` with `weight={100}` inside `h-8 w-8` buttons for clarity and ease of selection.
  - Large, circular 'Add New' buttons use `text-4xl` for prominence.
- **Filled Icons**: To use the filled style of an icon, pass the `filled` prop to the component: `<GoogleSymbol name="star" filled />`. This works with any of the three main styles.
- **Hover Behavior**: The color of icons on hover is typically determined by their parent element. For example, an icon inside a `<Button variant="ghost">` will change to the primary theme color on hover because the button's text color changes, and the icon inherits that color. This creates a clean and predictable interaction.
- **Destructive Actions**: Delete or other destructive action icons (like `delete`, `close`, `cancel`) are `text-muted-foreground` by default and become `text-destructive` on hover to provide a clear but not overwhelming visual warning.
- **Tooltips for Clarity**: Icon-only buttons (those without visible text) and icons within pickers (like the **Icon Picker**) must always be wrapped in a `<Tooltip>` to provide context on their function. This is crucial for accessibility and user experience.

### Color Themes & Button Styles
The application supports two distinct color themes, `light` and `dark`, which can be selected by the user in their preferences.

-   **Light Theme**:
    -   **Aesthetic**: Clean, airy, and professional, using a light grey background (`--background: 0 0% 98%`) and dark text (`--foreground: 0 0% 20%`).
    -   **Primary Color**: A muted, professional blue (`hsl(210 40% 55%)`) used for all key interactive elements.
    -   **Accent Color**: A very light blue (`hsl(210 40% 96%)`) used in button hover gradients.

-   **Dark Theme**:
    -   **Aesthetic**: Modern and focused, using a dark charcoal background (`--background: 0 0% 8%`) and light grey text (`--foreground: 0 0% 67%`).
    -   **Primary Color**: A vibrant, energetic orange (`#D8620E` or `hsl(25 88% 45%)`) used for key actions.
    -   **Accent Color**: A warm, golden yellow (`hsl(43 55% 71%)`) used in button hover gradients.

- **Custom Primary Color**: Users can select a custom primary color using a color picker popover, as defined in the **Icon & Color Editing Flow** pattern. This custom color overrides the theme's default primary color.
- **Primary Button Gradient**: Primary buttons have a special gradient effect on hover, which is unique to each theme. This provides a subtle but polished visual feedback for key actions.
- **Text-based Button Hover**: For text-based buttons (like those on the login page), the hover and focus state is indicated *only* by the text color changing to the primary theme color. No background color is applied.

### Global Focus & Highlight Style
This is the single source of truth for indicating user interaction state across the entire application.

-   **Keyboard Focus (`focus-visible`)**: All interactive elements (buttons, inputs, checkboxes, custom cards, etc.) share a consistent focus indicator. When an element is focused via keyboard navigation, a subtle, `1px` ring with 50% opacity appears directly on its border (`focus-visible:ring-1 focus-visible:ring-ring/50`). This provides a clean, minimal, and non-intrusive focus indicator that aligns with the app's elegant aesthetic.
-   **Selected/Highlighted State**: To indicate a persistently selected or highlighted state (e.g., the designated "Team Admin" in a list), a clear icon badge (e.g., a "key" icon) is used, typically overlaid on the user's avatar. This avoids visually noisy outlines and provides a clear, universally understood symbol for elevated status.

### List Item States (Dropdowns & Popovers)
- **Hover & Focus**: When hovering over or navigating to list items (like in dropdowns or popovers) using the keyboard, the item's text color changes to `text-primary`. **No background highlight is applied**, ensuring a clean and consistent look across the application.
- **Selection**: The currently selected item within a list is indicated by a checkmark icon, which also uses the `primary` color.

### User Notifications

- **Toaster Notifications**: Used for providing brief, non-blocking feedback for user actions (e.g., "Badge Deleted").
    - **Appearance**: Simple, clean, and without a close button. They have a `cursor-pointer` style to indicate they can be dismissed.
    - **Behavior**:
        - Automatically dismisses after a short period (e.g., 2 seconds).
        - Can be dismissed instantly by clicking anywhere on the notification.

### Subtle Visual Cues

- **Lunch Break Pattern**: A subtle diagonal line pattern is used in calendar views to visually block out the typical lunch period (12:00 - 14:30). This serves as a non-intrusive reminder to avoid scheduling meetings during that time.
- **Icon as Badge**: An icon displayed as a small, circular overlay on another element (e.g., an Avatar or another icon) to provide secondary information.
    - **Appearance**: A circular badge with a `border-0`. It is used to trigger a color picker popover or display a status.
    - **Sizing**: `h-4 w-4`.
    - **Placement**:
      - **Color Picker**: `absolute -bottom-1 -right-3`.
      - **Ownership Status**: `absolute -top-0 -right-3`.
    - **Icon Size (Ownership Status)**: The `GoogleSymbol` inside an ownership status badge should have its size set via `style={{fontSize: '16px'}}`.
-   **Badges in Compact View & Team Badges**: Badges in these specific views use a light font weight (`font-thin`) for their text and icons to create a cleaner, more stylized look.

```