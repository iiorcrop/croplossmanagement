# Stage 1: Build Vite React app
FROM node:20-alpine AS builder

WORKDIR /app
RUN npm install -g npm@11
COPY package*.json ./
RUN npm install

COPY . .

# Build arguments for Vite environment variables
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy Vite build output
COPY --from=builder /app/build /usr/share/nginx/html

# Copy nginx config for React SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
