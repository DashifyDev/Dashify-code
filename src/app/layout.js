import "./globals.css";
import { darkTheme } from "./theme/themes";
import { ThemeProvider, CssBaseline } from "./theme/themeExports";
import { UserProvider } from "@auth0/nextjs-auth0/client";
import AppContextProvider from "@/context/appContext";
import Script from "next/script";

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
          <Script id="google-tag-manager" strategy="afterInteractive">
            {`
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','GTM-5QKCCXNS');
            `}
            </Script>
          <body id="__next">
            <noscript>
              <iframe src="https://www.googletagmanager.com/ns.html?id=GTM-5QKCCXNS"
                height="0" width="0" style={{ display: 'none', visibility: 'hidden' }}>
              </iframe>
            </noscript>
            {children}
          </body>
        </AppContextProvider>
        </UserProvider>
    </html>
  );
}
