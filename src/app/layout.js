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

          {/* <Facebook Pixel Code> */}
          <Script id="facebook-pixel">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window,document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '1717804821773055'); 
              fbq('track', 'PageView');  
            `}
          </Script>
          <body id="__next">
            <noscript>
              <iframe
                src="https://www.googletagmanager.com/ns.html?id=GTM-5QKCCXNS"
                height="0"
                width="0"
                style={{ display: "none", visibility: "hidden" }}
              ></iframe>
            </noscript>
            <noscript>
              <img
                height="1"
                width="1"
                src="https://www.facebook.com/tr?id=1717804821773055&ev=PageView
              &noscript=1"
              />
            </noscript>
            {children}
          </body>
        </AppContextProvider>
      </UserProvider>
    </html>
  );
}
