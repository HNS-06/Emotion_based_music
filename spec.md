# MoodWave - Music Recommendation Application

## Overview
MoodWave is a music recommendation application that analyzes user mood through typing patterns or manual selection, then recommends and plays music from external APIs based on the detected emotional state.

## Core Features

### Mood Detection & Selection
- **Typing Pattern Analysis**: Analyze user typing speed, rhythm, and patterns to detect emotional state
- **Manual Mood Selection**: Allow users to manually select their current mood from predefined options
- Support mood categories: Happy, Sad, Energetic, Calm, Angry, Romantic, Focused

### Music Integration
- Connect to external music API (Spotify or Deezer) to fetch song recommendations
- Stream music based on detected or selected mood
- Display album art, song title, artist information
- Music player controls: play, pause, skip, previous, like/unlike

### User Interface
- **Glassmorphism Design**: Semi-transparent cards and modals with blur effects
- **Smooth Animations**: Transitions between mood states and UI interactions
- **Mood Graph Visualization**: Dynamic chart showing mood intensity and trends over time
- **Background Animation**: Color-changing background that reflects current mood
- **Navigation Bar**: Clean navigation between different sections
- **Mood Insights Section**: Display mood history and patterns

### Data Storage
The backend must store:
- User mood history and timestamps
- Liked/disliked songs for each user
- Typing pattern data for mood analysis
- User preferences and settings

### Backend Operations
- Process typing pattern data to determine mood
- Store and retrieve user mood history
- Manage user music preferences and liked songs
- Handle external music API integration and caching
- Provide mood analytics and insights

## User Flow
1. User opens the application
2. System analyzes typing patterns or user selects mood manually
3. Application fetches music recommendations based on mood
4. User can play, control, and interact with music
5. Mood data and preferences are saved for future recommendations
6. User can view mood insights and history
