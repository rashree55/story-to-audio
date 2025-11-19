"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  const handleGoogleLogin = () => {
    signIn("google");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="w-full max-w-md bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/10">
        
        <div className="mb-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-500/90 mb-3">
            <span className="text-xl font-extrabold">S</span>
          </div>
          <h1 className="text-2xl font-bold">Story to Audio</h1>
          <p className="text-sm text-gray-300 mt-1">
            Sign in to turn your stories into immersive audio.
          </p>
        </div>

        
        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 font-medium py-3 rounded-xl shadow-md hover:bg-slate-100 transition"
        >
          <img
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            alt="Google"
            className="w-5 h-5"
          />
          <span>Continue with Google</span>
        </button>

        <p className="text-xs text-gray-300 mt-4 text-center">
          By continuing, you agree to our Terms & Privacy Policy.
        </p>
      </div>
    </div>
  );
}
