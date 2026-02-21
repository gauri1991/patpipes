'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { useState } from 'react';
import {
  ArrowRight,
  CheckCircle,
  X,
  Zap,
  Users,
  Building2,
  Sparkles,
  Shield,
  Clock,
  HeadphonesIcon,
  Server,
  Database,
  Lock
} from 'lucide-react';

export default function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const pricingTiers = [
    {
      name: "Starter",
      monthlyPrice: 299,
      annualPrice: 239, // 20% discount
      description: "Perfect for solo practitioners and small teams",
      icon: <Users className="h-6 w-6" />,
      features: [
        { name: "Prior Art Search", value: "100 searches/mo", included: true },
        { name: "Basic Analytics Dashboard", value: true, included: true },
        { name: "Patent Drafts", value: "5/month", included: true },
        { name: "Email Support", value: "24-48hr response", included: true },
        { name: "API Access", value: "10K calls/mo", included: true },
        { name: "User Licenses", value: "1 user", included: true },
        { name: "Infringement Analysis", value: false, included: false },
        { name: "Custom Integrations", value: false, included: false },
        { name: "Priority Support", value: false, included: false },
        { name: "Dedicated Account Manager", value: false, included: false },
      ],
      cta: "Start Free Trial",
      highlight: false,
      popular: false
    },
    {
      name: "Professional",
      monthlyPrice: 899,
      annualPrice: 719, // 20% discount
      description: "For growing law firms and IP departments",
      icon: <Building2 className="h-6 w-6" />,
      features: [
        { name: "Prior Art Search", value: "Unlimited", included: true },
        { name: "Advanced Analytics + White Space", value: true, included: true },
        { name: "Patent Drafts", value: "Unlimited", included: true },
        { name: "Priority Support + Slack", value: "4-8hr response", included: true },
        { name: "API Access", value: "100K calls/mo", included: true },
        { name: "User Licenses", value: "Up to 10 users", included: true },
        { name: "Infringement Analysis", value: "50/mo", included: true },
        { name: "Custom Integrations", value: true, included: true },
        { name: "Team Collaboration Tools", value: true, included: true },
        { name: "Dedicated Account Manager", value: false, included: false },
      ],
      cta: "Start Free Trial",
      highlight: true,
      popular: true
    },
    {
      name: "Enterprise",
      monthlyPrice: null,
      annualPrice: null,
      description: "For large organizations with complex needs",
      icon: <Sparkles className="h-6 w-6" />,
      features: [
        { name: "Everything in Professional", value: true, included: true },
        { name: "Unlimited Users & Searches", value: true, included: true },
        { name: "Dedicated Account Manager", value: true, included: true },
        { name: "Custom AI Model Training", value: true, included: true },
        { name: "SSO & Advanced Security", value: true, included: true },
        { name: "SLA with 99.9% Uptime", value: true, included: true },
        { name: "On-premise Deployment", value: "Optional", included: true },
        { name: "White Label Solution", value: true, included: true },
        { name: "24/7 Phone Support", value: true, included: true },
        { name: "Custom Contract Terms", value: true, included: true },
      ],
      cta: "Contact Sales",
      highlight: false,
      popular: false
    }
  ];

  const addons = [
    {
      name: "Additional User License",
      monthlyPrice: 50,
      description: "Add more team members to your plan",
      icon: <Users className="h-5 w-5" />
    },
    {
      name: "Premium Support",
      monthlyPrice: 199,
      description: "1-hour response time with dedicated support engineer",
      icon: <HeadphonesIcon className="h-5 w-5" />
    },
    {
      name: "Data Storage (500GB)",
      monthlyPrice: 99,
      description: "Additional storage for patents, documents, and analytics",
      icon: <Database className="h-5 w-5" />
    },
    {
      name: "Custom AI Training",
      monthlyPrice: 499,
      description: "Train AI models on your specific patent portfolio",
      icon: <Sparkles className="h-5 w-5" />
    },
  ];

  const faqs = [
    {
      question: "Can I switch plans anytime?",
      answer: "Yes! You can upgrade, downgrade, or cancel your plan at any time. Changes take effect at the start of your next billing cycle, or immediately if you upgrade."
    },
    {
      question: "What happens after the free trial?",
      answer: "Your 14-day free trial includes full access to all features in your chosen plan. No credit card required. After the trial, you can choose to subscribe or downgrade to our free tier (10 searches/month)."
    },
    {
      question: "Do you offer refunds?",
      answer: "Yes, we offer a 30-day money-back guarantee. If you're not satisfied for any reason within the first 30 days, contact us for a full refund."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards (Visa, Mastercard, Amex), ACH bank transfers, and wire transfers for Enterprise plans. Annual plans can also be paid via invoice."
    },
    {
      question: "Is there a discount for annual billing?",
      answer: "Yes! Annual plans receive a 20% discount compared to monthly billing. That's 2.4 months free when you pay annually."
    },
    {
      question: "Can I get a custom plan?",
      answer: "Absolutely! If none of our standard plans fit your needs, contact our sales team to discuss a custom plan tailored to your organization."
    }
  ];

  const getPrice = (tier: typeof pricingTiers[0]) => {
    if (tier.monthlyPrice === null) return "Custom";
    return billingCycle === 'monthly' ? `$${tier.monthlyPrice}` : `$${tier.annualPrice}`;
  };

  const getSavings = (tier: typeof pricingTiers[0]) => {
    if (tier.monthlyPrice === null || billingCycle === 'monthly') return null;
    const savings = (tier.monthlyPrice! * 12) - (tier.annualPrice! * 12);
    return savings;
  };

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
            className="text-center max-w-4xl mx-auto"
          >
            {/* Sparkles Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-100 text-cyan-700 rounded-full text-sm font-semibold mb-6">
              <Sparkles className="h-4 w-4" />
              Transparent Pricing, No Hidden Fees
            </div>

            {/* Gradient Title */}
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight bg-gradient-to-r from-cyan-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Choose the Perfect Plan for Your Team
            </h1>

            <p className="text-xl text-neutral-600 mb-8 leading-relaxed">
              Start with a 14-day free trial. No credit card required. Cancel anytime.
            </p>

            {/* Billing Toggle */}
            <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur p-1.5 rounded-full shadow-lg border border-neutral-200 mb-8">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  billingCycle === 'monthly'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingCycle('annual')}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  billingCycle === 'annual'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Annual
                <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                  Save 20%
                </span>
              </button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-neutral-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-cyan-600" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-cyan-600" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-cyan-600" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="container mx-auto px-4 pt-8 pb-20">
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {pricingTiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ y: -8 }}
              className="relative"
            >
              <Card className={`h-full border-2 transition-all duration-300 ${
                tier.highlight
                  ? 'border-cyan-500 shadow-2xl scale-105'
                  : 'border-neutral-200 hover:border-cyan-300 hover:shadow-lg'
              }`}>
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <CardContent className="p-8">
                  {/* Icon */}
                  <div className={`h-14 w-14 rounded-xl flex items-center justify-center mb-6 ${
                    tier.highlight ? 'bg-cyan-100 text-cyan-600' : 'bg-neutral-100 text-neutral-600'
                  }`}>
                    {tier.icon}
                  </div>

                  {/* Plan Name */}
                  <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                  <p className="text-sm text-neutral-600 mb-6">{tier.description}</p>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                      <span className="text-5xl font-bold text-neutral-900">
                        {getPrice(tier)}
                      </span>
                      {tier.monthlyPrice !== null && (
                        <span className="text-neutral-600 text-sm">
                          /{billingCycle === 'monthly' ? 'month' : 'year'}
                        </span>
                      )}
                    </div>
                    {billingCycle === 'annual' && tier.monthlyPrice !== null && (
                      <p className="text-sm text-green-600 font-medium mt-2">
                        💰 Save ${((tier.monthlyPrice! - tier.annualPrice!) * 12).toLocaleString()}/year
                      </p>
                    )}
                  </div>

                  {/* CTA Button */}
                  <Button
                    className={`w-full mb-8 ${
                      tier.highlight
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg'
                        : 'border-2 border-neutral-300 hover:border-cyan-500 hover:bg-cyan-50 hover:text-cyan-600'
                    }`}
                    variant={tier.highlight ? 'default' : 'outline'}
                  >
                    {tier.cta}
                  </Button>

                  {/* Features */}
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-4">
                      What's Included:
                    </p>
                    {tier.features.map((feature, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        {feature.included ? (
                          <CheckCircle className="h-5 w-5 text-cyan-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="h-5 w-5 text-neutral-300 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <span className={`text-sm ${feature.included ? 'text-neutral-700' : 'text-neutral-400'}`}>
                            {feature.name}
                          </span>
                          {typeof feature.value === 'string' && feature.value !== 'true' && (
                            <span className={`text-xs ml-2 ${feature.included ? 'text-neutral-500' : 'text-neutral-400'}`}>
                              ({feature.value})
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Add-ons Section */}
      <section className="bg-neutral-50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Optional Add-ons</h2>
            <p className="text-lg text-neutral-600">
              Enhance your plan with additional features and support
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {addons.map((addon, index) => (
              <motion.div
                key={addon.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <Card className="h-full border-2 border-neutral-200 hover:border-cyan-300 hover:shadow-lg transition-all">
                  <CardContent className="p-6">
                    <div className="h-10 w-10 bg-cyan-100 text-cyan-600 rounded-lg flex items-center justify-center mb-4">
                      {addon.icon}
                    </div>
                    <h3 className="font-bold mb-2 text-lg">{addon.name}</h3>
                    <p className="text-sm text-neutral-600 mb-4">{addon.description}</p>
                    <div className="text-2xl font-bold text-neutral-900">
                      ${addon.monthlyPrice}
                      <span className="text-sm text-neutral-600 font-normal">/month</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-5xl font-bold mb-4">Detailed Feature Comparison</h2>
          <p className="text-lg text-neutral-600">
            Compare all features across plans
          </p>
        </div>

        <div className="max-w-6xl mx-auto overflow-x-auto">
          <table className="w-full border-2 border-neutral-200 rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white">
                <th className="px-6 py-4 text-left text-sm font-semibold">Feature</th>
                <th className="px-6 py-4 text-center text-sm font-semibold">Starter</th>
                <th className="px-6 py-4 text-center text-sm font-semibold">Professional</th>
                <th className="px-6 py-4 text-center text-sm font-semibold">Enterprise</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {pricingTiers[0].features.map((_, featureIndex) => (
                <tr key={featureIndex} className={featureIndex % 2 === 0 ? 'bg-neutral-50' : 'bg-white'}>
                  <td className="px-6 py-4 text-sm font-medium text-neutral-900">
                    {pricingTiers[0].features[featureIndex].name}
                  </td>
                  {pricingTiers.map((tier, tierIndex) => (
                    <td key={tierIndex} className="px-6 py-4 text-center">
                      {tier.features[featureIndex].included ? (
                        typeof tier.features[featureIndex].value === 'string' &&
                        tier.features[featureIndex].value !== 'true' ? (
                          <span className="text-sm font-medium text-neutral-900">
                            {tier.features[featureIndex].value}
                          </span>
                        ) : (
                          <CheckCircle className="h-6 w-6 text-green-600 mx-auto" />
                        )
                      ) : (
                        <X className="h-6 w-6 text-neutral-300 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-neutral-50 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Pricing FAQs</h2>
            <p className="text-lg text-neutral-600">
              Common questions about our pricing and plans
            </p>
          </div>

          <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-6">
            {faqs.map((faq, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="h-full border-2 border-neutral-200 hover:border-cyan-300 transition-colors">
                  <CardContent className="p-6">
                    <h3 className="font-bold mb-3 text-lg text-neutral-900">{faq.question}</h3>
                    <p className="text-sm text-neutral-600 leading-relaxed">{faq.answer}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
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
