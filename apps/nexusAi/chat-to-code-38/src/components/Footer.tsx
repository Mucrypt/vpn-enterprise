import { Flame, Globe } from "lucide-react";

const footerLinks = {
  company: {
    title: "Company",
    links: [
      { label: "Careers", href: "#" },
      { label: "Press & media", href: "#" },
      { label: "Enterprise", href: "#" },
      { label: "Security", href: "#" },
      { label: "Trust center", href: "#" },
      { label: "Partnerships", href: "#" },
    ],
  },
  product: {
    title: "Product",
    links: [
      { label: "Pricing", href: "#" },
      { label: "Student discount", href: "#" },
      { label: "Founders", href: "#" },
      { label: "Product Managers", href: "#" },
      { label: "Designers", href: "#" },
      { label: "Marketers", href: "#" },
      { label: "Prototyping", href: "#" },
      { label: "Internal Tools", href: "#" },
      { label: "Connections", href: "#" },
      { label: "Changelog", href: "#" },
      { label: "Status", href: "#" },
    ],
  },
  resources: {
    title: "Resources",
    links: [
      { label: "Learn", href: "#" },
      { label: "Templates", href: "#" },
      { label: "Guides", href: "#" },
      { label: "Videos", href: "#" },
      { label: "Blog", href: "#" },
      { label: "Support", href: "#" },
    ],
  },
  legal: {
    title: "Legal",
    links: [
      { label: "Privacy policy", href: "#" },
      { label: "Cookie settings", href: "#" },
      { label: "Terms of Service", href: "#" },
      { label: "Platform rules", href: "#" },
      { label: "Report abuse", href: "#" },
      { label: "Report security concerns", href: "#" },
      { label: "DPA", href: "#" },
    ],
  },
  community: {
    title: "Community",
    links: [
      { label: "Apply to our expert program", href: "#" },
      { label: "Hire a NexusAI expert", href: "#" },
      { label: "Affiliates", href: "#" },
      { label: "Discord", href: "#" },
      { label: "Reddit", href: "#" },
      { label: "X / Twitter", href: "#" },
      { label: "YouTube", href: "#" },
      { label: "LinkedIn", href: "#" },
    ],
  },
};

const Footer = () => {
  return (
    <footer className="bg-card pt-16 pb-8 border-t border-border">
      <div className="container mx-auto px-6">
        {/* Footer Grid */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-16">
          {/* Logo Column */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-warm flex items-center justify-center">
                <Flame className="w-5 h-5 text-primary-foreground" />
              </div>
            </div>
          </div>

          {/* Links Columns */}
          {Object.entries(footerLinks).map(([key, section]) => (
            <div key={key}>
              <h4 className="text-sm font-medium text-foreground mb-4">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="flex items-center justify-between pt-8 border-t border-border">
          <button className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Globe className="w-4 h-4" />
            EN
          </button>
          <p className="text-sm text-muted-foreground">
            © 2024 NexusAI. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;