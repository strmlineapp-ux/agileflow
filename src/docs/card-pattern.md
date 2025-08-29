
# Standardized Card Component Pattern

This document outlines the definitive, standardized UI pattern for all "management cards" within the AgileFlow application. These cards are used for displaying and interacting with primary entities like Pages, Teams, Calendars, and Badge Collections. Adhering to this pattern ensures a consistent, predictable, and visually harmonious user experience.

---

## 1. Core Structure & Layout

All management cards must be built using the `<Card>` component from `shadcn/ui`.

-   **Component**: `src/components/ui/card.tsx`
-   **Anatomy**:
    -   `<Card>`: The root container. Must have a `bg-transparent` class to rely on its border for definition.
    -   `<CardHeader className="p-2">`: The header area. **Must** use `p-2` for compact padding.
    -   `<CardContent className="p-2 pt-0">`: The main content area. **Must** use `p-2 pt-0` for tight vertical spacing.
    -   `<CardTitle>`: The primary name of the entity. **Must** use the `break-words` class to handle long, unbroken strings gracefully.
    -   `<CardDescription>`: Optional secondary text, like a URL path or short description.

---

## 2. Primary Icon & Color Picker

The primary icon is the main visual identifier for the card's entity.

-   **Component**: `<GoogleSymbol>`
-   **Container**: The icon is placed within a `<Button variant="ghost" className="h-10 w-12 ...">`.
-   **Sizing**: The `<GoogleSymbol>` itself must be styled with `style={{fontSize: '36px'}}` and include `weight={100}` and `grade={-25}` for a large but light appearance.
-   **Color Picker**: A color swatch badge is overlaid on the icon's corner to trigger a `<Popover>` containing the color picker.
    -   The popover UI must use the `react-colorful` library.
    -   All color selection methods (wheel, hex input, swatches) **must** apply the change instantly. The "Set Color" button pattern is deprecated.

---

## 3. "Add New" & Duplicate Interaction

This interaction is for creating new entities or duplicating existing ones.

-   **Component**: A circular `<Button variant="ghost" size="icon" className="rounded-full ...">`.
-   **Icon**: The button contains a `<GoogleSymbol name="add_circle" className="text-4xl" weight={100} />`.
-   **Functionality**:
    -   **`onClick`**: Triggers the creation of a new, default item.
    -   **Drop Zone**: The button (or its wrapper) must be a `useDroppable` target to allow duplicating an item by dropping another card onto it.

---

## 4. Deletion Confirmation

Deleting a card is a destructive action and must be confirmed consistently.

-   **Trigger**: A `cancel` icon button, typically revealed on hover in the top-right corner of the card.
-   **Dialog**: Clicking the trigger opens a **Compact Action Dialog**.
-   **Dialog Content**: This dialog **must** contain:
    1.  A large, centered `<GoogleSymbol name="delete" />` icon with destructive coloring.
    2.  A `<DialogTitle>` confirming the action (e.g., "Delete Page?").
    3.  A `<DialogDescription>` explaining that the action cannot be undone.

---

## Example Implementation Reference

For a complete, "gold-standard" implementation of this pattern, refer to the `PageCard` component in `/src/components/admin/page.tsx`. It correctly implements all aspects of this standardized pattern.
