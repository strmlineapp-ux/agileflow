

# AgileFlow: Design System & UI Patterns

This document outlines the established UI patterns and design choices that ensure a consistent and intuitive user experience across the AgileFlow application. These patterns serve as a guide for both current and future development.

## Core UI Patterns

---

### 1. Card & Content Padding
The application favors a compact, information-dense layout. Card components are the primary building block for displaying content.

-   **Standard Implementation**: The `CalendarCard` (`/src/components/calendar/calendar-management.tsx`), `TeamCard` (`/src/components/teams/team-management.tsx`), `PageCard` (`/src/components/admin/page.tsx`), and `BadgeCollectionCard` (`/src/components/teams/badge-management.tsx`) serve as the ideal examples of the compact card pattern.
-   **Header Padding**: The `<CardHeader>` for these cards must use a compact `p-2` padding.
-   **Content Padding**: The `<CardContent>` should use `p-2 pt-0` to keep vertical spacing tight and aligned with the header.
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
- **Application:** Used for editing entity names, labels, and other simple text fields directly in the UI.

---

### 3. Compact Search Input
This pattern provides a clean, minimal interface for search functionality, especially in UIs where space is a consideration or a full search bar is not always needed. It is encapsulated in the reusable `/src/components/common/compact-search-input.tsx` component.

- **Interaction:**
  - The search input is initially hidden behind an icon-only button (e.g., `<GoogleSymbol name="search" />`), which **must have a tooltip**.
  - Clicking the button reveals the input field.
- **Behavior:**
  - **Automatic Focus**: For specific single-view pages like **Account Settings** or within popovers, an `autoFocus={true}` prop can be passed to focus the input on initial load. The component is responsible for handling this focus action reliably.
  - **Manual Focus**: Clicking the search icon will always expand the input and focus it.
  - **Collapse on Blur**: The input always collapses back to its icon-only state when it loses focus (`onBlur`) and the field is empty.
  - **Always Active**: An `isActive` prop can be passed to make the input field permanently visible, bypassing the icon toggle. This is useful in contexts like the **Icon Picker Popover** where search is a primary action.
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
- **Placement:** The button's placement is contextual. It can be positioned directly adjacent to a section title (e.g., on the Admin Management pages) or in a dedicated action area, such as below the tab navigation on the Tasks page.
- **Behavior:** Clicking the button initiates the process of adding a new item, typically by opening a dialog or form.
- **Application:** Used for creating new items in a list or grid, such as adding a new page, team, or task.

---

### 6. Icon & Color Editing Flow
This is the consistent, hardcoded blueprint for allowing a user to change both an icon and its associated color for an entity.

- **Component**: `<IconColorPicker />` from `src/components/common/icon-color-picker.tsx`.
- **Trigger:** A single, interactive icon button located on the main entity card.
- **Icon Sizing**: The trigger button itself must be sized `h-10 w-12`. The `<GoogleSymbol>` inside must have `style={{fontSize: '36px'}}`, `weight={100}`, and `grade={-25}` to create the "large but thin" aesthetic.
- **Main Popover (Icon Picker)**:
    - **Trigger**: Clicking the main icon button.
    - **Layout**: The `<PopoverContent>` must be a flex container with a fixed width (`w-80`) to ensure stability.
    - **Header**: Contains a `CompactSearchInput` (with `isActive` and `autoFocus` enabled) on the left and the color picker trigger on the right. The header element must have minimal vertical padding (`p-1`) for a compact feel.
    - **Color Picker Trigger**: A `Button` component containing a filled `circle` icon, dynamically colored to match the entity's current color.
    - **Icon Grid**:
        - A scrollable area (`<ScrollArea>`) with a fixed height (`h-52`) to display approximately six rows of icons.
        - The grid must use six columns (`grid-cols-6`) with a `gap-4` for adequate spacing.
        - All icons in the grid are rendered at `text-4xl` with `weight={100}`.
    - **Icon Sorting**: The list of icons must be sorted to show a predefined list of most-used icons first.
    - **Selection Behavior**:
        - Clicking an icon instantly updates the entity's icon and closes the popover.
        - The currently selected icon is highlighted with a button whose background is the entity's dynamic color (`entity.color`). The icon symbol inside this button must be colored with the theme's muted background color (`bg-muted`) to create a high-contrast, "punched out" look.
