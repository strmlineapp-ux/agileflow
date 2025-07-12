
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
### 2024-07-27: **Architecture Migration: `react-beautiful-dnd` to `dnd-kit`**

**Status**: ✅ Completed

**Problem**:
The `react-beautiful-dnd` library, while powerful, proved to be fundamentally incompatible with the application's responsive, multi-row grid layouts. Despite numerous attempts to stabilize the layout (fixing container sizes, using placeholders, correcting CSS), the library was unable to correctly calculate the geometry of draggable items and drop zones. This resulted in persistent, critical bugs where entire rows of cards would move as a single block, and cards could be dragged outside their intended container. The root cause was an intrinsic limitation in the library's ability to handle complex, responsive flexbox and grid layouts that shift during a drag operation.

**Solution**:
The decision was made to perform a full migration to a more modern and robust drag-and-drop library: `@dnd-kit`.

1.  **Library Replacement**: `react-beautiful-dnd` was completely removed from the project dependencies and replaced with `@dnd-kit/core` and `@dnd-kit/sortable`.

2.  **Component Refactoring**: All components that previously used `react-beautiful-dnd` were refactored to use the `dnd-kit` architecture. This included:
    *   `/src/components/admin/page.tsx` (Pages Management)
    *   `/src/components/calendar/calendar-management.tsx`
    *   `/src/components/teams/badge-management.tsx`
    *   `/src/components/teams/team-members-view.tsx`
    *   `/src/components/service-delivery/team-management.tsx`

3.  **Modern Hooks-based Approach**: The implementation was updated to use `dnd-kit`'s modern, hooks-based API (`useSortable`, `useDraggable`, `useDroppable`). This provided finer-grained control and eliminated the need for previous workarounds like `StrictModeDroppable` wrappers.

4.  **Sensors for Better Input**: `dnd-kit`'s sensor system (`PointerSensor`, `KeyboardSensor`) was implemented to provide a better user experience for both mouse and keyboard-based interactions.

**Outcome**:
The migration to `dnd-kit` was a complete success. It immediately resolved all of the persistent layout and positioning bugs. The drag-and-drop functionality is now smooth, predictable, and works flawlessly across responsive, multi-row grids. The resulting code is also cleaner, more modern, and more maintainable, aligning better with current React best practices. This was a critical architectural change that unblocked a core UX feature of the application.
