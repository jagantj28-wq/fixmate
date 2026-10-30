import { ScrollViewStyleReset } from 'expo-router/html';
import type { ReactNode } from 'react';

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
export default function Root({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <title>FixMate — Fieldnotes Home Services Marketplace</title>
        <meta
          name="description"
          content="FixMate: Architectural fieldnotes home services marketplace. Book verified local plumbers, electricians, carpenters, appliance technicians & cleaning experts."
        />

        {/* Disable body scrolling on web for native-like ScrollView feel */}
        <ScrollViewStyleReset />

        {/* FixMate Fieldnotes Responsive Frame & Styling */}
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
html, body {
  height: 100%;
  margin: 0;
  padding: 0;
  background-color: #10372C;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
}

#root {
  display: flex;
  height: 100%;
  width: 100%;
  justify-content: center;
  align-items: stretch;
  background-color: #F7F5EE;
}

/* Centered Smartphone Editorial Preview on Desktop */
@media (min-width: 521px) {
  body {
    background-color: #10372C;
    background-image: radial-gradient(rgba(215, 243, 106, 0.12) 1.5px, transparent 0);
    background-size: 28px 28px;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
  }
  #root {
    max-width: 460px;
    height: 94vh;
    max-height: 940px;
    margin: auto;
    border-radius: 28px;
    box-shadow: 0 30px 70px -15px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(229, 229, 217, 0.25);
    overflow: hidden;
  }
}
`;
