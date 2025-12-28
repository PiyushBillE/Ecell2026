# Deployment Guide

This guide covers deploying the E-Cell BVDU Event Management Platform to production.

## Prerequisites

Before deploying, ensure you have:
- A Supabase project (already created)
- Node.js 18+ installed locally
- Git repository access
- Hosting platform account (Vercel, Netlify, or similar)

## Supabase Setup

### 1. Database Setup

The database table should already be created. Verify it exists:

```sql
-- Check if table exists
SELECT * FROM kv_store_19c6936e LIMIT 1;
```

If it doesn't exist, create it:

```sql
CREATE TABLE kv_store_19c6936e (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. Enable Real-time

1. Go to your Supabase Dashboard
2. Navigate to Database → Replication
3. Enable real-time for the `kv_store_19c6936e` table
4. Ensure the following events are enabled:
   - INSERT
   - UPDATE
   - DELETE

### 3. Configure Authentication

1. Go to Authentication → Settings
2. Set up Email Auth:
   - Enable Email provider
   - Disable "Confirm email" (already configured for this app)
3. Configure Site URL:
   - Set your production URL
4. Configure Redirect URLs:
   - Add your production domain

### 4. Edge Functions Deployment

The edge function needs to be deployed to handle API requests:

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Link to your project:
```bash
supabase link --project-ref hkwbsimktejydjzkdykl
```

3. Deploy the edge function:
```bash
supabase functions deploy server
```

4. Verify deployment:
```bash
curl https://hkwbsimktejydjzkdykl.supabase.co/functions/v1/make-server-19c6936e/health
```

Expected response: `{"status":"ok"}`

### 5. Create Admin Account

After deployment, create the admin account:

**Option 1: Using Supabase Dashboard (Recommended)**

1. Go to Authentication → Users
2. Click "Add user" → "Create new user"
3. Fill in:
   - Email: `EcellBVDU@ecell.com`
   - Password: `SharkTank2026`
   - Auto Confirm User: ✅ (Enable this)
4. After creation, edit the user
5. Add to User Metadata:
```json
{
  "name": "E-Cell Admin",
  "role": "admin"
}
```

**Option 2: Using API**

```bash
curl -X POST https://hkwbsimktejydjzkdykl.supabase.co/functions/v1/make-server-19c6936e/init \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Frontend Deployment

### Option 1: Vercel (Recommended)

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Build the project:
```bash
npm run build
```

3. Deploy to Vercel:
```bash
vercel
```

