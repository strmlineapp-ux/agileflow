

# AgileFlow User Manual

Welcome to AgileFlow, your team's central hub for managing tasks, scheduling events, and coordinating production workflows. This guide will walk you through the key features of the app.

## 1. Getting Started

### 1.1 Requesting Access
To begin using AgileFlow, you must first request access from an administrator.
1.  Navigate to the main page and click the "Sign up" link.
2.  Enter your email address and click "Request Access".
3.  An administrator will review your request and grant you access.

### 1.2 Signing In
Once your access has been approved, you can sign in:
1.  Navigate to the login page.
2.  Enter your email and password.
3.  You will be taken to your default calendar view.

## 2. Navigating the App

The main navigation is located in the sidebar on the left, providing quick, icon-based access to all sections of the app. Hover over an icon to see its name.

- **Main Navigation**: Access to core features like the Calendar, Overview, and Tasks.
- **Team Management**: If you have permission to manage a team, a link to that team's management page will appear here.
- **Admin Pages**: If you are an Admin, you will see links to the Admin and Service Delivery pages.
- **User Profile**: At the bottom of the sidebar, you can access your profile, user preferences, notifications, and the "View as" feature (for Admins). The **Settings** page is only accessible from this menu.

## 3. Dashboard Overview

The **Overview** page gives you a high-level summary of team activity, including cards for Active Tasks, Tasks Due Soon, and Completed Tasks. You can also see a list of your most recent tasks. This page has no visible header; its content acts as the page itself.

## 4. Calendar

The calendar is a powerful tool for visualizing and managing your team's schedule. The main calendar area is presented within a single, clean card that contains all the different views, giving it a well-organized and unified feel.

### 4.1 Creating Events
- Click the **(+)** icon in the header to open the new event form.
- Fill in the details, including title, date, time, location, and priority.
- You can add attachments, request specific roles for the event, and invite guests.
- **Google Integration**: From the attachments dropdown, you can automatically generate a **Google Meet link** or create a new **Google Doc for meeting notes**, which will be attached directly to the event. This is only available for AgileFlow calendars that have been linked to a real Google Calendar.
- **Easy Booking**: In your user preferences, you can enable "Easy Booking," which allows you to click on any empty time slot in the Day, Week, or Production Schedule views to quickly open the new event form with the time pre-filled.

### 4.2 Calendar Views & Controls
The calendar provides four distinct views, accessible via tabs at the top of the calendar card. The header also contains controls to navigate between dates, jump to "Today," and toggle view-specific options. A subtle diagonal pattern between 12:00 and 14:30 in timeline views serves as a visual reminder to keep time free for a lunch break.

#### Month View
A traditional monthly grid layout.
-   **Layout**: A grid of days, organized into weeks. The view is designed to be responsive; rows will expand in height to accommodate the number of events on the busiest day of that week.
-   **Day Cells**: Each cell represents a day and displays its number in the top-left corner.
    -   **Today's Date**: The current day is highlighted with a circular, primary-colored background to make it stand out.
    -   **Shading**: Weekends and holidays are subtly shaded with a muted background color to visually separate them from workdays.
-   **Events**: Events appear as compact, colored badges that show the event title.
    -   **Color**: The badge color is determined by its assigned priority, providing an at-a-glance sense of importance. If no priority is set, it defaults to the color of the calendar it belongs to.
-   **Weekend Toggle**: If there are events scheduled on a weekend, controls will appear on the edges of the weekday header. Clicking the double-chevron icons will expand or collapse the view to show or hide Saturday and Sunday, optimizing the viewing area.

#### Week View
A 7-day vertical timeline view.
-   **Layout**: A horizontal grid with a fixed timeline on the left and a column for each day of the week.
-   **Day Columns**: Each column is a vertical representation of a single day, displaying the day's name and number at the top.
-   **Events**: Events are rendered as colored blocks within their respective day's column. Each block is positioned and sized vertically according to its start and end times. They display the same rich information as the Day View (priority, avatars, title, time).
-   **All-Day Events**: Events that span an entire day appear as a compact banner at the top of their day's column, preventing them from cluttering the main timeline.
-   **"Now" Marker**: On the current day, a horizontal red line dynamically indicates the current time, providing a clear reference point.

