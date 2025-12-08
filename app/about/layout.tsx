'use client'

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
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
      {children}
    </>
  );
}
