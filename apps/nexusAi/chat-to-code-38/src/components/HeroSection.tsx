import { useState } from "react";
import { ArrowRight, Plus, Paperclip, Palette, MessageSquare, Mic, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  const [inputValue, setInputValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-16">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-hero animate-pulse-glow" />
      
      {/* Content */}
      <div className="container mx-auto px-6 relative z-10 flex flex-col items-center text-center">
        {/* Promotional Badge */}
        <div className="mb-8 animate-fade-up">
          <a 
            href="#" 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/60 border border-border hover:bg-secondary/80 transition-colors group"
          >
            <span className="text-lg">🎁</span>
            <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
              Buy a NexusAI gift card
            </span>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </a>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-semibold leading-tight mb-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
          Build something{" "}
          <span className="inline-flex items-center gap-2">
            <span className="text-primary">🧡</span>
            <span className="text-gradient">NexusAI</span>
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-muted-foreground mb-12 animate-fade-up" style={{ animationDelay: '0.2s' }}>
          Create apps and websites by chatting with AI
        </p>

        {/* Chat Input Box */}
        <div 
          className="w-full max-w-2xl animate-scale-in" 
          style={{ animationDelay: '0.3s' }}
        >
          <div className="bg-card rounded-2xl border border-border shadow-lg overflow-hidden">
            {/* Input Area */}
            <div className="p-4">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask NexusAI to create a landing page for my..."
                className="w-full bg-transparent text-foreground placeholder:text-muted-foreground text-base resize-none focus:outline-none min-h-[60px]"
                rows={2}
              />
            </div>

            {/* Bottom Toolbar */}
            <div className="flex items-center justify-between px-4 pb-4">
              {/* Left Actions */}
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary">
                  <Plus className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="sm" className="h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary gap-2">
                  <Paperclip className="w-4 h-4" />
                  Attach
                </Button>
                <Button variant="ghost" size="sm" className="h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary gap-2">
                  <Palette className="w-4 h-4" />
                  Theme
                </Button>
              </div>

              {/* Right Actions */}
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Chat
                </Button>
                <button
                  onClick={() => setIsRecording(!isRecording)}
                  className={`h-9 w-9 rounded-lg flex items-center justify-center transition-all ${
                    isRecording 
                      ? 'bg-primary text-primary-foreground animate-voice-pulse' 
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  <Mic className="w-5 h-5" />
                </button>
                <Button 
                  size="icon" 
                  className="h-9 w-9 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={!inputValue.trim()}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;