# Cyber Essentials in Action — Digital Game

## Overview

A Kahoot/Mentimeter-style multiplayer cybersecurity awareness game for Singapore's CSA Cyber Health Clinics.

## Game Modes

### ⚡ Cyber Attack (Quick-Fire Round)
- 24 MCQ questions sourced from the CSA Facilitator Guide
- 1-minute timer per question
- Speed-based scoring: 1000 pts base + up to 500 bonus for fastest correct answer
- Real-time leaderboard after each question

### 🎭 Cyber Quest (Scenario Role-Play)
- 9 real-world scenarios: Ransomware, Social Engineering, Deepfake, Supply Chain Attack, Cloud Misconfiguration, Shadow AI, AI & Data Leakage, AI Manipulation, Access Keys for Cloud AI
- 3-minute timer per scenario
- Facilitator chooses which scenario(s) to run
- Players discuss and submit responses based on their assigned role
- Facilitator awards points (100/300/500) during debrief

## Setup

### 1. Supabase (Database + Realtime)
1. Go to your Supabase project
2. Open the SQL Editor
3. Run the contents of `supabase/game_schema.sql`
4. This creates: `game_rooms`, `game_players`, `game_answers` tables with Realtime enabled

### 2. Environment Variables
Ensure `.env.local` has:
```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Vercel Deploy
1. Push to GitHub
2. Import in Vercel
3. Add environment variables in Vercel project settings
4. Deploy

## How to Run a Session

### As Facilitator:
1. Go to `/game`
2. Click **Host Game**
3. Select your **sector/clinic type** (MinLaw, HIA, General, etc.)
4. Enter your name → **Create Game Room**
5. Share the 6-character **room code** with participants
6. Choose **Cyber Attack** or **Cyber Quest** mode
7. Control the game from the host panel

### As Participant:
1. Go to `/game` on any device
2. Click **Join Game**
3. Enter your name and the **room code**
4. Wait for the facilitator to start

## URL Structure

- `/game` — Home (host or join)
- `/game/[ROOMCODE]/host` — Facilitator control panel
- `/game/[ROOMCODE]/play` — Player game view

## Sector Types

| Sector | Use Case |
|--------|----------|
| MinLaw Clinic | Legal & Law Firms |
| HIA Clinic | Healthcare & Healthtech |
| Finance Clinic | Finance & Banking |
| Retail & F&B | Retail, Food & Beverage |
| Tech Sector | Technology & ICT |
| Education | Schools & Higher Education |
| General Business | All other sectors |
