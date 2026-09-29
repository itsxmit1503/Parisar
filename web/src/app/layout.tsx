import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PARISAR — Dr. Harisingh Gour Vishwavidyalaya (DHSGSU)",
  description: "Dedicated campus event management and student participation platform for Dr. Harisingh Gour Vishwavidyalaya (DHSGSU), Sagar (M.P.). Your Campus. Your Events. Your Community.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#F4F0E8] text-[#18212B] min-h-screen antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