#### Day View
A detailed horizontal timeline for a single day, organized by location.
-   **Layout**: A horizontal timeline where each row represents a different location. This view is ideal for understanding resource allocation and potential conflicts.
-   **Location Rows**: Each row is labeled with a location's name on the left.
    -   **Collapsible Rows**: Rows for locations with no scheduled events are automatically collapsed to save space. Users can also manually click on any location's name to toggle its row's visibility, allowing them to focus on what's important.
-   **Events**: Events appear as colored blocks within their location's row, positioned and sized horizontally according to their start and end times. They display rich information like priority badges, assigned user avatars (with their role icon), the event title, and the time range.
-   **Axis Toggle**: A "Swap Axis" button in the header allows you to switch to a **Reversed (Vertical) View**. In this mode, the timeline runs top-to-bottom in a single column, and all events for the day are displayed within it, providing a more traditional agenda-style layout.

#### Production Schedule
A specialized weekly view for production planning, organized by location across multiple days.
-   **Layout**: The week is presented as a series of collapsible day cards, allowing users to focus on one day at a time or view the entire week's schedule.
-   **Day Cards**: Each card represents a single day and can be collapsed or expanded by clicking its header.
-   **Daily Checks**: Positioned at the top of each day's card, a series of pills represent "daily checks" for specific locations (e.g., ensuring a studio is ready). Users with permission can add temporary checks for the day or assign users to a check. The assigned user's name appears in the pill.
-   **User Statuses**: On the right side of each day's header, color-coded pills show which users are absent (e.g., PTO, Sick). Managers can click the `account_circle_off` icon to open a dialog and manage these statuses for the day.
-   **Location Rows**: Similar to the Day View, each day's card contains rows for pinned locations, displaying all events scheduled in those locations for that specific day.

### 4.3 Google Calendar Integration: A Seamless Two-Way Sync

AgileFlow's calendar is designed to work in perfect harmony with your Google Calendar, creating a powerful, unified scheduling experience. Here’s how the deep, two-way integration works:

**Linking Your Calendars**

The first step is to link an AgileFlow calendar to its Google Calendar counterpart. On the **Service Delivery > Manage Calendars** page, each calendar card has a field for a **Google Calendar ID**. By pasting the ID from your shared Google Calendar here (it typically looks like an email address), you unlock a suite of powerful integration features.

**How Two-Way Synchronization Works**

Once linked, AgileFlow keeps your calendars perfectly aligned through a smart, two-way sync:

*   **AgileFlow to Google Calendar (Real-Time Push)**: When you create, edit, or delete an event in AgileFlow on a linked calendar, the change is instantly and automatically pushed to the real Google Calendar. You don’t have to do anything extra.

*   **Google Calendar to AgileFlow (Manual & Automated Pull)**:
    *   **Manual Sync**: You can click the "Sync" button on any calendar card in the "Manage Calendars" view to immediately pull the latest updates from Google Calendar.
    *   **Automatic Sync**: Behind the scenes, AgileFlow is designed to automatically sync all linked calendars on a regular schedule, ensuring data is always fresh without any manual effort.

**Feature Mapping: The Best of Both Worlds**

AgileFlow intelligently translates features between the two platforms:

*   **Google Meet & Meeting Notes**: When creating an event in AgileFlow, the "Add Attachment" dropdown allows you to trigger Google Calendar's native functions. AgileFlow delegates the request to Google, which creates the Meet link or the notes document and attaches it. The result is then synced back and appears on your AgileFlow event instantly.

*   **Badges and Priorities**: AgileFlow-specific details like event Priority and assigned Role Badges are neatly formatted and stored in the description of the Google Calendar event, so you have full context no matter where you are viewing it.

*   **All-Day Events**: Events that last a full day are displayed as a compact banner at the top of the timeline in the Week, Day, and Production Schedule views, keeping your main schedule clean and readable.

