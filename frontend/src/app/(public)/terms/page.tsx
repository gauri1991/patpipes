'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Download, Search, FileText, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const sections = [
  { id: 'acceptance', title: 'Acceptance of Terms', icon: '✅' },
  { id: 'services', title: 'Description of Services', icon: '🔧' },
  { id: 'account', title: 'User Accounts', icon: '👤' },
  { id: 'acceptable-use', title: 'Acceptable Use Policy', icon: '📜' },
  { id: 'intellectual-property', title: 'Intellectual Property', icon: '©️' },
  { id: 'payment', title: 'Payment Terms', icon: '💳' },
  { id: 'termination', title: 'Termination', icon: '🚫' },
  { id: 'warranties', title: 'Warranties & Disclaimers', icon: '⚠️' },
  { id: 'liability', title: 'Limitation of Liability', icon: '🛡️' },
  { id: 'indemnification', title: 'Indemnification', icon: '⚖️' },
  { id: 'disputes', title: 'Dispute Resolution', icon: '🤝' },
  { id: 'miscellaneous', title: 'Miscellaneous', icon: '📋' },
];

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState('acceptance');
  const [searchQuery, setSearchQuery] = useState('');
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('[data-section]');
      let current = 'acceptance';

      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 150 && rect.bottom >= 150) {
          current = section.getAttribute('data-section') || 'acceptance';
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
                  placeholder="Search terms..."
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

              {/* Version Info */}
              <div className="pt-6 border-t space-y-2 text-xs">
                <div>
                  <div className="font-medium text-neutral-700 mb-1">Version</div>
                  <div className="text-neutral-500">2.1 (October 2024)</div>
                </div>
                <div>
                  <div className="font-medium text-neutral-700 mb-1">Effective Date</div>
                  <div className="text-neutral-500">October 17, 2024</div>
                </div>
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
                <h1 className="text-4xl md:text-5xl font-bold text-neutral-900">Terms of Service</h1>
                <p className="text-xl text-neutral-600">
                  Please read these terms carefully before using PatPipes. By accessing our platform, you agree to be bound by these terms.
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <div className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                    Version 2.1
                  </div>
                  <div className="px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                    Effective: Oct 17, 2024
                  </div>
                </div>
              </div>

              {/* Acceptance of Terms */}
              <section id="acceptance" data-section="acceptance" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-neutral-900 mb-4">✅ Acceptance of Terms</h2>
                <div className="prose prose-neutral max-w-none">
                  <p className="text-neutral-700 leading-relaxed mb-4">
                    By accessing or using PatPipes, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service ("Terms") and our Privacy Policy. If you do not agree to these Terms, you may not access or use our services.
                  </p>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-neutral-700">
                      <strong className="text-yellow-800">Important:</strong> These Terms constitute a legally binding agreement between you and PatPipes Inc. By clicking "I Accept" or using our services, you are entering into this agreement.
                    </p>
                  </div>
                </div>
              </section>

              {/* Description of Services */}
              <section id="services" data-section="services" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-neutral-900 mb-4">🔧 Description of Services</h2>
                <div className="prose prose-neutral max-w-none">
                  <p className="text-neutral-700 leading-relaxed mb-4">
                    PatPipes provides a comprehensive patent analytics platform including:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { title: 'Prior Art Search', desc: 'AI-powered patent and publication search' },
                      { title: 'Patent Drafting', desc: 'Automated patent application drafting tools' },
                      { title: 'Infringement Analysis', desc: '10-phase infringement workflow' },
                      { title: 'Landscape Analytics', desc: 'Technology trends and competitive intelligence' },
                      { title: 'Collaboration Tools', desc: 'Team collaboration and workflow management' },
                      { title: 'API Access', desc: 'Programmatic access to platform features' },
                    ].map((service, index) => (
                      <div key={index} className="bg-white border border-neutral-200 rounded-lg p-4">
                        <h4 className="font-semibold text-neutral-900 mb-1">{service.title}</h4>
                        <p className="text-sm text-neutral-600">{service.desc}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-neutral-700 leading-relaxed mt-4">
                    We reserve the right to modify, suspend, or discontinue any aspect of our services at any time.
                  </p>
                </div>
              </section>

              {/* User Accounts */}
              <section id="account" data-section="account" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-neutral-900 mb-4">👤 User Accounts</h2>
                <div className="space-y-4">
                  <div className="bg-white border border-neutral-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-3">Account Registration</h3>
                    <ul className="space-y-2 text-neutral-700">
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-600 mt-1">•</span>
                        <span>You must provide accurate and complete information</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-600 mt-1">•</span>
                        <span>You must be at least 18 years old to use our services</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-600 mt-1">•</span>
                        <span>You are responsible for maintaining the security of your account</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-600 mt-1">•</span>
                        <span>You must not share your account credentials with others</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="text-cyan-600 mt-1">•</span>
                        <span>You must notify us immediately of any unauthorized access</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-800">
                      <strong>Warning:</strong> You are responsible for all activities that occur under your account. Keep your password secure and do not share it with anyone.
                    </p>
                  </div>
                </div>
              </section>

              {/* Acceptable Use Policy */}
              <section id="acceptable-use" data-section="acceptable-use" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-neutral-900 mb-4">📜 Acceptable Use Policy</h2>
                <div className="prose prose-neutral max-w-none">
                  <p className="text-neutral-700 leading-relaxed mb-4">
                    You agree not to use PatPipes to:
                  </p>
                  <div className="space-y-3">
                    {[
                      'Violate any applicable laws or regulations',
                      'Infringe on intellectual property rights of others',
                      'Upload malicious code, viruses, or harmful content',
                      'Attempt to gain unauthorized access to our systems',
                      'Interfere with or disrupt our services',
                      'Engage in any automated data collection (scraping, crawling)',
                      'Resell or redistribute our services without authorization',
                      'Use our services for any fraudulent or illegal activities',
                    ].map((item, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs shrink-0 mt-0.5">
                          ✕
                        </div>
                        <span className="text-neutral-700">{item}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-neutral-700">
                      Violation of this Acceptable Use Policy may result in immediate termination of your account without refund.
                    </p>
                  </div>
                </div>
              </section>

              {/* Intellectual Property */}
              <section id="intellectual-property" data-section="intellectual-property" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-neutral-900 mb-4">©️ Intellectual Property</h2>
                <div className="space-y-4">
                  <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-3">Our Intellectual Property</h3>
                    <p className="text-neutral-700 leading-relaxed">
                      All content, features, and functionality of PatPipes, including but not limited to text, graphics, logos, software, and AI models, are owned by PatPipes Inc. and protected by copyright, trademark, and other intellectual property laws.
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-3">Your Content</h3>
                    <p className="text-neutral-700 leading-relaxed mb-3">
                      You retain all rights to the content you upload or create using PatPipes. By using our services, you grant us a limited license to:
                    </p>
                    <ul className="space-y-2 text-neutral-700">
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                        <span>Store and process your content to provide our services</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                        <span>Use anonymized data to improve our AI models</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                        <span>Display your content to authorized team members</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Payment Terms */}
              <section id="payment" data-section="payment" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-neutral-900 mb-4">💳 Payment Terms</h2>
                <div className="space-y-4">
                  <div className="prose prose-neutral max-w-none">
                    <p className="text-neutral-700 leading-relaxed mb-4">
                      Access to PatPipes requires payment of applicable fees. By subscribing, you agree to the following payment terms:
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white border border-neutral-200 rounded-lg p-4">
                      <h4 className="font-semibold text-neutral-900 mb-2">Billing Cycles</h4>
                      <p className="text-sm text-neutral-600">
                        Subscriptions are billed monthly or annually based on your selected plan. Billing occurs on the same day each period.
                      </p>
                    </div>
                    <div className="bg-white border border-neutral-200 rounded-lg p-4">
                      <h4 className="font-semibold text-neutral-900 mb-2">Auto-Renewal</h4>
                      <p className="text-sm text-neutral-600">
                        Your subscription automatically renews unless canceled at least 24 hours before the renewal date.
                      </p>
                    </div>
                    <div className="bg-white border border-neutral-200 rounded-lg p-4">
                      <h4 className="font-semibold text-neutral-900 mb-2">Refund Policy</h4>
                      <p className="text-sm text-neutral-600">
                        We offer a 14-day money-back guarantee for new subscriptions. Refunds are prorated for annual plans.
                      </p>
                    </div>
                    <div className="bg-white border border-neutral-200 rounded-lg p-4">
                      <h4 className="font-semibold text-neutral-900 mb-2">Price Changes</h4>
                      <p className="text-sm text-neutral-600">
                        We may change our prices with 30 days advance notice. Changes apply to subsequent billing periods.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Termination */}
              <section id="termination" data-section="termination" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-neutral-900 mb-4">🚫 Termination</h2>
                <div className="prose prose-neutral max-w-none">
                  <p className="text-neutral-700 leading-relaxed mb-4">
                    Either party may terminate this agreement at any time:
                  </p>
                  <div className="space-y-4">
                    <div className="border-l-4 border-cyan-500 pl-4 py-2">
                      <h4 className="font-semibold text-neutral-900">You May Terminate</h4>
                      <p className="text-neutral-700 text-sm mt-1">
                        By canceling your subscription through your account settings. You will retain access until the end of your current billing period.
                      </p>
                    </div>
                    <div className="border-l-4 border-red-500 pl-4 py-2">
                      <h4 className="font-semibold text-neutral-900">We May Terminate</h4>
                      <p className="text-neutral-700 text-sm mt-1">
                        For violation of these Terms, failure to pay, or at our discretion with 30 days notice. Immediate termination may occur for serious violations.
                      </p>
                    </div>
                  </div>
                  <p className="text-neutral-700 leading-relaxed mt-4">
                    Upon termination, your right to access PatPipes will immediately cease. We will retain your data for 90 days, after which it will be permanently deleted.
                  </p>
                </div>
              </section>

              {/* Warranties & Disclaimers */}
              <section id="warranties" data-section="warranties" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-neutral-900 mb-4">⚠️ Warranties & Disclaimers</h2>
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6">
                  <p className="text-neutral-700 leading-relaxed mb-4 font-medium">
                    PATPIPES IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
                  </p>
                  <p className="text-neutral-700 leading-relaxed text-sm">
                    We do not warrant that our services will be uninterrupted, error-free, or completely secure. We make no guarantees about the accuracy, reliability, or completeness of any content or AI-generated results. You use PatPipes at your own risk.
                  </p>
                  <div className="mt-4 pt-4 border-t border-yellow-300">
                    <p className="text-sm text-yellow-800 font-medium">
                      Professional Advice: PatPipes is a tool to assist with patent work but does not provide legal advice. Always consult with a qualified patent attorney for legal matters.
                    </p>
                  </div>
                </div>
              </section>

              {/* Limitation of Liability */}
              <section id="liability" data-section="liability" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-neutral-900 mb-4">🛡️ Limitation of Liability</h2>
                <div className="prose prose-neutral max-w-none">
                  <div className="bg-red-50 border-2 border-red-300 rounded-lg p-6">
                    <p className="text-neutral-700 leading-relaxed mb-4">
                      TO THE MAXIMUM EXTENT PERMITTED BY LAW, PATPIPES SHALL NOT BE LIABLE FOR:
                    </p>
                    <ul className="space-y-2 text-neutral-700 text-sm">
                      <li>• Any indirect, incidental, special, or consequential damages</li>
                      <li>• Loss of profits, data, or business opportunities</li>
                      <li>• Damages resulting from unauthorized access to your account</li>
                      <li>• Errors or omissions in AI-generated content</li>
                      <li>• Third-party actions or content</li>
                    </ul>
                    <p className="text-neutral-700 leading-relaxed mt-4 font-medium">
                      Our total liability shall not exceed the amount you paid to PatPipes in the 12 months preceding the claim.
                    </p>
                  </div>
                </div>
              </section>

              {/* Indemnification */}
              <section id="indemnification" data-section="indemnification" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-neutral-900 mb-4">⚖️ Indemnification</h2>
                <div className="prose prose-neutral max-w-none">
                  <p className="text-neutral-700 leading-relaxed">
                    You agree to indemnify, defend, and hold harmless PatPipes, its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:
                  </p>
                  <div className="mt-4 space-y-2">
                    {[
                      'Your use of PatPipes',
                      'Your violation of these Terms',
                      'Your violation of any third-party rights',
                      'Content you upload or create using our platform',
                    ].map((item, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-neutral-100 rounded-lg">
                        <div className="h-6 w-6 rounded-full bg-neutral-600 text-white flex items-center justify-center text-xs font-semibold shrink-0">
                          {index + 1}
                        </div>
                        <span className="text-neutral-700">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Dispute Resolution */}
              <section id="disputes" data-section="disputes" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-neutral-900 mb-4">🤝 Dispute Resolution</h2>
                <div className="space-y-4">
                  <div className="prose prose-neutral max-w-none">
                    <p className="text-neutral-700 leading-relaxed">
                      Most disputes can be resolved through friendly communication. If a dispute arises, please contact us first at{' '}
                      <a href="mailto:legal@patpipes.com" className="text-cyan-600 hover:underline">legal@patpipes.com</a>
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-3">Arbitration Agreement</h3>
                    <p className="text-neutral-700 leading-relaxed text-sm mb-3">
                      Any disputes that cannot be resolved informally shall be resolved through binding arbitration, rather than in court, except:
                    </p>
                    <ul className="space-y-1 text-sm text-neutral-700">
                      <li>• Claims in small claims court</li>
                      <li>• Intellectual property disputes</li>
                      <li>• Claims for injunctive relief</li>
                    </ul>
                  </div>

                  <div className="bg-neutral-100 border border-neutral-300 rounded-lg p-4">
                    <p className="text-sm text-neutral-700">
                      <strong>Governing Law:</strong> These Terms shall be governed by the laws of the State of California, without regard to conflict of law principles.
                    </p>
                  </div>
                </div>
              </section>

              {/* Miscellaneous */}
              <section id="miscellaneous" data-section="miscellaneous" className="scroll-mt-24">
                <h2 className="text-2xl font-bold text-neutral-900 mb-4">📋 Miscellaneous</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white border border-neutral-200 rounded-lg p-4">
                      <h4 className="font-semibold text-neutral-900 mb-2">Entire Agreement</h4>
                      <p className="text-sm text-neutral-600">
                        These Terms, along with our Privacy Policy, constitute the entire agreement between you and PatPipes.
                      </p>
                    </div>
                    <div className="bg-white border border-neutral-200 rounded-lg p-4">
                      <h4 className="font-semibold text-neutral-900 mb-2">Severability</h4>
                      <p className="text-sm text-neutral-600">
                        If any provision is found unenforceable, the remaining provisions will remain in full effect.
                      </p>
                    </div>
                    <div className="bg-white border border-neutral-200 rounded-lg p-4">
                      <h4 className="font-semibold text-neutral-900 mb-2">No Waiver</h4>
                      <p className="text-sm text-neutral-600">
                        Our failure to enforce any right or provision does not constitute a waiver of such right or provision.
                      </p>
                    </div>
                    <div className="bg-white border border-neutral-200 rounded-lg p-4">
                      <h4 className="font-semibold text-neutral-900 mb-2">Assignment</h4>
                      <p className="text-sm text-neutral-600">
                        You may not assign these Terms without our consent. We may assign our rights without restriction.
                      </p>
                    </div>
                  </div>

                  <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-neutral-900 mb-3">Changes to Terms</h3>
                    <p className="text-neutral-700 leading-relaxed text-sm">
                      We may update these Terms from time to time. We will notify you of material changes by email or through a prominent notice on our platform at least 30 days before the changes take effect. Your continued use of PatPipes after changes become effective constitutes acceptance of the updated Terms.
                    </p>
                  </div>
                </div>
              </section>

              {/* Contact Section */}
              <section className="scroll-mt-24">
                <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 rounded-lg p-8">
                  <h3 className="text-2xl font-bold text-neutral-900 mb-4">Questions About These Terms?</h3>
                  <p className="text-neutral-700 leading-relaxed mb-6">
                    If you have any questions or concerns about these Terms of Service, please don't hesitate to contact our legal team.
                  </p>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-start gap-3">
                      <span className="font-medium text-neutral-900 w-24">Email:</span>
                      <a href="mailto:legal@patpipes.com" className="text-cyan-600 hover:underline">
                        legal@patpipes.com
                      </a>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="font-medium text-neutral-900 w-24">Address:</span>
                      <span className="text-neutral-700">
                        PatPipes Inc.<br />
                        Legal Department<br />
                        123 Innovation Drive<br />
                        San Francisco, CA 94105
                      </span>
                    </div>
                  </div>
                  <Link href="/contact">
                    <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white">
                      Contact Legal Team
                    </Button>
                  </Link>
                </div>
              </section>

              {/* Acceptance CTA */}
              <section className="scroll-mt-24">
                <div className="bg-white border-2 border-neutral-300 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      id="accept-terms"
                      checked={accepted}
                      onChange={(e) => setAccepted(e.target.checked)}
                      className="mt-1 h-5 w-5 rounded border-neutral-300 text-cyan-600 focus:ring-cyan-500"
                    />
                    <label htmlFor="accept-terms" className="flex-1 cursor-pointer">
                      <p className="text-neutral-900 font-medium mb-1">
                        I have read and agree to the Terms of Service
                      </p>
                      <p className="text-sm text-neutral-600">
                        By checking this box, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
                      </p>
                    </label>
                  </div>
                  <div className="mt-6 flex gap-3">
                    <Link href="/signup" className="flex-1">
                      <Button
                        disabled={!accepted}
                        className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Accept & Continue to Signup
                      </Button>
                    </Link>
                    <Button variant="outline" className="flex-1" onClick={() => window.print()}>
                      <Download className="h-4 w-4 mr-2" />
                      Download as PDF
                    </Button>
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
