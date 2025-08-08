import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, setDoc, doc, writeBatch } from "firebase/firestore";
import { mockUsers, mockTeams, allMockBadgeCollections, mockCalendars, videoProdBadges, liveEventsBadges, pScaleBadges, starRatingBadges, effortBadges, mockLocations, mockAppSettings } from "../src/lib/mock-data";
import { getFirebaseAppForTenant } from "../src/lib/firebase";
import { corePages, coreTabs } from "../src/lib/core-data";

async function migrateData() {
  try {
    // Initialize Firebase for the default tenant
    const app = getFirebaseAppForTenant('default');
    const db = getFirestore(app);
    const batch = writeBatch(db);

    console.log("Starting data migration to Firestore...");

    // Migrate mockUsers to 'users' collection with specified IDs
    console.log("Migrating users...");
    for (const user of mockUsers) {
      const userRef = doc(db, "users", user.userId);
      batch.set(userRef, user);
      console.log(`Added user: ${user.displayName} with ID ${user.userId}`);
    }

    // Migrate mockTeams to 'teams' collection
    console.log("Migrating teams...");
    for (const team of mockTeams) {
      const teamRef = doc(db, "teams", team.id);
      batch.set(teamRef, team);
      console.log(`Added team: ${team.name}`);
    }

    // Migrate allMockBadgeCollections to 'badgeCollections' collection
    console.log("Migrating badge collections...");
    for (const collectionData of allMockBadgeCollections) {
      const collectionRef = doc(db, "badgeCollections", collectionData.id);
      batch.set(collectionRef, collectionData);
      console.log(`Added badge collection: ${collectionData.name}`);
    }
    
    // Migrate all badges
    console.log("Migrating all badges...");
    const allBadges = [...videoProdBadges, ...liveEventsBadges, ...pScaleBadges, ...starRatingBadges, ...effortBadges];
    for (const badge of allBadges) {
        const badgeRef = doc(db, "badges", badge.id);
        batch.set(badgeRef, badge);
        console.log(`Added badge: ${badge.name}`);
    }

    // Migrate mockCalendars to 'calendars' collection
    console.log("Migrating calendars...");
    for (const calendarData of mockCalendars) {
      const calendarRef = doc(db, "calendars", calendarData.id);
      batch.set(calendarRef, calendarData);
      console.log(`Added calendar: ${calendarData.name}`);
    }
    
    // Migrate locations
    console.log("Migrating locations...");
    for (const location of mockLocations) {
      const locRef = doc(db, "locations", location.id);
      batch.set(locRef, location);
      console.log(`Added location: ${location.name}`);
    }

    // Migrate AppSettings
    console.log("Migrating App Settings...");
    const appSettingsRef = doc(db, "app-settings", "global");
    // Combine core data with mock dynamic data
    const finalSettings = {
        pages: [...mockAppSettings.pages],
        tabs: [...mockAppSettings.tabs],
        calendarManagementLabel: mockAppSettings.calendarManagementLabel || 'Manage Calendars',
        teamManagementLabel: mockAppSettings.teamManagementLabel || 'Manage Teams',
    };
    batch.set(appSettingsRef, finalSettings);
    console.log("Added App Settings.");


    // Commit the batch
    await batch.commit();
    console.log("All data successfully committed to Firestore!");


  } catch (error) {
    console.error("Error during data migration:", error);
  }
}

migrateData();
