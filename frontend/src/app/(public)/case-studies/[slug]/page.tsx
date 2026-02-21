'use client';

import { use } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Building2,
  Users,
  TrendingUp,
  Clock,
  Award,
  Target,
  CheckCircle2,
  Quote,
  ArrowRight,
  Calendar,
  MapPin,
  Briefcase,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

// Case study data (in production, this would come from a CMS or API)
const caseStudiesData: Record<string, any> = {
  'pharma-giant-roi': {
    id: 'pharma-giant-roi',
    title: 'Global Pharma Giant Achieves 300% ROI with PatPipes',
    company: 'BioPharma Solutions',
    industry: 'Pharmaceutical',
    logo: '💊',
    location: 'Basel, Switzerland',
    companySize: '10,000+ employees',
    publishedDate: 'October 15, 2024',
    readTime: '8 min read',
    heroImage: '/case-studies/pharma-hero.jpg',

    overview: {
      challenge:
        'BioPharma Solutions, a Fortune 500 pharmaceutical company, was struggling with escalating patent prosecution costs and slow filing velocity. Their traditional workflow involved manual prior art searches taking weeks, resulting in delayed patent filings and missed opportunities in fast-moving therapeutic areas.',
      solution:
        'The company implemented PatPipes\' AI-powered prior art search and analytics platform across their global IP team of 45 patent professionals. They integrated the platform with their existing patent management system and trained teams across three continents.',
      results:
        'Within six months, BioPharma Solutions reduced patent prosecution costs by 60%, accelerated prior art searches by 75%, and increased their patent filing velocity by 85%. The platform\'s landscape analytics also identified 12 white space opportunities, leading to strategic R&D investments.',
    },

    metrics: [
      { label: 'ROI', value: '300%', change: '+300%', icon: TrendingUp, color: 'green' },
      { label: 'Cost Reduction', value: '60%', change: '-$2.4M annually', icon: TrendingUp, color: 'green' },
      { label: 'Time Saved', value: '1,200 hrs', change: 'per year', icon: Clock, color: 'blue' },
      { label: 'Filing Velocity', value: '+85%', change: '120 patents/year', icon: Award, color: 'purple' },
      { label: 'Search Speed', value: '75% faster', change: 'from 2 weeks to 3 days', icon: Clock, color: 'cyan' },
      { label: 'White Space Found', value: '12', change: 'new opportunities', icon: Target, color: 'yellow' },
    ],

    testimonial: {
      quote:
        'PatPipes transformed our patent workflow from a bottleneck into a competitive advantage. The AI-powered search capabilities are lightyears ahead of traditional methods, and the analytics have guided our R&D strategy in ways we never thought possible.',
      author: 'Dr. Elena Martinez',
      role: 'VP of Intellectual Property',
      company: 'BioPharma Solutions',
      image: '👩‍⚕️',
    },

    challenge: {
      title: 'The Challenge: Escalating Costs and Slow Processes',
      description:
        'BioPharma Solutions faced mounting pressure to protect their pipeline of innovative therapeutics while controlling costs. Their existing patent workflow had several critical pain points:',
      points: [
        {
          title: 'Manual Prior Art Searches',
          desc: 'Patent attorneys spent 2-3 weeks conducting manual searches across multiple databases, delaying filing decisions.',
        },
        {
          title: 'High External Counsel Costs',
          desc: 'Heavy reliance on external law firms resulted in annual IP spend exceeding $4M.',
        },
        {
          title: 'Limited Strategic Insights',
          desc: 'Lack of landscape analytics made it difficult to identify white space opportunities or assess competitive threats.',
        },
        {
          title: 'Siloed Teams',
          desc: 'Global IP teams across Basel, Boston, and Beijing worked in isolation, leading to duplicated efforts.',
        },
      ],
      impact:
        'These challenges resulted in a backlog of 60+ invention disclosures awaiting freedom-to-operate analysis, putting critical product launches at risk.',
    },

    solution: {
      title: 'The Solution: AI-Powered Patent Intelligence',
      description:
        'BioPharma Solutions partnered with PatPipes to implement a comprehensive platform transformation:',
      phases: [
        {
          phase: 'Phase 1: Platform Integration',
          duration: '2 weeks',
          activities: [
            'Integrated PatPipes with existing IP management system',
            'Migrated 10,000+ historical patents to the platform',
            'Set up SSO and role-based access controls for 45 users',
          ],
        },
        {
          phase: 'Phase 2: Team Training',
          duration: '3 weeks',
          activities: [
            'Conducted virtual training sessions for teams in Basel, Boston, and Beijing',
            'Created custom workflow templates for different therapeutic areas',
            'Established best practices and quality benchmarks',
          ],
        },
        {
          phase: 'Phase 3: Pilot Program',
          duration: '8 weeks',
          activities: [
            'Ran parallel workflows comparing PatPipes vs. traditional methods',
            'Processed 25 invention disclosures through the new system',
            'Gathered feedback and optimized workflows',
          ],
        },
        {
          phase: 'Phase 4: Full Rollout',
          duration: 'Ongoing',
          activities: [
            'Transitioned all prior art searches to PatPipes',
            'Implemented monthly landscape analytics reviews',
            'Established KPIs and success metrics',
          ],
        },
      ],
    },

    results: {
      title: 'The Results: Measurable Impact Across the Board',
      description:
        'Six months post-implementation, BioPharma Solutions achieved remarkable results:',
      categories: [
        {
          category: 'Cost Savings',
          achievements: [
            'Reduced external counsel spend by $2.4M annually',
            'Decreased average cost per patent search from $8,000 to $3,200',
            'Eliminated duplicate search efforts across global teams',
          ],
        },
        {
          category: 'Efficiency Gains',
          achievements: [
            'Accelerated prior art searches from 2-3 weeks to 3-5 days',
            'Increased patent filing velocity by 85% (65 to 120 patents/year)',
            'Cleared invention disclosure backlog within 4 months',
          ],
        },
        {
          category: 'Strategic Insights',
          achievements: [
            'Identified 12 white space opportunities in oncology and immunotherapy',
            'Mapped competitive landscape across 8 therapeutic areas',
            'Guided R&D investment decisions with data-driven analytics',
          ],
        },
        {
          category: 'Quality Improvements',
          achievements: [
            'Improved patent quality score from 78% to 92%',
            'Reduced office action rates by 35%',
            'Enhanced claim breadth through comprehensive prior art analysis',
          ],
        },
      ],
    },

    timeline: [
      { month: 'Month 1', milestone: 'Platform implementation & training', status: 'completed' },
      { month: 'Month 2', milestone: 'Pilot program launch with 5 users', status: 'completed' },
      { month: 'Month 3', milestone: 'First measurable cost savings observed', status: 'completed' },
      { month: 'Month 4', milestone: 'Full team rollout (45 users)', status: 'completed' },
      { month: 'Month 5', milestone: 'Invention disclosure backlog cleared', status: 'completed' },
      { month: 'Month 6', milestone: '300% ROI achieved', status: 'completed' },
    ],

    technology: {
      title: 'Technology Stack',
      tools: [
        { name: 'Prior Art Search', usage: '45 users, 250+ searches/month' },
        { name: 'Landscape Analytics', usage: '12 therapeutic areas monitored' },
        { name: 'Patent Drafting Assistant', usage: '30 drafts/month' },
        { name: 'API Integration', usage: 'Connected to internal IP management system' },
      ],
    },

    keyLearnings: [
      {
        title: 'Change Management is Critical',
        description:
          'Success required buy-in from senior leadership and hands-on training for all users. The pilot program helped identify workflow adjustments before full rollout.',
      },
      {
        title: 'Integration Matters',
        description:
          'Integrating PatPipes with existing systems ensured seamless adoption and prevented workflow disruption.',
      },
      {
        title: 'Data Quality Drives Results',
        description:
          'Investing time upfront to clean and migrate historical patent data paid dividends in search accuracy and analytics quality.',
      },
    ],

    nextSteps: {
      title: 'Looking Ahead: Expanding the Platform',
      description:
        'Building on their success, BioPharma Solutions plans to expand their use of PatPipes:',
      plans: [
        'Implement automated infringement monitoring across competitor portfolios',
        'Deploy landscape analytics to guide M&A due diligence',
        'Extend platform access to 100+ R&D scientists for early-stage ideation',
        'Leverage patent drafting AI to further accelerate prosecution',
      ],
    },

    relatedCaseStudies: [
      { id: 'law-firm-efficiency', title: 'IP Law Firm Cuts Search Time by 75%', industry: 'Legal' },
      { id: 'tech-startup-speed', title: 'Tech Startup Accelerates Drafting by 10x', industry: 'Technology' },
    ],
  },
  // Add other case studies here...
};

