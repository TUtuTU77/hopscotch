import './globals.css'
import StageScaler from '@/components/StageScaler'

export const metadata = {
  title: 'Hopscotch',
  description: 'Travel Until You Are New',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500&family=DM+Serif+Display:ital@0;1&family=Kaushan+Script&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div id="stage">
          <div id="frame">
            {children}
            <StageScaler />
          </div>
        </div>
      </body>
    </html>
  )
}