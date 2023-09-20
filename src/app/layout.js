import "./globals.css";
import { darkTheme } from "./theme/themes";
import { ThemeProvider, CssBaseline } from "./theme/themeExports";
import { UserProvider } from "@auth0/nextjs-auth0/client";
import AppContextProvider from "@/context/appContext";

export const metadata = {
  title: "Boardzy",
  description: "Create beautiful dashboards for your life",
};
export default function RootLayout({ children }) {
  return (
    <html lang="en">
        <UserProvider>
        <AppContextProvider>
          <CssBaseline />
          <body id="__next">
            {children}
          </body>
        </AppContextProvider>
        </UserProvider>
    </html>
  );
}
