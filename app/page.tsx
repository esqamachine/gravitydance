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
import { getGalleryImages } from "@/lib/queries";

export default async function Home() {
  const gallery = await getGalleryImages();
  const galleryUrls = gallery.map((g) => g.image_url);
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
        <Gallery images={galleryUrls} />
        <Reviews />
        <Contacts />
      </main>
      <Footer />
    </>
  );
}
