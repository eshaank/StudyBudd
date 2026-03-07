import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { PomodoroProvider } from "./components/PomodoroProvider";
import { NotificationsProvider } from "./components/NotificationsContext";
import ThemeProvider from "./components/ThemeProvider";

export const metadata = {
  title: "Study Budd",
  description: "AI-powered study assistant",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="overflow-x-hidden" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");if(t==="dark")document.documentElement.classList.add("dark")}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-screen flex flex-col overflow-x-hidden bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <ThemeProvider>
          <NotificationsProvider>
            <PomodoroProvider>
              <Navbar />
              <div className="flex-1">{children}</div>
              <Footer />
            </PomodoroProvider>
          </NotificationsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