- **Side Panel (Color Picker)**:
    - **Trigger**: The color picker trigger button in the main popover's header. Clicking this badge toggles the visibility of the color picker panel.
    - **Layout**: The color picker panel is a conditionally rendered flex item inside the main popover. When it appears, the total width of the popover expands to accommodate it without compressing the icon grid.
    - **UI**: The panel contains:
        1.  The `react-colorful` `<HslStringColorPicker />` component. This component must have no extra header or title above it.
        2.  A grid of predefined color swatches.
    - **Behavior**: Changing the color via the wheel or clicking a swatch instantly applies the change. Clicking a predefined swatch also closes the entire popover.
- **Application:** This is the required pattern for editing the icon and color of any major entity, such as Pages, Calendars, Teams, and Badge Collections.

---

### 7. Entity Sharing & Linking
This pattern describes how a single entity (like a **Team**, **Calendar**, or **Badge Collection**) can exist in multiple contexts while maintaining a single source of truth. It works in tandem with the **Draggable Card Management blueprint**.

- **Mechanism**:
    - **Sharing via Side Panel**: The primary UI for sharing is a side panel that acts as a "discovery pool". The owner of an item can share it by dragging its card from their main management board and dropping it into this "Shared Items" panel.
        - **Behavior**: This action sets an `isShared` flag on the item but **does not remove it from the owner's board**. The item's visual state updates to show it is shared. **Dropping it back on the panel will unshare it.**
        - **Side Panel Content**: The side panel displays all items shared by *other* users/teams, allowing the current user to discover and link them. It does **not** show items that the current user already has on their own management board.
    - **Linking (Contextual)**: This action's behavior depends on the context of the management page.
        - **Global Management (e.g., Teams, Calendars)**: For top-level entities, "linking" is an explicit action. Dragging a shared item from the panel to the main board adds the item's ID to the current user's corresponding `linked...Ids` array, bringing it into their management scope without making them a member or owner.
- **Visual Cues**:
  - **Owned by you & Shared**: An item created by the current user/team that has been explicitly shared with others is marked with a `change_circle` icon overlay. This indicates it is the "source of truth." **The color of this icon badge matches the owner's primary color.**
  - **Linked (from another user)**: An item created elsewhere is marked with a `link` icon overlay in two scenarios:
    1.  When it is on the user's main management board, indicating it is actively being used.
    2.  When it is in the "Shared Items" side panel, but that same item has *already* been linked by the user. This provides crucial feedback, preventing the user from attempting to link the same item multiple times.
    **The color of this icon badge matches the original owner's primary color.**
  - **Owned and Not Shared/Linked**: An item that is owned and exists only in its original location does not get an icon.
