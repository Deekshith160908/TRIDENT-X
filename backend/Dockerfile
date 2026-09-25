FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source
COPY . .

# Run Drizzle migrations before starting (handled by custom script in production, but we can do push for now)
RUN npm i -g tsx drizzle-kit

EXPOSE 5000

# Start script that pushes schema and starts server
CMD ["sh", "-c", "npx drizzle-kit push && npx tsx src/index.ts"]
