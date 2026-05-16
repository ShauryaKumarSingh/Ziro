# Ziro — Tourist Safety System

A real-time SOS platform for tourists. 
One tap on the mobile app sends an emergency alert 
with live location to the admin dashboard instantly.

## Demo
https://youtu.be/mQeGXITAda4

## Tech Stack
- React Native (Expo) — mobile app
- React.js — police/admin dashboard  
- Node.js + Express + TypeScript — backend
- MongoDB Atlas — database
- WebSockets — real-time location sharing
- Leaflet — map rendering
- Deployed on Render

## How it works
1. Tourist opens app, taps SOS
2. Location streams live via WebSockets to backend
3. Admin dashboard plots location in real time on map
4. Dashboard supports monitoring multiple users simultaneously

## Folders
- /Backend — Express + TypeScript server
- /Ziro_App — React Native Expo app
- /policeD — React.js admin dashboard
