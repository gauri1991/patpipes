'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, User, Tag, TrendingUp, Lightbulb, Scale, Code } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const categories = [
  { name: 'All Posts', count: 12, slug: 'all' },
  { name: 'Product Updates', count: 4, slug: 'product' },
  { name: 'Best Practices', count: 3, slug: 'best-practices' },
  { name: 'Patent Law', count: 3, slug: 'law' },
  { name: 'AI & Technology', count: 2, slug: 'tech' },
];

const blogPosts = [
  {
    id: 1,
    title: 'Introducing AI-Powered Claim Generation: Patent Drafting Just Got 10x Faster',
    excerpt: 'Learn how our new AI claim generation feature helps patent attorneys draft comprehensive claims in minutes instead of hours.',
    author: 'Sarah Chen',
    date: 'October 15, 2024',
    readTime: '5 min read',
    category: 'Product Updates',
    image: '📝',
    tags: ['AI', 'Drafting', 'Product'],
    featured: true,
  },
  {
    id: 2,
    title: '5 Best Practices for Conducting Prior Art Searches in 2024',
    excerpt: 'Discover the latest strategies and techniques for comprehensive prior art searches that save time and improve patent quality.',
    author: 'Michael Rodriguez',
    date: 'October 10, 2024',
    readTime: '8 min read',
    category: 'Best Practices',
    image: '🔍',
    tags: ['Search', 'Best Practices', 'Tutorial'],
    featured: true,
  },
  {
    id: 3,
    title: 'Understanding the MPEP: A Guide for Patent Professionals',
    excerpt: 'A comprehensive overview of the Manual of Patent Examining Procedure and how to leverage it for better patent applications.',
    author: 'Jennifer Park',
    date: 'October 5, 2024',
    readTime: '12 min read',
    category: 'Patent Law',
    image: '⚖️',
    tags: ['MPEP', 'Law', 'Education'],
    featured: false,
  },
  {
    id: 4,
    title: 'How Semantic Search is Revolutionizing Patent Discovery',
    excerpt: 'Explore how AI-powered semantic search goes beyond keyword matching to find truly relevant prior art.',
    author: 'Alex Thompson',
    date: 'September 28, 2024',
    readTime: '6 min read',
    category: 'AI & Technology',
    image: '🤖',
    tags: ['AI', 'Search', 'Technology'],
    featured: false,
  },
  {
    id: 5,
    title: 'Patent Portfolio Management: Strategies for Growing Law Firms',
    excerpt: 'Learn how successful IP firms manage large patent portfolios efficiently using modern analytics tools.',
    author: 'David Kim',
    date: 'September 20, 2024',
    readTime: '10 min read',
    category: 'Best Practices',
    image: '📊',
    tags: ['Portfolio', 'Management', 'Law Firms'],
    featured: false,
  },
  {
    id: 6,
    title: 'New Feature: Collaborative Drafting Workspaces',
    excerpt: 'Introducing real-time collaboration features that let your team work together on patent applications seamlessly.',
    author: 'Sarah Chen',
    date: 'September 15, 2024',
    readTime: '4 min read',
    category: 'Product Updates',
    image: '👥',
    tags: ['Product', 'Collaboration', 'Teams'],
    featured: false,
  },
  {
    id: 7,
    title: 'Infringement Analysis: A Step-by-Step Guide',
    excerpt: 'Master the 10-phase infringement analysis workflow with this comprehensive guide for patent litigators.',
    author: 'Michael Rodriguez',
    date: 'September 8, 2024',
    readTime: '15 min read',
    category: 'Patent Law',
    image: '⚔️',
    tags: ['Litigation', 'Infringement', 'Analysis'],
    featured: false,
  },
  {
    id: 8,
    title: 'The Future of Patent Analytics: Trends to Watch in 2025',
    excerpt: 'Industry experts share their predictions for how AI and machine learning will transform patent analytics.',
    author: 'Jennifer Park',
    date: 'September 1, 2024',
    readTime: '7 min read',
    category: 'AI & Technology',
    image: '🔮',
    tags: ['Trends', 'Future', 'Analytics'],
    featured: false,
  },
  {
    id: 9,
    title: 'Maximizing ROI: How Startups Can Protect IP on a Budget',
    excerpt: 'Cost-effective strategies for startups to build a strong patent portfolio without breaking the bank.',
    author: 'Alex Thompson',
    date: 'August 25, 2024',
    readTime: '9 min read',
    category: 'Best Practices',
    image: '💰',
    tags: ['Startups', 'Budget', 'Strategy'],
    featured: false,
  },
];

