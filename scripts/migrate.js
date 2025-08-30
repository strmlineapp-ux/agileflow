
require('dotenv').config({ path: './.env.local' });
const admin = require('firebase-admin');

// Check if the app is already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

const db = admin.firestore();

async function addWorkspaceIdToCollection(collectionName) {
    const collectionRef = db.collection(collectionName);
    const snapshot = await collectionRef.get();

    if (snapshot.empty) {
        console.log(`No documents found in ${collectionName}. Skipping.`);
        return;
    }

    const batch = db.batch();
    let updatedCount = 0;
    snapshot.forEach(doc => {
        const data = doc.data();
        if (!data.workspaceId) {
            batch.update(doc.ref, { workspaceId: 'default' });
            updatedCount++;
        }
    });

    if (updatedCount > 0) {
        await batch.commit();
        console.log(`Successfully added workspaceId to ${updatedCount} documents in ${collectionName}.`);
    } else {
        console.log(`All documents in ${collectionName} already have a workspaceId.`);
    }
}

async function migrate() {
    console.log('Starting data migration to add workspace IDs...');
    const collectionsToUpdate = [
        'users',
        'teams',
        'projects',
        'calendars',
        'locations',
        'badgeCollections',
        'badges',
        'app-settings',
    ];

    try {
        for (const collectionName of collectionsToUpdate) {
            await addWorkspaceIdToCollection(collectionName);
        }
        console.log('Data migration complete! All documents should now have a workspaceId.');
    } catch (error) {
        console.error("Error during data migration:", error);
        process.exit(1);
    }
    process.exit(0);
}

migrate();
