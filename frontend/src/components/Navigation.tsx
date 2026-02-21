'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X as CloseIcon, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Navigation() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);
  const productsRef = useRef<HTMLDivElement>(null);
  const solutionsRef = useRef<HTMLDivElement>(null);
  const resourcesRef = useRef<HTMLDivElement>(null);

  const navItems = [
    { label: 'Pricing', href: '/pricing' },
    { label: 'Case Studies', href: '/case-studies' },
  ];

  const productItems = [
    { label: 'Prior Art Discovery', href: '/products#prior-art-discovery', description: 'AI-powered semantic search' },
    { label: 'Patent Drafting Studio', href: '/products#patent-drafting', description: 'Draft applications with AI' },
    { label: 'Landscape Analytics', href: '/products#landscape-analytics', description: 'Visualize technology trends' },
    { label: 'Infringement Analyzer', href: '/products#infringement-analyzer', description: 'Automated claim charting' },
  ];

  const solutionItems = [
    { label: 'Law Firms', href: '/solutions#law-firms', description: 'For legal professionals' },
    { label: 'Enterprises', href: '/solutions#enterprises', description: 'For corporate IP teams' },
    { label: 'Startups', href: '/solutions#startups', description: 'For emerging companies' },
    { label: 'Universities', href: '/solutions#universities', description: 'For research institutions' },
  ];

  const resourceItems = [
    { label: 'Blog', href: '/blog', description: 'Latest insights and updates' },
    { label: 'Documentation', href: '#', description: 'API docs and guides' },
    { label: 'Help Center', href: '#', description: 'FAQs and support articles' },
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (productsRef.current && !productsRef.current.contains(event.target as Node)) {
        setProductsOpen(false);
      }
      if (solutionsRef.current && !solutionsRef.current.contains(event.target as Node)) {
        setSolutionsOpen(false);
      }
      if (resourcesRef.current && !resourcesRef.current.contains(event.target as Node)) {
        setResourcesOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isActive = (href: string) => {
    // Don't highlight anchor links (like /#products, /#solutions) as active
    // Only highlight actual page routes
    if (href.startsWith('/#')) {
      return false;
    }
    return pathname === href;
  };

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="border-b bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50 shadow-sm"
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-8">
          <motion.div
            className="flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            <Link href="/">
              <span className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                PatPipes
              </span>
            </Link>
          </motion.div>
        </div>

        {/* Desktop Navigation - Centered */}
        <nav className="hidden md:flex items-center gap-8 absolute left-1/2 transform -translate-x-1/2">
          {/* Products Dropdown */}
          <motion.div
            ref={productsRef}
            className="relative"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * 0, duration: 0.4 }}
            onMouseEnter={() => setProductsOpen(true)}
            onMouseLeave={() => setProductsOpen(false)}
          >
            <Link
              href="/products"
              className={`flex items-center gap-1 text-sm font-medium transition-colors duration-200 ${
                pathname.startsWith('/products')
                  ? 'text-cyan-600 font-semibold'
                  : 'text-neutral-700 hover:text-cyan-600'
              }`}
            >
              Products
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${productsOpen ? 'rotate-180' : ''}`} />
            </Link>

            <AnimatePresence>
              {productsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-72 bg-white rounded-lg shadow-xl border border-neutral-200 py-2 overflow-hidden"
                >
                  {productItems.map((item, index) => (
                    <a
                      key={item.label}
                      href={item.href}
                      onClick={() => setProductsOpen(false)}
                    >
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.2 }}
                        className="px-4 py-3 hover:bg-cyan-50 transition-colors cursor-pointer"
                      >
                        <div className="font-medium text-neutral-900 text-sm">{item.label}</div>
                        <div className="text-xs text-neutral-600 mt-0.5">{item.description}</div>
                      </motion.div>
                    </a>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Solutions Dropdown */}
          <motion.div
            ref={solutionsRef}
            className="relative"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * 1, duration: 0.4 }}
            onMouseEnter={() => setSolutionsOpen(true)}
            onMouseLeave={() => setSolutionsOpen(false)}
          >
            <Link
              href="/solutions"
              className={`flex items-center gap-1 text-sm font-medium transition-colors duration-200 ${
                pathname.startsWith('/solutions')
                  ? 'text-cyan-600 font-semibold'
                  : 'text-neutral-700 hover:text-cyan-600'
              }`}
            >
              Solutions
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${solutionsOpen ? 'rotate-180' : ''}`} />
            </Link>

            <AnimatePresence>
              {solutionsOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-white rounded-lg shadow-xl border border-neutral-200 py-2 overflow-hidden"
                >
                  {solutionItems.map((item, index) => (
                    <a
                      key={item.label}
                      href={item.href}
                      onClick={() => setSolutionsOpen(false)}
                    >
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.2 }}
                        className="px-4 py-3 hover:bg-cyan-50 transition-colors cursor-pointer"
                      >
                        <div className="font-medium text-neutral-900 text-sm">{item.label}</div>
                        <div className="text-xs text-neutral-600 mt-0.5">{item.description}</div>
                      </motion.div>
                    </a>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {navItems.map((item, index) => {
            const active = isActive(item.href);
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * (index + 2), duration: 0.4 }}
              >
                <Link
                  href={item.href}
                  className={`text-sm font-medium transition-colors duration-200 ${
                    active
                      ? 'text-cyan-600 font-semibold'
                      : 'text-neutral-700 hover:text-cyan-600'
                  }`}
                >
                  {item.label}
                </Link>
              </motion.div>
            );
          })}

          {/* Resources Dropdown */}
          <motion.div
            ref={resourcesRef}
            className="relative"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * (navItems.length + 2), duration: 0.4 }}
            onMouseEnter={() => setResourcesOpen(true)}
            onMouseLeave={() => setResourcesOpen(false)}
          >
            <button
              className="flex items-center gap-1 text-sm font-medium text-neutral-700 hover:text-cyan-600 transition-colors duration-200"
            >
              Resources
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${resourcesOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {resourcesOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 bg-white rounded-lg shadow-xl border border-neutral-200 py-2 overflow-hidden"
                >
                  {resourceItems.map((item, index) => (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setResourcesOpen(false)}
                    >
                      <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05, duration: 0.2 }}
                        className="px-4 py-3 hover:bg-cyan-50 transition-colors cursor-pointer"
                      >
                        <div className="font-medium text-neutral-900 text-sm">{item.label}</div>
                        <div className="text-xs text-neutral-600 mt-0.5">{item.description}</div>
                      </motion.div>
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </nav>

        {/* Desktop CTAs */}
        <motion.div
          className="hidden md:flex items-center gap-3"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Link href="/login">
            <Button variant="ghost" className="hover:bg-cyan-50 hover:text-cyan-600 font-medium text-sm">
              Sign In
            </Button>
          </Link>
          <Link href="/signup">
            <Button className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl transition-all duration-200 font-semibold text-sm">
              Start Free Trial
            </Button>
          </Link>
        </motion.div>

        {/* Mobile Menu Button */}
        <motion.button
          className="md:hidden p-2 text-neutral-700 hover:text-cyan-600 transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          whileTap={{ scale: 0.95 }}
        >
          {mobileMenuOpen ? <CloseIcon className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </motion.button>
      </div>

      {/* Mobile Menu Drawer */}
      <motion.div
        initial={false}
        animate={{
          height: mobileMenuOpen ? 'auto' : 0,
          opacity: mobileMenuOpen ? 1 : 0
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="md:hidden overflow-hidden bg-white border-t"
      >
        <div className="container mx-auto px-4 py-6 space-y-4">
          {/* Products Section in Mobile */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={mobileMenuOpen ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
            transition={{ delay: 0 * 0.1, duration: 0.3 }}
            className="space-y-2"
          >
            <button
              onClick={() => setProductsOpen(!productsOpen)}
              className={`w-full flex items-center justify-between py-3 px-4 text-base font-medium rounded-lg transition-colors ${
                pathname.startsWith('/products')
                  ? 'text-cyan-600 bg-cyan-50 font-semibold'
                  : 'text-neutral-700 hover:text-cyan-600 hover:bg-cyan-50'
              }`}
            >
              Products
              <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${productsOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {productsOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="pl-4 space-y-1 overflow-hidden"
                >
                  {productItems.map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.2 }}
                    >
                      <a
                        href={item.href}
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setProductsOpen(false);
                        }}
                        className="block py-2 px-4 text-sm text-neutral-600 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                      >
                        <div className="font-medium">{item.label}</div>
                        <div className="text-xs text-neutral-500 mt-0.5">{item.description}</div>
                      </a>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Solutions Section in Mobile */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={mobileMenuOpen ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
            transition={{ delay: 1 * 0.1, duration: 0.3 }}
            className="space-y-2"
          >
            <button
              onClick={() => setSolutionsOpen(!solutionsOpen)}
              className={`w-full flex items-center justify-between py-3 px-4 text-base font-medium rounded-lg transition-colors ${
                pathname.startsWith('/solutions')
                  ? 'text-cyan-600 bg-cyan-50 font-semibold'
                  : 'text-neutral-700 hover:text-cyan-600 hover:bg-cyan-50'
              }`}
            >
              Solutions
              <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${solutionsOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {solutionsOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="pl-4 space-y-1 overflow-hidden"
                >
                  {solutionItems.map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.2 }}
                    >
                      <a
                        href={item.href}
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setSolutionsOpen(false);
                        }}
                        className="block py-2 px-4 text-sm text-neutral-600 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                      >
                        <div className="font-medium">{item.label}</div>
                        <div className="text-xs text-neutral-500 mt-0.5">{item.description}</div>
                      </a>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {navItems.map((item, index) => {
            const active = isActive(item.href);
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                animate={mobileMenuOpen ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
                transition={{ delay: (index + 2) * 0.1, duration: 0.3 }}
              >
                <Link
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block py-3 px-4 text-base font-medium rounded-lg transition-colors ${
                    active
                      ? 'text-cyan-600 bg-cyan-50 font-semibold'
                      : 'text-neutral-700 hover:text-cyan-600 hover:bg-cyan-50'
                  }`}
                >
                  {item.label}
                </Link>
              </motion.div>
            );
          })}

          {/* Resources Section in Mobile */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={mobileMenuOpen ? { opacity: 1, x: 0 } : { opacity: 0, x: -20 }}
            transition={{ delay: (navItems.length + 2) * 0.1, duration: 0.3 }}
            className="space-y-2"
          >
            <button
              onClick={() => setResourcesOpen(!resourcesOpen)}
              className="w-full flex items-center justify-between py-3 px-4 text-base font-medium text-neutral-700 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
            >
              Resources
              <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${resourcesOpen ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {resourcesOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="pl-4 space-y-1 overflow-hidden"
                >
                  {resourceItems.map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.2 }}
                    >
                      <Link
                        href={item.href}
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setResourcesOpen(false);
                        }}
                        className="block py-2 px-4 text-sm text-neutral-600 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                      >
                        <div className="font-medium">{item.label}</div>
                        <div className="text-xs text-neutral-500 mt-0.5">{item.description}</div>
                      </Link>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
          <div className="pt-4 border-t space-y-3">
            <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full font-medium">
                Sign In
              </Button>
            </Link>
            <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
              <Button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold">
                Start Free Trial
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.nav>
  );
}
