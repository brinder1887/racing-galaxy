# Ivaan's Racing Galaxy — Go-Live Guide

This turns the prototype into a real website you and Ivaan can both open on
your own phones, with progress syncing between you instantly.

## Step 1 — Create a free Firebase project (~5 min)

1. Go to https://console.firebase.google.com and sign in with a Google account.
2. Click **Add project**, name it anything (e.g. "ivaan-galaxy"), skip Google
   Analytics if asked, and click **Create project**.
3. Once created, click the **</>** (web) icon to add a web app. Give it any
   nickname and click **Register app**.
4. Firebase will show you a code block with a `firebaseConfig` object
   (apiKey, projectId, etc). Copy the whole object.
5. Open `src/firebase.js` in this project and paste your values in, replacing
   the placeholder `firebaseConfig` object at the top.

## Step 2 — Turn on Firestore (the database) (~2 min)

1. In the Firebase console sidebar, click **Build → Firestore Database**.
2. Click **Create database**, choose **Start in test mode** (fine for a
   private family app), pick any region close to you, and click **Enable**.
3. Once it's created, go to the **Rules** tab and paste in the contents of
   `firestore.rules` from this project, then click **Publish**.

## Step 3 — Test it locally (optional but recommended)

If you have Node.js installed:
```
npm install
npm run dev
```
This opens the app in your browser at a local address. Try tapping a
mission, then open the app in a second browser tab — you should see it
sync. If it works locally, it'll work live.

## Step 4 — Push the code to GitHub (~5 min)

1. Go to https://github.com and create a free account if you don't have one.
2. Click **New repository**, name it `racing-galaxy`, keep it Public or
   Private (either works), and click **Create repository**.
3. Follow GitHub's "push an existing repository" instructions, or simply
   drag-and-drop all these project files into the repo using GitHub's web
   uploader (Add file → Upload files) if you'd rather not use git commands.

## Step 5 — Deploy on Netlify (~3 min, free)

1. Go to https://app.netlify.com and sign up (you can sign up directly with
   your GitHub account, which makes step 2 easier).
2. Click **Add new site → Import an existing project**.
3. Choose GitHub, then select your `racing-galaxy` repository.
4. Set the build command to `npm run build` and the publish directory to
   `dist` (Netlify usually detects this automatically for Vite projects).
5. Click **Deploy site**. In about a minute, Netlify gives you a live URL
   like `https://racing-galaxy-1234.netlify.app`.

## Step 6 — Get it on both devices

1. Open the Netlify URL on your phone.
2. Send the same link to Ivaan's device (WhatsApp, message, whatever's easiest).
3. On each device, use the browser's "Add to Home Screen" option so it opens
   like an app icon instead of a browser tab.
4. That's it — his taps and your approvals now sync in real time through
   Firestore, no manual refreshing needed.

## Optional next steps

- **Custom domain**: Netlify lets you add a free `.netlify.app` alias or
  connect a real domain if you ever want one.
- **Basic PIN lock**: since anyone with the link can currently open the app,
  a simple 4-digit PIN screen is a quick addition if you want it more private.
- **Multi-family version**: once this is solid for your household, the
  Firestore structure can extend to one document per family instead of one
  shared document, which is the foundation for scaling to other parents.
