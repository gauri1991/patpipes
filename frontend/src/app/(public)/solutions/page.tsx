'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Building2,
  Rocket,
  GraduationCap,
  Scale,
  CheckCircle,
  Users,
  Zap,
  TrendingUp,
  Shield,
  Clock,
  Search,
  FileText,
  BarChart3,
  Target,
  Sparkles,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const solutions = [
  {
    id: 'law-firms',
    name: 'Law Firms',
    icon: Scale,
    tagline: 'Accelerate Client Delivery with AI-Powered Patent Intelligence',
    description: 'Empower your IP practice with advanced tools that reduce research time, improve application quality, and deliver exceptional client value.',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-300',
    iconBg: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
    textColor: 'text-cyan-600',
    buttonBg: 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600',
    stats: [
      { value: '75%', label: 'Faster Prior Art Searches' },
      { value: '500+', label: 'Law Firms Trust PatPipes' },
      { value: '95%', label: 'Client Satisfaction Rate' },
    ],
    challenges: [
      {
        title: 'Time-Consuming Prior Art Research',
        description: 'Manual searches can take weeks and still miss crucial references',
        solution: 'AI semantic search finds relevant patents in hours, not weeks'
      },
      {
        title: 'Inconsistent Application Quality',
        description: 'Maintaining high standards across attorneys is challenging',
        solution: 'MPEP compliance checking and AI drafting assistance ensure quality'
      },
      {
        title: 'Client Expectations for Speed',
        description: 'Clients demand faster turnaround without compromising thoroughness',
        solution: 'Automated workflows accelerate delivery by 60% while improving accuracy'
      }
    ],
    keyFeatures: [
      {
        title: 'Comprehensive Prior Art Search',
        description: '100M+ patents across USPTO, EPO, WIPO, JPO, and 50+ jurisdictions with AI-powered semantic search capabilities.'
      },
      {
        title: 'AI-Assisted Drafting',
        description: 'Auto-generate claims and descriptions with MPEP compliance checking and real-time validation against USPTO rules.'
      },
      {
        title: 'Team Collaboration',
        description: 'Shared workspaces, version control, and real-time collaboration tools for seamless team coordination.'
      },
      {
        title: 'Client Privilege Protected',
        description: 'SOC 2 certified with attorney-client privilege preservation and enterprise-grade security measures.'
      }
    ],
    useCases: [
      {
        title: 'Patent Prosecution',
        description: 'Streamline office action responses and accelerate prosecution with AI-powered prior art search and claim analysis.'
      },
      {
        title: 'IP Litigation Support',
        description: 'Build stronger cases with comprehensive evidence collection, claim charting, and expert-grade analysis tools.'
      },
      {
        title: 'Freedom to Operate',
        description: 'Quickly assess patent landscapes and identify potential risks before product launches or market entry.'
      }
    ],
    benefits: [
      { icon: 'clock', title: '75% Faster Research', description: 'Complete prior art searches in hours instead of weeks' },
      { icon: 'target', title: 'Higher Quality Work', description: 'MPEP compliance checking ensures consistent high standards' },
      { icon: 'zap', title: 'Increased Productivity', description: 'Handle 60% more cases with the same team size' },
      { icon: 'check', title: 'Client Satisfaction', description: '95% client satisfaction with faster turnaround times' }
    ],
    workflow: [
      { title: 'Input Requirements', description: 'Upload invention disclosures, client requirements, or existing patents for analysis' },
      { title: 'AI Analysis', description: 'Our AI searches 100M+ patents, drafts claims, and performs compliance checking' },
      { title: 'Review & Deliver', description: 'Review AI-generated content, refine as needed, and deliver to clients faster' }
    ],
    caseStudy: {
      company: 'Sterling & Associates',
      logo: '⚖️',
      quote: 'PatPipes cut our prior art search time by 75% and our clients love the faster turnaround.',
      author: 'Michael Chen',
      role: 'Senior Partner, IP Litigation'
    }
  },
  {
    id: 'enterprises',
    name: 'Enterprises',
    icon: Building2,
    tagline: 'Strategic IP Management for Innovation-Driven Companies',
    description: 'Scale your IP operations, identify white space opportunities, and protect your competitive advantage with enterprise-grade patent intelligence.',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    textColor: 'text-blue-600',
    buttonBg: 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600',
    stats: [
      { value: '300%', label: 'Average ROI' },
      { value: '100+', label: 'Enterprise Customers' },
      { value: '60%', label: 'Cost Reduction' },
    ],
    challenges: [
      {
        title: 'Growing Patent Portfolio Complexity',
        description: 'Managing hundreds or thousands of patents across jurisdictions',
        solution: 'Centralized portfolio management with AI-powered analytics and monitoring'
      },
      {
        title: 'Identifying White Space for R&D',
        description: 'Finding innovation opportunities in crowded technology landscapes',
        solution: 'Advanced landscape analytics reveal gaps and opportunities competitors miss'
      },
      {
        title: 'Protecting Against Infringement',
        description: 'Monitoring competitors and detecting potential IP violations',
        solution: 'Automated infringement detection with claim charting and evidence collection'
      }
    ],
    keyFeatures: [
      {
        title: 'Portfolio Analytics',
        description: 'Track portfolio health, identify gaps, optimize your IP strategy with real-time dashboards and insights.'
      },
      {
        title: 'White Space Analysis',
        description: 'Discover untapped innovation opportunities in your technology domain with AI-powered gap analysis.'
      },
      {
        title: 'Infringement Monitoring',
        description: 'Automated competitor monitoring with evidence collection workflows and claim charting capabilities.'
      },
      {
        title: 'Enterprise SSO & Security',
        description: 'SAML/OIDC integration, role-based access control, and SOC 2 compliance for enterprise security.'
      }
    ],
    useCases: [
      {
        title: 'R&D Strategy',
        description: 'Guide research investments by identifying promising technology areas and avoiding crowded competitive spaces.'
      },
      {
        title: 'Competitive Intelligence',
        description: 'Monitor competitor patent activity, R&D focus areas, and strategic positioning in real-time.'
      },
      {
        title: 'Portfolio Optimization',
        description: 'Identify high-value assets, candidates for abandonment, and opportunities for portfolio strengthening.'
      }
    ],
    benefits: [
      { icon: 'target', title: '300% Average ROI', description: 'Maximize return on IP investments with data-driven decisions' },
      { icon: 'zap', title: 'Real-Time Intelligence', description: 'Track competitor filings and technology trends as they happen' },
      { icon: 'check', title: 'Enterprise Security', description: 'SOC 2 compliant with SSO and role-based access control' },
      { icon: 'clock', title: '60% Cost Reduction', description: 'Reduce external counsel costs while maintaining quality' }
    ],
    workflow: [
      { title: 'Define Strategy', description: 'Set technology focus areas, competitors to monitor, and strategic IP goals' },
      { title: 'AI Analysis', description: 'Our AI analyzes millions of patents, identifies trends, and finds opportunities' },
      { title: 'Execute & Monitor', description: 'Take action on insights and continuously monitor your competitive landscape' }
    ],
    caseStudy: {
      company: 'BioPharma Solutions',
      logo: '💊',
      quote: 'PatPipes helped us identify $50M in licensing opportunities we would have missed.',
      author: 'Dr. Sarah Williams',
      role: 'VP of Intellectual Property'
    }
  },
  {
    id: 'startups',
    name: 'Startups',
    icon: Rocket,
    tagline: 'Build Your IP Foundation Without Breaking the Bank',
    description: 'Affordable, powerful patent tools designed for fast-moving startups. Protect your innovation from day one with enterprise-grade capabilities at startup-friendly prices.',
    bgColor: 'bg-magenta-50',
    borderColor: 'border-magenta-300',
    iconBg: 'bg-magenta-100',
    iconColor: 'text-magenta-600',
    textColor: 'text-magenta-600',
    buttonBg: 'bg-gradient-to-r from-magenta-500 to-pink-500 hover:from-magenta-600 hover:to-pink-600',
    stats: [
      { value: '10x', label: 'Faster Patent Drafting' },
      { value: '70%', label: 'Cost Savings vs Traditional' },
      { value: '1000+', label: 'Startups Powered' },
    ],
    challenges: [
      {
        title: 'Limited Budget for IP Protection',
        description: 'Traditional patent services are expensive and slow',
        solution: 'Affordable self-service tools with optional expert review'
      },
      {
        title: 'Speed to Market Pressure',
        description: 'Need to file patents quickly while iterating on product',
        solution: 'AI-assisted drafting reduces application time from weeks to days'
      },
      {
        title: 'Lack of IP Expertise In-House',
        description: 'Founders lack patent experience but need to protect innovation',
        solution: 'Guided workflows and templates make patent filing accessible to non-experts'
      }
    ],
    keyFeatures: [
      {
        title: 'DIY Patent Drafting',
        description: 'AI-powered drafting tools with step-by-step guidance specifically designed for founders and innovators.'
      },
      {
        title: 'Competitive Intelligence',
        description: 'Monitor competitor patents and identify potential infringement risks before they become problems.'
      },
      {
        title: 'Fast Time to Filing',
        description: 'Draft, review, and file provisional applications in days, not months, to secure your priority date.'
      },
      {
        title: 'Startup-Friendly Pricing',
        description: 'Free tier for early exploration, affordable plans that scale with you as you grow your business.'
      }
    ],
    useCases: [
      {
        title: 'Provisional Applications',
        description: 'Quickly file provisionals to establish priority dates while you continue refining your invention.'
      },
      {
        title: 'Competitive Landscape',
        description: 'Understand who owns what in your space and identify opportunities for differentiation.'
      },
      {
        title: 'Investor Due Diligence',
        description: 'Present a strong IP portfolio to investors with professional patent documentation and analysis.'
      }
    ],
    benefits: [
      { icon: 'clock', title: '10x Faster Drafting', description: 'Draft complete provisional applications in days instead of weeks' },
      { icon: 'target', title: '70% Cost Savings', description: 'Reduce patent costs dramatically compared to traditional services' },
      { icon: 'zap', title: 'Founder-Friendly', description: 'No IP expertise required with guided workflows and templates' },
      { icon: 'check', title: 'Scales With You', description: 'Free tier to start, affordable plans as you grow' }
    ],
    workflow: [
      { title: 'Describe Invention', description: 'Use our guided questionnaire to describe your invention in plain language' },
      { title: 'AI Drafting', description: 'AI generates patent-quality claims and descriptions based on your input' },
      { title: 'File & Protect', description: 'Review, refine, and file directly through our USPTO integration' }
    ],
    caseStudy: {
      company: 'NeuralTech AI',
      logo: '🚀',
      quote: 'We filed 50+ patents in 6 months with PatPipes. Would have been impossible otherwise.',
      author: 'Alex Rodriguez',
      role: 'Co-Founder & CTO'
    }
  },
  {
    id: 'universities',
    name: 'Universities',
    icon: GraduationCap,
    tagline: 'Maximize Research Impact and Technology Transfer Success',
    description: 'Transform university research into protected IP. Streamline invention disclosures, accelerate patent prosecution, and increase licensing revenue.',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-300',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    textColor: 'text-green-600',
    buttonBg: 'bg-gradient-to-r from-green-500 to-cyan-500 hover:from-green-600 hover:to-cyan-600',
    stats: [
      { value: '65%', label: 'More Efficient Disclosures' },
      { value: '50+', label: 'Universities Using PatPipes' },
      { value: '40%', label: 'Increase in Licensing Revenue' },
    ],
    challenges: [
      {
        title: 'Managing High Volume of Disclosures',
        description: 'Technology transfer offices overwhelmed with invention submissions',
        solution: 'Automated disclosure intake, triage, and prior art screening'
      },
      {
        title: 'Limited TTO Resources',
        description: 'Small teams managing hundreds of inventions and patent applications',
        solution: 'Self-service tools empower researchers while reducing TTO workload'
      },
      {
        title: 'Maximizing Licensing Revenue',
        description: 'Identifying commercial potential and attracting industry partners',
        solution: 'Market analysis tools highlight high-value opportunities'
      }
    ],
    keyFeatures: [
      {
        title: 'Invention Disclosure Portal',
        description: 'Streamlined submission forms with automated prior art analysis and patentability assessments.'
      },
      {
        title: 'Portfolio Management',
        description: 'Track all university IP from disclosure through licensing with comprehensive analytics and reporting.'
      },
      {
        title: 'Market Intelligence',
        description: 'Identify potential licensees and assess commercial viability of university research and innovations.'
      },
      {
        title: 'Researcher Collaboration',
        description: 'Enable faculty to participate in patent drafting and prosecution with guided self-service tools.'
      }
    ],
    useCases: [
      {
        title: 'Disclosure Management',
        description: 'Streamline the entire disclosure process from submission to patentability determination.'
      },
      {
        title: 'Technology Transfer',
        description: 'Identify licensing opportunities and connect with potential industry partners more effectively.'
      },
      {
        title: 'Portfolio Optimization',
        description: 'Make data-driven decisions about which inventions to pursue and which to abandon.'
      }
    ],
    benefits: [
      { icon: 'clock', title: '65% Faster Processing', description: 'Process invention disclosures faster with automated workflows' },
      { icon: 'target', title: '40% More Revenue', description: 'Increase licensing revenue by identifying high-value opportunities' },
      { icon: 'zap', title: 'Empower Researchers', description: 'Faculty can contribute to drafting without burdening TTO' },
      { icon: 'check', title: 'Better Decisions', description: 'Data-driven insights on commercial potential and market fit' }
    ],
    workflow: [
      { title: 'Submit Disclosure', description: 'Researchers submit inventions through streamlined portal with guided questions' },
      { title: 'AI Assessment', description: 'Automated prior art search and patentability assessment for triage' },
      { title: 'Transfer & License', description: 'Identify potential licensees and manage commercialization efforts' }
    ],
    caseStudy: {
      company: 'State University Tech Transfer',
      logo: '🎓',
      quote: 'PatPipes helped us manage 200+ disclosures efficiently and increased our licensing revenue 40%.',
      author: 'Dr. Jennifer Park',
      role: 'Director of Technology Transfer'
    }
  }
];

