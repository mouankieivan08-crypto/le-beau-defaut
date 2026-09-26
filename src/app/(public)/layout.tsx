import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieNotice from "@/components/CookieNotice";

// La boutique lit la base a chaque visite : stock, prix et statuts changent en continu.
// On rend donc ces pages a la demande plutot qu au build.
export const dynamic = "force-dynamic";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <CookieNotice />
    </div>
  );
}
