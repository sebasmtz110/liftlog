import "./globals.css";
import TabBar from "./components/TabBar";

export const metadata = {
  title: "LiftLog",
  description: "Simple workout tracker — log exercises, sets, reps and weight.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b0b0d",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <main className="app-main">{children}</main>
          <TabBar />
        </div>
      </body>
    </html>
  );
}
