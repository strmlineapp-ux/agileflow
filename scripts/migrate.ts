import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";
import { mockUsers, mockTeams, allMockBadgeCollections, mockCalendars } from "../src/lib/mock-data";
import { getFirebaseAppForTenant } from "../src/lib/firebase";

async function migrateData() {
  try {
    // Initialize Firebase for the default tenant
    const app = getFirebaseAppForTenant('default');
    const db = getFirestore(app);

    console.log("Starting data migration to Firestore...");

    // Migrate mockUsers to 'users' collection
    console.log("Migrating users...");
    for (const user of mockUsers) {
      // Using addDoc to let Firestore generate document IDs
      await addDoc(collection(db, "users"), user);
      console.log(`Added user: ${user.displayName}`);
    }
    console.log("User migration complete.");

    // Migrate mockTeams to 'teams' collection
    console.log("Migrating teams...");
    for (const team of mockTeams) {
      // Using addDoc to let Firestore generate document IDs
      await addDoc(collection(db, "teams"), team);
      console.log(`Added team: ${team.name}`);
    }
    console.log("Team migration complete.");

    // Migrate allMockBadgeCollections to 'badgeCollections' collection
    console.log("Migrating badge collections...");
    for (const collectionData of allMockBadgeCollections) {
      // Using addDoc to let Firestore generate document IDs
      await addDoc(collection(db, "badgeCollections"), collectionData);
      console.log(`Added badge collection: ${collectionData.name}`);
    }
    console.log("Badge collection migration complete.");

    // Migrate mockCalendars to 'calendars' collection
    console.log("Migrating calendars...");
    for (const calendarData of mockCalendars) {
      // Using addDoc to let Firestore generate document IDs
      await addDoc(collection(db, "calendars"), calendarData);
      console.log(`Added calendar: ${calendarData.name}`);
    }
    console.log("Calendar migration complete.");

  } catch (error) {
    console.error("Error during data migration:", error);
  }
}

migrateData();