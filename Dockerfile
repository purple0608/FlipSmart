# Stage 1: Node.js and Python setup
FROM node:20-alpine AS node-build

# Install Python and other dependencies
RUN apk add --no-cache python3 py3-pip py3-dotenv

# Create a virtual environment
RUN python3 -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Set working directory in the container for Node.js
WORKDIR /app

# Copy package.json for both frontend and backend
COPY frontend/package*.json ./frontend/
COPY backend/package*.json  ./backend/

# Install frontend dependencies
WORKDIR /app/frontend
RUN npm install

# Install backend dependencies
WORKDIR /app/backend
RUN npm install

# Install fetch polyfill (node-fetch or undici)
RUN npm install node-fetch
RUN npm install @google/generative-ai

# Copy the rest of the frontend and backend source code
WORKDIR /app
COPY frontend /app/frontend
COPY backend /app/backend

# Install 'concurrently' to run multiple services at once
RUN npm install -g concurrently

# Copy requirements.txt for Python dependencies
COPY requirements.txt .

# Upgrade pip and install Python dependencies
RUN pip install --upgrade pip
RUN pip install -r requirements.txt
# RUN pip install azure-cognitiveservices-speech
# COPY backend/azure_cognitiveservices_speech-1.40.0-py3-none-manylinux1_x86_64.whl /opt/
# RUN pip install /opt/azure_cognitiveservices_speech-1.40.0-py3-none-manylinux1_x86_64.whl

# Expose the necessary ports
EXPOSE 5173    
EXPOSE 3000    
EXPOSE 5000    

# Start all three services: frontend, backend, and app.py
CMD ["concurrently", "\"cd frontend && npm run dev\"", "\"cd backend && npm run dev\"", "\"python /app/frontend/src/pages/app.py\""]
