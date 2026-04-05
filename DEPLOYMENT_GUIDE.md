# Fuel Price Finder - Ubuntu VPS Deployment Guide

## App Overview

- **Frontend**: React + Vite + Tailwind CSS (with Leaflet maps)
- **Backend**: Express 5 API server (Node.js)
- **Database**: Remote MySQL at `82.165.170.203`
- **Package Manager**: pnpm (monorepo workspace)
- **Node.js**: v24+

---

## Step 1: Prepare Your Ubuntu VPS

### 1.1 Update system

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 Install Node.js 24

```bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs
node -v   # should show v24.x
```

### 1.3 Install pnpm

```bash
corepack enable
corepack prepare pnpm@latest --activate
pnpm -v   # verify installation
```

### 1.4 Install build tools (needed for native modules like mysql2)

```bash
sudo apt install -y build-essential git
```

### 1.5 Install Nginx (reverse proxy)

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
```

### 1.6 Install PM2 (process manager)

```bash
sudo npm install -g pm2
```

---

## Step 2: Upload Your Project

### Option A: Using Git (recommended)

```bash
# On your VPS
cd /home/$USER
git clone <your-repo-url> fuel-finder
cd fuel-finder
```

### Option B: Using SCP (from your local machine)

```bash
# On your LOCAL machine - zip it first (exclude node_modules, .git, dist)
cd /path/to/Modern-UI
tar --exclude='node_modules' --exclude='.git' --exclude='dist' -czf fuel-finder.tar.gz .

# Upload to VPS
scp fuel-finder.tar.gz user@YOUR_VPS_IP:/home/user/

# On your VPS
mkdir -p /home/$USER/fuel-finder
cd /home/$USER/fuel-finder
tar -xzf ../fuel-finder.tar.gz
```

---

## Step 3: Install Dependencies & Build

```bash
cd /home/$USER/fuel-finder

# Install all workspace dependencies
pnpm install

# Build the entire monorepo (typecheck + build all packages)
pnpm run build
```

After building, you will have:
- **Backend**: `artifacts/api-server/dist/index.mjs` (bundled Express server)
- **Frontend**: `artifacts/fuel-finder/dist/public/` (static files)

---

## Step 4: Configure Environment Variables

### 4.1 Backend (.env or inline)

The backend needs a `PORT` variable. The MySQL credentials are currently hardcoded in `artifacts/api-server/src/routes/fuel.ts`. If you want to externalize them, see the "Security Improvements" section below.

### 4.2 Frontend

The frontend is pre-built as static files. It only needs proper `PORT` and `BASE_PATH` at **build time** (not runtime). If you need to change the base path:

```bash
# Rebuild frontend with custom base path (default "/" is usually fine)
cd /home/$USER/fuel-finder
PORT=4173 BASE_PATH="/" pnpm --filter @workspace/fuel-finder run build
```

---

## Step 5: Start Backend with PM2

```bash
# Start the API server on port 3001
cd /home/$USER/fuel-finder
PORT=3001 pm2 start artifacts/api-server/dist/index.mjs --name "fuel-api"

# Verify it's running
pm2 status
curl http://localhost:3001/api/healthz
# Should return: {"status":"ok"}

