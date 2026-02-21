'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { toast } from 'sonner';
import { ProductPreview } from '@/components/ProductPreview';
import {
  ArrowRight,
  BarChart3,
  Shield,
  Search,
  FileText,
  Users,
  Zap,
  CheckCircle,
  Sparkles,
  TrendingUp,
  Brain,
  Database,
  Rocket,
  Target,
  Globe,
  Award,
  Clock,
  Lightbulb,
  ChevronDown,
  Check,
  X,
  Play,
  Mail,
  Lock,
  Settings,
  Building2,
  GraduationCap,
} from 'lucide-react';

export default function PatPipesLanding() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [email, setEmail] = useState('');

  const products = [
    {
      icon: <Search className="h-8 w-8" />,
      title: "Prior Art Discovery",
      description: "AI-powered semantic search across 100M+ patents, academic papers, and product databases. Find relevant prior art in seconds, not weeks.",
      color: "cyan",
      features: ["Semantic Search", "AI Claim Mapping", "Global Coverage", "2hr avg search time"],
      previewType: "search" as const
    },
    {
      icon: <FileText className="h-8 w-8" />,
      title: "Patent Drafting Studio",
      description: "Draft patent applications with AI assistance. Auto-generate claims, descriptions, and drawings with MPEP compliance checking.",
      color: "magenta",
      features: ["AI Writing Assistant", "Claim Generator", "MPEP Compliance", "60% time savings"],
      previewType: "drafting" as const
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Landscape Analytics",
      description: "Visualize technology trends, identify white spaces, and track competitor activity with interactive analytics dashboards.",
      color: "blue",
      features: ["Trend Analysis", "Competitor Tracking", "White Space ID", "50+ data points"],
      previewType: "analytics" as const
    },
    {
      icon: <Shield className="h-8 w-8" />,
      title: "Infringement Analyzer",
      description: "10-phase workflow for infringement analysis. Automated claim charting, evidence collection, and report generation.",
      color: "yellow",
      features: ["Claim Charts", "Evidence Mapping", "Auto Reports", "Expert-grade output"],
      previewType: "infringement" as const
    }
  ];

  const trustedLogos = [
    { name: "Tech Law Partners", type: "Law Firm" },
    { name: "BioTech Innovations", type: "Enterprise" },
    { name: "NanoSystems Corp", type: "Enterprise" },
    { name: "Quantum Legal", type: "Law Firm" },
    { name: "MedDevice Inc", type: "Enterprise" },
    { name: "Stanford Tech Transfer", type: "University" }
  ];

  const pricingTiers = [
    {
      name: "Starter",
      price: "$299",
      period: "/month",
      description: "Perfect for solo practitioners and small teams",
      features: [
        "Prior Art Search (100 searches/mo)",
        "Basic Analytics Dashboard",
        "5 Patent Drafts/month",
        "Email Support",
        "API Access (10K calls/mo)",
        "Single User License"
      ],
      cta: "Start Free Trial",
      highlight: false
    },
    {
      name: "Professional",
      price: "$899",
      period: "/month",
      description: "For growing law firms and IP departments",
      features: [
        "Prior Art Search (Unlimited)",
        "Advanced Analytics + White Space",
        "Unlimited Patent Drafts",
        "Priority Support + Slack",
        "API Access (100K calls/mo)",
        "Up to 10 User Licenses",
        "Infringement Analysis (50/mo)",
        "Custom Integrations",
        "Team Collaboration Tools"
      ],
      cta: "Start Free Trial",
      highlight: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For large organizations with complex needs",
      features: [
        "Everything in Professional",
        "Unlimited Users & Searches",
        "Dedicated Account Manager",
        "Custom AI Model Training",
        "SSO & Advanced Security",
        "SLA with 99.9% Uptime",
        "On-premise Deployment Option",
        "White Label Solution",
        "24/7 Phone Support"
      ],
      cta: "Contact Sales",
      highlight: false
    }
  ];

  const faqs = [
    {
      question: "How accurate is your AI search?",
      answer: "Our AI achieves 98% accuracy validated by independent patent attorneys. We use advanced semantic search that understands patent language, not just keywords. The system is trained on 100M+ patents and continuously improves with each search."
    },
    {
      question: "What data sources do you cover?",
      answer: "We index 100M+ patents from USPTO, EPO, WIPO, JPO, CNIPA, and 50+ other patent offices. We also cover 80M+ academic papers, product databases, and non-patent literature across 150+ countries."
    },
    {
      question: "Is my data secure and confidential?",
      answer: "Absolutely. We're SOC 2 Type II certified, GDPR compliant, and ISO 27001 certified. Your data is encrypted at rest and in transit. We never use your proprietary information to train our models. Attorney-client privilege is preserved."
    },
    {
      question: "Can I integrate with my existing workflow?",
      answer: "Yes! We offer REST APIs, webhooks, and direct integrations with major IP management systems like CPA Global, Anaqua, and PatSnap. We also integrate with Microsoft Office, Google Workspace, and Slack."
    },
    {
      question: "What happens after the free trial?",
      answer: "You get full access for 14 days with no credit card required. After the trial, choose a plan that fits your needs or downgrade to our free tier (10 searches/month). No automatic charges - you decide."
    },
    {
      question: "How does PatPipes compare to traditional search tools?",
      answer: "Traditional tools use keyword matching and Boolean logic. PatPipes uses AI semantic understanding to find conceptually similar patents even with different terminology. Users report 10x faster searches and finding 40% more relevant prior art."
    }
  ];

  const comparisonFeatures = [
    { feature: "AI Semantic Search", patpipes: true, traditional: false },
    { feature: "Avg. Search Time", patpipes: "2 hours", traditional: "2 weeks" },
    { feature: "Global Patent Coverage", patpipes: "100M+ patents", traditional: "Limited" },
    { feature: "AI-Assisted Drafting", patpipes: true, traditional: false },
    { feature: "Real-time Analytics", patpipes: true, traditional: false },
    { feature: "API Access", patpipes: true, traditional: "Enterprise only" },
    { feature: "MPEP Compliance Check", patpipes: true, traditional: false },
    { feature: "Collaborative Workspace", patpipes: true, traditional: false },
  ];

  const stats = [
    { value: "100M+", label: "Patents Indexed", icon: <Database className="h-5 w-5" /> },
    { value: "500+", label: "Law Firms", icon: <Users className="h-5 w-5" /> },
    { value: "98%", label: "AI Accuracy", icon: <Target className="h-5 w-5" /> },
    { value: "10x", label: "Faster Searches", icon: <Zap className="h-5 w-5" /> }
  ];

  const testimonials = [
    {
      quote: "PatPipes reduced our prior art search time from 2 weeks to 2 hours. The AI-powered semantic search is incredibly accurate and finds patents we would have missed.",
      author: "Sarah Chen",
      role: "Partner, Patent Litigation",
      company: "Tech Law Partners",
      avatar: "SC",
      logo: "⚖️"
    },
    {
      quote: "The landscape analytics helped us identify a white space opportunity worth $50M in potential licensing revenue. ROI was immediate.",
      author: "Michael Rodriguez",
      role: "VP of Intellectual Property",
      company: "BioTech Innovations",
      avatar: "MR",
      logo: "🧬"
    },
    {
      quote: "PatPipes' drafting assistant improved our application quality while cutting drafting time by 60%. Our allowance rate increased 15%.",
      author: "Dr. Emily Watson",
      role: "Chief IP Counsel",
      company: "NanoSystems Corp",
      avatar: "EW",
      logo: "⚛️"
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" as const },
    },
  };

  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string; text: string; border: string; gradient: string }> = {
      cyan: {
        bg: 'bg-cyan-50',
        text: 'text-cyan-600',
        border: 'border-cyan-200',
        gradient: 'from-cyan-500 to-blue-500'
      },
      magenta: {
        bg: 'bg-magenta-50',
        text: 'text-magenta-600',
        border: 'border-magenta-200',
        gradient: 'from-magenta-500 to-cyan-500'
      },
      yellow: {
        bg: 'bg-yellow-50',
        text: 'text-yellow-700',
        border: 'border-yellow-200',
        gradient: 'from-yellow-400 to-cyan-400'
      },
      blue: {
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        border: 'border-blue-200',
        gradient: 'from-blue-500 to-cyan-500'
      },
    };
    return colorMap[color] || colorMap.cyan;
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Simulate API call
    toast.loading('Subscribing...', { id: 'newsletter' });

    setTimeout(() => {
      toast.success('Success! Check your email for the Prior Art Search Guide.', {
        id: 'newsletter',
        description: 'Welcome to the PatPipes community!',
        duration: 5000,
      });
      setEmail('');
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-cyan-50/30 to-white">
        {/* Animated background */}
        <div className="absolute inset-0 -z-10">
          <motion.div
            className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
            animate={{
              scale: [1, 1.2, 1],
              x: [0, 50, 0],
              y: [0, 30, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute top-1/3 right-1/4 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
            animate={{
              scale: [1, 1.3, 1],
              x: [0, -50, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 text-cyan-700 px-5 py-2.5 rounded-full text-sm font-semibold shadow-md"
            >
              <Brain className="h-4 w-4" />
              AI-Powered Patent Intelligence Platform
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1]"
            >
              Search, Analyze, Protect.
              <span className="block mt-2 bg-gradient-to-r from-cyan-500 via-blue-500 to-magenta-500 bg-clip-text text-transparent">
                All in One Platform.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-lg md:text-xl text-neutral-600 max-w-3xl mx-auto leading-relaxed"
            >
              PatPipes uses AI to accelerate patent search, drafting, and analytics.
              Find prior art <strong className="text-neutral-900">10x faster</strong>, draft better applications, and make data-driven IP decisions.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link href="/signup">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="lg" className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-xl hover:shadow-2xl transition-all duration-200 px-8 h-12 text-base font-semibold">
                    Start Free Trial
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </motion.div>
              </Link>
              <Link href="#demo">
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button size="lg" variant="outline" className="gap-2 border-2 hover:bg-cyan-50 hover:border-cyan-500 hover:text-cyan-600 px-8 h-12 text-base font-semibold">
                    <Play className="h-4 w-4" />
                    Watch Demo
                  </Button>
                </motion.div>
              </Link>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.9 }}
              className="text-sm text-neutral-500"
            >
              No credit card required • 14-day free trial • Cancel anytime
            </motion.p>
          </div>
        </div>
      </section>

      {/* Trust Badges Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="border-t border-b bg-neutral-50 py-12"
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <p className="text-sm font-semibold text-neutral-600 uppercase tracking-wide">
              Trusted by 500+ Law Firms & Enterprises
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 max-w-5xl mx-auto items-center">
            {trustedLogos.map((logo, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="flex flex-col items-center justify-center p-4 rounded-lg bg-white border border-neutral-200 hover:border-cyan-300 hover:shadow-md transition-all"
              >
                <div className="text-2xl font-bold text-neutral-700 mb-1">{logo.name.substring(0, 2)}</div>
                <div className="text-xs font-medium text-neutral-600 text-center">{logo.name}</div>
                <div className="text-xs text-neutral-400 mt-1">{logo.type}</div>
              </motion.div>
            ))}
          </div>
          <div className="flex justify-center gap-6 mt-10">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-neutral-200 shadow-sm"
            >
              <Lock className="h-5 w-5 text-green-600" />
              <div className="text-left">
                <div className="text-xs font-semibold text-neutral-900">SOC 2 Type II</div>
                <div className="text-xs text-neutral-500">Certified</div>
              </div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-neutral-200 shadow-sm"
            >
              <Shield className="h-5 w-5 text-blue-600" />
              <div className="text-left">
                <div className="text-xs font-semibold text-neutral-900">ISO 27001</div>
                <div className="text-xs text-neutral-500">Certified</div>
              </div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-neutral-200 shadow-sm"
            >
              <Globe className="h-5 w-5 text-purple-600" />
              <div className="text-left">
                <div className="text-xs font-semibold text-neutral-900">GDPR</div>
                <div className="text-xs text-neutral-500">Compliant</div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
        className="container mx-auto px-4 py-16"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ scale: 1.05, y: -5 }}
              className="text-center p-6 rounded-2xl bg-white border-2 border-neutral-100 shadow-sm hover:shadow-lg hover:border-cyan-200 transition-all duration-300"
            >
              <div className="flex justify-center mb-3 text-cyan-500">
                {stat.icon}
              </div>
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-1">
                {stat.value}
              </div>
              <div className="text-xs md:text-sm text-neutral-600 font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Products Section */}
      <section id="products" className="container mx-auto px-4 py-20 bg-gradient-to-b from-white to-neutral-50">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
            Everything You Need to Innovate Faster
          </h2>
          <p className="text-lg text-neutral-600 leading-relaxed">
            Four powerful products working together to streamline your entire patent workflow
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto"
        >
          {products.map((product, index) => {
            const colors = getColorClasses(product.color);
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="h-full border-2 border-neutral-200 hover:border-transparent hover:shadow-2xl transition-all duration-300 overflow-hidden group">
                  <div className={`h-2 bg-gradient-to-r ${colors.gradient}`} />
                  <CardContent className="p-8">
                    {/* Product UI Preview */}
                    <div className="mb-6 -mx-8 -mt-8 pt-8 px-8 pb-4 bg-gradient-to-b from-neutral-50 to-transparent">
                      <ProductPreview type={product.previewType} className="w-full h-auto rounded-lg shadow-md" />
                    </div>

                    {/* Icon and Title */}
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`h-12 w-12 ${colors.bg} rounded-xl flex items-center justify-center ${colors.text} shadow-md`}>
                        {product.icon}
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold text-el-black">{product.title}</h3>
                    </div>

                    <p className="text-neutral-600 leading-relaxed mb-6 text-base">{product.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {product.features.map((feature, idx) => (
                        <span key={idx} className={`text-xs px-3 py-1.5 ${colors.bg} ${colors.text} rounded-full font-semibold`}>
                          {feature}
                        </span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* Comparison Section - Why PatPipes */}
      <section className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
            Why Choose PatPipes?
          </h2>
          <p className="text-lg text-neutral-600 leading-relaxed">
            See how PatPipes compares to traditional patent search and management tools
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-white rounded-2xl border-2 border-neutral-200 shadow-xl overflow-hidden">
            <div className="grid grid-cols-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white p-4">
              <div className="text-sm md:text-base font-semibold">Feature</div>
              <div className="text-sm md:text-base font-semibold text-center">PatPipes</div>
              <div className="text-sm md:text-base font-semibold text-center">Traditional Tools</div>
            </div>
            {comparisonFeatures.map((item, index) => (
              <div
                key={index}
                className={`grid grid-cols-3 p-4 items-center ${
                  index % 2 === 0 ? 'bg-neutral-50' : 'bg-white'
                }`}
              >
                <div className="text-sm md:text-base font-medium text-neutral-900">{item.feature}</div>
                <div className="text-center">
                  {typeof item.patpipes === 'boolean' ? (
                    item.patpipes ? (
                      <Check className="h-6 w-6 text-green-600 mx-auto" />
                    ) : (
                      <X className="h-6 w-6 text-neutral-300 mx-auto" />
                    )
                  ) : (
                    <span className="text-sm md:text-base font-semibold text-cyan-600">{item.patpipes}</span>
                  )}
                </div>
                <div className="text-center">
                  {typeof item.traditional === 'boolean' ? (
                    item.traditional ? (
                      <Check className="h-6 w-6 text-green-600 mx-auto" />
                    ) : (
                      <X className="h-6 w-6 text-neutral-300 mx-auto" />
                    )
                  ) : (
                    <span className="text-sm md:text-base text-neutral-600">{item.traditional}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Testimonials Section */}
      <section className="bg-gradient-to-b from-neutral-50 to-white py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
              Loved by Patent Professionals
            </h2>
            <p className="text-lg text-neutral-600 leading-relaxed">
              See what our customers say about transforming their IP workflows
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto"
          >
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -5 }}
                className="p-8 rounded-2xl bg-white border-2 border-neutral-100 hover:border-cyan-200 hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-yellow-400 text-lg">★</span>
                    ))}
                  </div>
                  <div className="text-2xl">{testimonial.logo}</div>
                </div>
                <p className="text-neutral-700 leading-relaxed mb-6 text-sm md:text-base italic">"{testimonial.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center text-white font-bold flex-shrink-0">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-el-black text-sm">{testimonial.author}</div>
                    <div className="text-xs text-neutral-600">{testimonial.role}</div>
                    <div className="text-xs text-neutral-500">{testimonial.company}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="container mx-auto px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
            Transparent Pricing for Every Stage
          </h2>
          <p className="text-lg text-neutral-600 leading-relaxed">
            Start free, scale as you grow. No hidden fees, cancel anytime.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto"
        >
          {pricingTiers.map((tier, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -8 }}
              className={`relative rounded-2xl border-2 p-8 bg-white ${
                tier.highlight
                  ? 'border-cyan-500 shadow-2xl scale-105'
                  : 'border-neutral-200 hover:border-cyan-300 hover:shadow-lg'
              } transition-all duration-300`}
            >
              {tier.highlight && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg">
                    MOST POPULAR
                  </span>
                </div>
              )}
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-bold text-neutral-900">{tier.price}</span>
                  <span className="text-neutral-600 text-sm">{tier.period}</span>
                </div>
                <p className="text-sm text-neutral-600">{tier.description}</p>
              </div>
              <ul className="space-y-3 mb-8">
                {tier.features.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-cyan-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-neutral-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <Button
                className={`w-full ${
                  tier.highlight
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg'
                    : 'border-2 border-neutral-300 hover:border-cyan-500 hover:bg-cyan-50 hover:text-cyan-600'
                }`}
                variant={tier.highlight ? 'default' : 'outline'}
              >
                {tier.cta}
              </Button>
            </motion.div>
          ))}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-sm text-neutral-500 mt-8"
        >
          All plans include 14-day free trial • No credit card required • Annual plans save 20%
        </motion.p>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="bg-neutral-50 py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4 leading-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-neutral-600 leading-relaxed">
              Everything you need to know about PatPipes
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={containerVariants}
            className="max-w-3xl mx-auto space-y-4"
          >
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="bg-white rounded-xl border-2 border-neutral-200 overflow-hidden hover:border-cyan-300 transition-colors"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 hover:bg-neutral-50 transition-colors"
                >
                  <span className="font-semibold text-neutral-900 text-base">{faq.question}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-cyan-600 flex-shrink-0 transition-transform duration-300 ${
                      openFaq === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    openFaq === index ? 'max-h-96' : 'max-h-0'
                  }`}
                >
                  <div className="px-6 pb-6 text-neutral-600 text-sm leading-relaxed">
                    {faq.answer}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Email Capture Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="container mx-auto px-4 py-16"
      >
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-cyan-500 via-blue-500 to-magenta-500 rounded-2xl p-12 text-center shadow-2xl">
          <h3 className="text-2xl md:text-4xl font-bold text-white mb-4">
            Get the Free Prior Art Search Guide
          </h3>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            Join 10,000+ patent professionals receiving tips, strategies, and industry insights.
          </p>
          <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <div className="flex-1 relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-neutral-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full pl-10 pr-4 py-3 rounded-lg border-2 border-white/20 bg-white/10 backdrop-blur-sm text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 text-sm"
              />
            </div>
            <Button
              type="submit"
              className="bg-white text-cyan-600 hover:bg-neutral-100 font-semibold px-6 py-3 shadow-lg whitespace-nowrap"
            >
              Download Free Guide
            </Button>
          </form>
          <p className="text-xs text-white/70 mt-4">
            Unsubscribe anytime. We respect your privacy.
          </p>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative bg-gradient-to-br from-cyan-500 via-blue-500 to-magenta-500 py-20 overflow-hidden"
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '48px 48px'
          }} />
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl md:text-5xl font-bold mb-6 text-white leading-tight"
          >
            Ready to Transform Your Patent Workflow?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed"
          >
            Join thousands of innovators using PatPipes to search smarter, draft faster, and protect better.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/signup">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" className="gap-2 bg-white text-cyan-600 hover:bg-neutral-100 shadow-xl hover:shadow-2xl px-8 h-12 text-base font-semibold">
                  Start Free Trial
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </motion.div>
            </Link>
            <Link href="#demo">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" variant="outline" className="border-2 border-white bg-white text-cyan-600 hover:bg-transparent hover:text-white px-8 h-12 text-base font-semibold">
                  Schedule Demo
                </Button>
              </motion.div>
            </Link>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-sm text-white/80 mt-6"
          >
            14-day free trial • No credit card required • Enterprise plans available
          </motion.p>
        </div>
      </motion.section>

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
                <li><Link href="#" className="hover:text-cyan-400 transition-colors">Prior Art Search</Link></li>
                <li><Link href="#" className="hover:text-cyan-400 transition-colors">Drafting Studio</Link></li>
                <li><Link href="#" className="hover:text-cyan-400 transition-colors">Analytics Platform</Link></li>
                <li><Link href="#" className="hover:text-cyan-400 transition-colors">Infringement Analyzer</Link></li>
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