4. Configure environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`: https://hkwbsimktejydjzkdykl.supabase.co
   - `VITE_SUPABASE_ANON_KEY`: Your anon key

5. Set up production domain and deploy:
```bash
vercel --prod
```

### Option 2: Netlify

1. Install Netlify CLI:
```bash
npm install -g netlify-cli
```

2. Build the project:
```bash
npm run build
```

3. Deploy to Netlify:
```bash
netlify deploy --prod --dir=dist
```

4. Configure environment variables in Netlify dashboard:
   - `VITE_SUPABASE_URL`: https://hkwbsimktejydjzkdykl.supabase.co
   - `VITE_SUPABASE_ANON_KEY`: Your anon key

### Option 3: Manual Deployment

1. Build the project:
```bash
npm run build
```

2. The `dist` folder contains all production files

3. Upload the contents to your hosting provider:
   - Upload all files from `dist/` to your web server
   - Configure your web server to serve `index.html` for all routes (SPA routing)

## Environment Variables

### Production Environment Variables

Create these in your hosting platform:

```env
VITE_SUPABASE_URL=https://hkwbsimktejydjzkdykl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhrd2JzaW1rdGVqeWRqemtkeWtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY4MTY5ODgsImV4cCI6MjA4MjM5Mjk4OH0.4lJfEt8xb5GCYZfiGOiTpZDOv1l5oJmxBLAmmHu-YRg
```

## Post-Deployment Checklist

### 1. Verify Deployment

- [ ] Application loads at production URL
- [ ] Can access public activity feed without login
- [ ] Student registration works
- [ ] Student login works
- [ ] Admin login works with credentials
- [ ] Polls display correctly
- [ ] Quizzes display correctly

### 2. Test Real-time Features

- [ ] Open app in two browser windows
- [ ] Create a poll in admin dashboard
- [ ] Verify it appears in student view immediately
- [ ] Submit a vote
- [ ] Verify results update in real-time

### 3. Test Admin Features

- [ ] Create a new poll
- [ ] Edit an existing poll
- [ ] Close a poll
- [ ] Create a quiz
- [ ] View quiz submissions
- [ ] Export data as CSV

### 4. Security Check

- [ ] Admin routes require authentication
- [ ] Students can't access admin dashboard
- [ ] Database queries are authorized
- [ ] CORS is configured correctly
- [ ] Environment variables are not exposed

## Performance Optimization

### 1. Enable Gzip Compression

Configure your hosting provider to enable gzip compression for:
- JavaScript files (.js)
- CSS files (.css)
- HTML files (.html)

### 2. Set Cache Headers

Configure cache headers for static assets:
```
Cache-Control: public, max-age=31536000, immutable
```

For HTML:
```
Cache-Control: no-cache
```

### 3. Enable HTTP/2

Ensure your hosting provider has HTTP/2 enabled for faster asset loading.

### 4. CDN Configuration

Consider using a CDN for static assets to reduce latency globally.

## Monitoring

### 1. Supabase Dashboard

Monitor in Supabase Dashboard:
- Database size and queries
- Auth usage
- Edge function invocations
- Real-time connections

### 2. Application Monitoring

Set up monitoring for:
- Error tracking (Sentry, LogRocket)
- Performance monitoring
- User analytics
- Uptime monitoring

## Backup Strategy

### 1. Database Backups

Supabase automatically backs up your database. To create manual backups:

1. Go to Database → Backups in Supabase Dashboard
2. Click "Create backup"
3. Download backup if needed

### 2. Export Data

Regularly export important data:
```sql
-- Export all polls
COPY (
  SELECT * FROM kv_store_19c6936e
  WHERE key LIKE 'poll:%'
) TO '/path/to/polls_backup.csv' WITH CSV HEADER;

-- Export all quiz submissions
COPY (
  SELECT * FROM kv_store_19c6936e
  WHERE key LIKE 'quiz_submission:%'
) TO '/path/to/submissions_backup.csv' WITH CSV HEADER;
```

## Rollback Procedure

If you need to rollback:

1. **Frontend Rollback**:
   - Vercel: Use deployment history to rollback
   - Netlify: Use deployment history to rollback
   - Manual: Redeploy previous version

2. **Database Rollback**:
   - Go to Database → Backups
   - Restore from a previous backup
   - Verify data integrity

3. **Edge Function Rollback**:
```bash
supabase functions delete server
supabase functions deploy server --legacy
```

## Troubleshooting

### Issue: Admin can't login

**Solution:**
1. Verify admin account exists in Supabase Auth
2. Check "Auto Confirm User" is enabled
3. Verify user metadata includes role: "admin"
4. Check environment variables are correct

### Issue: Real-time not working

**Solution:**
1. Enable real-time in Supabase Dashboard
2. Check real-time subscriptions in browser console
3. Verify CORS settings in Supabase
4. Check WebSocket connections aren't blocked

### Issue: Edge function not responding

**Solution:**
1. Verify function is deployed: `supabase functions list`
2. Check function logs: `supabase functions logs server`
3. Test endpoint directly with curl
4. Verify CORS headers are set

### Issue: Build fails

**Solution:**
1. Clear node_modules: `rm -rf node_modules package-lock.json`
2. Reinstall: `npm install`
3. Clear build cache: `rm -rf dist`
4. Rebuild: `npm run build`

## Scaling Considerations

### When to Scale

Monitor these metrics:
- Database connections > 80% of limit
- Edge function invocations > 1M per month
- Storage > 500MB
- Real-time connections > 200 concurrent

### Scaling Options

1. **Upgrade Supabase Plan**:
   - More database connections
   - Higher rate limits
   - More storage

2. **Optimize Queries**:
   - Add indexes for frequently queried keys
   - Use database connection pooling
   - Implement caching

3. **Load Balancing**:
   - Use multiple edge function instances
   - Implement rate limiting
   - Add request queuing

## Support

For deployment issues:
- Check Supabase status: https://status.supabase.com
- Review deployment logs
- Check browser console for errors
- Contact E-Cell BVDU technical team
