import "./globals.css";
import { AuthProvider } from "./components/AuthContext";
import AuthGate from "./components/AuthGate";
import InstallPrompt from "./components/InstallPrompt";
import ForegroundRefresh from "./components/ForegroundRefresh";

export const metadata = {
  title: "LiftLog",
  description: "Simple workout tracker — log exercises, sets, reps and weight.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "LiftLog",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#FFFFFF",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AuthGate>{children}</AuthGate>
          <InstallPrompt />
          <ForegroundRefresh />
        </AuthProvider>
      </body>
    </html>
  );
}
