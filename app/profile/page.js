import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import prisma from "../../lib/prisma";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  return (
    <div className="min-h-screen bg-linear-to-br from-sky-50 via-white to-blue-50">
      <header className="w-full bg-linear-to-r from-blue-400 to-blue-300 shadow-lg px-6 py-4 flex items-center justify-between">
        
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-white bg-opacity-20 flex items-center justify-center text-sm font-bold text-white backdrop-blur">
            S
          </div>
          <span className="text-lg font-semibold tracking-wide text-white">
            Story to Audio
          </span>
        </div>

        {/* Logout */}
        <form action="/api/auth/signout" method="post">
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-white text-shadow-blue-300 font-medium shadow-md hover:bg-slate-100 transition"
          >
            Logout
          </button>
        </form>
      </header>

      {/* BODY */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-10 flex flex-col md:flex-row gap-10">
          
          {/* LEFT PANEL : AVATAR + NAME */}
          <div className="flex flex-col items-center md:items-start md:w-1/3 text-center md:text-left">
            <img
              src={user.image}
              alt="Profile"
              className="w-28 h-28 rounded-full mb-4 border-4 border-blue-200 shadow-md object-cover"
            />
            <h1 className="text-2xl font-bold text-slate-900">
              {user.name}
            </h1>
            <p className="text-sm text-slate-500 mt-1">{user.email}</p>

            {/* User Badge */}
            <span className="mt-4 px-4 py-1 text-xs bg-blue-100 text-blue-700 font-semibold rounded-full">
              Verified User
            </span>
          </div>

          {/* RIGHT PANEL : DETAILS */}
          <div className="md:w-2/3 space-y-6">
            <h2 class="text-xl font-semibold text-slate-800 border-b pb-2">
              Account Information
            </h2>

            {/* USER ID */}
            <div>
              <p className="text-slate-500">User ID</p>
              <p className="font-mono text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 mt-1 break-all">
                {user.id}
              </p>
            </div>

            {/* EMAIL */}
            <div>
              <p className="text-slate-500">Email</p>
              <p className="text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 mt-1 break-all">
                {user.email}
              </p>
            </div>

            {/* GRID OF DATES */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-slate-500">Created At</p>
                <p className="text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 mt-1">
                  {new Date(user.createdAt).toLocaleString()}
                </p>
              </div>

              <div>
                <p className="text-slate-500">Last Updated</p>
                <p className="text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 mt-1">
                  {new Date(user.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}
