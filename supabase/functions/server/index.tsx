import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "npm:@supabase/supabase-js@2";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-19c6936e/health", (c) => {
  return c.json({ status: "ok" });
});

// Internal endpoint to ensure admin exists (called automatically by frontend)
app.post("/make-server-19c6936e/init", async (c) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Try to create the admin account
    const { error } = await supabase.auth.admin.createUser({
      email: 'EcellBVDU@ecell.com',
      password: 'SharkTank2026',
      user_metadata: { 
        name: 'E-Cell Admin',
        role: 'admin'
      },
      email_confirm: true
    });

    if (error) {
      if (error.message.includes('already registered') || error.message.includes('User already registered')) {
        return c.json({ success: true, message: 'Admin account already exists' });
      }
      console.log('Error creating admin account:', error.message);
      return c.json({ success: false, error: error.message });
    }

    console.log('Admin account created successfully');
    return c.json({ success: true, message: 'Admin account created' });
  } catch (err) {
    console.log('Error during admin account initialization:', err);
    return c.json({ success: false, error: 'Initialization failed' });
  }
});

// Admin signup endpoint
app.post("/make-server-19c6936e/signup", async (c) => {
  try {
    const body = await c.req.json();
    const { email, password, name, metadata } = body;

    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    // Create Supabase admin client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Merge name and metadata into user_metadata
    const userMetadata = {
      name: name || 'User',
      ...metadata
    };

    // Create user with admin client
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: userMetadata,
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    });

    if (error) {
      console.log(`Error creating user during signup: ${error.message}`);
      return c.json({ error: error.message }, 400);
    }

    return c.json({ 
      success: true, 
      user: data.user,
      message: 'User created successfully' 
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log(`Server error during signup: ${errorMessage}`);
    return c.json({ error: 'Internal server error' }, 500);
  }
});

// Get all polls
app.get("/make-server-19c6936e/polls", async (c) => {
  try {
    const polls = await kv.getByPrefix('poll:');
    return c.json({ polls });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log(`Error fetching polls: ${errorMessage}`);
    return c.json({ error: 'Failed to fetch polls', polls: [] });
  }
});

// Get all quizzes
app.get("/make-server-19c6936e/quizzes", async (c) => {
  try {
    const quizzes = await kv.getByPrefix('quiz:');
    return c.json({ quizzes });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.log(`Error fetching quizzes: ${errorMessage}`);
    return c.json({ error: 'Failed to fetch quizzes', quizzes: [] });
  }
});

Deno.serve(app.fetch);