- **Behavior**:
  - **Full Context**: When an item is linked, it should display all of its original properties (name, icon, color, description, etc.) to give the linking user full context.
  - **Editing Source of Truth**: Editing a shared item (e.g., changing a team's name) modifies the original "source of truth" item, and the changes are instantly reflected in all other places where it is used.
  - **Smart Deletion & Unlinking**: Clicking the "delete" icon on a *linked* item (like a Team, Calendar, or Badge) simply unlinks it from the current context, and the original item is unaffected. This is a low-risk action. Deleting an item *owned* by the user is confirmed via a `Compact Action Dialog`.
- **Application**: This is the required pattern for sharing **Teams**, **Calendars**, and **Badge Collections**.

---

### 8. Draggable Card Management blueprint
This is the application's gold-standard pattern for managing a collection of entities displayed as cards. It provides an intuitive, responsive, masonry-style grid that works reliably with drag-and-drop. It is the required pattern for managing Pages, Calendars, Teams, and Badge Collections.

-   **Layout**: The grid uses CSS Columns (`columns-1 sm:columns-2...`) to create a true masonry-style layout. This allows columns to have flexible heights and for content to flow naturally between them.
-   **Critical Stability Properties**:
    -   **`break-inside: avoid`**: Each individual draggable card **must** have a class that applies `break-inside: avoid`. This is critical for preventing a card from being visually split across two columns, which is a major source of layout bugs in masonry grids. This is applied in the `<SortableItem>` component.
-   **Collision Detection**: The `<DndContext>` provider **must** use the `pointerWithin` collision detection algorithm. This strategy detects a collision only with the single droppable item that is directly under the user's mouse pointer. This prevents the issue where multiple cards react at once during a drag, providing a more precise and controlled user experience.
-   **Initiating a Drag**: The **sole method** for initiating a drag action is by clicking and dragging any non-interactive part of a card.
-   **Drag-Ready State**: When a drag action is initiated, the application enters a "drag-ready" state to provide clear visual feedback and prevent accidental actions.
    - **Hide Interactive Elements**: All secondary interactive elements within draggable cards—such as delete buttons, color swatch badges, and expand/collapse icons—**must be hidden**. This is typically achieved by adding a `.hidden` class based on a global state.
    - **Disable Triggers**: The main entity icon's Popover trigger for changing the icon must be **disabled** (but the icon itself remains visible).
    - **Disable Editing**: Inline editing functionality must be disabled to prevent text from being selected or edited during a drag attempt.
-   **Expand/Collapse**: Cards can be expanded and collapsed to show more detail. This action is triggered by a dedicated `expand_more` icon button, positioned at `absolute -bottom-1 right-0`. The expanded state of each card is managed independently by its parent component.
-   **Preventing Interaction Conflicts**: To allow button clicks inside a draggable card without starting a drag, all interactive elements (buttons, inputs, etc.) must have an `onPointerDown={(e) => e.stopPropagation()}` handler. This prevents the pointer event from bubbling up to the drag listener.
-   **Drag Overlay Visuals & Positioning**: The drag overlay provides a clean, focused representation of the item being dragged.
    -   **Positioning**: To ensure the overlay appears directly under the cursor and tracks it smoothly without an offset, the `<DragOverlay>` component **must** use the `snapCenterToCursor` modifier from the `@dnd-kit/modifiers` library. Example: `modifiers={[snapCenterToCursor]}`.
    -   **Card Overlays (Pages, Calendars, Teams, Badge Collections)**: The overlay consists **only** of the entity's icon. It is rendered using the `<GoogleSymbol>` component, styled with the entity's specific color and an appropriate size (e.g., `fontSize: '48px'`) to make it a clear visual target.
    -   **User Overlays**: The overlay consists **only** of the user's `<Avatar>` component, rendered at an appropriate size (e.g., `h-12 w-12`).
    -   **Badge Overlays**: The overlay for an assigned badge is a larger, `36px` version of the assigned badge icon: a colored icon within a matching circular colored border.
-   **Internal Card Layout**: Each card is structured for clarity. The header contains the primary entity identifier (icon and name) and contextual controls. To keep cards compact, headers and content areas should use minimal padding (e.g., `p-2`). Titles should be configured to wrap gracefully to handle longer text. **All icon-only buttons inside a card MUST have a `<Tooltip>`**.
-   **User Item Display**: When users are displayed as items within a management card (e.g., `TeamCard`), they are presented **without a border**. Each user item must display their avatar, full name, and professional title underneath the name for consistency.
-   **Unique Draggable & Droppable IDs (Critical)**:
    - **Draggable Items**: It is critical that every `Draggable` component has a globally unique `id`. If the same logical item (e.g., a user) can appear in multiple lists, you must create a unique ID for each instance to prevent `@dnd-kit` from trying to move all instances simultaneously. A common pattern is to combine a prefix, the list's ID, and the item's ID (e.g., `draggableId={'user-sort:${team.id}-${item.id}'}`).
    - **Droppable Containers**: It is equally critical that major container drop zones (like the main management area or a side panel) have a **static, predictable `id`**. Using a dynamic or index-based `id` for a top-level container can cause it to be re-rendered in a way that `@dnd-kit` can no longer identify it as a valid drop target, making it appear to be disabled. **Always use a hardcoded string literal for container-level drop zones** (e.g., `id="collections-list"` or `id="shared-collections-panel"`).
-   **Draggable & Pinned States**:
    -   **Draggable Cards**: Most cards can be freely reordered within the grid. The `useSortable` hook allows this.
    -   **Pinned Cards**: Certain core system cards (e.g., "Admin", "Settings") are designated as "pinned" and cannot be dragged. This is achieved by disabling the `useSortable` hook for those specific items (`disabled: true`). They act as fixed anchors in the layout.
-   **Reordering with Guardrails**:
    -   **Interaction**: Users can drag any non-pinned card and drop it between other non-pinned cards to change its order.
    -   **Guardrail Logic**: The `onDragEnd` handler must contain logic to prevent reordering pinned items. A non-pinned item cannot be dropped into a position occupied by or between pinned items. This ensures the core page order is always maintained.
-   **Drop Zone Highlighting**: Drop zones provide visual feedback when an item is dragged over them. To maintain a clean UI, highlights must **only** use rings without background fills.
    -   **Standard & Duplication Zones (Reordering, Moving, Duplicating):** The drop area must be highlighted with a `1px` inset, colorless ring using the standard border color. The required class is `ring-1 ring-border ring-inset`. This is the universal style for all non-destructive drop actions, and colored backgrounds or borders **must not** be used.
    -   **Destructive Zones (Deleting):** The drop area must be highlighted with a `1px` ring in the destructive theme color (`ring-1 ring-destructive`).
-   **Contextual Hover Actions (Critical Implementation)**: To prevent unwanted cascading hover effects (e.g., hovering a parent card triggering actions on all child items), hover effects must be strictly scoped.
    - **Card-level Actions**: To show an action icon (like delete) for the entire card, place the action button (and its `<TooltipProvider>`) **inside the `<CardHeader>`**. Then, apply the `group` class to the `<CardHeader>` itself. This correctly scopes the `group-hover:opacity-100` effect to the header area, preventing it from activating when the user hovers over the card's content. The standard icon for deleting a card is a circular `cancel` icon that appears on hover, absolutely positioned to the corner of the card.
    - **Item-level Actions**: For actions on individual items *within* a card (like Badges in a Collection or Users in a Team), apply the `group` class to the immediate container of **each individual item**. The action button inside that container uses `group-hover:opacity-100`. This ensures that hovering one item only reveals its own actions.
-   **Drag-to-Duplicate & Create**:
    -   **Interaction & Implementation**: A designated "Add New" icon (`<Button>`) acts as a drop zone. To ensure this works reliably, the `useDroppable` hook from `@dnd-kit` must be applied to a **permanently rendered wrapper `div`** around the button. The button *inside* this wrapper can be visually hidden (e.g., with the `hidden` class based on the `isDragging` state), but the wrapper `div` itself must always be present in the DOM. This ensures `@dnd-kit` can register it as a valid drop zone when the drag operation begins. While a card is being dragged, this zone becomes highlighted with a ring to indicate it can accept a drop.
    -   **Behavior (Duplicate)**: Dropping any card (pinned or not, from the main board or the shared panel) creates a deep, independent copy of the original. The new card is given a unique ID, a modified name (e.g., with `(Copy)`), and a unique URL path. It is placed immediately after the original in the list. Its ownership is assigned to the current user's context.
    -   **Behavior (Create)**: Clicking the "Add New" button will create a fresh, default item. The item is intelligently placed *before* any pinned items, preserving the integrity of the core page structure.
    -   **Smart Unlinking**: If the duplicated card was a *linked* item (e.g., a shared calendar from another user), the original linked item is automatically removed from the user's board after the copy is created. This provides a clean "copy and replace" workflow.
-   **Drag-to-Assign & Drag-to-Link (Badges)**: This pattern allows badges to be moved between different `BadgeCollectionCard`s.
    - **Interaction**: A user can drag a badge from one collection card. As it is dragged over another collection card, that card's content area (which is a drop zone) becomes highlighted.
    - **Ownership Rules**: The drop behavior is governed by strict ownership rules. A user can **only** drop a badge into a `BadgeCollection` that they own.
    - **Move vs. Link**:
        - **Move**: If a badge is dragged from one owned collection to another owned collection, the badge is *moved*.
        - **Link**: If a badge is dragged from a *shared* (unowned) collection into an *owned* collection, a *link* to the original badge is created. The original badge remains in the shared collection.
    - **UI Feedback**: Drop zones on unowned collections will not be highlighted, providing clear visual feedback that the action is not permitted.
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
  - The active tab is indicated by a bolder font weight (`font-normal`) and the standard foreground text color.
  - The entire tab list has a subtle divider underneath it, separating it from the content below.
- **Reordering**: Users can reorder tabs by dragging them to a new position.
- **Application**: Used for all main page-level tab navigation, such as on the Admin, Service Delivery, and Team Management pages.

---

### 12. Seamless Single-Tab Pages

- **Description**: This pattern ensures a streamlined, header-less user experience for pages that are designed as primary content views.
- **Behavior**:
  - The main page rendering component (`/src/app/dashboard/[...page]/page.tsx`) contains a predefined list of "seamless" page IDs (e.g., `page-overview`, `page-admin-management`, `page-calendar`).
  - If the currently rendered page's ID is in this list, the component will **not** render a page header (title and icon).
  - The content component for that page (e.g., `<OverviewContent />`) is then rendered directly, filling the entire content area and creating a more focused, app-like feel.
- **Application**: Applied to the **Overview**, **Admin**, **Calendar**, **Tasks**, **Notifications**, and **Settings** pages.

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

### 14. Drag-and-Drop Scrolling Clipping
This is a specific fix for a common layout issue that occurs when using a collapsible side panel (Pattern #13) within a tabbed interface.

-   **Problem**: When dragging an item on a page that has a collapsed side panel, the drag area might still occupy space, causing the entire page content to scroll horizontally and appear "clipped."
-   **Solution**: The container element for the content of *each individual tab* must have the `overflow-hidden` class applied.
    -   **For `<TabsContent>`**: ` <div className="flex-1 overflow-hidden">`
-   **Application**: This is applied in `/src/app/dashboard/[...page]/page.tsx` and `/src/app/dashboard/admin/page.tsx` to the containers that wrap the `TabsContent`, ensuring that the content of each tab is properly clipped and does not cause page-level scrolling.

---

### 15. Compact Badge Pills
This pattern is a specialized, ultra-compact version of the standard `<Badge>` component, used for displaying multiple badges in a dense layout, such as the "Compact" view mode in Badge Collections.

- **Appearance**: A very thin, pill-shaped badge with minimal padding. It contains a small icon and a short text label.
- **Sizing**:
    - The pill has a reduced height and horizontal padding (`py-0 px-1`).
    - The icon inside is small, with its size set via `style={{ fontSize: '28px' }}`.
    - The text label is small (e.g., `text-sm`).
- **Interaction**: A small, circular `cancel` icon appears on hover, allowing the user to remove the badge.
- **Application**: Used in the "Compact" view of **Badge Collections** to display many badges in a compact, scannable format.

---
### 16. Team Member Badge Assignment
This pattern describes the user interface for assigning and unassigning badges to team members. The interaction is exclusively handled via drag-and-drop to ensure a clear and unambiguous workflow.

- **Layout**: Within each `TeamMemberCard`, badges that are **currently assigned** to that member are displayed as icon-only buttons. The card does not show unassigned or "available" badges.
- **Interaction (Drag-and-Drop Only)**:
    - **Re-assigning**: To move a badge from one member to another, the user can drag it from the source member's card and drop it directly onto the target member's card.
- **Visual States**:
    - **Assigned Badges**: Appear as icon-only `28px` buttons with a solid, colored border and a transparent background. The `20px` icon inside matches the border color. The name of the badge is revealed in a tooltip on hover. There is no `onClick` functionality; interaction is exclusively through drag-and-drop.
- **Application**: Used on the **Team Members** tab within each team's management page.

---
### 17. Compact Preferences Row
This pattern provides a dense, icon-driven interface for managing a series of user-specific settings. It is designed to be placed within a user's card or profile view, offering quick access without taking up significant vertical space.

- **Appearance**: A horizontal row of icon-only buttons.
- **Interaction**:
    - **Tooltip on Hover**: Hovering over any icon button **must** display a `<Tooltip>` that clearly describes the setting and its current value (e.g., "Theme: Dark" or "Easy Booking: On"). This is critical for usability as the icons alone do not convey the current state.
    - **Popover on Click**: Clicking an icon button opens a compact `<Popover>` containing the options for that setting.
    - **Instant Application**: Selecting an option within the popover immediately applies the change and closes the popover. There is no separate "Save" button.
    - **Custom Color Picker**: The palette icon opens the standard color picker popover, as defined in the **Icon & Color Editing Flow** pattern. Selecting a predefined swatch instantly applies the color and closes the popover.
- **Application**: Used on the **Account Settings** page to manage the current user's theme, primary color, default calendar view, time format, and other boolean preferences.

## Visual & Theming Elements

### Typography
- **Font**: The application exclusively uses the **Roboto** font family for a clean and consistent look.
- **Body Font**: The user can select their preferred global font weight.
- **Emphasis**: See the "Emphasis Logic" section for details on how interaction states are handled.

### Icons & Hover Effects
- **Icon Set**: We exclusively use **Google Material Symbols** via the `<GoogleSymbol />` component. This ensures a consistent visual language.
- **Icon Customization**: The `GoogleSymbol` component reads CSS variables (`--global-icon-weight`, `--global-icon-grade`, etc.) to apply user-defined preferences for weight, grade, optical size, and fill across the entire application.
- **Hover Behavior**: See the "Emphasis Logic" section.
- **Destructive Actions**: Delete or other destructive action icons (like `delete`, `close`, `cancel`) are `text-muted-foreground` by default and become `text-destructive` on hover to provide a clear but not overwhelming visual warning.
- **Tooltips for Clarity**: Icon-only buttons (those without visible text) and icons within pickers (like the **Icon Picker**) must always be wrapped in a `<Tooltip>` to provide context on their function. This is crucial for accessibility and user experience.

### Color Themes & Button Styles
The application supports two distinct color themes, `light` and `dark`, which can be selected by the user in their preferences.

- **Custom Primary Color**: Users can select a custom primary color using a color picker popover, as defined in the **Icon & Color Editing Flow** pattern. This custom color overrides the theme's default primary color.
- **Button Hover**: See the "Emphasis Logic" section.

### Emphasis Logic
The application uses a sophisticated, user-configurable emphasis system for interactive elements. This system creates two distinct interaction styles based on the user's selected global font weight.

- **Mechanism**: A `bold-emphasis` class is dynamically added to the `<body>` tag based on the user's selected `fontWeight`. The application's global CSS contains rules that react to the presence or absence of this class.
- **Logic**:
    - **If Global Weight is `Thin`, `Light`, `Normal`, or `Medium`**: The `bold-emphasis` class is absent. When a user hovers over an interactive element with the `.font-emphasis` class, its **font weight increases** to the next available level. Color does not change.
    - **If Global Weight is `Bold`**: The `bold-emphasis` class is present. When a user hovers over an interactive element with the `.font-emphasis` class, its font weight does not change. Instead, its **color changes** to the theme's primary color.
- **Implementation**: This is achieved by adding the `font-emphasis` class to interactive components. The logic is handled entirely by the CSS rules in `globals.css`.

### User Notifications

- **Toaster Notifications**: Used for providing brief, non-blocking feedback for user actions (e.g., "Badge Deleted").
    - **Appearance**: Simple, clean, and without a close button. They have a `cursor-pointer` style to indicate they can be dismissed. The padding is compact (`p-4`).
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