export default function BlogPage() {
  const featuredPosts = blogPosts.filter(post => post.featured);
  const regularPosts = blogPosts.filter(post => !post.featured);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-neutral-50 to-white py-16">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Patent Intelligence Insights
            </h1>
            <p className="text-xl text-neutral-600">
              Expert insights, product updates, and best practices for patent professionals.
            </p>
          </motion.div>

          {/* Categories */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-wrap justify-center gap-3 mb-12"
          >
            {categories.map((category, index) => (
              <button
                key={category.slug}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  index === 0
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md'
                    : 'bg-white border-2 border-neutral-200 text-neutral-700 hover:border-cyan-500 hover:text-cyan-600'
                }`}
              >
                {category.name}
                <span className="ml-2 text-xs opacity-75">({category.count})</span>
              </button>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Posts */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold mb-8">Featured Articles</h2>
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          {featuredPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full border-2 border-neutral-200 hover:border-cyan-500 hover:shadow-xl transition-all group cursor-pointer">
                <CardContent className="p-8">
                  <div className="text-6xl mb-6">{post.image}</div>

                  <div className="flex items-center gap-2 mb-4">
                    <span className="px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-xs font-semibold">
                      {post.category}
                    </span>
                    <span className="text-xs text-neutral-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {post.readTime}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold mb-3 text-neutral-900 group-hover:text-cyan-600 transition-colors">
                    {post.title}
                  </h3>

                  <p className="text-neutral-600 mb-4 line-clamp-2">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-neutral-200">
                    <div className="flex items-center gap-2 text-sm text-neutral-600">
                      <User className="h-4 w-4" />
                      <span>{post.author}</span>
                      <span className="text-neutral-400">•</span>
                      <span>{post.date}</span>
                    </div>
                    <ArrowRight className="h-5 w-5 text-cyan-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Recent Posts */}
        <h2 className="text-3xl font-bold mb-8">Recent Articles</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {regularPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full border-2 border-neutral-200 hover:border-cyan-500 hover:shadow-lg transition-all group cursor-pointer">
                <CardContent className="p-6">
                  <div className="text-5xl mb-4">{post.image}</div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-1 bg-neutral-100 text-neutral-700 rounded text-xs font-medium">
                      {post.category}
                    </span>
                    <span className="text-xs text-neutral-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {post.readTime}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold mb-2 text-neutral-900 group-hover:text-cyan-600 transition-colors line-clamp-2">
                    {post.title}
                  </h3>

                  <p className="text-sm text-neutral-600 mb-4 line-clamp-2">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center gap-2 text-xs text-neutral-500 pt-3 border-t border-neutral-200">
                    <User className="h-3 w-3" />
                    <span>{post.author}</span>
                    <span>•</span>
                    <span>{post.date}</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center mt-12">
          <Button
            size="lg"
            variant="outline"
            className="border-2 border-neutral-300 hover:border-cyan-500 hover:bg-cyan-50 hover:text-cyan-600"
          >
            Load More Articles
          </Button>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="bg-gradient-to-b from-neutral-50 to-white py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="text-5xl mb-6">📧</div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Subscribe to Our Newsletter
              </h2>
              <p className="text-lg text-neutral-600 mb-8">
                Get the latest patent insights, product updates, and industry news delivered to your inbox weekly.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 border-2 border-neutral-300 rounded-lg focus:outline-none focus:border-cyan-500"
                />
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-8"
                >
                  Subscribe
                </Button>
              </div>

              <p className="text-xs text-neutral-500 mt-4">
                No spam. Unsubscribe anytime. Read our{' '}
                <Link href="/privacy" className="text-cyan-600 hover:underline">
                  Privacy Policy
                </Link>
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 py-20 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '48px 48px'
          }} />
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 text-white">
            Ready to Transform Your Patent Workflow?
          </h2>
          <p className="text-xl text-cyan-50 mb-8 max-w-3xl mx-auto">
            Join thousands of IP professionals using PatPipes to work smarter, faster, and more effectively.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-white text-cyan-600 hover:bg-cyan-50 px-8 py-6 text-lg shadow-xl hover:shadow-2xl transition-all duration-200 font-semibold">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="border-2 border-white bg-white text-cyan-600 hover:bg-transparent hover:text-white px-8 py-6 text-lg font-semibold">
                Contact Sales
              </Button>
            </Link>
          </div>
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
                <li><Link href="/#products" className="hover:text-cyan-400 transition-colors">Prior Art Search</Link></li>
                <li><Link href="/#products" className="hover:text-cyan-400 transition-colors">Drafting Studio</Link></li>
                <li><Link href="/#products" className="hover:text-cyan-400 transition-colors">Analytics Platform</Link></li>
                <li><Link href="/#products" className="hover:text-cyan-400 transition-colors">Infringement Analyzer</Link></li>
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