export default function CaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const study = caseStudiesData[slug];

  if (!study) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-neutral-900 mb-4">Case Study Not Found</h1>
          <Link href="/case-studies">
            <Button>Back to Case Studies</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent cursor-pointer hover:scale-105 transition-transform">
              PatPipes
            </h1>
          </Link>
          <Link href="/case-studies">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              All Case Studies
            </Button>
          </Link>
        </div>
      </header>

      <article className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-neutral-600 mb-8">
          <Link href="/" className="hover:text-cyan-600">
            Home
          </Link>
          <span>/</span>
          <Link href="/case-studies" className="hover:text-cyan-600">
            Case Studies
          </Link>
          <span>/</span>
          <span className="text-neutral-900">{study.company}</span>
        </nav>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="text-6xl">{study.logo}</div>
            <div>
              <div className="flex items-center gap-2 text-sm text-neutral-600 mb-2">
                <Building2 className="h-4 w-4" />
                <span>{study.company}</span>
                <span>•</span>
                <span>{study.industry}</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-neutral-900">{study.title}</h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-600 mb-8">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{study.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>{study.companySize}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{study.publishedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{study.readTime}</span>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {study.metrics.map((metric: any, index: number) => {
              const Icon = metric.icon;
              return (
                <Card key={index}>
                  <CardContent className="p-4 text-center">
                    <Icon className={`h-6 w-6 mx-auto mb-2 text-${metric.color}-600`} />
                    <div className="text-2xl font-bold text-neutral-900">{metric.value}</div>
                    <div className="text-xs text-neutral-600 mt-1">{metric.label}</div>
                    <div className="text-xs text-neutral-500 mt-1">{metric.change}</div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </motion.div>

        {/* Overview */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold text-neutral-900 mb-6">Overview</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-neutral-900 mb-3">Challenge</h3>
                <p className="text-neutral-700 text-sm leading-relaxed">{study.overview.challenge}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-neutral-900 mb-3">Solution</h3>
                <p className="text-neutral-700 text-sm leading-relaxed">{study.overview.solution}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-neutral-900 mb-3">Results</h3>
                <p className="text-neutral-700 text-sm leading-relaxed">{study.overview.results}</p>
              </CardContent>
            </Card>
          </div>
        </motion.section>

        {/* Testimonial */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-12"
        >
          <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200">
            <CardContent className="p-8">
              <Quote className="h-12 w-12 text-cyan-600 mb-4" />
              <blockquote className="text-xl text-neutral-900 mb-6 leading-relaxed italic">
                "{study.testimonial.quote}"
              </blockquote>
              <div className="flex items-center gap-4">
                <div className="text-4xl">{study.testimonial.image}</div>
                <div>
                  <div className="font-semibold text-neutral-900">{study.testimonial.author}</div>
                  <div className="text-sm text-neutral-600">{study.testimonial.role}</div>
                  <div className="text-sm text-neutral-600">{study.testimonial.company}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* The Challenge */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold text-neutral-900 mb-4">{study.challenge.title}</h2>
          <p className="text-neutral-700 leading-relaxed mb-6">{study.challenge.description}</p>

          <div className="space-y-4 mb-6">
            {study.challenge.points.map((point: any, index: number) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-neutral-900 mb-2">{point.title}</h3>
                  <p className="text-neutral-700 text-sm">{point.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-neutral-700 text-sm">
              <strong className="text-yellow-800">Impact:</strong> {study.challenge.impact}
            </p>
          </div>
        </motion.section>

        {/* The Solution */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold text-neutral-900 mb-4">{study.solution.title}</h2>
          <p className="text-neutral-700 leading-relaxed mb-6">{study.solution.description}</p>

          <div className="space-y-6">
            {study.solution.phases.map((phase: any, index: number) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-cyan-100 text-cyan-600 rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-neutral-900">{phase.phase}</h3>
                        <span className="text-sm text-neutral-600">{phase.duration}</span>
                      </div>
                      <ul className="space-y-2">
                        {phase.activities.map((activity: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-sm text-neutral-700">
                            <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                            <span>{activity}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.section>

        {/* The Results */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold text-neutral-900 mb-4">{study.results.title}</h2>
          <p className="text-neutral-700 leading-relaxed mb-6">{study.results.description}</p>

          <div className="grid md:grid-cols-2 gap-6">
            {study.results.categories.map((category: any, index: number) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-neutral-900 mb-4">{category.category}</h3>
                  <ul className="space-y-3">
                    {category.achievements.map((achievement: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-neutral-700">
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                        <span>{achievement}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.section>

        {/* Timeline */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold text-neutral-900 mb-6">Implementation Timeline</h2>
          <div className="space-y-4">
            {study.timeline.map((item: any, index: number) => (
              <div key={index} className="flex items-start gap-4">
                <div className="flex-shrink-0 w-24 font-semibold text-neutral-900">{item.month}</div>
                <div className="flex-1 flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                  <span className="text-neutral-700">{item.milestone}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* Key Learnings */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold text-neutral-900 mb-6">Key Learnings</h2>
          <div className="space-y-4">
            {study.keyLearnings.map((learning: any, index: number) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-neutral-900 mb-2">{learning.title}</h3>
                  <p className="text-neutral-700 text-sm">{learning.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.section>

        {/* Next Steps */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.9 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold text-neutral-900 mb-4">{study.nextSteps.title}</h2>
          <p className="text-neutral-700 leading-relaxed mb-6">{study.nextSteps.description}</p>
          <ul className="space-y-3">
            {study.nextSteps.plans.map((plan: string, index: number) => (
              <li key={index} className="flex items-start gap-3">
                <Target className="h-5 w-5 text-cyan-600 shrink-0 mt-0.5" />
                <span className="text-neutral-700">{plan}</span>
              </li>
            ))}
          </ul>
        </motion.section>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 1.0 }}
          className="bg-gradient-to-r from-cyan-50 to-blue-50 border-2 border-cyan-200 rounded-2xl p-8 text-center mb-12"
        >
          <h2 className="text-3xl font-bold text-neutral-900 mb-4">Ready to Transform Your Patent Workflow?</h2>
          <p className="text-lg text-neutral-600 mb-6 max-w-2xl mx-auto">
            See how PatPipes can help your organization achieve similar results. Start your free trial or schedule a demo today.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline">
                Schedule Demo
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Related Case Studies */}
        {study.relatedCaseStudies && study.relatedCaseStudies.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.1 }}
          >
            <h2 className="text-2xl font-bold text-neutral-900 mb-6">Related Success Stories</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {study.relatedCaseStudies.map((related: any) => (
                <Link key={related.id} href={`/case-studies/${related.id}`}>
                  <Card className="hover:shadow-lg transition-all cursor-pointer">
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-neutral-900 mb-2 hover:text-cyan-600 transition-colors">
                        {related.title}
                      </h3>
                      <p className="text-sm text-neutral-600">{related.industry}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </motion.section>
        )}
      </article>

      {/* Footer */}
      <footer className="border-t bg-white mt-24">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-neutral-600">
          <p>© 2024 PatPipes. All rights reserved.</p>
          <div className="mt-2 space-x-4">
            <Link href="/privacy" className="hover:text-cyan-600 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-cyan-600 transition-colors">
              Terms of Service
            </Link>
            <Link href="/contact" className="hover:text-cyan-600 transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
