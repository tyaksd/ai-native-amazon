'use client'

import type { Metadata } from "next";

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <style jsx global>{`
          body {
            margin: 0;
            padding: 0;
            background: #000000;
            color: white;
            font-family: Helvetica, Arial, sans-serif;
          }
          * {
            box-sizing: border-box;
          }
        `}</style>
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
