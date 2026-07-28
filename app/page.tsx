import Header from "@/components/Header";
import Hero from "@/components/Hero";
import About from "@/components/About";
import FamilyGrid from "@/components/FamilyGrid";
import Groups from "@/components/Groups";
import Coaches from "@/components/Coaches";
import Gallery from "@/components/Gallery";
import FAQ from "@/components/FAQ";
import Reviews from "@/components/Reviews";
import SignupForm from "@/components/SignupForm";
import Contacts from "@/components/Contacts";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <About />
        <FamilyGrid />
        <Groups />
        <Coaches />
        <SignupForm />
        <FAQ />
        <Gallery />
        <Reviews />
        <Contacts />
      </main>
      <Footer />
    </>
  );
}
