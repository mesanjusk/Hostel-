# Pack with Me — Deployment & Operations Runbook

This document is a complete handover for running the **Pack with Me** (Hostel) app on AWS.
It is written so that an assistant (Claude) or a developer can operate, update, and — if needed —
rebuild the whole stack from scratch, with minimal back-and-forth.

> **Reading order for an assistant:** skim §1–§3 for the mental model, then use §5 (operate),
> §6 (deploy updates), and §11 (troubleshoot) as your working references. §10 is the full
> from-scratch rebuild if the instance is ever lost.

---

## 0. What you (the operator) must obtain first

These are **not** in this repo (on purpose — they're secrets). Get them from the project owner
privately, then place them as noted:

| Secret / access | What it's for | Where it goes |
| --- | --- | --- |
| **SSH private key** `hostel-key` | SSH into the server | Save to `~/.ssh/hostel-key`, then `chmod 600 ~/.ssh/hostel-key` |
| **AWS credentials** (an IAM user with EC2/VPC access) | Manage the instance via CLI | `aws configure` (region `ap-south-1`) |
| **MSG91 dashboard login** | Whitelist domains, toggle OTP settings | msg91.com console |

The app's runtime secrets (JWT secret, DB encryption key, MSG91 auth key, etc.) **already exist
on the server** in `/home/ubuntu/hostel/backend/.env`. You normally never need to touch them.
See §7 if you do.

Tooling you need locally: **AWS CLI v2**, an **SSH client**, and (only to build updates) **Node 20+**.

---

## 1. Architecture

Single self-contained EC2 box. No external database or PaaS.

```
                Internet
                   │  http://52.66.179.25   (port 80)
                   ▼
            ┌──────────────────────────────────────────┐
            │  EC2  t3.micro  Ubuntu 24.04 (Mumbai)     │
            │                                            │
            │   nginx :80                                │
            │    ├─ /            → static SPA            │
            │    │                 (/var/www/hostel/dist)│
            │    ├─ /api/         → 127.0.0.1:4000       │
            │    ├─ /socket.io/   → 127.0.0.1:4000 (ws)  │
            │    └─ /health       → 127.0.0.1:4000       │
            │                                            │
            │   pm2 → node backend  :4000  (hostel-api)  │
            │             │                              │
            │             ▼                              │
            │   MongoDB 8  127.0.0.1:27017 / hostel_prod │
            └──────────────────────────────────────────┘
```

- **Frontend:** Vite + React SPA, built to static files, served by nginx.
- **Backend:** Express + TypeScript (compiled to `dist/`), run by **pm2**, listens on `:4000`.
- **Database:** **self-hosted MongoDB 8** on the same box (not Atlas). DB name `hostel_prod`.
- **Auth:** passwordless **MSG91 "Login with OTP"** (mobile + SMS OTP). See §8.

---

## 2. Server facts (source of truth)

| Item | Value |
| --- | --- |
| Public URL | **http://52.66.179.25** |
| AWS account | `966042699555` ("Instify") |
| Region | `ap-south-1` (Mumbai) |
| EC2 instance ID | `i-07ab26518f4cfdefd` |
| Instance type | `t3.micro` (2 vCPU, ~1 GB RAM) + **2 GB swap** |
| OS | Ubuntu 24.04 LTS |
| Elastic IP | `52.66.179.25` (alloc `eipalloc-0741ee3e84de7b173`) |
| Security group | `sg-0ad4c5058e16d6fb4` (inbound 22, 80, 443 from anywhere) |
| Key pair (AWS) | `hostel-key` (imported; private key is `~/.ssh/hostel-key`) |
| SSH user | `ubuntu` |
| App source on box | `/home/ubuntu/hostel` (`backend/`, `frontend/`) |
| Web root (static) | `/var/www/hostel/dist` |
| Backend env file | `/home/ubuntu/hostel/backend/.env` |
| pm2 process name | `hostel-api` |
| Deployed branch | **`priyal`** (MSG91 passwordless login) |

> The box holds **built source shipped over SCP**, not a git clone — there is no `.git` on the
> server. See §6 for how updates are shipped (and how to switch to git-based deploys).

---

## 3. Runtime layout on the box

```
/home/ubuntu/hostel/
  backend/            Express API (TypeScript)
    .env              runtime secrets (see §7)      ← DO NOT COMMIT
    dist/             compiled JS (node dist/index.js)
    node_modules/
  frontend/           Vite SPA source
    .env              build-time public vars (see §7)
    dist/             build output (copied to web root)
/var/www/hostel/dist/ what nginx actually serves
/etc/nginx/sites-available/hostel   nginx site (symlinked into sites-enabled)
/etc/mongod.conf      MongoDB config (wiredTiger cache capped at 0.25 GB)
/swapfile             2 GB swap (needed so builds don't OOM)
```

---

## 4. Connecting

```bash
ssh -i ~/.ssh/hostel-key ubuntu@52.66.179.25
```

If you see *"UNPROTECTED PRIVATE KEY FILE"*: `chmod 600 ~/.ssh/hostel-key` (Linux/macOS) or fix
the file's ACL on Windows.

All service management below assumes you're either SSH'd in, or wrapping commands as
`ssh -i ~/.ssh/hostel-key ubuntu@52.66.179.25 '<command>'`.

---

## 5. Day-to-day operations

**Health check (from anywhere):**
```bash
curl http://52.66.179.25/health          # → {"status":"ok"}
```

**Backend (pm2):**
```bash
pm2 status                 # list processes
pm2 logs hostel-api        # tail live logs (Ctrl-C to stop)
pm2 logs hostel-api --lines 200 --nostream   # last 200 lines
pm2 restart hostel-api     # restart after an env/code change
pm2 stop hostel-api
```

**nginx:**
```bash
sudo nginx -t              # validate config
sudo systemctl reload nginx
sudo tail -f /var/log/nginx/error.log
```

**MongoDB:**
```bash
systemctl status mongod
mongosh hostel_prod        # open a shell on the app DB
```

**System:**
```bash
free -m                    # memory + swap
df -h /                    # disk
```

---

## 6. Deploying an update

The app is built from the **`priyal`** branch and shipped as a tarball. Two ways:

### 6a. Ship-from-local (current method — no GitHub auth on the box)

On a machine that has the repo checked out (branch `priyal`) and Node installed:

```bash
# 1) package the source (exclude junk)
cd <path-to>/Hostel-
tar --exclude=.git --exclude=node_modules --exclude=dist --exclude='*.log' \
    --exclude=backend/.env --exclude=frontend/.env \
    -czf /tmp/hostel-src.tgz backend frontend README.md

# 2) copy up
scp -i ~/.ssh/hostel-key /tmp/hostel-src.tgz ubuntu@52.66.179.25:/tmp/

# 3) build + release on the box (see deploy script below)
ssh -i ~/.ssh/hostel-key ubuntu@52.66.179.25 'bash /tmp/deploy.sh'
```

The **`deploy.sh`** that lives on the box (`/tmp/deploy.sh`) does: extract → keep existing
`.env` files → `npm ci` + build backend → `npm ci` + build frontend → copy `frontend/dist` to
the web root → `pm2 restart` → reload nginx. If you need to recreate it, its body is:

```bash
#!/usr/bin/env bash
set -euo pipefail
APP=/home/ubuntu/hostel ; WEBROOT=/var/www/hostel/dist
export NODE_OPTIONS=--max-old-space-size=1536   # <-- REQUIRED: 1GB box OOMs tsc/vite without this
# preserve existing env, refresh source
cp "$APP/backend/.env"  /tmp/keep-backend.env  2>/dev/null || true
cp "$APP/frontend/.env" /tmp/keep-frontend.env 2>/dev/null || true
rm -rf "$APP"; mkdir -p "$APP"; tar -xzf /tmp/hostel-src.tgz -C "$APP"
cp /tmp/keep-backend.env  "$APP/backend/.env"
cp /tmp/keep-frontend.env "$APP/frontend/.env"
cd "$APP/backend"  && npm ci --no-audit --no-fund && npm run build
cd "$APP/frontend" && npm ci --no-audit --no-fund && npm run build
sudo mkdir -p "$WEBROOT"; sudo rm -rf "${WEBROOT:?}/"*; sudo cp -r "$APP/frontend/dist/." "$WEBROOT/"
cd "$APP/backend" && pm2 restart hostel-api --update-env || pm2 start dist/index.js --name hostel-api --time
pm2 save
sudo nginx -t && sudo systemctl reload nginx
echo DEPLOY_DONE
```

> **Critical:** always keep `NODE_OPTIONS=--max-old-space-size=1536`. The default V8 heap on a
> 1 GB box is ~460 MB and both `tsc` and `vite` exceed it → `Aborted (core dumped)`. The 2 GB
> swap backs the larger heap.

### 6b. Recommended upgrade: git-based deploys

To make updates a one-liner, put a **read-only GitHub deploy key** on the box:

```bash
ssh -i ~/.ssh/hostel-key ubuntu@52.66.179.25
ssh-keygen -t ed25519 -f ~/.ssh/gh_deploy -N ""     # then add ~/.ssh/gh_deploy.pub as a
                                                    # Deploy Key on the mesanjusk/Hostel- repo
git clone git@github.com:mesanjusk/Hostel-.git ~/hostel-git
```
Then a deploy becomes: `cd ~/hostel-git && git pull && <build + release>`. (Only do this once
`priyal` is merged, or clone `-b priyal`.)

---

## 7. Environment variables

### Backend — `/home/ubuntu/hostel/backend/.env` (secret, already set on box)

| Key | Meaning | Notes |
| --- | --- | --- |
| `NODE_ENV` | `production` | |
| `PORT` | `4000` | nginx proxies to this |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/hostel_prod` | local Mongo |
| `JWT_SECRET` | session token signing secret | generated; keep stable (rotating logs everyone out) |
| `IP_HASH_SALT` | salts hashed visitor IPs (analytics) | generated |
| `PIN_ENCRYPTION_KEY` | AES-256 key (64 hex) for stored PINs | generated |
| `MSG91_AUTH_KEY` | **secret** MSG91 account auth key | verifies OTP tokens server-side |
| `CORS_ORIGIN` | `http://52.66.179.25` | allowed frontend origin(s) |
| `FRONTEND_URL` | `http://52.66.179.25` | |

After editing this file: `pm2 restart hostel-api --update-env`.

### Frontend — `/home/ubuntu/hostel/frontend/.env` (public, baked into the build)

| Key | Value |
| --- | --- |
| `VITE_API_URL` | `http://52.66.179.25` |
| `VITE_MSG91_WIDGET_ID` | `3666786f316c313635323337` |
| `VITE_MSG91_TOKEN_AUTH` | `312759TRZYCE2x67e4f528P1` |

These are public (safe in the bundle). Changing them requires a **frontend rebuild** (§6).

---

## 8. MSG91 OTP login

Login is passwordless: user enters mobile → MSG91 sends an SMS OTP via its "Login with OTP"
widget → the browser gets a signed access token → the backend confirms it with MSG91
(`POST control.msg91.com/api/v5/widget/verifyAccessToken`, using `MSG91_AUTH_KEY`) and reads the
verified number. New numbers auto-register; returning numbers log in. Code:
`frontend/src/lib/msg91.ts`, `frontend/src/pages/otp-login-page.tsx`,
`backend/src/services/msg91Service.ts`, route `POST /api/auth/otp/widget-verify`.

**⚠️ Required for login to work on a domain:** the site's origin must be in the MSG91 widget's
**allowed-domains whitelist** (MSG91 dashboard → the widget → settings), or the widget script
refuses to load and "Send code" fails. Add `52.66.179.25` (and any real domain you attach later).
The same widget/account is shared with the WhatsLocal project — don't create a new widget.

---

## 9. Database (self-hosted MongoDB)

- Runs locally, DB `hostel_prod`, no auth (bound to localhost only — not exposed). Cache capped
  at 0.25 GB in `/etc/mongod.conf` for the small box.
- **Make a user an admin** (there's no admin UI login — role lives in the DB):
  ```bash
  mongosh hostel_prod --eval 'db.users.updateOne({mobile:"91XXXXXXXXXX"}, {$set:{role:"admin"}})'
  ```
  (Mobile is stored as `91` + 10 digits. Register once via OTP first so the user row exists.)
- **Backup / restore:**
  ```bash
  mongodump --db hostel_prod --archive=/home/ubuntu/hostel_$(date +%F).gz --gzip
  mongorestore --archive=<file> --gzip
  ```
- If you'd rather use MongoDB Atlas later, just change `MONGODB_URI` in the backend `.env`
  (and allowlist the server's IP `52.66.179.25` in Atlas Network Access), then
  `pm2 restart hostel-api --update-env`.

---

## 10. Rebuild from scratch (if the instance is lost)

All via AWS CLI (`region ap-south-1`). On Windows Git Bash, prefix EC2 commands with
`MSYS_NO_PATHCONV=1 MSYS2_ARG_CONV_EXCL='*'` so `/dev/...` args aren't mangled.

```bash
# key pair (import your existing public key)
aws ec2 import-key-pair --key-name hostel-key \
  --public-key-material fileb://~/.ssh/hostel-key.pub

# network
VPC=$(aws ec2 describe-vpcs --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text)
SUBNET=$(aws ec2 describe-subnets --filters Name=vpc-id,Values=$VPC Name=default-for-az,Values=true \
         --query 'Subnets[0].SubnetId' --output text)

# security group (22/80/443)
SG=$(aws ec2 create-security-group --group-name hostel-sg \
     --description "Hostel SSH/HTTP/HTTPS" --vpc-id $VPC --query GroupId --output text)
for p in 22 80 443; do aws ec2 authorize-security-group-ingress \
  --group-id $SG --protocol tcp --port $p --cidr 0.0.0.0/0; done

# latest Ubuntu 24.04 AMI
AMI=$(aws ec2 describe-images --owners 099720109477 \
  --filters "Name=name,Values=ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*" \
            "Name=state,Values=available" \
  --query 'sort_by(Images,&CreationDate)[-1].ImageId' --output text)

# launch
IID=$(aws ec2 run-instances --image-id $AMI --instance-type t3.micro --key-name hostel-key \
  --security-group-ids $SG --subnet-id $SUBNET --associate-public-ip-address \
  --block-device-mappings 'DeviceName=/dev/sda1,Ebs={VolumeSize=20,VolumeType=gp3}' \
  --tag-specifications 'ResourceType=instance,Tags=[{Key=Name,Value=hostel}]' \
  --count 1 --query 'Instances[0].InstanceId' --output text)
aws ec2 wait instance-running --instance-ids $IID

# (optional) reuse the existing Elastic IP, or allocate a new one and associate
aws ec2 associate-address --instance-id $IID --allocation-id eipalloc-0741ee3e84de7b173
```

Then **provision the software** over SSH (swap, Node 22, nginx, pm2, MongoDB) — the exact script
is in this repo's deploy notes / can be regenerated; the essential steps are:

```bash
# 2 GB swap
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && \
  sudo swapon /swapfile && echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
# base + node 22 + pm2
sudo apt-get update -y && sudo apt-get install -y nginx git curl
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash - && sudo apt-get install -y nodejs
sudo npm i -g pm2
# MongoDB 8
curl -fsSL https://www.mongodb.org/static/pgp/server-8.0.asc | \
  sudo gpg -o /usr/share/keyrings/mongodb-server-8.0.gpg --dearmor
echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-8.0.gpg ] https://repo.mongodb.org/apt/ubuntu noble/mongodb-org/8.0 multiverse" | \
  sudo tee /etc/apt/sources.list.d/mongodb-org-8.0.list
sudo apt-get update -y && sudo apt-get install -y mongodb-org
sudo systemctl enable --now mongod
```

Finally recreate the two `.env` files (§7), run the deploy (§6a), and write the nginx site (§12).

---

## 11. Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| `Aborted (core dumped)` during build | V8 OOM on the 1 GB box. Ensure `NODE_OPTIONS=--max-old-space-size=1536` and that swap is on (`swapon --show`). |
| `502 Bad Gateway` | Backend down. `pm2 status`; `pm2 logs hostel-api`; likely a crash on boot (bad `.env` / Mongo down). |
| Backend won't start, exits immediately | Missing required env var (`MONGODB_URI`, `JWT_SECRET`, `IP_HASH_SALT`, `PIN_ENCRYPTION_KEY`). Check `pm2 logs`. |
| Login "Send code" fails / widget won't load | Site origin not whitelisted in MSG91 (§8), or `MSG91_AUTH_KEY` missing/blank. |
| Login says "OTP verification failed" | `MSG91_AUTH_KEY` wrong, or the OTP expired. |
| Mongo connection refused | `systemctl status mongod`; `sudo systemctl restart mongod`; check disk with `df -h /`. |
| Site unreachable but instance running | Security group / Elastic IP association, or nginx stopped (`systemctl status nginx`). |
| Disk full | `df -h /`; clear old builds/logs; pm2 logrotate: `pm2 install pm2-logrotate`. |

---

## 12. nginx site (`/etc/nginx/sites-available/hostel`)

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;
    root /var/www/hostel/dist;
    index index.html;
    client_max_body_size 12m;

    location /api/       { proxy_pass http://127.0.0.1:4000; proxy_http_version 1.1;
                           proxy_set_header Host $host; proxy_set_header X-Real-IP $remote_addr;
                           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
                           proxy_set_header X-Forwarded-Proto $scheme; }
    location /socket.io/ { proxy_pass http://127.0.0.1:4000; proxy_http_version 1.1;
                           proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection "upgrade";
                           proxy_set_header Host $host; }
    location = /health   { proxy_pass http://127.0.0.1:4000/health; }
    location /           { try_files $uri $uri/ /index.html; }
}
```
Enable: `sudo ln -sf /etc/nginx/sites-available/hostel /etc/nginx/sites-enabled/hostel && sudo rm -f /etc/nginx/sites-enabled/default && sudo nginx -t && sudo systemctl reload nginx`

---

## 13. Add a domain + HTTPS (recommended next step)

1. Point an A record for your domain → `52.66.179.25`.
2. `sudo snap install --classic certbot && sudo certbot --nginx -d yourdomain.com`
   (certbot edits the nginx site and auto-renews).
3. Update backend `.env` `CORS_ORIGIN`/`FRONTEND_URL` and frontend `VITE_API_URL` to
   `https://yourdomain.com`, rebuild frontend, `pm2 restart hostel-api --update-env`.
4. Add the domain to the **MSG91 allowed-domains** whitelist (§8).

---

## 14. Security & housekeeping follow-ups

- **Rotate the initial AWS access key** if it was ever shared in plaintext; keep keys only in
  `~/.aws/credentials`.
- **Tighten SSH:** restrict security-group port 22 to known IPs instead of `0.0.0.0/0`.
- **Backups:** schedule `mongodump` (cron) off-box (e.g. to S3).
- **Cost:** the `t3.micro` is free-tier-eligible for 12 months; the Elastic IP / public IPv4
  incurs a small charge (~$3–4/mo) regardless. One instance, one EIP — nothing else billable.
- **Merge `priyal` → main** once reviewed.

---

*Generated as a handover runbook. Server of record: `52.66.179.25` (EC2 `i-07ab26518f4cfdefd`,
account `966042699555`, region `ap-south-1`).*

<!-- redeploy-trigger: 2026-07-19T00:00:00Z -->
