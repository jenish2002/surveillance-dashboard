# Real-Time Surveillance Dashboard

A real-time surveillance system that monitors multiple camera feeds and performs object detection using AI.

## Features

* Add and manage multiple cameras.
* Process RTSP camera streams in real time.
* Detect objects using YOLOv8.
* Store camera and detection data in PostgreSQL.
* View camera status and detection events from a web dashboard.

## Tech Stack

### Frontend

* React
* TypeScript
* Vite

### Backend

* Bun
* Hono
* Drizzle ORM
* PostgreSQL

### Worker Service

* FastAPI
* Python
* OpenCV
* YOLOv8

## Prerequisites

Make sure the following tools are installed before setting up the project:

* Git
* Docker
* Bun
* Node.js
* Python 3.10+

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/jenish2002/surveillance-dashboard.git

cd surveillance-dashboard
```

### 2. Start PostgreSQL (Docker)

Run the following commands from the project root directory:

```bash
# Start PostgreSQL service
docker compose up -d

# Stop PostgreSQL service
docker compose down

# View running containers
docker compose ps
```

### 3. Setup Backend

```bash
cd backend

# Install dependencies
bun install
```

Create a `.env` file in the `backend` directory and add the following environment variables:

* `POSTGRES_USER`
* `POSTGRES_PASSWORD`
* `POSTGRES_DB`
* `DATABASE_URL`
* `JWT_SECRET`
* `WORKER_URL`

```bash
# Generate migration files
bunx drizzle-kit generate

# Apply migrations
bunx drizzle-kit migrate

# Start development server
bun run dev
```

### 4. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 5. Setup Worker

```bash
cd worker

# Create virtual environment
python -m venv .venv

# Activate virtual environment (Windows)
.venv\Scripts\activate

# Activate virtual environment (Linux/macOS)
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Create a `.env` file in the `worker` directory and add the following environment variables:

* `API_URL`

```bash
# Start worker service
uvicorn main:app --reload --port 8000
```

## Project Status

🚧 This project is currently under development. More features and documentation will be added in future updates.

## Support

If you face any issues during setup or have questions about the project, feel free to contact:

**Jenish Patel**
📧 [jenish1820@gmail.com](mailto:jenish1820@gmail.com)
