import "./globals.css";
import { AuthProvider } from "./components/AuthContext";
import AuthGate from "./components/AuthGate";

export const metadata = {
  title: "LiftLog",
  description: "Simple workout tracker — log exercises, sets, reps and weight.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AuthGate>{children}</AuthGate>
        </AuthProvider>
      </body>
    </html>
  );
}
