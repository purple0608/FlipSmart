# Stage 1: Node.js and Python setup
FROM node:17-alpine AS node-build

# Install Python and other dependencies
RUN apk add --no-cache python3 py3-pip
RUN pip3 install python-dotenv


# Set working directory in the container for Node.js
WORKDIR /app

# Copy package.json for both frontend and backend
COPY frontend/package.json ./frontend/
COPY backend/package.json  ./backend/

# Install frontend dependencies
WORKDIR /app/frontend
RUN npm install

# Install backend dependencies
WORKDIR /app/backend
RUN npm install

# Install fetch polyfill (node-fetch or undici)
RUN npm install node-fetch

# Copy the rest of the frontend and backend source code
WORKDIR /app
COPY frontend /app/frontend
COPY backend /app/backend

# Install 'concurrently' to run multiple services at once
RUN npm install -g concurrently
COPY requirements.txt /app/
WORKDIR /app
RUN pip3 install -r requirements.txt

# Expose the necessary ports
EXPOSE 5173    
EXPOSE 3000    
EXPOSE 5000    

# Start all three services: frontend, backend, and app.py
CMD ["concurrently", "\"cd frontend && npm run dev\"", "\"cd backend && npm run dev\"", "\"python3 frontend/src/pages/app.py\""]