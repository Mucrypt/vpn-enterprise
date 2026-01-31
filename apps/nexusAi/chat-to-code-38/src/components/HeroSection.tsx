import { useState, useEffect } from "react";
import { ArrowRight, Plus, Paperclip, Palette, MessageSquare, Mic, Send, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AIService } from "@/services/aiService";

const HeroSection = () => {
  const [inputValue, setInputValue] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [showAPIKeyDialog, setShowAPIKeyDialog] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [aiService] = useState(() => new AIService(undefined, true)); // Use public API for browser access
  const [hasApiKey, setHasApiKey] = useState(false);
  const [messages, setMessages] = useState<Array<{role: string, content: string}>>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    // Check if API key exists
    const stored = localStorage.getItem('nexusai_api_key');
    setHasApiKey(!!stored);
    if (!stored) {
      // Show dialog after a short delay
      setTimeout(() => setShowAPIKeyDialog(true), 2000);
    }
  }, []);

  const handleSaveApiKey = () => {
    if (apiKey.trim()) {
      aiService.setAPIKey(apiKey);
      setHasApiKey(true);
      setShowAPIKeyDialog(false);
    }
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    
    if (!hasApiKey) {
      setShowAPIKeyDialog(true);
      return;
    }

    const userMessage = inputValue;
    setInputValue("");
    setIsGenerating(true);
    
    // Add user message to chat
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);

    try {
      const response = await aiService.generate({
        prompt: userMessage,
        model: 'llama3.2:1b',
        temperature: 0.7,
        max_tokens: 2000
      });
      
      // Add AI response to chat
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response.response 
      }]);
      
      console.log('✅ AI Response:', response);
      console.log('📊 Duration:', response.total_duration_ms, 'ms');
      console.log('🔄 Cached:', response.cached);
    } catch (error: any) {
      console.error('❌ Failed to generate:', error);
      setMessages(prev => [...prev, { 
        role: 'error', 
        content: `Error: ${error.message || 'Failed to connect to AI service'}` 
      }]);
    } finally {
      setIsGenerating(false);
    }
  };

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

        {/* Messages Display */}
        {messages.length > 0 && (
          <div className="w-full max-w-2xl mb-6 animate-fade-up" style={{ animationDelay: '0.25s' }}>
            <div className="bg-card rounded-2xl border border-border shadow-lg p-4 max-h-96 overflow-y-auto space-y-4">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-lg p-3 ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground' 
                      : msg.role === 'error'
                      ? 'bg-destructive/10 text-destructive border border-destructive/20'
                      : 'bg-muted'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              ))}
              {isGenerating && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Thinking...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

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
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Ask NexusAI to create a landing page for my..."
                className="w-full bg-transparent text-foreground placeholder:text-muted-foreground text-base resize-none focus:outline-none min-h-[60px]"
                rows={2}
                disabled={isGenerating}
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
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary"
                  onClick={() => setShowAPIKeyDialog(true)}
                  title="API Settings"
                >
                  <Settings className="w-4 h-4" />
                </Button>
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
                  onClick={handleSend}
                  size="icon" 
                  className="h-9 w-9 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
                  disabled={!inputValue.trim() || isGenerating}
                >
                  {isGenerating ? (
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* API Key Dialog */}
      <Dialog open={showAPIKeyDialog} onOpenChange={setShowAPIKeyDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Configure AI API Key</DialogTitle>
            <DialogDescription>
              Enter your VPN Enterprise API key to start building with AI.
              Get your key at: <a href="https://chatbuilds.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-primary underline">chatbuilds.com/dashboard</a>
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="apikey">API Key</Label>
              <Input
                id="apikey"
                placeholder="vpn_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                type="password"
              />
              <p className="text-sm text-muted-foreground">
                {hasApiKey ? "✓ API key is configured" : "No API key configured"}
              </p>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <p className="text-sm font-medium mb-1">Demo API Key:</p>
              <code className="text-xs">vpn_2hrUOubvcBqlrysKkGOe4CBv5_sTi7QEgNLhp7S2WrI</code>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAPIKeyDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveApiKey} disabled={!apiKey.trim()}>
              Save API Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default HeroSection;