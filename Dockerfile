FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install dependencies
RUN npm install
RUN npm --prefix backend ci
RUN npm --prefix frontend ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npm --prefix backend run prisma:generate

# Build frontend
RUN npm --prefix frontend run build

# Expose port
EXPOSE 3000

# Start server
CMD ["npm", "run", "start"]
