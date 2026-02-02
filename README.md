# Welcome to your Convex + React (Vite) + Convex Auth app

This is a [Convex](https://convex.dev/) project created with [`npm create convex`](https://www.npmjs.com/package/create-convex).

After the initial setup (<2 minutes) you'll have a working full-stack app using:

- Convex as your backend (database, server logic)
- [React](https://react.dev/) as your frontend (web page interactivity)
- [Vite](https://vitest.dev/) for optimized web hosting
- [Tailwind](https://tailwindcss.com/) for building great looking UI
- [Convex Auth](https://labs.convex.dev/auth) for authentication

## Get started

If you just cloned this codebase and didn't use `npm create convex`, run:

```
npm install --legacy-peer-deps
npm run dev
```

If you're reading this README on GitHub and want to use this template, run:

```
npm create convex@latest -- -t react-vite-convexauth
```

For more information on how to configure Convex Auth, check out the [Convex Auth docs](https://labs.convex.dev/auth/).

For more examples of different Convex Auth flows, check out this [example repo](https://www.convex.dev/templates/convex-auth).

## Initial Setup: Creating the First Admin

This project uses role-based access control where users must be approved before signing in. To bootstrap the system, you need to create the first admin user.

### Step 1: Start the Development Server

```bash
npm run dev
```

### Step 2: Create Admin via Convex Dashboard

1. Open your Convex dashboard (usually http://localhost:3210 when running locally)
2. Click on "Functions" in the left sidebar
3. Navigate to `seed` → `createAdmin`
4. Click "Run Function"
5. Enter the arguments:
   ```json
   {
     "email": "admin@yourdomain.com",
     "name": "Admin Name"
   }
   ```
6. Click "Run"

### Step 3: Sign In as Admin

1. Go to your app (usually http://localhost:5173)
2. Click "Sign In" and enter the admin email
3. Check your email for the magic link (or console logs in dev)
4. Click the link to sign in

### Security Notes

- **Run Once**: The `createAdmin` mutation has built-in guards to prevent creating multiple admins accidentally
- **Access Requests**: After the first admin exists, additional admins should be created via the access request workflow (not this seed mutation)
- **Production**: In production, consider using environment variables or a more secure bootstrapping mechanism

### What Admins Can Do

Admins have full access to:
- View and manage all games
- View and manage all companies
- Approve/deny access requests for teachers and students
- Assign teachers to games and students to companies
- View all reports and outcomes

### Troubleshooting

**"Admin user already exists"**: You already have an admin. Sign in with that admin account or use the access request workflow for additional admins.

**"User with email already exists with role X"**: A user with that email already exists but is not an admin. Use a different email address for the admin.

## Learn more

To learn more about developing your project with Convex, check out:

- The [Tour of Convex](https://docs.convex.dev/get-started) for a thorough introduction to Convex principles.
- The rest of [Convex docs](https://docs.convex.dev/) to learn about all Convex features.
- [Stack](https://stack.convex.dev/) for in-depth articles on advanced topics.

## Join the community

Join thousands of developers building full-stack apps with Convex:

- Join the [Convex Discord community](https://convex.dev/community) to get help in real-time.
- Follow [Convex on GitHub](https://github.com/get-convex/), star and contribute to the open-source implementation of Convex.
