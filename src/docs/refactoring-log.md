
# Refactoring Log

This document tracks major refactoring efforts, architectural decisions, and the resolution of significant bugs.

---
### 2024-07-25: **Data Flow Refactoring (Admin & Service Delivery)**

**Status**: ✅ Completed

**Problem**:
The initial `useUser` hook was monolithic, loading all application data (users, teams, calendars, events, settings) globally. This caused two main issues:
1.  **Performance**: Every component re-rendered on any data change, even if it was unrelated.
2.  **Scalability**: Loading all data upfront is not viable for a Firestore-based architecture.

**Solution**:
The monolithic `UserProvider` was split into smaller, domain-specific contexts to better manage data scopes and align with a component-based architecture.

1.  **`UserProvider` Split**:
    -   The original context was divided into `UserSessionContext` (for lightweight session data like `viewAsUser`) and `UserDataContext` (for heavier, less frequently changed data).
    -   Custom hooks `useUserSession()` and `useUserData()` were introduced to allow components to subscribe to only the data they need, significantly reducing unnecessary re-renders.

2.  **`AdminProvider` Implementation**:
    -   A new `AdminProvider` (`src/context/admin-context.tsx`) was created to exclusively manage `appSettings` and `users` data.
    -   This provider is wrapped *only* around the Admin-related tabs (`admins`, `pages`, `tabs`) in the `DynamicPage` renderer.
    -   This ensures that the heavy `appSettings` object is only loaded when a user navigates to the admin section, improving initial load times and overall performance for non-admin users.

3.  **`ServiceDeliveryProvider` Implementation**:
    -   A new `ServiceDeliveryProvider` (`src/context/service-delivery-context.tsx`) was created to manage `calendars`, `teams`, `users`, and related business logic.
    -   This provider wraps management-focused tabs (`calendars`, `teams`).

4.  **Calendar View Optimization**:
    -   The main `CalendarPageContent` component now fetches its own `events` data, decoupling it from any global context. This is a key step towards a scalable model where only events for the visible date range would be queried from Firestore.

**Outcome**:
This refactoring resulted in a more performant, scalable, and maintainable data architecture. Pages and components now load data on-demand, and the separation of concerns greatly improves the developer experience.

---
### 2024-07-26: **FIX: JSX Parsing Error in Admin Page**

**Status**: ✅ Completed

**Problem**:
A runtime error `Unexpected token 'Card'. Expected jsx identifier` was crashing the application when viewing the "Pages" management tab within the Admin section.

**Solution**:
The root cause was identified as a JSX nesting error in the `PageCard` component (`src/components/admin/page.tsx`). A `<PopoverContent>` for the color picker was incorrectly placed inside a `<TooltipProvider>` block, which is not a valid structure for the `radix-ui/react-popover` component.

The fix involved restructuring the JSX to ensure the `<PopoverTrigger>` and `<PopoverContent>` were direct siblings under the main `<Popover>` component, as required.

**Corrected Structure:**
```jsx
<Popover>
  {/* The Trigger can be wrapped for tooltips */}
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <PopoverTrigger>...</PopoverTrigger>
      </TooltipTrigger>
      <TooltipContent>...</TooltipContent>
    </Tooltip>
  </TooltipProvider>

  {/* The Content must be a direct child of Popover */}
  <PopoverContent>...</PopoverContent>
</Popover>
```

**Outcome**:
The fix resolved the parsing error and restored the functionality of the "Pages" management tab. This reinforces the importance of adhering to the component structure expected by UI libraries like Radix.

---
### 2024-07-28: **Architecture Migration to `@dnd-kit`**

**Status**: ✅ Completed

**Problem**:
Several key management components (`CalendarManagement`, `TeamManagement`, `BadgeManagement`) were still using the outdated and unstable `react-beautiful-dnd` library. This created architectural inconsistencies and was a source of persistent drag-and-drop bugs, especially in responsive layouts.

**Solution**:
A full migration to the modern and robust **`@dnd-kit`** library was executed across all remaining components.

1.  **Library Standardization**: All drag-and-drop functionality has been unified under the `@dnd-kit` ecosystem, including `@dnd-kit/core` and `@dnd-kit/sortable`.
2.  **Component Refactoring**: The following components were fully refactored to use `dnd-kit`'s modern, hooks-based API (`useSortable`, `useDraggable`, `useDroppable`):
    *   `src/components/calendar/calendar-management.tsx`
    *   `src/components/service-delivery/team-management.tsx`
    *   `src/components/teams/badge-management.tsx`
3.  **Documentation Update**: The `Draggable Card Management blueprint` in the design system has been updated to name `@dnd-kit` as the single source of truth for all drag-and-drop implementations.

**Outcome**:
The migration is complete. All drag-and-drop features across the entire application now use a single, stable, and modern library. This resolves critical layout and positioning bugs, improves performance, and establishes a consistent architectural pattern for all future development.
