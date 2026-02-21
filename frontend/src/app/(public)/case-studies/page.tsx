'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, Filter, ArrowRight, TrendingUp, Clock, Users, Building2, Award, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

const caseStudies = [
  {
    id: 'pharma-giant-roi',
    title: 'Global Pharma Giant Achieves 300% ROI',
    company: 'BioPharma Solutions',
    industry: 'Pharmaceutical',
    logo: '💊',
    excerpt: 'How a Fortune 500 pharmaceutical company reduced patent prosecution costs by 60% while increasing filing velocity.',
    metrics: [
      { label: 'ROI', value: '300%', icon: TrendingUp },
      { label: 'Time Saved', value: '1,200 hrs/year', icon: Clock },
      { label: 'Cost Reduction', value: '60%', icon: TrendingUp },
    ],
    tags: ['Prior Art Search', 'Analytics', 'Enterprise'],
    featured: true,
    readTime: '8 min read',
    publishedDate: 'October 2024',
  },
  {
    id: 'law-firm-efficiency',
    title: 'Top IP Law Firm Cuts Prior Art Search Time by 75%',
    company: 'Sterling & Associates',
    industry: 'Legal',
    logo: '⚖️',
    excerpt: 'Leading intellectual property firm leverages AI-powered search to deliver faster, more comprehensive results to clients.',
    metrics: [
      { label: 'Search Time', value: '75% Faster', icon: Clock },
      { label: 'Client Satisfaction', value: '95%', icon: Award },
      { label: 'Projects Completed', value: '+150%', icon: TrendingUp },
    ],
    tags: ['Prior Art Search', 'AI', 'Legal'],
    featured: true,
    readTime: '6 min read',
    publishedDate: 'September 2024',
  },
  {
    id: 'tech-startup-speed',
    title: 'Tech Startup Accelerates Patent Drafting by 10x',
    company: 'NeuralTech AI',
    industry: 'Technology',
    logo: '🚀',
    excerpt: 'Emerging AI company uses PatPipes to file 50+ patent applications in record time, protecting their IP portfolio.',
    metrics: [
      { label: 'Drafting Speed', value: '10x Faster', icon: TrendingUp },
      { label: 'Patents Filed', value: '50+ in 6 months', icon: Award },
      { label: 'Quality Score', value: '92%', icon: Award },
    ],
    tags: ['Patent Drafting', 'Startups', 'AI'],
    featured: true,
    readTime: '7 min read',
    publishedDate: 'August 2024',
  },
  {
    id: 'manufacturing-analytics',
    title: 'Manufacturing Leader Identifies 23 White Space Opportunities',
    company: 'Precision Manufacturing Inc',
    industry: 'Manufacturing',
    logo: '🏭',
    excerpt: 'Industrial manufacturer uses landscape analytics to discover untapped patent opportunities and guide R&D strategy.',
    metrics: [
      { label: 'Opportunities', value: '23 Found', icon: TrendingUp },
      { label: 'New Filings', value: '15 Patents', icon: Award },
      { label: 'R&D ROI', value: '+85%', icon: TrendingUp },
    ],
    tags: ['Analytics', 'White Space', 'Manufacturing'],
    featured: false,
    readTime: '5 min read',
    publishedDate: 'July 2024',
  },
  {
    id: 'university-research',
    title: 'Research University Streamlines Technology Transfer',
    company: 'State University Tech Transfer Office',
    industry: 'Education',
    logo: '🎓',
    excerpt: 'University technology transfer office manages 200+ invention disclosures with improved efficiency and tracking.',
    metrics: [
      { label: 'Efficiency Gain', value: '65%', icon: TrendingUp },
      { label: 'Disclosures Managed', value: '200+', icon: Award },
      { label: 'Licensing Revenue', value: '+40%', icon: TrendingUp },
    ],
    tags: ['Collaboration', 'Education', 'Research'],
    featured: false,
    readTime: '6 min read',
    publishedDate: 'June 2024',
  },
  {
    id: 'automotive-infringement',
    title: 'Automotive Company Wins Major Infringement Case',
    company: 'AutoTech Innovations',
    industry: 'Automotive',
    logo: '🚗',
    excerpt: 'Leading automotive manufacturer successfully defends patent portfolio using comprehensive infringement analysis.',
    metrics: [
      { label: 'Case Outcome', value: 'Won', icon: Award },
      { label: 'Evidence Items', value: '500+ Collected', icon: TrendingUp },
      { label: 'Prep Time', value: '70% Faster', icon: Clock },
    ],
    tags: ['Infringement Analysis', 'Litigation', 'Automotive'],
    featured: false,
    readTime: '9 min read',
    publishedDate: 'May 2024',
  },
];

