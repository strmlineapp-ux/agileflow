
require('dotenv').config({ path: './.env.local' });
const admin = require('firebase-admin');
const { mockUsers, mockTeams, mockCalendars, mockLocations, allMockBadgeCollections, videoProdBadges, liveEventsBadges, pScaleBadges, starRatingBadges, effortBadges, mockEvents, mockTasks } = require('../src/lib/mock-data.js');
const { corePages, coreTabs } = require('../src/lib/core-data.js');

// Check if the app is already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

const db = admin.firestore();

// A robust, recursive function to remove any key with an 'undefined' value and convert Dates.
const sanitizeObject = (obj) => {
  if (obj instanceof Date) {
    // Convert Date objects to Firestore Timestamps
    return admin.firestore.Timestamp.fromDate(obj);
  }
  if (obj === undefined) {
    return null; // Firestore cannot store 'undefined', so we convert to 'null'
  }
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }

  const newObj = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      // Firestore cannot store 'undefined' values in objects.
      if (value !== undefined) {
        newObj[key] = sanitizeObject(value);
      }
    }
  }
  return newObj;
};


async function migrate() {
  console.log('Starting data migration to Firestore...');
  const batch = db.batch();

  // Migrate Users
  console.log('Migrating users...');
  mockUsers.forEach(user => {
    const { userId, ...userData } = user;
    const sanitizedUser = sanitizeObject(userData);
    batch.set(db.collection('users').doc(userId), sanitizedUser);
  });
  
  // Migrate Teams
  console.log('Migrating teams...');
  mockTeams.forEach(team => {
      const { id, ...teamData } = team;
      const sanitizedTeam = sanitizeObject(teamData);
      batch.set(db.collection("teams").doc(id), sanitizedTeam);
  });

  // Migrate Projects, Events, and Tasks
  console.log('Migrating projects, events, and tasks...');
  const mockProjects = [
      { id: 'proj-1', name: 'Q3 All-Hands', owner: { type: 'user', id: '3' }, isShared: true, icon: 'event', color: '#3B82F6' },
      { id: 'proj-2', name: 'Sizzle Reel 2024', owner: { type: 'user', id: '1' }, isShared: true, icon: 'movie', color: '#FBBF24' },
  ];

  mockProjects.forEach(project => {
      const { id, ...projectData } = project;
      const projectRef = db.collection("projects").doc(id);
      batch.set(projectRef, sanitizeObject(projectData));
      console.log(`Added project: ${project.name}`);

      const projectEvents = mockEvents.filter(e => e.projectId === project.id);
      projectEvents.forEach(event => {
          const { eventId, ...eventData } = event;
          const sanitizedEvent = sanitizeObject(eventData);
          batch.set(projectRef.collection('events').doc(eventId), sanitizedEvent);
      });
      console.log(`- Added ${projectEvents.length} events to ${project.name}`);
      
      const projectTasks = mockTasks.filter(t => t.projectId === project.id);
      projectTasks.forEach(task => {
          const { taskId, ...taskData } = task;
          const sanitizedTask = sanitizeObject(taskData);
          batch.set(projectRef.collection('tasks').doc(taskId), sanitizedTask);
      });
      console.log(`- Added ${projectTasks.length} tasks to ${project.name}`);
  });

  // Migrate Badge Collections
  console.log('Migrating badge collections...');
  allMockBadgeCollections.forEach(collection => {
      const { id, ...collectionData } = collection;
      const sanitizedCollection = sanitizeObject(collectionData);
      batch.set(db.collection("badgeCollections").doc(id), sanitizedCollection);
  });

  // Migrate All Badges
  console.log('Migrating all badges...');
  const allBadges = [...videoProdBadges, ...liveEventsBadges, ...pScaleBadges, ...starRatingBadges, ...effortBadges];
  allBadges.forEach(badge => {
      const { id, ...badgeData } = badge;
      const sanitizedBadge = sanitizeObject(badgeData);
      batch.set(db.collection("badges").doc(id), sanitizedBadge);
  });

  // Migrate Calendars
  console.log('Migrating calendars...');
  mockCalendars.forEach(calendar => {
      const { id, ...calendarData } = calendar;
      const sanitizedCalendar = sanitizeObject(calendarData);
      batch.set(db.collection("calendars").doc(id), sanitizedCalendar);
  });

  // Migrate Locations
  console.log('Migrating locations...');
  mockLocations.forEach(location => {
      const { id, ...locationData } = location;
      const sanitizedLocation = sanitizeObject(locationData);
      batch.set(db.collection("locations").doc(id), sanitizedLocation);
  });

  // Migrate App Settings
  console.log('Migrating App Settings...');
  const appSettings = {
      pages: corePages,
      tabs: coreTabs,
      calendarManagementLabel: "Manage Calendars",
      teamManagementLabel: "Manage Teams",
  };
  batch.set(db.collection('app-settings').doc('global'), sanitizeObject(appSettings));
  console.log('Added App Settings.');

  try {
    await batch.commit();
    console.log('Data migration complete!');
  } catch (error) {
    console.error("Error committing batch:", error);
    process.exit(1);
  }
  process.exit(0);
}

migrate();
