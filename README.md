# E-Cell BVDU Event Management Platform

A modern, real-time event management platform for E-Cell BVDU Navi Mumbai, built with React, TypeScript, Tailwind CSS, and Supabase.

## Features

### For Students
- **Live Activity Feed**: View all active polls, quizzes, and events in real-time
- **Interactive Polls**: Participate in live polls and see results instantly
- **Engaging Quizzes**: Take quizzes with immediate feedback and scoring
- **Real-time Updates**: All changes sync automatically across all connected devices
- **Progress Tracking**: Track completed polls and quizzes
- **Public Preview**: Browse activities without logging in

### For Admins/Coordinators
- **Poll Management**: Create, edit, and manage live polls with multiple options
- **Quiz Builder**: Design quizzes with multiple questions and correct answers
- **Live Results**: Monitor poll results and quiz submissions in real-time
- **Student Analytics**: Track quiz performance and poll participation
- **Status Control**: Open/close polls and quizzes on demand
- **Export Data**: Download poll results and quiz submissions as CSV

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Authentication, Real-time)
- **Edge Functions**: Hono framework for serverless API endpoints
- **State Management**: React Hooks
- **Notifications**: Sonner for toast messages
- **Icons**: Lucide React

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── admin/          # Admin dashboard components
│   │   │   ├── ui/             # Reusable UI components (shadcn/ui)
│   │   │   ├── ActivityFeed.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── AudienceDashboard.tsx
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── PollDetail.tsx
│   │   │   ├── PublicActivityFeed.tsx
│   │   │   ├── QuizEntry.tsx
│   │   │   ├── QuizQuestion.tsx
│   │   │   └── QuizResults.tsx
│   │   └── App.tsx
│   ├── lib/
│   │   └── supabase.ts         # Supabase client configuration
│   └── styles/
│       ├── index.css
│       ├── tailwind.css
│       └── theme.css
├── supabase/
│   └── functions/
│       └── server/             # Edge function for API endpoints
├── utils/
│   └── supabase/
│       └── info.tsx           # Supabase project info
└── .env                       # Environment variables
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd <project-directory>
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
The `.env` file should already contain the Supabase credentials. If not, create it with:
```env
VITE_SUPABASE_URL=https://hkwbsimktejydjzkdykl.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

4. Set up the admin account:
   - Go to your Supabase dashboard
   - Navigate to Authentication → Users
   - Create a new user with:
     - Email: `EcellBVDU@ecell.com`
     - Password: `SharkTank2026`
     - Enable "Auto Confirm User"
   - After creation, edit the user and add to User Metadata:
     ```json
     {
       "name": "E-Cell Admin",
       "role": "admin"
     }
     ```

5. Start the development server:
```bash
npm run dev
```

6. Build for production:
```bash
npm run build
```

## Database Schema

The application uses a key-value store pattern in Supabase:

### Table: `kv_store_19c6936e`
```sql
CREATE TABLE kv_store_19c6936e (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Key Patterns:
- `poll:{pollId}` - Poll data
- `quiz:{quizId}` - Quiz data
- `vote:{userId}:{pollId}` - User votes
- `quiz_submission:{userId}:{quizId}` - Quiz submissions
- `quiz_progress:{userId}:{quizId}` - Quiz progress tracking

## Authentication

### Student Registration
Students can register using:
- Google Sign-In (coming soon)
- Email/Password with required fields:
  - Full Name
  - Email
  - Course
  - PRN
  - Roll Number
  - Password

### Admin Access
Admins use the dedicated admin login with pre-configured credentials.

## Real-time Features

The application leverages Supabase's real-time capabilities:
- Poll results update live as votes come in
- Quiz submissions appear instantly in admin dashboard
- Activity feed refreshes automatically
- Sync indicators show when data is being updated

## API Endpoints (Edge Functions)

- `GET /make-server-19c6936e/health` - Health check
- `POST /make-server-19c6936e/init` - Initialize admin account
- `POST /make-server-19c6936e/signup` - Student registration
- `GET /make-server-19c6936e/polls` - Get all polls
- `GET /make-server-19c6936e/quizzes` - Get all quizzes

## Security Features

- Row Level Security (RLS) on database tables
- Secure authentication with Supabase Auth
- API key protection for edge functions
- CORS configuration for secure API access
- Input validation and sanitization

## Performance Optimizations

- Code splitting with dynamic imports
- Optimized bundle size with Vite
- Real-time subscriptions cleanup
- Efficient state management
- Lazy loading of components

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Troubleshooting

### Admin Login Issues
- Ensure admin account is created in Supabase with exact credentials
- Check "Auto Confirm User" is enabled
- Verify user metadata includes `role: "admin"`

### Build Warnings
The build may show chunk size warnings - this is normal for applications with many dependencies. Consider implementing code splitting for production.

### Real-time Not Working
- Check Supabase real-time is enabled in your project
- Verify database permissions allow real-time subscriptions
- Check browser console for WebSocket errors

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project uses components from [shadcn/ui](https://ui.shadcn.com/) under MIT license.

## Credits

- Photos from [Unsplash](https://unsplash.com)
- UI Components from [shadcn/ui](https://ui.shadcn.com/)
- Icons from [Lucide](https://lucide.dev/)

## Support

For issues or questions:
- Check the troubleshooting section
- Review Supabase documentation
- Contact E-Cell BVDU technical team
