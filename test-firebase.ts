import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

const app = initializeApp({
  credential: applicationDefault(),
  projectId: firebaseConfig.projectId
});
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

async function test() {
  await db.collection('test').doc('doc1').set({ foo: 'bar' });
  const doc = await db.collection('test').doc('doc1').get();
  console.log('Read data:', doc.data());
}

test().catch(console.error);
