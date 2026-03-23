# Backend Folder Structure

This backend is kept small on purpose so it is easier to learn.

## Main folders

- `src/config` : setup files like environment variables and MongoDB connection
- `src/controllers` : logic for each API route
- `src/models` : MongoDB models
- `src/routes` : API endpoints

## Main files

- `src/app.js` : creates the Express app
- `src/server.js` : starts the backend server
- `.env` : stores your real environment variables

## Current API

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
