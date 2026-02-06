/**
 * Login Route - Test User Selection
 *
 * TEMPORARY: Simplified auth for E2E testing using ?user={email} query param
 * Shows a list of test users with buttons to log in as that user
 *
 * See bd-2tk for proper Mailgun magic link implementation
 */

import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useCurrentUser } from "@/hooks/useCurrentUser";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

type TestUser = {
  email: string;
  name: string;
  role: "admin" | "teacher" | "student";
  description: string;
  emoji: string;
  bgColor: string;
};

const testUsers: TestUser[] = [
  {
    email: "student@test.com",
    name: "Test Student",
    role: "student",
    description: "Participate in simulations, view rankings & reports",
    emoji: "👨‍🎓",
    bgColor: "bg-blue-500",
  },
  {
    email: "teacher@test.com",
    name: "Test Teacher",
    role: "teacher",
    description: "Manage game, view all students & reports",
    emoji: "👩‍🏫",
    bgColor: "bg-purple-500",
  },
  {
    email: "admin@test.com",
    name: "Test Admin",
    role: "admin",
    description: "Full access to all features & settings",
    emoji: "👑",
    bgColor: "bg-amber-500",
  },
];

function LoginPage() {
  console.log('[login.tsx] LoginPage component rendering');

  const user = useCurrentUser();
  console.log('[login.tsx] useCurrentUser returned:', user);

  // Already authenticated via ?user param - redirect to appropriate dashboard
  if (user) {
    console.log('[login.tsx] User already authenticated, role:', user.role);
    switch (user.role) {
      case "admin":
        console.log('[login.tsx] Redirecting to /admin/compilation');
        return <Navigate to="/admin/compilation" />;
      case "teacher":
        console.log('[login.tsx] Redirecting to /teacher/dashboard');
        return <Navigate to="/teacher/dashboard" />;
      case "student":
        console.log('[login.tsx] Redirecting to /student');
        return <Navigate to="/student" />;
      default:
        console.log('[login.tsx] Unknown role, returning null');
        return null;
    }
  }

  console.log('[login.tsx] User not authenticated, showing login page');

  const handleLoginAs = (email: string) => {
    console.log('[login.tsx] handleLoginAs called with:', email);
    // Navigate to root with user param - will redirect to appropriate dashboard
    window.location.href = `/?user=${encodeURIComponent(email)}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 px-4 py-12">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to Capo
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">
            Business Simulation Platform
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Select a test user to explore the platform
          </p>
        </div>

        {/* Test User Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {testUsers.map((testUser) => (
            <button
              key={testUser.email}
              onClick={() => handleLoginAs(testUser.email)}
              className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-indigo-500 dark:hover:border-indigo-400"
            >
              {/* Role Badge */}
              <div className={`absolute top-4 right-4 ${testUser.bgColor} text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide`}>
                {testUser.role}
              </div>

              {/* Content */}
              <div className="p-8 text-left">
                {/* Emoji */}
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                  {testUser.emoji}
                </div>

                {/* Name */}
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {testUser.name}
                </h3>

                {/* Email */}
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 font-mono">
                  {testUser.email}
                </p>

                {/* Description */}
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                  {testUser.description}
                </p>

                {/* Arrow indicator */}
                <div className="flex items-center text-indigo-600 dark:text-indigo-400 font-medium text-sm group-hover:gap-2 transition-all">
                  <span>Enter as {testUser.role}</span>
                  <svg
                    className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </div>
              </div>

              {/* Hover gradient effect */}
              <div className={`absolute inset-0 bg-gradient-to-br ${testUser.bgColor} opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none`} />
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-500">
          <p className="mb-2">
            <span className="font-semibold">Development Mode:</span> Authentication via URL parameter for testing
          </p>
          <p className="text-xs">
            Production will use magic link authentication (Mailgun)
          </p>
        </div>
      </div>
    </div>
  );
}
