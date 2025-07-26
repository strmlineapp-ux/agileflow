

# AgileFlow User Manual

Welcome to AgileFlow, your team's central hub for managing tasks, scheduling events, and coordinating production workflows. This guide will walk you through the key features of the app.

## 1. Getting Started

### 1.1 Requesting Access
To begin using AgileFlow, you must first be invited or request access to your company's specific workspace from an administrator.
1.  Navigate to your company's unique AgileFlow URL (e.g., `your-company.agileflow.app`).
2.  Click the "Sign up" link.
3.  Enter your email address to request access to the workspace.
4.  An administrator for your company will review your request and grant you access.

### 1.2 Signing In
Once your access has been approved, you can sign in:
1.  Navigate to your company's login page.
2.  Enter your email and password.
3.  You will be taken to your default calendar view.

## 2. Navigating the App

The main navigation is located in the sidebar on the left, providing quick, icon-based access to all sections of the app. Hover over an icon to see its name.

- **Main Navigation**: Access to core features like the Calendar, Overview, and Tasks.
- **Team Management**: If you have permission to manage a team, a link to that team's management page will appear here.
- **Admin Pages**: If you are an Admin, you will see links to the Admin page.
- **User Profile**: At the bottom of the sidebar, you can access your profile, user preferences, notifications, and the "View as" feature (for Admins). The **Settings** page is only accessible from this menu.

## 3. Dashboard Overview

The **Overview** page gives you a high-level summary of team activity, including cards for Active Tasks, Tasks Due Soon, and Completed Tasks. You can also see a list of your most recent tasks. This page has no visible header; its content acts as the page itself.

## 4. Calendar

The calendar is a powerful tool for visualizing and managing your team's schedule.

### 4.1 Creating Events
- Click the **(+)** icon in the header to open the new event form.
- Fill in the details, including title, date, time, location, and priority.
- You can add attachments, request specific roles for the event, and invite guests.
- **Easy Booking**: In your user preferences, you can enable "Easy Booking," which allows you to click on any empty time slot in the Day, Week, or Production Schedule views to quickly open the new event form with the time pre-filled.

### 4.2 Calendar Views & Controls
- **View Tabs**: Switch between four different views:
    - **Month**: A traditional monthly overview.
    - **Week**: A 7-day timeline view.
    - **Day**: A detailed hourly view for a single day. Can be switched between a horizontal (standard) or vertical (reversed) axis.
    - **Production Schedule**: A specialized view showing events organized by location for an entire week.
- **Controls**: Use the controls at the top to navigate between dates, jump to "Today," and adjust the view (e.g., zoom in/out).
- **Lunch Break**: A subtle diagonal pattern between 12:00 and 14:30 serves as a visual reminder to keep time free for a lunch break.

### 4.3 Production Schedule View
This is the most detailed view, designed for production planning.
- **Daily Checks**: Users with the "Manage Checks" permission can add, remove, and assign users to daily check locations that appear as pills at the top of each day.
- **User Statuses**: Managers can assign absence statuses (e.g., PTO, Sick) to users by clicking the `account_circle_off` icon. These appear as color-coded pills on the right side of each day's header.

## 5. Tasks

The **Tasks** page helps you stay on top of your work.
- **Tabs**: Switch between "My Tasks" (tasks assigned to you) and "All Tasks".
- **Grouping**: Tasks are automatically grouped by their current status (e.g., In Progress, Awaiting Review).
- **New Task**: Click the `add_circle` button below the tabs to create a new task.
- **Task Actions**: Use the "more" menu (`...`) on any task row to edit or delete it.

## 6. Notifications

The **Notifications** page keeps you informed. This page has no visible header; the list content itself acts as the page.
- **Unread Count**: A badge on the sidebar shows the number of unread notifications.
- **Access Requests**: Administrators can approve or reject new user access requests directly from the notification list.

## 7. Settings & Preferences

Access your preferences by clicking your avatar in the bottom-left corner of the sidebar and selecting **"Account Settings"**. This page has no visible header; the user search bar is automatically focused to make finding other users easier.

Your user preferences appear in a compact, icon-driven row on your user card. Hover over each icon to see its function.

