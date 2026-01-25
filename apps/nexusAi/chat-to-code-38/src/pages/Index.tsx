import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import TemplatesSection from "@/components/TemplatesSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>NexusAI - Build Apps with AI | Create Apps Through Conversation</title>
        <meta 
          name="description" 
          content="Create apps and websites by chatting with AI. Transform your ideas into fully functional applications with voice commands and natural conversation." 
        />
        <meta name="keywords" content="AI app builder, voice commands, no-code, low-code, web development, AI development, chat to build" />
        <link rel="canonical" href="https://nexusai.dev" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />
        <main>
          <HeroSection />
          <TemplatesSection />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;