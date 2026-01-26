import type { Metadata } from "next";
import "./globals.css";
import ErrorReporter from "@/components/ErrorReporter";

export const metadata: Metadata = {
  title: "Mill Game - Nine Men's Morris",
  description: "Play Nine Men's Morris online. Challenge AI, play locally with friends, or compete online against players worldwide.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <ErrorReporter />
        {children}
      </body>
    </html>
  );
}
