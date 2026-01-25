import { ArrowRight } from "lucide-react";

const templates = [
  {
    id: 1,
    title: "Ecommerce store",
    description: "Premium design for webstore",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop",
  },
  {
    id: 2,
    title: "Architect portfolio",
    description: "Firm website & showcase",
    image: "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=600&h=400&fit=crop",
  },
  {
    id: 3,
    title: "Personal blog",
    description: "Muted, intimate design",
    image: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=600&h=400&fit=crop",
  },
  {
    id: 4,
    title: "Fashion blog",
    description: "Minimal, playful design",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop",
  },
  {
    id: 5,
    title: "Visual landing page",
    description: "AI film production showcase",
    image: "https://images.unsplash.com/photo-1536240478700-b869070f9279?w=600&h=400&fit=crop",
  },
  {
    id: 6,
    title: "Lifestyle Blog",
    description: "Featured article showcase",
    image: "https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=600&h=400&fit=crop",
  },
  {
    id: 7,
    title: "Event platform",
    description: "Discover events near you",
    image: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop",
  },
  {
    id: 8,
    title: "Personal portfolio",
    description: "Creative showcase",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=400&fit=crop",
  },
];

const TemplatesSection = () => {
  return (
    <section className="py-24 bg-foreground" id="discover">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-semibold text-background mb-2">
              Discover templates
            </h2>
            <p className="text-background/60">
              Start your next project with a template
            </p>
          </div>
          <a 
            href="#" 
            className="hidden md:flex items-center gap-2 text-background/80 hover:text-background transition-colors group"
          >
            View all
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {templates.map((template) => (
            <a
              key={template.id}
              href="#"
              className="group block"
            >
              <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-3 bg-background/5">
                <img
                  src={template.image}
                  alt={template.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <h3 className="font-medium text-background group-hover:text-background/80 transition-colors">
                {template.title}
              </h3>
              <p className="text-sm text-background/50">
                {template.description}
              </p>
            </a>
          ))}
        </div>

        {/* Mobile View All */}
        <div className="mt-8 md:hidden">
          <a 
            href="#" 
            className="flex items-center justify-center gap-2 text-background/80 hover:text-background transition-colors"
          >
            View all templates
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default TemplatesSection;