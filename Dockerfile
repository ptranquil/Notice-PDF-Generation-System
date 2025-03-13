FROM node:latest

# Set working directory
WORKDIR /code

# Install system dependencies required for Puppeteer
RUN apt-get update && apt-get install -y \
    libnss3 \
    libatk1.0-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxfixes3 \
    libxi6 \
    libxrandr2 \
    libgbm1 \
    libpango1.0-0 \
    libasound2 \
    libxshmfence1 \
    ca-certificates \
    fonts-liberation \
    libappindicator3-1 \
    lsb-release \
    xdg-utils \
    wget \
    && rm -rf /var/lib/apt/lists/*

# # Install Bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:$PATH"

# Copy package files first to leverage Docker caching
COPY package.json ./

# Install dependencies
RUN npm install
RUN npm install -g pm2 typescript

# Copy the rest of the application files
COPY . .

# Build TypeScript inside Docker
RUN npx tsc

# Set environment variable
ENV NODE_ENV="production"

# Start the application using PM2
CMD ["pm2-runtime", "start", "pm2.config.cjs", "--env", "production"]
