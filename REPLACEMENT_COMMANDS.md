# NXBC Project Replacement Commands

## 1. Backup the current project

```bash
cd /var/www
mv nextbil-main nextbil-main-backup-$(date +%Y%m%d-%H%M%S)
```

## 2. Extract the replacement ZIP

```bash
unzip nextbil-main-replacement.zip
cd nextbil-main
```

## 3. Install dependencies

```bash
npm ci
```

## 4. Configure environment

```bash
cp .env.example .env
nano .env
```

> Put your real production values in `.env`. Do not copy demo credentials.

## 5. Run checks and build

```bash
npm run lint
npm run build
npm run db:predeploy-check
```

## 6. Restart with PM2

```bash
pm2 restart nextbil-main || pm2 start dist/server.cjs --name nextbil-main
pm2 save
pm2 logs nextbil-main --lines 100
```

## Windows PowerShell

```powershell
Expand-Archive .\nextbil-main-replacement.zip -DestinationPath .
cd .\nextbil-main
npm ci
npm run lint
npm run build
npm run db:predeploy-check
npm start
```