# Save PM2 process list so it auto-starts on reboot
pm2 save
pm2 startup
# Follow the command PM2 outputs (sudo env PATH=... pm2 startup ...)
```

---

## Step 6: Configure Nginx

### 6.1 Create Nginx config

```bash
sudo nano /etc/nginx/sites-available/fuel-finder
```

Paste the following:

```nginx
server {
    listen 80;
    server_name YOUR_VPS_IP;  # Replace with your IP or domain name

    # Frontend - serve static files
    root /home/YOUR_USER/fuel-finder/artifacts/fuel-finder/dist/public;
    index index.html;

    # API - proxy to Express backend
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # SPA fallback - all other routes go to index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

> **Important**: Replace `YOUR_VPS_IP` with your actual IP address and `YOUR_USER` with your Linux username.

### 6.2 Enable the site

```bash
sudo ln -s /etc/nginx/sites-available/fuel-finder /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default   # Remove default site
sudo nginx -t                               # Test config
sudo systemctl reload nginx
```

### 6.3 Test it

Open your browser and go to `http://YOUR_VPS_IP` - you should see the Fuel Finder app!

---

## Step 7: Firewall Setup

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

---

## Step 8 (Optional): Add SSL with Let's Encrypt

If you have a domain name pointing to your VPS:

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
# Follow the prompts

# Auto-renewal is set up automatically, verify:
sudo certbot renew --dry-run
```

After this, update Nginx config `server_name` to your domain:

```nginx
server_name yourdomain.com;
```

---

## Quick Reference - Common Commands

| Action | Command |
|---|---|
| Check app status | `pm2 status` |
| View backend logs | `pm2 logs fuel-api` |
| Restart backend | `pm2 restart fuel-api` |
| Stop backend | `pm2 stop fuel-api` |
| Rebuild after code changes | `cd ~/fuel-finder && pnpm run build && pm2 restart fuel-api` |
| Restart Nginx | `sudo systemctl restart nginx` |
| Check Nginx errors | `sudo tail -f /var/log/nginx/error.log` |

---

## Security Improvements (Recommended)

### Move MySQL credentials to environment variables

Currently, your MySQL credentials are hardcoded in `artifacts/api-server/src/routes/fuel.ts`. For production, update the code to use environment variables:

**1. Edit `artifacts/api-server/src/routes/fuel.ts`** - change the `getPool()` function:

```typescript
function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST || "82.165.170.203",
      user: process.env.MYSQL_USER || "phpmyadmin",
      password: process.env.MYSQL_PASSWORD || "Moshyrfare@1",
      database: process.env.MYSQL_DATABASE || "materiali_db",
      charset: "utf8mb4",
      connectionLimit: 10,
    });
  }
  return pool;
}
```

**2. Create a `.env` file** in the project root:

```bash
MYSQL_HOST=82.165.170.203
MYSQL_USER=phpmyadmin
MYSQL_PASSWORD=Moshyrfare@1
MYSQL_DATABASE=materiali_db
```

**3. Start PM2 with env file:**

```bash
PORT=3001 MYSQL_HOST=82.165.170.203 MYSQL_USER=phpmyadmin MYSQL_PASSWORD=Moshyrfare@1 MYSQL_DATABASE=materiali_db pm2 start artifacts/api-server/dist/index.mjs --name "fuel-api"
```

Or use a PM2 ecosystem file (see next section).

---

## PM2 Ecosystem File (Recommended)

Create `ecosystem.config.cjs` in the project root for easier management:

```javascript
module.exports = {
  apps: [{
    name: "fuel-api",
    script: "./artifacts/api-server/dist/index.mjs",
    env: {
      PORT: 3001,
      NODE_ENV: "production",
      MYSQL_HOST: "82.165.170.203",
      MYSQL_USER: "phpmyadmin",
      MYSQL_PASSWORD: "Moshyrfare@1",
      MYSQL_DATABASE: "materiali_db"
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: "500M",
    log_date_format: "YYYY-MM-DD HH:mm:ss"
  }]
};
```

Then start with:

```bash
pm2 start ecosystem.config.cjs
pm2 save
```

---

## Deployment Checklist

- [ ] Ubuntu updated
- [ ] Node.js 24 installed
- [ ] pnpm installed
- [ ] Project uploaded to VPS
- [ ] `pnpm install` completed
- [ ] `pnpm run build` completed
- [ ] Backend started with PM2 on port 3001
- [ ] `curl http://localhost:3001/api/healthz` returns `{"status":"ok"}`
- [ ] Nginx configured and running
- [ ] Firewall enabled (ports 22, 80, 443)
- [ ] App accessible at `http://YOUR_VPS_IP`
- [ ] (Optional) SSL certificate installed
- [ ] (Optional) MySQL credentials moved to env variables
- [ ] PM2 startup configured for auto-restart on reboot

---

## Troubleshooting

### Backend won't start
```bash
# Check logs
pm2 logs fuel-api --lines 50

# Try running manually to see errors
cd ~/fuel-finder
PORT=3001 node artifacts/api-server/dist/index.mjs
```

### Frontend shows blank page
```bash
# Verify build output exists
ls -la ~/fuel-finder/artifacts/fuel-finder/dist/public/

# Check Nginx config
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

### API calls fail from frontend
```bash
# Verify the backend is reachable
curl http://localhost:3001/api/healthz
curl http://localhost:3001/api/fuel/fuels

# Check that Nginx proxies /api/ correctly
curl http://YOUR_VPS_IP/api/healthz
```

### MySQL connection errors
```bash
# Test MySQL connectivity from VPS
sudo apt install -y mysql-client
mysql -h 82.165.170.203 -u phpmyadmin -p materiali_db
```

### Rebuild after code changes
```bash
cd ~/fuel-finder
pnpm run build
pm2 restart fuel-api
# No need to restart Nginx for backend changes
# For frontend changes, the new static files are served automatically
```