const industries = ['All', 'Pharmaceutical', 'Legal', 'Technology', 'Manufacturing', 'Education', 'Automotive'];
const solutions = ['All', 'Prior Art Search', 'Patent Drafting', 'Analytics', 'Infringement Analysis', 'Collaboration'];

export default function CaseStudiesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('All');
  const [selectedSolution, setSelectedSolution] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  const filteredCaseStudies = caseStudies.filter((study) => {
    const matchesSearch =
      study.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      study.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      study.excerpt.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesIndustry = selectedIndustry === 'All' || study.industry === selectedIndustry;

    const matchesSolution =
      selectedSolution === 'All' ||
      study.tags.some(tag => tag.toLowerCase().includes(selectedSolution.toLowerCase()));

    return matchesSearch && matchesIndustry && matchesSolution;
  });

  const featuredStudies = filteredCaseStudies.filter(s => s.featured);
  const regularStudies = filteredCaseStudies.filter(s => !s.featured);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-cyan-50 via-blue-50 to-white pt-16 pb-12">
        <div className="absolute inset-0 bg-grid-neutral-200/50 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto text-center"
          >
            {/* Sparkles Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-100 text-cyan-700 rounded-full text-sm font-semibold mb-6">
              <Award className="h-4 w-4" />
              Customer Success Stories
            </div>

            {/* Gradient Title */}
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
              See How Teams Are Transforming Patent Work with PatPipes
            </h1>

            <p className="text-xl text-neutral-600 mb-8 leading-relaxed">
              From Fortune 500 companies to innovative startups, discover how organizations are achieving breakthrough results with our platform.
            </p>

            {/* Search Bar */}
            <div className="max-w-3xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <Input
                  type="text"
                  placeholder="Search case studies..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 h-14 text-lg shadow-lg border-neutral-200"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-neutral-900">Filter Results</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="md:hidden"
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide' : 'Show'} Filters
            </Button>
          </div>

          <div className={`space-y-4 ${showFilters ? 'block' : 'hidden md:block'}`}>
            {/* Industry Filter */}
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-2 block">Industry</label>
              <div className="flex flex-wrap gap-2">
                {industries.map((industry) => (
                  <button
                    key={industry}
                    onClick={() => setSelectedIndustry(industry)}
                    className={`
                      px-4 py-2 rounded-lg text-sm font-medium transition-all
                      ${selectedIndustry === industry
                        ? 'bg-cyan-500 text-white'
                        : 'bg-white border border-neutral-300 text-neutral-700 hover:border-cyan-400'
                      }
                    `}
                  >
                    {industry}
                  </button>
                ))}
              </div>
            </div>

            {/* Solution Filter */}
            <div>
              <label className="text-sm font-medium text-neutral-700 mb-2 block">Solution</label>
              <div className="flex flex-wrap gap-2">
                {solutions.map((solution) => (
                  <button
                    key={solution}
                    onClick={() => setSelectedSolution(solution)}
                    className={`
                      px-4 py-2 rounded-lg text-sm font-medium transition-all
                      ${selectedSolution === solution
                        ? 'bg-blue-500 text-white'
                        : 'bg-white border border-neutral-300 text-neutral-700 hover:border-blue-400'
                      }
                    `}
                  >
                    {solution}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-neutral-600">
            Showing <span className="font-semibold text-neutral-900">{filteredCaseStudies.length}</span> case {filteredCaseStudies.length === 1 ? 'study' : 'studies'}
          </p>
        </div>

        {/* Featured Case Studies */}
        {featuredStudies.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-neutral-900 mb-6">Featured Success Stories</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredStudies.map((study, index) => (
                <motion.div
                  key={study.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Link href={`/case-studies/${study.id}`}>
                    <Card className="h-full hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-cyan-400 cursor-pointer group">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="text-5xl">{study.logo}</div>
                          <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-semibold">
                            ⭐ Featured
                          </div>
                        </div>

                        <h3 className="text-xl font-bold text-neutral-900 mb-2 group-hover:text-cyan-600 transition-colors">
                          {study.title}
                        </h3>

                        <div className="flex items-center gap-2 text-sm text-neutral-600 mb-4">
                          <Building2 className="h-4 w-4" />
                          <span>{study.company}</span>
                        </div>

                        <p className="text-neutral-600 mb-6 line-clamp-3">
                          {study.excerpt}
                        </p>

                        {/* Metrics */}
                        <div className="grid grid-cols-3 gap-3 mb-6">
                          {study.metrics.map((metric, idx) => {
                            const Icon = metric.icon;
                            return (
                              <div key={idx} className="text-center">
                                <div className="flex items-center justify-center mb-1">
                                  <Icon className="h-4 w-4 text-cyan-600" />
                                </div>
                                <div className="text-lg font-bold text-neutral-900">{metric.value}</div>
                                <div className="text-xs text-neutral-600">{metric.label}</div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {study.tags.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-neutral-100 text-neutral-700 rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between text-sm text-neutral-600 pt-4 border-t">
                          <span>{study.readTime}</span>
                          <span className="flex items-center gap-1 text-cyan-600 font-medium group-hover:gap-2 transition-all">
                            Read story
                            <ChevronRight className="h-4 w-4" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Regular Case Studies */}
        {regularStudies.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-6">More Success Stories</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularStudies.map((study, index) => (
                <motion.div
                  key={study.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: (featuredStudies.length + index) * 0.1 }}
                >
                  <Link href={`/case-studies/${study.id}`}>
                    <Card className="h-full hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-blue-400 cursor-pointer group">
                      <CardContent className="p-6">
                        <div className="text-5xl mb-4">{study.logo}</div>

                        <h3 className="text-xl font-bold text-neutral-900 mb-2 group-hover:text-blue-600 transition-colors">
                          {study.title}
                        </h3>

                        <div className="flex items-center gap-2 text-sm text-neutral-600 mb-4">
                          <Building2 className="h-4 w-4" />
                          <span>{study.company}</span>
                        </div>

                        <p className="text-neutral-600 mb-6 line-clamp-3">
                          {study.excerpt}
                        </p>

                        {/* Metrics */}
                        <div className="grid grid-cols-3 gap-3 mb-6">
                          {study.metrics.map((metric, idx) => {
                            const Icon = metric.icon;
                            return (
                              <div key={idx} className="text-center">
                                <div className="flex items-center justify-center mb-1">
                                  <Icon className="h-4 w-4 text-blue-600" />
                                </div>
                                <div className="text-lg font-bold text-neutral-900">{metric.value}</div>
                                <div className="text-xs text-neutral-600">{metric.label}</div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {study.tags.slice(0, 3).map((tag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-neutral-100 text-neutral-700 rounded text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-between text-sm text-neutral-600 pt-4 border-t">
                          <span>{study.readTime}</span>
                          <span className="flex items-center gap-1 text-blue-600 font-medium group-hover:gap-2 transition-all">
                            Read story
                            <ChevronRight className="h-4 w-4" />
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* No Results */}
        {filteredCaseStudies.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold text-neutral-900 mb-2">No case studies found</h3>
            <p className="text-neutral-600 mb-6">
              Try adjusting your filters or search query
            </p>
            <Button
              onClick={() => {
                setSearchQuery('');
                setSelectedIndustry('All');
                setSelectedSolution('All');
              }}
              variant="outline"
            >
              Clear Filters
            </Button>
          </motion.div>
        )}
      </div>

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
                <li><Link href="#" className="hover:text-cyan-400 transition-colors">Prior Art Search</Link></li>
                <li><Link href="#" className="hover:text-cyan-400 transition-colors">Drafting Studio</Link></li>
                <li><Link href="#" className="hover:text-cyan-400 transition-colors">Analytics Platform</Link></li>
                <li><Link href="#" className="hover:text-cyan-400 transition-colors">Infringement Analyzer</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4 text-cyan-400 text-sm">Solutions</h4>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li><Link href="#" className="hover:text-cyan-400 transition-colors">Law Firms</Link></li>
                <li><Link href="#" className="hover:text-cyan-400 transition-colors">Enterprises</Link></li>
                <li><Link href="#" className="hover:text-cyan-400 transition-colors">Startups</Link></li>
                <li><Link href="#" className="hover:text-cyan-400 transition-colors">Universities</Link></li>
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
