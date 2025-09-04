# Deploy to Vercel with Secure Password (10 Minutes)

## Why Vercel?
- **Password NEVER in code** - stored as environment variable
- **Actually secure** - backend authentication
- **Free tier**: 100GB bandwidth, unlimited sites
- **Fast global CDN**
- **Easy deployment**

## Prerequisites
- Node.js installed (for local testing)
- Git (optional, for easier deployment)

## Step 1: Install Vercel CLI

```bash
npm install -g vercel
```

## Step 2: Set Up Local Development (Optional)

1. Create `.env.local` file (for local testing):
```bash
cp .env.example .env.local
```

2. Edit `.env.local` and set your password:
```
APP_PASSWORD=your-actual-password-here
SESSION_SECRET=some-long-random-string
```

3. Install dependencies:
```bash
npm install
```

4. Run locally:
```bash
npm run dev
# OR
vercel dev
```

Visit http://localhost:3000 to test locally.

## Step 3: Deploy to Vercel

### Option A: Deploy with CLI (Recommended)

1. Run deployment command:
```bash
vercel
```

2. Follow prompts:
   - Login/Create Vercel account
   - Set up and deploy project? **Yes**
   - Which scope? Select your account
   - Link to existing project? **No**
   - Project name? `speedrun-form` (or whatever)
   - Directory? `.` (current)
   - Override settings? **No**

3. Set environment variables:
```bash
# Set production password (IMPORTANT!)
vercel env add APP_PASSWORD production
# Enter your actual password when prompted

# Set session secret
vercel env add SESSION_SECRET production
# Enter a long random string
```

4. Deploy to production:
```bash
vercel --prod
```

Your site is now live! URL will be shown (something.vercel.app)

### Option B: Deploy via GitHub

1. Push code to GitHub repository

2. Go to [vercel.com](https://vercel.com)

3. Click "New Project"

4. Import your GitHub repository

5. **IMPORTANT**: Add Environment Variables:
   - Click "Environment Variables"
   - Add `APP_PASSWORD` = your actual password
   - Add `SESSION_SECRET` = random long string

6. Click "Deploy"

## Step 4: Set Your Password (CRITICAL!)

### Via Dashboard (Easy):
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click your project
3. Go to **Settings** → **Environment Variables**
4. Add/Edit:
   - `APP_PASSWORD` = `your-secure-password`
   - `SESSION_SECRET` = `generate-random-string-here`
5. Click Save

### Via CLI:
```bash
vercel env add APP_PASSWORD production
# Type your password (hidden)

vercel env add SESSION_SECRET production  
# Type a random string
```

## Step 5: Redeploy After Setting Password

```bash
vercel --prod
```

Or in dashboard: **Settings** → **Functions** → **Redeploy**

## How It Works

1. User enters password on your site
2. Password sent to Vercel backend (not visible in code)
3. Backend checks against `APP_PASSWORD` environment variable
4. If correct, returns secure token
5. Token stored in browser for session
6. Form access granted

## Testing Your Deployment

1. Visit your Vercel URL
2. Enter the password you set in environment variables
3. Form should appear
4. Data saves to localStorage (per user)

## Changing Password Later

1. Go to Vercel dashboard
2. Settings → Environment Variables
3. Edit `APP_PASSWORD`
4. Save (auto-redeploys)
5. New password active immediately!

## Custom Domain (Optional)

1. In Vercel dashboard → Settings → Domains
2. Add your domain (e.g., form.yourdomain.com)
3. Follow DNS instructions
4. HTTPS automatic and free

## Security Benefits

✅ **Password never in code** - stored in Vercel's secure environment
✅ **Can't be seen in browser** - backend authentication
✅ **Token-based sessions** - secure authentication
✅ **HTTPS enforced** - encrypted connections
✅ **Change password anytime** - without touching code

## Troubleshooting

**"Invalid password" but you're sure it's correct:**
- Check environment variables are set in Vercel dashboard
- Redeploy after setting variables
- Make sure no spaces/quotes in password

**"Connection error" message:**
- Check if API endpoint is working: `your-site.vercel.app/api/auth`
- Check browser console for errors
- Try incognito mode (no extensions)

**Local development not working:**
- Make sure `.env.local` exists with variables
- Run `vercel dev` not just `npm run dev`
- Check Node.js is installed

## Cost

**FREE tier includes:**
- 100GB bandwidth/month
- Unlimited projects
- Automatic HTTPS
- Global CDN
- Serverless functions
- Environment variables

More than enough for your form!

## Commands Reference

```bash
# Deploy
vercel          # Deploy preview
vercel --prod   # Deploy production

# Environment Variables
vercel env add [name] [environment]    # Add variable
vercel env rm [name] [environment]     # Remove variable
vercel env ls                          # List variables

# Local Development
vercel dev      # Run locally with env vars

# Logs
vercel logs     # View function logs
```

---

**Your password is now actually secure and not visible in any code!**