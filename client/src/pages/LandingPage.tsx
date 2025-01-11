import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, Brain, Hourglass, ArrowRight } from "lucide-react";

interface Feature {
  icon: React.ElementType;
  title: string;
  description: string;
}

interface SectionProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

interface HeroButtonProps {
  onClick: () => void;
  children: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({
  title,
  children,
  className = "",
}) => (
  <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 ${className}`}>
    <h2 className="text-4xl font-bold text-center text-white mb-16">{title}</h2>
    {children}
  </div>
);

const HeroButton: React.FC<HeroButtonProps> = ({ onClick, children }) => (
  <Button
    onClick={onClick}
    className="bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-lg py-6 px-8 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
  >
    {children}
    <ArrowRight className="ml-2 h-5 w-5" />
  </Button>
);

const FeatureCard: React.FC<Feature> = ({ icon: Icon, title, description }) => (
  <Card className="bg-white/10 backdrop-blur-lg border-0 hover:bg-white/15 transition-all duration-300">
    <CardContent className="p-6">
      <Icon className="h-12 w-12 text-purple-400 mb-4" />
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-300">{description}</p>
    </CardContent>
  </Card>
);

const LandingPage: React.FC<{ navigateToModel: () => void }> = ({
  navigateToModel,
}) => {
  const features: Feature[] = [
    {
      icon: Mic,
      title: "Speech Recognition",
      description:
        "Capture and convert speech to text in real-time using advanced AI.",
    },
    {
      icon: Brain,
      title: "Human-like interaction",
      description: "Understand and generate human-like responses.",
    },
    {
      icon: Hourglass,
      title: "Real-Time Processing",
      description:
        "Enjoy instant interactions powered by real-time AI capabilities.",
    },
  ];
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900">
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center">
            <h1 className="text-6xl font-bold text-white mb-6 animate-fade-in">
              Welcome to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
                2x2pac AI
              </span>
            </h1>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Experience the next generation of communication with our advanced
              AI-powered chatbot. Real-time conversations enhanced with
              cutting-edge artificial intelligence.
            </p>
            <HeroButton onClick={navigateToModel}>
              Start Chatting Now
            </HeroButton>
          </div>
        </div>
      </div>
      <Section title="Powerful Features">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} />
          ))}
        </div>
      </Section>
      <div className="bg-white/5 backdrop-blur-sm py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            <h2 className="text-4xl font-bold text-purple-400 sm:text-5xl">
              Empowering Your Digital Experience
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              At 2x2pac, we believe in providing innovative solutions to help
              you achieve your goals. Our AI-powered assistant is designed to
              offer seamless support, streamline your workflows, and enhance
              your productivity.
            </p>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Join a community of forward-thinking individuals who are unlocking
              new potential with cutting-edge technology and intuitive design.
              Together, we can build a better tomorrow.
            </p>
          </div>
        </div>
      </div>

      <Section title="Ready to Experience the Future?" className="text-center">
        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
          Join thousands of users who are already revolutionizing their
          communication with AI
        </p>
        <HeroButton onClick={navigateToModel}>Get Started Now</HeroButton>
      </Section>
    </div>
  );
};

export default LandingPage;