- **Set Custom Primary Colour**: Click the palette icon to open a color picker and choose a custom color that overrides your theme's default.
- **Change Colour Scheme**: Click the sun/moon icon to instantly toggle between `light` and `dark` themes.
- **Set Default Calendar View**: Click the calendar icon to open a compact popover menu and select which calendar view you want to see when you log in.
- **Set Time Format**: Click the clock icon to choose between 12-hour and 24-hour time display from a popover menu.
- **Enable Easy Booking**: Click the toggle icon to turn on or off the ability to quickly create events by clicking on empty calendar slots. The current status (**On** or **Off**) is shown in the tooltip.
- **Set Drag Modifier Key**: Click the `smart_button` icon to set a custom modifier key (`Shift`, `Alt`, `Control`, or `Meta`) that must be held down to initiate drag-and-drop actions. The tooltip for this icon will show the currently selected key.
- **Link Google Calendar**: To connect your Google Calendar, hover over the status dot on your avatar in the sidebar user menu. If disconnected, a tooltip will prompt you to click to connect. A simulated Google sign-in will appear and, once complete, will enable features like creating Google Meet links for your events.

## 8. Management Pages (Admin & Manager Roles)

### 8.1 Admin (`/dashboard/admin`)
This is the central control panel for configuring the application itself. It does not have a page header.
- **Admin Management**: Manage system administrators and users.
    - **Assigning Admins**: Drag and drop a user from the "Users" list to the "Admins" list to grant them administrative privileges. This action is secured by a 2-Factor Authentication code. For safety, the system prevents you from removing the last system administrator.
    - **Deleting Users**: Hover over a user in the "Users" list to reveal a `cancel` icon. Clicking this will trigger the 2FA dialog to confirm deletion.
- **Pages**: Configure the application's navigation. You can intuitively reorder pages by holding down your chosen modifier key (e.g., `Shift`) and dragging them in the grid. Key system pages are pinned and cannot be moved. You can also instantly duplicate any page by dragging it onto the "Add New Page" (+) button.
- **Tabs**: Manage the reusable content blocks (tabs) that appear on pages. The order of this list can be changed via drag-and-drop and affects the default order in which tabs appear in popovers. You can also reorder tabs directly on a page by holding down your modifier key and dragging them.
- **Calendar & Team Management**: Admins can create pages to manage global application settings, such as creating shared calendars or managing teams. When creating or editing a calendar, an administrator can choose to link it to an existing Google Calendar they manage or create a new one directly from the app. Once linked, events can be synced between both platforms.

### 8.2 Team Management (`/dashboard/teams/[teamId]`)
This page is for managing the specifics of an individual team.
-   **Members Tab**: This tab provides a drag-and-drop interface for managing team roles and badge assignments.
    -   **Assigning Team Admins**: To designate a user as a Team Admin, hold down your drag modifier key (e.g., `Shift`) and drag their card from the "Members" list on the right to the "Team Admins" list on the left. To revoke admin status, drag their card back.
    -   **Reordering Members**: You can reorder users within the "Admins" or "Members" lists by holding down your modifier key and dragging their cards into a new position.
    -   **Re-assigning Badges**: To quickly move a badge from one member to another, simply drag the badge from the source member's card and drop it onto the target member's card.
- **Badge Management Tab**: Create and manage your team's badge collections. To share a collection, simply drag its card to the "Shared Collections" panel. To link a collection from another team, drag it from the shared panel onto your main board. To **activate** a collection for your team, click on its ghosted card; clicking an active card will deactivate it. To **delete** a collection you own, use the dropdown menu on its card.
- **Pinned Locations Tab**: Pin locations to the team's Production Schedule. You can also designate locations as "check locations."
- **Workstations Tab**: Manage a list of bookable workstations or machines for the team.
- **Event Templates Tab**: Create reusable templates for common events. You can edit a template's name by clicking on it directly. Click the edit icon on the template card to manage its requested roles.
- **Location Check Managers Tab**: Assign users who are allowed to manage the daily check assignments for this team's locations.

### 8.3 View As Another User (Admin Only)
Administrators can view the application from another user's perspective.
1.  Click your avatar in the bottom-left corner of the sidebar.
2.  Select "View as" from the dropdown menu.
3.  Choose a user from the list.
4.  A banner will appear at the top of the screen indicating whose view you are using. To return to your own view, repeat the process and select "Return to your view".

