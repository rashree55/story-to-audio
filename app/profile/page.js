import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { redirect } from "next/navigation";
import prisma from "../../lib/prisma";

export default async function ProfilePage() {
  // ✅ Fetch session properly
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

 
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  return (
    <div className="min-h-screen bg-linear-to-br from-sky-50 via-white to-blue-50">
      
      
      <header className="w-full bg-linear-to-r from-blue-500 to-blue-400 shadow-lg px-6 py-4 flex items-center justify-between">
        
       
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white bg-opacity-20 flex items-center justify-center text-sm font-bold text-white backdrop-blur">
            S
          </div>
          <span className="text-xl font-semibold tracking-wide text-white">
            Story to Audio
          </span>
        </div>

       
        <form action="/api/auth/signout" method="post">
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-white text-blue-700 font-semibold shadow-md hover:bg-slate-100 transition border border-blue-200"
          >
            Logout
          </button>
        </form>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-10 flex flex-col md:flex-row gap-10">
          
     
          <div className="flex flex-col items-center md:items-start md:w-1/3 text-center md:text-left">
            <img
              src={user.image}
              alt="Profile"
              className="w-32 h-32 rounded-full mb-4 border-4 border-blue-200 shadow-lg object-cover"
            />
            <h1 className="text-3xl font-bold text-slate-900">{user.name}</h1>
            <p className="text-sm text-slate-500 mt-1">{user.email}</p>

            <span className="mt-4 px-4 py-1 text-xs bg-blue-100 text-blue-700 font-semibold rounded-full">
              Verified User
            </span>
          </div>

        
          <div className="md:w-2/3 space-y-6">
            
            <h2 className="text-xl font-semibold text-slate-800 border-b pb-2">
              Account Information
            </h2>

          
            <div>
              <p className="text-slate-500">User ID</p>
              <p className="font-mono text-xs text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 mt-1 break-all">
                {user.id}
              </p>
            </div>

    
            <div>
              <p className="text-slate-500">Email</p>
              <p className="text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 mt-1 break-all">
                {user.email}
              </p>
            </div>


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
