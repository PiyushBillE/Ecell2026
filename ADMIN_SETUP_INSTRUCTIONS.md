# Admin Account Setup Instructions

The admin account needs to be created manually in your Supabase dashboard. Follow these steps:

## Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **Authentication** → **Users**
3. Click **"Add user"** → **"Create new user"**
4. Fill in the details:
   - **Email**: `EcellBVDU@ecell.com`
   - **Password**: `SharkTank2026`
   - **Auto Confirm User**: ✅ (Enable this - very important!)
5. Click **"Create user"**
6. After the user is created, click on the user to open details
7. Scroll down to **"User Metadata"** section
8. Click **"Edit"** and add:
   ```json
   {
     "name": "E-Cell Admin",
     "role": "admin"
   }
   ```
9. Click **"Save"**

## Option 2: Using SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **"New query"**
4. Paste this SQL:

```sql
-- This creates the admin user in the auth.users table
-- Note: You'll need to hash the password manually or use Supabase's admin API
-- This is just for reference - use the Dashboard method above instead

-- Get the user ID after creating via dashboard:
SELECT id, email, raw_user_meta_data 
FROM auth.users 
WHERE email = 'EcellBVDU@ecell.com';
```

## Verify Admin Account

After creating the account, test it by:
1. Go to your app's login screen
2. Use the **Admin Login** section
3. Enter:
   - Email: `EcellBVDU@ecell.com`
   - Password: `SharkTank2026`
4. You should be redirected to the admin dashboard

## Troubleshooting

**"Invalid login credentials" error:**
- Make sure you enabled "Auto Confirm User" when creating the account
- Check that the email is exactly: `EcellBVDU@ecell.com` (case-sensitive)
- Check that the password is exactly: `SharkTank2026`

**Can't access Supabase Dashboard:**
- Make sure you're logged into the correct Supabase account
- Check that you have the correct project selected

**Still having issues:**
- The Edge Function server may need to be deployed. Check the "Functions" section in Supabase dashboard
- Make sure the server environment variables are set correctly (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, etc.)
