// apps/web/src/app/u/[handle]/page.jsx
import { notFound, redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";

export default async function UserDashboard({ params }) {
  const { handle } = params;
  const supabase = createSupabaseServer();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Lookup profile by handle
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, handle, display_name")
    .eq("handle", handle)
    .single();

  if (!profile) return notFound();

  // Don’t let other users view a private dashboard (simple MVP rule)
  if (profile.id !== user.id) redirect(`/u/${handle}`); // or redirect("/dashboard")

  // Load settings; create default if missing
  let { data: settings } = await supabase
    .from("dashboard_settings")
    .select("layout")
    .eq("user_id", user.id)
    .single();

  if (!settings) {
    const defaultLayout = {
      cards: ["continue", "pomodoro", "chat", "quizzes"],
      hidden: [],
    };

    await supabase
      .from("dashboard_settings")
      .upsert({ user_id: user.id, layout: defaultLayout });

    settings = { layout: defaultLayout };
  }

  const name = profile.display_name || profile.handle;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-extrabold text-slate-900">
        Welcome back, {name} 👋
      </h1>
      <p className="mt-2 text-slate-600">
        This is your personal dashboard. Cards are ordered from your saved layout.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {settings.layout.cards.map((cardId) => (
          <DashboardCard key={cardId} id={cardId} />
        ))}
      </div>
    </div>
  );
}

function DashboardCard({ id }) {
  const map = {
    continue: {
      title: "Continue where you left off",
      desc: "Resume last chat / last notes / last quiz",
      href: "/dashboard/chat",
    },
    pomodoro: {
      title: "Pomodoro",
      desc: "Start a focus session",
      href: "/dashboard",
    },
    chat: {
      title: "RAG Chat",
      desc: "Ask questions with memory",
      href: "/dashboard/chat",
    },
    quizzes: {
      title: "Quizzes",
      desc: "Generate & review quizzes",
      href: "/dashboard/quizzes",
    },
  };

  const item = map[id] || { title: id, desc: "Unknown card", href: "/dashboard" };

  return (
    <a
      href={item.href}
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition"
    >
      <div className="text-lg font-bold text-slate-900">{item.title}</div>
      <div className="mt-1 text-sm text-slate-600">{item.desc}</div>
    </a>
  );
}
