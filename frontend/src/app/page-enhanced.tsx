'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
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
  TrendingUp
} from 'lucide-react';

export default function EnhancedLandingPage() {
  const features = [
    {
      icon: <FileText className="h-6 w-6" />,
      title: "Patent Drafting",
      description: "AI-powered patent drafting with MPEP compliance checking and automated claim generation",
      color: "cyan"
    },
    {
      icon: <Search className="h-6 w-6" />,
      title: "Prior Art Search",
      description: "Comprehensive prior art searching with intelligent claim mapping and analysis",
      color: "magenta"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Infringement Analysis",
      description: "10-phase infringement workflow with automated claim charting and evidence mapping",
      color: "yellow"
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Landscape Analytics",
      description: "Technology trends, competitive intelligence, and white space identification",
      color: "blue"
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: "Collaboration",
      description: "Real-time collaboration with team members, clients, and external counsel",
      color: "cyan"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "AI Assistant",
      description: "GPT-4 powered suggestions for claims, descriptions, and patent improvements",
      color: "magenta"
    }
  ];

  const stats = [
    { value: "10K+", label: "Patents Analyzed", icon: <FileText className="h-5 w-5" /> },
    { value: "500+", label: "Law Firms", icon: <Users className="h-5 w-5" /> },
    { value: "98%", label: "Accuracy Rate", icon: <TrendingUp className="h-5 w-5" /> },
    { value: "24/7", label: "Support", icon: <CheckCircle className="h-5 w-5" /> }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
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
    const colorMap: Record<string, { bg: string; text: string; border: string; hover: string }> = {
      cyan: {
        bg: 'bg-cyan-50',
        text: 'text-cyan-600',
        border: 'border-cyan-200',
        hover: 'hover:shadow-cyan-500/20'
      },
      magenta: {
        bg: 'bg-magenta-50',
        text: 'text-magenta-600',
        border: 'border-magenta-200',
        hover: 'hover:shadow-magenta-500/20'
      },
      yellow: {
        bg: 'bg-yellow-50',
        text: 'text-yellow-600',
        border: 'border-yellow-200',
        hover: 'hover:shadow-yellow-500/20'
      },
      blue: {
        bg: 'bg-blue-50',
        text: 'text-blue-600',
        border: 'border-blue-200',
        hover: 'hover:shadow-blue-500/20'
      },
    };
    return colorMap[color] || colorMap.cyan;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-neutral-50 to-white">
      {/* Enhanced Navigation */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="border-b bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50 shadow-sm"
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <motion.div
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <div className="h-8 w-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-sm font-bold text-white">PA</span>
              </div>
              <span className="text-xl font-semibold bg-gradient-to-r from-el-black to-neutral-700 bg-clip-text text-transparent">
                Patent Analytics
              </span>
            </motion.div>
            <nav className="hidden md:flex items-center gap-6">
              {['Features', 'Pricing', 'About', 'Contact'].map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index, duration: 0.4 }}
                >
                  <Link
                    href={`#${item.toLowerCase()}`}
                    className="text-sm text-neutral-600 hover:text-cyan-600 transition-colors duration-200 font-medium"
                  >
                    {item}
                  </Link>
                </motion.div>
              ))}
            </nav>
          </div>
          <motion.div
            className="flex items-center gap-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <Link href="/login">
              <Button variant="ghost" className="hover:bg-cyan-50 hover:text-cyan-600">
                Sign In
              </Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200">
                Get Started
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.nav>

      {/* Enhanced Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 -z-10">
          <motion.div
            className="absolute top-1/4 left-1/4 w-72 h-72 bg-cyan-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
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
            className="absolute top-1/3 right-1/4 w-72 h-72 bg-magenta-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
            animate={{
              scale: [1, 1.3, 1],
              x: [0, -50, 0],
              y: [0, -30, 0],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-1/4 left-1/2 w-72 h-72 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"
            animate={{
              scale: [1, 1.1, 1],
              x: [0, 30, 0],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-50 to-blue-50 border border-cyan-200 text-cyan-700 px-6 py-3 rounded-full text-sm font-semibold shadow-md"
          >
            <Sparkles className="h-4 w-4" />
            AI-Powered Patent Intelligence Platform
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-5xl md:text-7xl font-bold tracking-tight leading-tight"
          >
            Transform Your Patent Practice with
            <span className="block mt-2 bg-gradient-to-r from-cyan-500 via-blue-500 to-magenta-500 bg-clip-text text-transparent animate-gradient">
              Advanced Analytics
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-xl text-neutral-600 max-w-2xl mx-auto leading-relaxed"
          >
            Streamline patent drafting, infringement analysis, and landscape research with our
            comprehensive AI-powered platform trusted by leading law firms and corporations.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.7 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/signup">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" className="gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-xl hover:shadow-2xl transition-all duration-200 px-8">
                  Start Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            </Link>
            <Link href="#demo">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" variant="outline" className="border-2 hover:bg-cyan-50 hover:border-cyan-500 hover:text-cyan-600 px-8">
                  Watch Demo
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Enhanced Stats Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={containerVariants}
        className="container mx-auto px-4 pb-16"
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ scale: 1.05, y: -5 }}
              className="text-center p-6 rounded-xl bg-white border border-neutral-200 shadow-sm hover:shadow-lg transition-all duration-300"
            >
              <div className="flex justify-center mb-3 text-cyan-500">
                {stat.icon}
              </div>
              <div className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-sm text-neutral-600 mt-2 font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Enhanced Features Section */}
      <section id="features" className="container mx-auto px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything You Need for Patent Excellence
          </h2>
          <p className="text-lg text-neutral-600 leading-relaxed">
            Our comprehensive platform covers the entire patent lifecycle from ideation to enforcement
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {features.map((feature, index) => {
            const colors = getColorClasses(feature.color);
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -8, scale: 1.02 }}
                transition={{ duration: 0.3 }}
              >
                <Card className={`h-full border-2 ${colors.border} hover:shadow-2xl ${colors.hover} transition-all duration-300`}>
                  <CardContent className="p-6">
                    <div className={`h-14 w-14 ${colors.bg} rounded-xl flex items-center justify-center ${colors.text} mb-4 shadow-md`}>
                      {feature.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-el-black">{feature.title}</h3>
                    <p className="text-neutral-600 leading-relaxed">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>
      </section>

      {/* Enhanced CTA Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="relative bg-gradient-to-br from-cyan-500 via-blue-500 to-magenta-500 py-24 overflow-hidden"
      >
        {/* Animated background pattern */}
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
            className="text-4xl md:text-5xl font-bold mb-4 text-white"
          >
            Ready to Revolutionize Your Patent Practice?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg text-white/90 mb-8 max-w-2xl mx-auto leading-relaxed"
          >
            Join thousands of patent professionals who are already using our platform to
            deliver better results faster.
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
                <Button size="lg" className="gap-2 bg-white text-cyan-600 hover:bg-neutral-100 shadow-xl hover:shadow-2xl px-8">
                  Start 14-Day Free Trial
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </motion.div>
            </Link>
            <Link href="/contact">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-cyan-600 px-8">
                  Contact Sales
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
            No credit card required • Cancel anytime
          </motion.p>
        </div>
      </motion.section>

      {/* Enhanced Footer */}
      <footer className="border-t bg-neutral-900 text-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-8 w-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-sm font-bold text-white">PA</span>
                </div>
                <span className="text-lg font-semibold">Patent Analytics</span>
              </div>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Professional patent management and analytics platform for law firms and enterprises.
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-cyan-400">Product</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><Link href="#" className="hover:text-cyan-400 transition-colors">Features</Link></li>
                <li><Link href="#" className="hover:text-cyan-400 transition-colors">Pricing</Link></li>
                <li><Link href="#" className="hover:text-cyan-400 transition-colors">API</Link></li>
                <li><Link href="#" className="hover:text-cyan-400 transition-colors">Integrations</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-cyan-400">Company</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><Link href="#" className="hover:text-cyan-400 transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-cyan-400 transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-cyan-400 transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-cyan-400 transition-colors">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-cyan-400">Legal</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><Link href="#" className="hover:text-cyan-400 transition-colors">Privacy Policy</Link></li>
                <li><Link href="#" className="hover:text-cyan-400 transition-colors">Terms of Service</Link></li>
                <li><Link href="#" className="hover:text-cyan-400 transition-colors">Security</Link></li>
                <li><Link href="#" className="hover:text-cyan-400 transition-colors">Compliance</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-neutral-800 mt-8 pt-8 text-center text-sm text-neutral-400">
            <p>© 2024 Patent Analytics Platform. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