export default function SolutionsPage() {
  const [selectedSolution, setSelectedSolution] = useState(solutions[0].id);
  const contentRef = useRef<HTMLElement>(null);

  const selectedSolutionData = solutions.find(s => s.id === selectedSolution) || solutions[0];

  // Handle URL hash navigation
  useEffect(() => {
    const scrollToContent = () => {
      if (contentRef.current) {
        const yOffset = -80;
        const element = contentRef.current;
        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    };

    const hash = window.location.hash.replace('#', '');
    if (hash && solutions.find(s => s.id === hash)) {
      setSelectedSolution(hash);
      setTimeout(scrollToContent, 150);
    }

    const handleHashChange = () => {
      const newHash = window.location.hash.replace('#', '');
      if (newHash && solutions.find(s => s.id === newHash)) {
        setSelectedSolution(newHash);
        setTimeout(scrollToContent, 150);
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-cyan-50 via-blue-50 to-white pt-16 pb-8">
        <div className="absolute inset-0 bg-grid-neutral-200/50 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-100 text-cyan-700 rounded-full text-sm font-semibold mb-6">
              <Sparkles className="h-4 w-4" />
              Tailored Solutions for Every Organization
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent leading-tight">
              Patent Intelligence Solutions That Drive Results
            </h1>
            <p className="text-lg md:text-xl text-neutral-600 leading-relaxed mb-8">
              From law firms to universities, PatPipes delivers powerful patent search, drafting, and analytics solutions tailored to your unique needs.
            </p>
          </motion.div>

          {/* Solution Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto"
          >
            {solutions.map((solution) => {
              const Icon = solution.icon;
              const isActive = selectedSolution === solution.id;
              return (
                <button
                  key={solution.id}
                  onClick={() => {
                    setSelectedSolution(solution.id);
                    window.history.pushState(null, '', `#${solution.id}`);
                    setTimeout(() => {
                      if (contentRef.current) {
                        const yOffset = -80;
                        const element = contentRef.current;
                        const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
                        window.scrollTo({ top: y, behavior: 'smooth' });
                      }
                    }, 150);
                  }}
                  className={`p-4 md:p-6 rounded-xl border-2 transition-all duration-300 ${
                    isActive
                      ? `${solution.borderColor} ${solution.bgColor} shadow-lg scale-105`
                      : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-md'
                  }`}
                >
                  <div className={`h-12 w-12 md:h-16 md:w-16 mx-auto mb-3 rounded-xl flex items-center justify-center ${
                    isActive ? solution.iconBg : 'bg-neutral-100'
                  } ${isActive ? solution.iconColor : 'text-neutral-600'} transition-colors`}>
                    <Icon className="h-6 w-6 md:h-8 md:w-8" />
                  </div>
                  <h3 className={`text-sm md:text-base font-bold text-center ${
                    isActive ? solution.textColor : 'text-neutral-700'
                  }`}>
                    {solution.name}
                  </h3>
                </button>
              );
            })}
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="grid grid-cols-3 gap-4 max-w-4xl mx-auto mt-12"
          >
            {selectedSolutionData.stats.map((stat, index) => (
              <div key={index} className="text-center p-4 bg-white/80 backdrop-blur rounded-lg border border-neutral-200">
                <div className={`text-2xl md:text-3xl font-bold ${selectedSolutionData.iconColor}`}>{stat.value}</div>
                <div className="text-sm text-neutral-600 mt-1">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Solution Details Section */}
      <section ref={contentRef} className="container mx-auto px-4 pt-4 pb-16">
        <motion.div
          key={selectedSolution}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto"
        >
          {/* Solution Header */}
          <div className={`rounded-2xl p-8 md:p-12 mb-12 ${selectedSolutionData.bgColor} border-2 ${selectedSolutionData.borderColor}`}>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className={`h-20 w-20 rounded-2xl flex items-center justify-center ${selectedSolutionData.iconBg} ${selectedSolutionData.iconColor} shadow-lg`}>
                {React.createElement(selectedSolutionData.icon, { className: "h-10 w-10" })}
              </div>
              <div className="flex-1">
                <h2 className="text-3xl md:text-4xl font-bold mb-3">{selectedSolutionData.name}</h2>
                <p className="text-lg text-neutral-700 leading-relaxed">{selectedSolutionData.description}</p>
              </div>
              <Link href="/signup">
                <Button className={`${selectedSolutionData.buttonBg} text-white shadow-lg hover:shadow-xl transition-all duration-200 font-semibold whitespace-nowrap`}>
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Key Features Grid */}
          <div className="mb-12">
            <h3 className="text-2xl md:text-3xl font-bold mb-8 text-center">Key Features</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {selectedSolutionData.keyFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                >
                  <Card className="h-full border-2 border-neutral-200 hover:border-cyan-300 hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${selectedSolutionData.iconBg} ${selectedSolutionData.iconColor} shrink-0`}>
                          <CheckCircle className="h-6 w-6" />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold mb-2">{feature.title}</h4>
                          <p className="text-neutral-600 leading-relaxed">{feature.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Use Cases */}
          <div className="mb-12">
            <h3 className="text-2xl md:text-3xl font-bold mb-8 text-center">Perfect For</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {selectedSolutionData.useCases.map((useCase, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                  className="p-6 bg-gradient-to-br from-neutral-50 to-white rounded-xl border-2 border-neutral-200 hover:border-cyan-300 hover:shadow-lg transition-all duration-300"
                >
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${selectedSolutionData.iconBg} ${selectedSolutionData.iconColor} mb-4`}>
                    <Target className="h-5 w-5" />
                  </div>
                  <h4 className="text-lg font-bold mb-2">{useCase.title}</h4>
                  <p className="text-neutral-600 text-sm leading-relaxed">{useCase.description}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Benefits */}
          <div className="mb-12">
            <h3 className="text-2xl md:text-3xl font-bold mb-8 text-center">Why Teams Love It</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {selectedSolutionData.benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                  className="flex items-start gap-4 p-6 bg-white rounded-xl border-2 border-neutral-200 hover:shadow-lg transition-all duration-300"
                >
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${selectedSolutionData.iconBg} ${selectedSolutionData.iconColor} shrink-0 mt-1`}>
                    {benefit.icon === 'zap' && <Zap className="h-4 w-4" />}
                    {benefit.icon === 'clock' && <Clock className="h-4 w-4" />}
                    {benefit.icon === 'target' && <Target className="h-4 w-4" />}
                    {benefit.icon === 'check' && <CheckCircle className="h-4 w-4" />}
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">{benefit.title}</h4>
                    <p className="text-neutral-600 text-sm leading-relaxed">{benefit.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* How It Works */}
          <div className={`rounded-2xl p-8 md:p-12 ${selectedSolutionData.bgColor} border-2 ${selectedSolutionData.borderColor}`}>
            <h3 className="text-2xl md:text-3xl font-bold mb-6 text-center">How It Works</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {selectedSolutionData.workflow.map((step, index) => (
                <div key={index} className="relative">
                  <div className="bg-white rounded-xl p-6 border-2 border-neutral-200 shadow-sm h-full">
                    <div className={`inline-flex items-center justify-center h-10 w-10 rounded-full ${selectedSolutionData.iconBg} ${selectedSolutionData.iconColor} font-bold text-lg mb-4`}>
                      {index + 1}
                    </div>
                    <h4 className="font-bold mb-2">{step.title}</h4>
                    <p className="text-neutral-600 text-sm leading-relaxed">{step.description}</p>
                  </div>
                  {index < selectedSolutionData.workflow.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                      <ArrowRight className={`h-6 w-6 ${selectedSolutionData.iconColor}`} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 py-20">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Patent Workflow?
            </h2>
            <p className="text-xl text-cyan-50 mb-8 leading-relaxed">
              Join thousands of IP professionals using PatPipes to work smarter, faster, and more effectively.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="bg-white text-cyan-600 hover:bg-cyan-50 font-semibold text-lg px-8 py-6 shadow-xl hover:shadow-2xl transition-all duration-200">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="border-2 border-white bg-white text-cyan-600 hover:bg-transparent hover:text-white font-semibold text-lg px-8 py-6">
                  Contact Sales
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-neutral-900 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">PatPipes</span>
              </div>
              <p className="text-sm text-neutral-400 leading-relaxed mb-4 max-w-sm">
                AI-powered patent search, drafting, and analytics platform for innovators worldwide.
              </p>
              <div className="flex gap-3">
                <a href="#" className="h-10 w-10 rounded-full bg-neutral-800 hover:bg-cyan-600 flex items-center justify-center transition-colors">
                  <span className="sr-only">Twitter</span>
                  𝕏
                </a>
                <a href="#" className="h-10 w-10 rounded-full bg-neutral-800 hover:bg-cyan-600 flex items-center justify-center transition-colors">
                  <span className="sr-only">LinkedIn</span>
                  in
                </a>
                <a href="#" className="h-10 w-10 rounded-full bg-neutral-800 hover:bg-cyan-600 flex items-center justify-center transition-colors">
                  <span className="sr-only">GitHub</span>
                  GH
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-cyan-400 text-sm">Products</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><Link href="/products#prior-art-discovery" className="hover:text-cyan-400 transition-colors">Prior Art Search</Link></li>
                <li><Link href="/products#patent-drafting" className="hover:text-cyan-400 transition-colors">Drafting Studio</Link></li>
                <li><Link href="/products#landscape-analytics" className="hover:text-cyan-400 transition-colors">Analytics Platform</Link></li>
                <li><Link href="/products#infringement-analyzer" className="hover:text-cyan-400 transition-colors">Infringement Analyzer</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-cyan-400 text-sm">Solutions</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><Link href="/solutions#law-firms" className="hover:text-cyan-400 transition-colors">Law Firms</Link></li>
                <li><Link href="/solutions#enterprises" className="hover:text-cyan-400 transition-colors">Enterprises</Link></li>
                <li><Link href="/solutions#startups" className="hover:text-cyan-400 transition-colors">Startups</Link></li>
                <li><Link href="/solutions#universities" className="hover:text-cyan-400 transition-colors">Universities</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-cyan-400 text-sm">Company</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><Link href="/case-studies" className="hover:text-cyan-400 transition-colors">Case Studies</Link></li>
                <li><Link href="/pricing" className="hover:text-cyan-400 transition-colors">Pricing</Link></li>
                <li><Link href="/blog" className="hover:text-cyan-400 transition-colors">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-cyan-400 transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-neutral-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-neutral-400">
            <p>© 2024 PatPipes. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/privacy" className="hover:text-cyan-400 transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-cyan-400 transition-colors">Terms of Service</Link>
              <Link href="/contact" className="hover:text-cyan-400 transition-colors">Support</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
