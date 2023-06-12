import "./globals.css";
import { darkTheme } from "./theme/themes";
import { ThemeProvider, CssBaseline } from "./theme/themeExports";

export const metadata = {
  title: "Dashifiy",
  description: "Dashify Home",
};
export default function RootLayout({ children }) {
  return (
    <html lang="en">
        <ThemeProvider theme={darkTheme}>
          <CssBaseline />
          <body id="__next">
            {children}
          </body>
        </ThemeProvider>
    </html>
  );
}