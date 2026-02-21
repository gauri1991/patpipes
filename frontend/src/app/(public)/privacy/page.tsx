'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Download, Search, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const sections = [
  { id: 'overview', title: 'Overview', icon: '📋' },
  { id: 'information-collection', title: 'Information We Collect', icon: '📊' },
  { id: 'usage', title: 'How We Use Your Information', icon: '🔧' },
  { id: 'sharing', title: 'Information Sharing', icon: '🤝' },
  { id: 'security', title: 'Data Security', icon: '🔒' },
  { id: 'retention', title: 'Data Retention', icon: '📦' },
  { id: 'rights', title: 'Your Privacy Rights', icon: '⚖️' },
  { id: 'cookies', title: 'Cookies & Tracking', icon: '🍪' },
  { id: 'international', title: 'International Transfers', icon: '🌍' },
  { id: 'children', title: "Children's Privacy", icon: '👶' },
  { id: 'changes', title: 'Policy Changes', icon: '🔄' },
  { id: 'contact', title: 'Contact Us', icon: '📧' },
];

export default function PrivacyPage() {
  const [activeSection, setActiveSection] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('[data-section]');
      let current = 'overview';

      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 150 && rect.bottom >= 150) {
          current = section.getAttribute('data-section') || 'overview';
        }
      });

      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: elementPosition - offset,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <section className="container mx-auto px-4 py-12">
        <div className="flex gap-12">
          {/* Sticky Sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24 space-y-6">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  type="text"
                  placeholder="Search policy..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-sm"
                />
              </div>

              {/* Navigation */}
              <nav className="space-y-1">
                <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                  Table of Contents
                </div>
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`
                      w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2
                      ${activeSection === section.id
                        ? 'bg-cyan-50 text-cyan-700 font-medium'
                        : 'text-neutral-600 hover:bg-cyan-50 hover:shadow-2xl'
                      }
                    `}
                  >
                    <span>{section.icon}</span>
                    <span>{section.title}</span>
                  </button>
                ))}
              </nav>

              {/* Last Updated */}
              <div className="pt-6 border-t text-xs text-neutral-500">
                <div className="font-medium text-neutral-700 mb-1">Last Updated</div>
                October 17, 2024
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-12"
            >
              {/* Hero */}
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold text-neutral-900">Privacy Policy</h1>
                <p className="text-xl text-neutral-600">
                  Your privacy is important to us. This policy explains how PatPipes collects, uses, and protects your personal information.
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                    <Shield className="h-4 w-4" />
                    SOC 2 Compliant
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                    <Shield className="h-4 w-4" />
                    GDPR Compliant
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-sm font-medium">
                    <Shield className="h-4 w-4" />
                    CCPA Compliant
                  </div>
                </div>
              </div>

              {/* Overview */}
              <section id="overview" data-section="overview" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-neutral-900 mb-4">📋 Overview</h2>
                <div className="prose prose-neutral max-w-none">
                  <p className="text-neutral-700 leading-relaxed">
                    PatPipes ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our patent analytics platform and related services.
                  </p>
                  <p className="text-neutral-700 leading-relaxed mt-4">
                    By accessing or using PatPipes, you agree to this Privacy Policy. If you do not agree with the terms of this policy, please do not access our platform.
                  </p>
                </div>
              </section>

              {/* Information We Collect */}
              <section id="information-collection" data-section="information-collection" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-neutral-900 mb-4">📊 Information We Collect</h2>
                <div className="space-y-6">
                  <div className="bg-white border border-neutral-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-3">Personal Information</h3>
                    <ul className="space-y-2 text-neutral-700">
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-600 mt-1">•</span>
                        <span>Name, email address, and contact details</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-600 mt-1">•</span>
                        <span>Company name, job title, and professional information</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-600 mt-1">•</span>
                        <span>Account credentials and authentication data</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-600 mt-1">•</span>
                        <span>Payment and billing information</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-white border border-neutral-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-3">Usage Data</h3>
                    <ul className="space-y-2 text-neutral-700">
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-600 mt-1">•</span>
                        <span>Search queries and patent analysis results</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-600 mt-1">•</span>
                        <span>Draft documents and patent applications</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-600 mt-1">•</span>
                        <span>Platform usage patterns and feature interactions</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-600 mt-1">•</span>
                        <span>IP address, browser type, and device information</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* How We Use Your Information */}
              <section id="usage" data-section="usage" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-neutral-900 mb-4">🔧 How We Use Your Information</h2>
                <div className="prose prose-neutral max-w-none">
                  <p className="text-neutral-700 leading-relaxed mb-4">
                    We use the information we collect to:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      'Provide and maintain our services',
                      'Process your transactions',
                      'Send administrative information',
                      'Respond to your requests and support needs',
                      'Improve and optimize our platform',
                      'Conduct analytics and research',
                      'Detect and prevent fraud or abuse',
                      'Comply with legal obligations',
                    ].map((item, index) => (
                      <div key={index} className="flex items-start gap-3 bg-cyan-50 p-4 rounded-lg">
                        <div className="h-6 w-6 rounded-full bg-cyan-500 text-white flex items-center justify-center text-sm font-semibold shrink-0">
                          {index + 1}
                        </div>
                        <span className="text-neutral-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Information Sharing */}
              <section id="sharing" data-section="sharing" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-neutral-900 mb-4">🤝 Information Sharing</h2>
                <div className="prose prose-neutral max-w-none">
                  <p className="text-neutral-700 leading-relaxed mb-4">
                    We do not sell your personal information. We may share your information only in the following circumstances:
                  </p>
                  <div className="space-y-4">
                    <div className="border-l-4 border-cyan-500 pl-4 py-2">
                      <h4 className="font-semibold text-neutral-900">Service Providers</h4>
                      <p className="text-neutral-700 text-sm mt-1">
                        Third-party vendors who perform services on our behalf (e.g., hosting, analytics, payment processing)
                      </p>
                    </div>
                    <div className="border-l-4 border-blue-500 pl-4 py-2">
                      <h4 className="font-semibold text-neutral-900">Legal Requirements</h4>
                      <p className="text-neutral-700 text-sm mt-1">
                        When required by law or to protect our rights and safety
                      </p>
                    </div>
                    <div className="border-l-4 border-purple-500 pl-4 py-2">
                      <h4 className="font-semibold text-neutral-900">Business Transfers</h4>
                      <p className="text-neutral-700 text-sm mt-1">
                        In connection with a merger, acquisition, or sale of assets
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Data Security */}
              <section id="security" data-section="security" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-neutral-900 mb-4">🔒 Data Security</h2>
                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 rounded-lg p-6">
                  <p className="text-neutral-700 leading-relaxed mb-4">
                    We implement industry-standard security measures to protect your information:
                  </p>
                  <ul className="space-y-3">
                    {[
                      'End-to-end encryption for data in transit and at rest',
                      'Regular security audits and penetration testing',
                      'Multi-factor authentication (MFA) support',
                      'Role-based access controls',
                      'Automated backup and disaster recovery',
                      '24/7 security monitoring and incident response',
                    ].map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Shield className="h-5 w-5 text-cyan-600 shrink-0 mt-0.5" />
                        <span className="text-neutral-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              {/* Data Retention */}
              <section id="retention" data-section="retention" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-neutral-900 mb-4">📦 Data Retention</h2>
                <div className="prose prose-neutral max-w-none">
                  <p className="text-neutral-700 leading-relaxed">
                    We retain your personal information for as long as necessary to provide our services and comply with legal obligations. When you delete your account, we will delete or anonymize your personal information within 90 days, except where we are required by law to retain certain data.
                  </p>
                </div>
              </section>

              {/* Your Privacy Rights */}
              <section id="rights" data-section="rights" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-neutral-900 mb-4">⚖️ Your Privacy Rights</h2>
                <div className="prose prose-neutral max-w-none">
                  <p className="text-neutral-700 leading-relaxed mb-4">
                    Depending on your location, you may have the following rights:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { title: 'Access', desc: 'Request a copy of your personal data' },
                      { title: 'Rectification', desc: 'Correct inaccurate information' },
                      { title: 'Erasure', desc: 'Request deletion of your data' },
                      { title: 'Portability', desc: 'Receive your data in a portable format' },
                      { title: 'Restriction', desc: 'Limit how we process your data' },
                      { title: 'Objection', desc: 'Object to certain processing activities' },
                    ].map((right, index) => (
                      <div key={index} className="bg-white border border-neutral-200 rounded-lg p-4">
                        <h4 className="font-semibold text-neutral-900 mb-1">{right.title}</h4>
                        <p className="text-sm text-neutral-600">{right.desc}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 bg-cyan-50 border border-cyan-200 rounded-lg p-4">
                    <p className="text-neutral-700">
                      To exercise your privacy rights, please contact us at{' '}
                      <a href="mailto:privacy@patpipes.com" className="text-cyan-600 font-medium hover:underline">
                        privacy@patpipes.com
                      </a>
                    </p>
                  </div>
                </div>
              </section>

              {/* Cookies */}
              <section id="cookies" data-section="cookies" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-neutral-900 mb-4">🍪 Cookies & Tracking</h2>
                <div className="prose prose-neutral max-w-none">
                  <p className="text-neutral-700 leading-relaxed mb-4">
                    We use cookies and similar tracking technologies to enhance your experience. You can control cookies through your browser settings.
                  </p>
                  <div className="space-y-3">
                    {[
                      { type: 'Essential', desc: 'Required for the platform to function', color: 'red' },
                      { type: 'Functional', desc: 'Remember your preferences and settings', color: 'blue' },
                      { type: 'Analytics', desc: 'Help us understand how you use our platform', color: 'green' },
                      { type: 'Marketing', desc: 'Used to deliver relevant advertisements', color: 'purple' },
                    ].map((cookie, index) => (
                      <div key={index} className={`flex items-center gap-3 p-3 bg-${cookie.color}-50 rounded-lg`}>
                        <div className={`h-3 w-3 rounded-full bg-${cookie.color}-500`} />
                        <div className="flex-1">
                          <span className="font-medium text-neutral-900">{cookie.type}</span>
                          <span className="text-neutral-600 text-sm ml-2">— {cookie.desc}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* International Transfers */}
              <section id="international" data-section="international" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-neutral-900 mb-4">🌍 International Transfers</h2>
                <div className="prose prose-neutral max-w-none">
                  <p className="text-neutral-700 leading-relaxed">
                    Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place, including Standard Contractual Clauses approved by the European Commission.
                  </p>
                </div>
              </section>

              {/* Children's Privacy */}
              <section id="children" data-section="children" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-neutral-900 mb-4">👶 Children's Privacy</h2>
                <div className="prose prose-neutral max-w-none">
                  <p className="text-neutral-700 leading-relaxed">
                    Our platform is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
                  </p>
                </div>
              </section>

              {/* Policy Changes */}
              <section id="changes" data-section="changes" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-neutral-900 mb-4">🔄 Policy Changes</h2>
                <div className="prose prose-neutral max-w-none">
                  <p className="text-neutral-700 leading-relaxed">
                    We may update this Privacy Policy from time to time. We will notify you of any material changes by email or through a notice on our platform. Your continued use of PatPipes after such changes constitutes acceptance of the updated policy.
                  </p>
                </div>
              </section>

              {/* Contact */}
              <section id="contact" data-section="contact" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-neutral-900 mb-4">📧 Contact Us</h2>
                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 rounded-lg p-6">
                  <p className="text-neutral-700 leading-relaxed mb-4">
                    If you have questions about this Privacy Policy or our data practices, please contact us:
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="font-medium text-neutral-900 w-24">Email:</span>
                      <a href="mailto:privacy@patpipes.com" className="text-cyan-600 hover:underline">
                        privacy@patpipes.com
                      </a>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="font-medium text-neutral-900 w-24">Address:</span>
                      <span className="text-neutral-700">
                        PatPipes Inc.<br />
                        123 Innovation Drive<br />
                        San Francisco, CA 94105
                      </span>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="font-medium text-neutral-900 w-24">Phone:</span>
                      <span className="text-neutral-700">+1 (555) 123-4567</span>
                    </div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-cyan-200">
                    <Link href="/contact">
                      <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white">
                        Contact Privacy Team
                      </Button>
                    </Link>
                  </div>
                </div>
              </section>
            </motion.div>
          </main>
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
