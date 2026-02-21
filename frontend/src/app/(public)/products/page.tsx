'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, FileText, BarChart3, Shield, ArrowRight, Check, Sparkles, Zap, Target, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function ProductsPage() {
  const [selectedProduct, setSelectedProduct] = useState(products[0].id);
  const contentRef = useRef<HTMLElement>(null);

  const selectedProductData = products.find(p => p.id === selectedProduct) || products[0];

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
    if (hash && products.find(p => p.id === hash)) {
      setSelectedProduct(hash);
      setTimeout(scrollToContent, 150);
    }

    const handleHashChange = () => {
      const newHash = window.location.hash.replace('#', '');
      if (newHash && products.find(p => p.id === newHash)) {
        setSelectedProduct(newHash);
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
              AI-Powered Patent Intelligence
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent leading-tight">
              Products Built for Modern IP Teams
            </h1>
            <p className="text-lg md:text-xl text-neutral-600 leading-relaxed mb-8">
              Four powerful products working together to streamline your entire patent workflow. From discovery to drafting, analytics to enforcement.
            </p>
          </motion.div>

          {/* Product Selector */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-5xl mx-auto"
          >
            {products.map((product) => {
              const Icon = product.icon;
              const isActive = selectedProduct === product.id;
              return (
                <button
                  key={product.id}
                  onClick={() => {
                    setSelectedProduct(product.id);
                    window.history.pushState(null, '', `#${product.id}`);
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
                      ? `${product.borderColor} ${product.bgColor} shadow-lg scale-105`
                      : 'border-neutral-200 bg-white hover:border-neutral-300 hover:shadow-md'
                  }`}
                >
                  <div className={`h-12 w-12 md:h-16 md:w-16 mx-auto mb-3 rounded-xl flex items-center justify-center ${
                    isActive ? product.iconBg : 'bg-neutral-100'
                  } ${isActive ? product.iconColor : 'text-neutral-600'} transition-colors`}>
                    <Icon className="h-6 w-6 md:h-8 md:w-8" />
                  </div>
                  <h3 className={`text-sm md:text-base font-bold text-center ${
                    isActive ? product.textColor : 'text-neutral-700'
                  }`}>
                    {product.name}
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
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mt-12"
          >
            <div className="text-center p-4 bg-white/80 backdrop-blur rounded-lg border border-neutral-200">
              <div className="text-2xl md:text-3xl font-bold text-cyan-600">100M+</div>
              <div className="text-sm text-neutral-600 mt-1">Patents Indexed</div>
            </div>
            <div className="text-center p-4 bg-white/80 backdrop-blur rounded-lg border border-neutral-200">
              <div className="text-2xl md:text-3xl font-bold text-blue-600">60%</div>
              <div className="text-sm text-neutral-600 mt-1">Time Savings</div>
            </div>
            <div className="text-center p-4 bg-white/80 backdrop-blur rounded-lg border border-neutral-200">
              <div className="text-2xl md:text-3xl font-bold text-magenta-600">50+</div>
              <div className="text-sm text-neutral-600 mt-1">Data Points</div>
            </div>
            <div className="text-center p-4 bg-white/80 backdrop-blur rounded-lg border border-neutral-200">
              <div className="text-2xl md:text-3xl font-bold text-yellow-600">2hrs</div>
              <div className="text-sm text-neutral-600 mt-1">Avg Search Time</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Product Details Section */}
      <section ref={contentRef} className="container mx-auto px-4 pt-4 pb-16">
        <motion.div
          key={selectedProduct}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-6xl mx-auto"
        >
          {/* Product Header */}
          <div className={`rounded-2xl p-8 md:p-12 mb-12 ${selectedProductData.bgColor} border-2 ${selectedProductData.borderColor}`}>
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className={`h-20 w-20 rounded-2xl flex items-center justify-center ${selectedProductData.iconBg} ${selectedProductData.iconColor} shadow-lg`}>
                {React.createElement(selectedProductData.icon, { className: "h-10 w-10" })}
              </div>
              <div className="flex-1">
                <h2 className="text-3xl md:text-4xl font-bold mb-3">{selectedProductData.name}</h2>
                <p className="text-lg text-neutral-700 leading-relaxed">{selectedProductData.description}</p>
              </div>
              <Link href="/signup">
                <Button className={`${selectedProductData.buttonBg} text-white shadow-lg hover:shadow-xl transition-all duration-200 font-semibold whitespace-nowrap`}>
                  Try {selectedProductData.name}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Key Features Grid */}
          <div className="mb-12">
            <h3 className="text-2xl md:text-3xl font-bold mb-8 text-center">Key Features</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {selectedProductData.keyFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                >
                  <Card className="h-full border-2 border-neutral-200 hover:border-cyan-300 hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${selectedProductData.iconBg} ${selectedProductData.iconColor} shrink-0`}>
                          <Check className="h-6 w-6" />
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
              {selectedProductData.useCases.map((useCase, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                  className="p-6 bg-gradient-to-br from-neutral-50 to-white rounded-xl border-2 border-neutral-200 hover:border-cyan-300 hover:shadow-lg transition-all duration-300"
                >
                  <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${selectedProductData.iconBg} ${selectedProductData.iconColor} mb-4`}>
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
              {selectedProductData.benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                  className="flex items-start gap-4 p-6 bg-white rounded-xl border-2 border-neutral-200 hover:shadow-lg transition-all duration-300"
                >
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${selectedProductData.iconBg} ${selectedProductData.iconColor} shrink-0 mt-1`}>
                    {benefit.icon === 'zap' && <Zap className="h-4 w-4" />}
                    {benefit.icon === 'clock' && <Clock className="h-4 w-4" />}
                    {benefit.icon === 'target' && <Target className="h-4 w-4" />}
                    {benefit.icon === 'check' && <Check className="h-4 w-4" />}
                  </div>
                  <div>
                    <h4 className="font-bold mb-1">{benefit.title}</h4>
                    <p className="text-neutral-600 text-sm leading-relaxed">{benefit.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Integration & Workflow */}
          <div className={`rounded-2xl p-8 md:p-12 ${selectedProductData.bgColor} border-2 ${selectedProductData.borderColor}`}>
            <h3 className="text-2xl md:text-3xl font-bold mb-6 text-center">How It Works</h3>
            <div className="grid md:grid-cols-3 gap-6">
              {selectedProductData.workflow.map((step, index) => (
                <div key={index} className="relative">
                  <div className="bg-white rounded-xl p-6 border-2 border-neutral-200 shadow-sm h-full">
                    <div className={`inline-flex items-center justify-center h-10 w-10 rounded-full ${selectedProductData.iconBg} ${selectedProductData.iconColor} font-bold text-lg mb-4`}>
                      {index + 1}
                    </div>
                    <h4 className="font-bold mb-2">{step.title}</h4>
                    <p className="text-neutral-600 text-sm leading-relaxed">{step.description}</p>
                  </div>
                  {index < selectedProductData.workflow.length - 1 && (
                    <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                      <ArrowRight className={`h-6 w-6 ${selectedProductData.iconColor}`} />
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

const products = [
  {
    id: 'prior-art-discovery',
    name: 'Prior Art Discovery',
    icon: Search,
    description: 'AI-powered semantic search across 100M+ patents, academic papers, and product databases. Find relevant prior art in seconds, not weeks.',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-300',
    iconBg: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
    textColor: 'text-cyan-600',
    buttonBg: 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600',
    keyFeatures: [
      {
        title: 'Semantic Search AI',
        description: 'Go beyond keyword matching. Our AI understands context and finds conceptually similar prior art across 100M+ patents.'
      },
      {
        title: 'Multi-Source Coverage',
        description: 'Search USPTO, EPO, WIPO, academic papers, product databases, and technical literature in one unified interface.'
      },
      {
        title: 'AI Claim Mapping',
        description: 'Automatically map your claims to prior art references with confidence scoring and element-by-element analysis.'
      },
      {
        title: 'Citation Network Analysis',
        description: 'Visualize patent families, citation chains, and related technologies to uncover hidden prior art.'
      }
    ],
    useCases: [
      {
        title: 'Patent Prosecution',
        description: 'Prepare comprehensive office action responses with relevant prior art citations and legal arguments.'
      },
      {
        title: 'Freedom to Operate',
        description: 'Quickly assess landscape before product launch to identify potential blocking patents.'
      },
      {
        title: 'Due Diligence',
        description: 'Conduct thorough IP assessments for M&A, investment decisions, and portfolio valuation.'
      }
    ],
    benefits: [
      { icon: 'clock', title: '90% Faster Research', description: 'Complete prior art searches in 2 hours instead of 2 weeks' },
      { icon: 'target', title: 'Higher Quality Results', description: 'AI finds relevant references human researchers often miss' },
      { icon: 'zap', title: 'Real-Time Updates', description: 'Get instant alerts when new relevant prior art is published' },
      { icon: 'check', title: 'Expert-Grade Reports', description: 'Generate professional reports ready for examiner submission' }
    ],
    workflow: [
      { title: 'Input Claims', description: 'Paste your patent claims or describe your invention in plain language' },
      { title: 'AI Analysis', description: 'Our AI searches 100M+ documents and ranks results by relevance' },
      { title: 'Review & Export', description: 'Review findings, generate claim charts, and export professional reports' }
    ]
  },
  {
    id: 'patent-drafting',
    name: 'Patent Drafting Studio',
    icon: FileText,
    description: 'Draft patent applications with AI assistance. Auto-generate claims, descriptions, and drawings with MPEP compliance checking.',
    bgColor: 'bg-magenta-50',
    borderColor: 'border-magenta-300',
    iconBg: 'bg-magenta-100',
    iconColor: 'text-magenta-600',
    textColor: 'text-magenta-600',
    buttonBg: 'bg-gradient-to-r from-magenta-500 to-pink-500 hover:from-magenta-600 hover:to-pink-600',
    keyFeatures: [
      {
        title: 'AI Writing Assistant',
        description: 'Generate patent-quality descriptions, specifications, and abstracts from your invention disclosure.'
      },
      {
        title: 'Smart Claim Generator',
        description: 'Automatically create independent and dependent claims with proper formatting and legal language.'
      },
      {
        title: 'MPEP Compliance Checker',
        description: 'Real-time validation against USPTO rules with suggestions for 35 USC 112 compliance.'
      },
      {
        title: 'Prior Art Integration',
        description: 'Seamlessly incorporate prior art findings and automatically draft around existing patents.'
      }
    ],
    useCases: [
      {
        title: 'Patent Attorneys',
        description: 'Draft high-quality applications 60% faster while maintaining full control over content.'
      },
      {
        title: 'In-House Counsel',
        description: 'Handle higher application volumes without expanding team size or outsourcing.'
      },
      {
        title: 'Solo Practitioners',
        description: 'Compete with larger firms by delivering faster turnarounds at competitive pricing.'
      }
    ],
    benefits: [
      { icon: 'clock', title: '60% Time Savings', description: 'Draft complete applications in hours instead of days' },
      { icon: 'check', title: 'Consistent Quality', description: 'Maintain high standards across all applications' },
      { icon: 'zap', title: 'Instant Revisions', description: 'Update claims and descriptions in real-time as invention evolves' },
      { icon: 'target', title: 'Stronger Claims', description: 'AI suggests broader coverage and identifies potential loopholes' }
    ],
    workflow: [
      { title: 'Upload Disclosure', description: 'Import invention disclosure, technical documents, or sketches' },
      { title: 'AI Drafting', description: 'AI generates claims, descriptions, and drawings with MPEP compliance' },
      { title: 'Refine & File', description: 'Edit with smart suggestions, export to USPTO format, and file directly' }
    ]
  },
  {
    id: 'landscape-analytics',
    name: 'Landscape Analytics',
    icon: BarChart3,
    description: 'Visualize technology trends, identify white spaces, and track competitor activity with interactive analytics dashboards.',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-300',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    textColor: 'text-blue-600',
    buttonBg: 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600',
    keyFeatures: [
      {
        title: 'Technology Trend Analysis',
        description: 'Track patent filing trends, emerging technologies, and innovation hotspots over time with interactive charts.'
      },
      {
        title: 'Competitor Intelligence',
        description: 'Monitor competitor patent activity, R&D focus areas, and strategic positioning in your technology space.'
      },
      {
        title: 'White Space Identification',
        description: 'Discover underexplored areas and innovation opportunities through AI-powered gap analysis.'
      },
      {
        title: 'Portfolio Benchmarking',
        description: 'Compare your patent portfolio strength against competitors across 50+ metrics and quality indicators.'
      }
    ],
    useCases: [
      {
        title: 'R&D Strategy',
        description: 'Guide research investments by identifying promising technology areas and avoiding crowded spaces.'
      },
      {
        title: 'Competitive Intelligence',
        description: 'Stay ahead of competitor innovation strategies and identify potential partnership opportunities.'
      },
      {
        title: 'Portfolio Management',
        description: 'Optimize patent portfolios by identifying high-value assets and candidates for abandonment.'
      }
    ],
    benefits: [
      { icon: 'target', title: 'Strategic Insights', description: 'Make data-driven decisions about R&D and IP strategy' },
      { icon: 'zap', title: 'Real-Time Monitoring', description: 'Track competitor filings and technology trends as they happen' },
      { icon: 'check', title: 'Custom Dashboards', description: 'Create personalized views for different stakeholders and use cases' },
      { icon: 'clock', title: 'Automated Reports', description: 'Schedule weekly briefs on technology trends and competitor activity' }
    ],
    workflow: [
      { title: 'Define Scope', description: 'Select technology areas, competitors, and time periods to analyze' },
      { title: 'AI Processing', description: 'Our AI analyzes millions of patents and identifies patterns and trends' },
      { title: 'Interactive Insights', description: 'Explore findings with interactive dashboards and export custom reports' }
    ]
  },
  {
    id: 'infringement-analyzer',
    name: 'Infringement Analyzer',
    icon: Shield,
    description: '10-phase workflow for infringement analysis. Automated claim charting, evidence collection, and report generation.',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-300',
    iconBg: 'bg-yellow-100',
    iconColor: 'text-yellow-700',
    textColor: 'text-yellow-700',
    buttonBg: 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600',
    keyFeatures: [
      {
        title: 'Automated Claim Charting',
        description: 'Generate element-by-element claim charts with automated evidence mapping and confidence scoring.'
      },
      {
        title: 'Evidence Collection',
        description: 'Automatically gather product documentation, technical specs, marketing materials, and prior art references.'
      },
      {
        title: '10-Phase Workflow',
        description: 'Structured analysis process from initial assessment through damages calculation and settlement strategy.'
      },
      {
        title: 'Legal Brief Generator',
        description: 'Create professional infringement opinions and cease-and-desist letters with proper legal citations.'
      }
    ],
    useCases: [
      {
        title: 'Enforcement Actions',
        description: 'Build strong infringement cases with comprehensive evidence and professional claim charts.'
      },
      {
        title: 'Licensing Negotiations',
        description: 'Support licensing discussions with detailed technical analysis and valuation data.'
      },
      {
        title: 'Clearance Opinions',
        description: 'Assess infringement risk for your own products before launch or during product development.'
      }
    ],
    benefits: [
      { icon: 'clock', title: '80% Faster Analysis', description: 'Complete infringement analysis in days instead of weeks' },
      { icon: 'target', title: 'Stronger Cases', description: 'AI finds evidence and arguments human analysts might overlook' },
      { icon: 'check', title: 'Expert-Grade Output', description: 'Generate litigation-ready claim charts and technical reports' },
      { icon: 'zap', title: 'Risk Assessment', description: 'Get probability scores and recommendations for each infringement theory' }
    ],
    workflow: [
      { title: 'Input Patents & Products', description: 'Upload patent claims and accused product information or documentation' },
      { title: 'AI Analysis', description: 'AI maps claims to product features, collects evidence, and assesses strength' },
      { title: 'Review & Action', description: 'Review findings, refine arguments, and generate enforcement documents' }
    ]
  }
];
