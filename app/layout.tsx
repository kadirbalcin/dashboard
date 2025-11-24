import "./globals.css";

export const metadata = {
  title: "Process Manager",
  description: "Next.js Process Monitoring Panel"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-neutral-200">
        {children}
      </body>
    </html>
  );
}
