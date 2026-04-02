import { Livvic } from "next/font/google";
import '../styles/global.css'
import '../styles/main.scss'

import { AuthProvider } from '@/app/context/AuthContext';
import Header from "./components/Header"
import Footer from './components/Footer'
import PostHogProvider from '@/app/providers/PostHogProvider';

const livvic = Livvic({
  variable: "--font-livvic",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata = {
  title: "Hiring | Osmo",
  description: "Osmo is a boutique placement agency that specializes in end-to-end creative staffing for agencies and companies across sectors.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${livvic.variable}`}>
        <PostHogProvider>
          <AuthProvider>
            <Header/>
            <main>{children}</main>
            <Footer/>
          </AuthProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
