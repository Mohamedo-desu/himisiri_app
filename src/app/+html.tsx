import "@/translations/i18n";
import { ScrollViewStyleReset } from "expo-router/html";
import React, { type PropsWithChildren } from "react";
import "../../unistyles";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />

        {/* App Title and Description */}
        <title>Himisiri - Share your thoughts anonymously</title>
        <meta
          name="description"
          content="Share your thoughts anonymously and connect with others on Himisiri"
        />

        {/* iOS Smart App Banner */}
        <meta
          name="apple-itunes-app"
          content="app-id=YOUR_APP_STORE_ID, app-argument=himisiri://open"
        />

        {/* Android Chrome intent and PWA support */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#4B50B2" />

        {/* Open Graph for social sharing */}
        <meta property="og:title" content="Himisiri" />
        <meta
          property="og:description"
          content="Share your thoughts anonymously and connect with others"
        />
        <meta
          property="og:image"
          content="https://himisiri.expo.app/icon.png"
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://himisiri.expo.app" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Himisiri" />
        <meta
          name="twitter:description"
          content="Share your thoughts anonymously and connect with others"
        />
        <meta
          name="twitter:image"
          content="https://himisiri.expo.app/icon.png"
        />

        {/* Favicon */}
        <link rel="icon" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <link rel="manifest" href="/manifest.json" />

        {/*
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native.
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Smart App Banner and Deep Link Handler */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Only run on mobile devices
                if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                  
                  // Get current path for deep linking
                  const currentPath = window.location.pathname + window.location.search;
                  const deepLink = 'himisiri:/' + currentPath;
                  
                  console.log('Smart redirect - Current path:', currentPath);
                  console.log('Smart redirect - Deep link:', deepLink);
                  
                  // Function to attempt app opening
                  function attemptAppOpen() {
                    // For iOS devices
                    if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
                      console.log('iOS detected - attempting to open app');
                      
                      // Try universal link first (preferred method)
                      const universalLink = window.location.href;
                      window.location.href = universalLink;
                      
                      // Fallback to custom scheme after short delay
                      setTimeout(function() {
                        if (!document.hidden) {
                          window.location.href = deepLink;
                        }
                      }, 500);
                    }
                    // For Android devices
                    else if (/Android/.test(navigator.userAgent)) {
                      console.log('Android detected - attempting to open app');
                      
                      // Create intent URL for Android
                      const intentUrl = 'intent:/' + currentPath + '#Intent;scheme=himisiri;package=com.mohamedodesu.himisiri;S.browser_fallback_url=' + encodeURIComponent(window.location.href) + ';end';
                      
                      try {
                        window.location.href = intentUrl;
                      } catch (e) {
                        console.log('Intent failed, trying custom scheme');
                        window.location.href = deepLink;
                      }
                    }
                  }
                  
                  // Auto-attempt to open app on page load
                  if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', function() {
                      setTimeout(attemptAppOpen, 1000);
                    });
                  } else {
                    setTimeout(attemptAppOpen, 1000);
                  }
                  
                  // Add a manual button for users if auto-redirect fails
                  setTimeout(function() {
                    if (!document.hidden) {
                      const openAppButton = document.createElement('div');
                      openAppButton.innerHTML = \`
                        <div style="
                          position: fixed;
                          top: 20px;
                          left: 50%;
                          transform: translateX(-50%);
                          background: #4B50B2;
                          color: white;
                          padding: 12px 24px;
                          border-radius: 25px;
                          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                          font-size: 14px;
                          font-weight: 600;
                          cursor: pointer;
                          box-shadow: 0 4px 12px rgba(75, 80, 178, 0.3);
                          z-index: 10000;
                          text-align: center;
                          user-select: none;
                        " onclick="(function() { 
                          const currentPath = window.location.pathname + window.location.search;
                          const deepLink = 'himisiri:/' + currentPath;
                          window.location.href = deepLink;
                        })()">
                          📱 Open in Himisiri App
                        </div>
                      \`;
                      document.body.appendChild(openAppButton);
                      
                      // Auto-hide after 10 seconds
                      setTimeout(function() {
                        if (openAppButton.parentNode) {
                          openAppButton.parentNode.removeChild(openAppButton);
                        }
                      }, 10000);
                    }
                  }, 3000);
                }
              })();
            `,
          }}
        />

        {/* Add any additional <head> elements that you want globally available on web... */}
      </head>
      <body>{children}</body>
    </html>
  );
}