This deep integration ensures that you can leverage the specialized planning tools of AgileFlow while staying perfectly in sync with the broader Google Calendar ecosystem.

## 5. Tasks

The **Tasks** page helps you stay on top of your work.
- **Tabs**: Switch between "My Tasks" (tasks assigned to you) and "All Tasks".
- **Grouping**: Tasks are automatically grouped by their current status (e.g., In Progress, Awaiting Review).
- **New Task**: Click the "New Task" button to create a new task.

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
- **Link Google Calendar**: To connect your Google Calendar, hover over the status dot on your avatar in the sidebar user menu. If disconnected, a tooltip will prompt you to click to connect. A simulated Google sign-in will appear and, once complete, will enable features like creating Google Meet links for your events.

## 8. Management Pages (Admin & Manager Roles)

### 8.1 Admin (`/dashboard/admin`)
This is the central control panel for configuring the application itself. It does not have a page header.
- **Admin Management**: Manage system administrators by dragging and dropping users between the "Admins" and "Users" lists. Granting or revoking admin status requires a 2-Factor Authentication code for security. For safety, the system prevents you from removing the last system administrator. The "Search users" input is automatically focused for convenience.
- **Pages**: Configure the application's navigation. Create new pages, define their URL path, and control who has access to them (by user or team). You can intuitively reorder pages by dragging and dropping them in the grid. Key system pages are pinned and cannot be moved. You can also instantly duplicate any page by dragging it onto the "Add New Page" (+) button. A duplicated page is a completely independent copy with its own unique URL path.
- **Tabs**: Manage the reusable content blocks (tabs) in a simple list view. The order of this list can be changed via drag-and-drop and affects the default order in which tabs appear in popovers, like the "Manage Tabs" control on the Pages screen. The default order is: `Calendars`, `Teams`, `Members`, `Badges`, `Locations`, `Workstations`, `Templates`, `Overview`, `Calendar`, `Tasks`, `Admin Management`, `Settings`, `Pages`, and `Tabs`.

### 8.2 Service Delivery Management (`/dashboard/service-delivery`)
This is the central hub for global application settings.
- **Manage Calendars**: Create, edit, or delete shared calendars. Deleting a calendar is a high-impact action and must be done from the dropdown menu on its card.
- **Manage Teams**: This tab provides a powerful, dynamic interface for managing user groups (called "Teams"). You can drag and drop your owned teams to a shared panel to make them available to others, or drag a shared team from that panel onto your board to link it. To unlink a shared team, simply drag it from your board back to the shared panel.

### 8.3 Team Management (`/dashboard/teams/[teamId]`)
This page is for managing the specifics of an individual team.
- **Team Members**: View all members of the team. Team Admins are now listed in a dedicated column on the left for clarity, while all other members are in a responsive grid on the right. You have full flexibility to manage Team Admins, including removing the last one. You can also click on the "Team Admins" and "Members" titles to rename them for your team.
- **Badge Management**: Create and manage your team's badge collections. To share a collection, simply drag its card to the "Shared Collections" panel. To link a collection from another team, drag it from the shared panel onto your main board. To **activate** a collection for your team, click on its ghosted card; clicking an active card will deactivate it. To **delete** a collection you own, use the dropdown menu on its card.
- **Pinned Locations**: Pin locations to the team's Production Schedule. You can also designate locations as "check locations."
- **Workstations**: Manage a list of bookable workstations or machines for the team.
- **Event Templates**: Create reusable templates for common events. You can edit a template's name by clicking on it directly. Click the edit icon on the template card to manage its requested roles.
- **Location Check Managers**: Assign users who are allowed to manage the daily check assignments for this team's locations.

### 8.4 View As Another User (Admin Only)
Administrators can view the application from another user's perspective.
1.  Click your avatar in the bottom-left corner of the sidebar.
2.  Select "View as" from the dropdown menu.
3.  Choose a user from the list.
4.  A banner will appear at the top of the screen indicating whose view you are using. To return to your own view, repeat the process and select "Return to your view".


    
    
