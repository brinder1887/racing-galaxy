import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";

// 1. Go to https://console.firebase.google.com, create a free project.
// 2. Click the </> (web) icon to register a web app, then copy the config
//    object it gives you and paste it below, replacing everything here.
const firebaseConfig = {
  apiKey: "AIzaSyDOv7MUajxBgq3U-HaqbEvqFpl6xjKGgek",
  authDomain: "ivaan-galaxy.firebaseapp.com",
  projectId: "ivaan-galaxy",
  storageBucket: "ivaan-galaxy.firebasestorage.app",
  messagingSenderId: "592486700684",
  appId: "1:592486700684:web:c0606860fe1a2b908f8da9"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// All of Ivaan's game state lives in one document so both devices
// read/write the exact same record and stay in sync automatically.
const STATE_DOC = doc(db, "families", "ivaan-galaxy");

export async function loadState() {
  const snap = await getDoc(STATE_DOC);
  return snap.exists() ? snap.data() : null;
}

export async function saveState(state) {
  await setDoc(STATE_DOC, state, { merge: true });
}

// Real-time listener: fires instantly whenever either device writes,
// so a kid's "done" tap shows up on the parent's screen with no refresh.
export function subscribeState(callback) {
  return onSnapshot(STATE_DOC, (snap) => {
    if (snap.exists()) callback(snap.data());
  });
}
