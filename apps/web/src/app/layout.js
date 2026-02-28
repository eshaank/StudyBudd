import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { PomodoroProvider } from "./components/PomodoroProvider";
import { NotificationsProvider } from "./components/NotificationsContext";

export const metadata = {
  title: "Study Budd",
  description: "AI-powered study assistant",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <body className="min-h-screen flex flex-col overflow-x-hidden">
        <NotificationsProvider>
          <PomodoroProvider>
            <Navbar />
            <div className="flex-1">{children}</div>
            <Footer />
          </PomodoroProvider>
        </NotificationsProvider>
      </body>
    </html>
  );
}
