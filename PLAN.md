# Queue System Project Plan

## Overview
A real-time queue management system with two distinct interfaces:
1. **Client Interface**: For users to join the queue and track their position.
2. **Admin Interface**: For queue operators to manage entries and call the next person.

## Tech Stack
- **Frontend**: React 18 + Vite + Zustand + Tailwind CSS
- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL
- **Real-time**: Socket.IO (WebSockets)

## Feature Specification

### Client Features
- **Join Queue**: Form to enter Name and Phone number.
- **Position Tracking**: Real-time display of position in line (e.g., "You are #3 in line").
- **Real-time Updates**: Position updates automatically as people are served or leave.
- **Notifications**: Browser alerts when the user is next in line (Position #1).
- **Leave Queue**: Option to exit the queue at any time.
- **Status Indicators**: Visual cues for waiting, called, and served states.

### Admin Features
- **Queue Overview**: Live list of all people currently waiting.
- **Call Next**: Move the next person in line to "Called" status.
- **Skip Client**: Skip a client with an optional reason.
- **Manual Entry**: Add walk-in clients directly to the queue.
- **Basic Statistics**: Track total served, current queue length, and peak daily volume.
- **Role Toggle**: Ability to switch between client and admin views for testing.

## UI/UX Design (Look & Feel)
- **Minimalist Aesthetic**: Clean, white/gray backgrounds with indigo accents.
- **Clear Typography**: Large, bold numbers for queue positions.
- **Color Coding**:
    - **Blue**: Waiting / Neutral
    - **Green**: Next / Served / Success
    - **Red**: Error / Skip / Leave
- **Responsive**: Fully functional on mobile (for clients) and desktop (for admin).

## Database Schema (PostgreSQL)

```sql
CREATE TABLE queues (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE queue_entries (
  id SERIAL PRIMARY KEY,
  queue_id INTEGER REFERENCES queues(id),
  client_name VARCHAR(100) NOT NULL,
  client_phone VARCHAR(20),
  position INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'waiting', -- waiting, called, served, skipped
  joined_at TIMESTAMP DEFAULT NOW(),
  called_at TIMESTAMP NULL,
  served_at TIMESTAMP NULL,
  skip_reason TEXT
);
```

## API Endpoints

### Client API
- `POST /api/queue/join`: Add a new entry to the queue.
- `DELETE /api/queue/leave/:id`: Remove self from the queue.
- `GET /api/queue/status/:id`: Get individual status and position.

### Admin API
- `GET /api/queue/active`: Get all waiting entries.
- `POST /api/queue/call-next`: Advance the queue.
- `POST /api/queue/skip/:id`: Mark an entry as skipped.
- `POST /api/queue/manual-add`: Admin adds a client.
- `GET /api/queue/stats`: Fetch daily metrics.

## Project Structure

### Frontend (`/client`)
- `/src/components`: UI components (ClientView, AdminView, PositionCard, etc.)
- `/src/store`: Zustand stores (`useQueueStore`)
- `/src/hooks`: Custom hooks (`useSocket`)
- `/src/utils`: API wrappers and constants

### Backend (`/server`)
- `/controllers`: Logic for queue operations.
- `/models`: Database interaction.
- `/routes`: API route definitions.
- `/socket`: Socket.IO event handlers.

## Implementation Phases
1. **Scaffolding**: Setup Vite, Tailwind, and Express skeleton.
2. **Database**: Setup PostgreSQL and migrations.
3. **Core API**: Implement Join/Leave/Call-Next endpoints.
4. **Real-time**: Integrate Socket.IO for live position updates.
5. **Frontend UI**: Build Client and Admin interfaces with Tailwind.
6. **Polish**: Add notifications, error handling, and animations.
