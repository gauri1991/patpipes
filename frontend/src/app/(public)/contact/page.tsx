'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion } from 'framer-motion';
import {
  Mail,
  Phone,
  MapPin,
  MessageSquare,
  Clock,
  Send,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Paperclip,
  X,
  Users,
  Briefcase,
  HeadphonesIcon,
  Scale,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  company: z.string().optional(),
  phone: z.string().optional(),
  department: z.enum(['sales', 'support', 'partnerships', 'legal']),
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  message: z.string().min(20, 'Message must be at least 20 characters'),
  urgency: z.enum(['low', 'medium', 'high']),
});

type ContactFormData = z.infer<typeof contactSchema>;

const departments = [
  {
    value: 'sales',
    label: 'Sales',
    icon: Briefcase,
    description: 'Pricing, demos, and product information',
    responseTime: '2-4 hours',
    email: 'sales@patpipes.com',
  },
  {
    value: 'support',
    label: 'Technical Support',
    icon: HeadphonesIcon,
    description: 'Account issues, bugs, and technical help',
    responseTime: '1-2 hours',
    email: 'support@patpipes.com',
  },
  {
    value: 'partnerships',
    label: 'Partnerships',
    icon: Users,
    description: 'Integration opportunities and collaborations',
    responseTime: '1-2 business days',
    email: 'partnerships@patpipes.com',
  },
  {
    value: 'legal',
    label: 'Legal & Privacy',
    icon: Scale,
    description: 'Privacy, compliance, and legal inquiries',
    responseTime: '2-3 business days',
    email: 'legal@patpipes.com',
  },
];

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string>('sales');
  const [attachments, setAttachments] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      department: 'sales',
      urgency: 'medium',
    },
  });

  const watchDepartment = watch('department');

  const onSubmit = async (data: ContactFormData) => {
    setIsSubmitting(true);
    toast.loading('Sending your message...', { id: 'contact' });

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    toast.success('Message sent successfully!', {
      id: 'contact',
      description: `We'll get back to you within ${
        departments.find((d) => d.value === data.department)?.responseTime
      }`,
    });

    setIsSubmitting(false);
    setSubmitted(true);

    // Reset form after 3 seconds
    setTimeout(() => {
      setSubmitted(false);
      reset();
      setAttachments([]);
    }, 3000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (attachments.length + files.length > 3) {
      toast.error('Maximum 3 files allowed');
      return;
    }
    setAttachments([...attachments, ...files]);
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const quickLinks = [
    { title: 'Knowledge Base', desc: 'Browse our help articles', href: '#' },
    { title: 'API Documentation', desc: 'Integration guides & reference', href: '#' },
    { title: 'Community Forum', desc: 'Connect with other users', href: '#' },
    { title: 'Status Page', desc: 'Check system status', href: '#' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-neutral-900 mb-4">
            Get in Touch
          </h1>
          <p className="text-xl text-neutral-600">
            Have a question or need assistance? We're here to help. Choose how you'd like to reach us.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {/* Left Column - Contact Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            {/* Department Cards */}
            <div className="space-y-3">
              <h3 className="font-semibold text-neutral-900 text-lg mb-4">Select Department</h3>
              {departments.map((dept, index) => {
                const Icon = dept.icon;
                const isSelected = watchDepartment === dept.value;

                return (
                  <motion.button
                    key={dept.value}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    onClick={() => {
                      setValue('department', dept.value as any);
                      setSelectedDepartment(dept.value);
                    }}
                    className={`
                      w-full text-left p-4 rounded-lg border-2 transition-all
                      ${isSelected
                        ? 'border-cyan-500 bg-cyan-50'
                        : 'border-neutral-200 bg-white hover:border-cyan-300 hover:bg-cyan-50/50'
                      }
                    `}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`
                        p-2 rounded-lg shrink-0
                        ${isSelected ? 'bg-cyan-500 text-white' : 'bg-neutral-100 text-neutral-600'}
                      `}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-neutral-900 mb-1">{dept.label}</div>
                        <div className="text-sm text-neutral-600 mb-2">{dept.description}</div>
                        <div className="flex items-center gap-1 text-xs text-neutral-500">
                          <Clock className="h-3 w-3" />
                          <span>Responds in {dept.responseTime}</span>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Contact Methods */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-neutral-900 text-lg">Other Ways to Reach Us</h3>

                <div className="space-y-3">
                  <a
                    href={`mailto:${departments.find((d) => d.value === selectedDepartment)?.email}`}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-neutral-50 transition-colors group"
                  >
                    <Mail className="h-5 w-5 text-cyan-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-neutral-900 group-hover:text-cyan-600 transition-colors">
                        Email
                      </div>
                      <div className="text-sm text-neutral-600">
                        {departments.find((d) => d.value === selectedDepartment)?.email}
                      </div>
                    </div>
                  </a>

                  <a
                    href="tel:+15551234567"
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-neutral-50 transition-colors group"
                  >
                    <Phone className="h-5 w-5 text-cyan-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-neutral-900 group-hover:text-cyan-600 transition-colors">
                        Phone
                      </div>
                      <div className="text-sm text-neutral-600">+1 (555) 123-4567</div>
                    </div>
                  </a>

                  <div className="flex items-start gap-3 p-3 rounded-lg">
                    <MapPin className="h-5 w-5 text-cyan-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-neutral-900">Office</div>
                      <div className="text-sm text-neutral-600">
                        123 Innovation Drive<br />
                        San Francisco, CA 94105
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-lg">
                    <Clock className="h-5 w-5 text-cyan-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium text-neutral-900">Business Hours</div>
                      <div className="text-sm text-neutral-600">
                        Mon-Fri: 9:00 AM - 6:00 PM PST<br />
                        Sat-Sun: Closed
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-neutral-900 text-lg mb-4">Quick Links</h3>
                <div className="space-y-2">
                  {quickLinks.map((link, index) => (
                    <a
                      key={index}
                      href={link.href}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-neutral-50 transition-colors group"
                    >
                      <MessageSquare className="h-4 w-4 text-cyan-600 shrink-0 mt-1" />
                      <div>
                        <div className="text-sm font-medium text-neutral-900 group-hover:text-cyan-600 transition-colors">
                          {link.title}
                        </div>
                        <div className="text-xs text-neutral-600">{link.desc}</div>
                      </div>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Right Column - Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-2"
          >
            <Card className="shadow-xl border-neutral-200">
              <CardContent className="p-8">
                {!submitted ? (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-neutral-900 mb-2">Send us a Message</h2>
                      <p className="text-neutral-600">
                        Fill out the form below and we'll get back to you as soon as possible.
                      </p>
                    </div>

                    {/* Name & Email Row */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Full Name *</Label>
                        <Input
                          id="name"
                          type="text"
                          placeholder="John Doe"
                          {...register('name')}
                          className="focus:ring-cyan-500 focus:border-cyan-500"
                        />
                        {errors.name && (
                          <p className="text-sm text-red-600">{errors.name.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address *</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="john.doe@company.com"
                          {...register('email')}
                          className="focus:ring-cyan-500 focus:border-cyan-500"
                        />
                        {errors.email && (
                          <p className="text-sm text-red-600">{errors.email.message}</p>
                        )}
                      </div>
                    </div>

                    {/* Company & Phone Row */}
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="company">Company</Label>
                        <Input
                          id="company"
                          type="text"
                          placeholder="Acme Corporation"
                          {...register('company')}
                          className="focus:ring-cyan-500 focus:border-cyan-500"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+1 (555) 123-4567"
                          {...register('phone')}
                          className="focus:ring-cyan-500 focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    {/* Hidden Department Field */}
                    <input type="hidden" {...register('department')} />

                    {/* Subject */}
                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject *</Label>
                      <Input
                        id="subject"
                        type="text"
                        placeholder="How can we help you?"
                        {...register('subject')}
                        className="focus:ring-cyan-500 focus:border-cyan-500"
                      />
                      {errors.subject && (
                        <p className="text-sm text-red-600">{errors.subject.message}</p>
                      )}
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <textarea
                        id="message"
                        rows={6}
                        placeholder="Please provide details about your inquiry..."
                        {...register('message')}
                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 resize-none"
                      />
                      {errors.message && (
                        <p className="text-sm text-red-600">{errors.message.message}</p>
                      )}
                      <p className="text-xs text-neutral-500">
                        {watch('message')?.length || 0} / 500 characters
                      </p>
                    </div>

                    {/* Urgency */}
                    <div className="space-y-2">
                      <Label>Urgency Level</Label>
                      <div className="flex gap-3">
                        {[
                          { value: 'low', label: 'Low', color: 'bg-green-100 text-green-700 hover:bg-green-200' },
                          { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
                          { value: 'high', label: 'High', color: 'bg-red-100 text-red-700 hover:bg-red-200' },
                        ].map((urgency) => (
                          <button
                            key={urgency.value}
                            type="button"
                            onClick={() => setValue('urgency', urgency.value as any)}
                            className={`
                              flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all
                              ${watch('urgency') === urgency.value
                                ? urgency.color + ' ring-2 ring-offset-2 ring-current'
                                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                              }
                            `}
                          >
                            {urgency.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* File Attachments */}
                    <div className="space-y-2">
                      <Label>Attachments (Optional)</Label>
                      <div className="border-2 border-dashed border-neutral-300 rounded-lg p-4 hover:border-cyan-400 transition-colors">
                        <input
                          type="file"
                          id="file-upload"
                          multiple
                          onChange={handleFileChange}
                          className="hidden"
                          accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                        />
                        <label
                          htmlFor="file-upload"
                          className="flex flex-col items-center justify-center cursor-pointer"
                        >
                          <Paperclip className="h-8 w-8 text-neutral-400 mb-2" />
                          <span className="text-sm text-neutral-600">
                            Click to attach files (max 3)
                          </span>
                          <span className="text-xs text-neutral-500 mt-1">
                            PDF, DOC, TXT, PNG, JPG (Max 10MB each)
                          </span>
                        </label>
                      </div>

                      {/* Attached Files */}
                      {attachments.length > 0 && (
                        <div className="space-y-2 mt-3">
                          {attachments.map((file, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 bg-neutral-50 rounded-lg"
                            >
                              <div className="flex items-center gap-2">
                                <Paperclip className="h-4 w-4 text-neutral-500" />
                                <span className="text-sm text-neutral-700">{file.name}</span>
                                <span className="text-xs text-neutral-500">
                                  ({(file.size / 1024).toFixed(1)} KB)
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeAttachment(index)}
                                className="p-1 hover:bg-neutral-200 rounded transition-colors"
                              >
                                <X className="h-4 w-4 text-neutral-600" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white transition-all duration-300"
                      size="lg"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-5 w-5" />
                          Send Message
                        </>
                      )}
                    </Button>

                    <p className="text-xs text-center text-neutral-500">
                      By submitting this form, you agree to our{' '}
                      <Link href="/privacy" className="text-cyan-600 hover:underline">
                        Privacy Policy
                      </Link>
                    </p>
                  </form>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center justify-center py-12"
                  >
                    <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
                      <CheckCircle2 className="h-10 w-10 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-neutral-900 mb-2">Message Sent!</h3>
                    <p className="text-neutral-600 text-center max-w-md">
                      Thank you for contacting us. We've received your message and will respond within{' '}
                      {departments.find((d) => d.value === selectedDepartment)?.responseTime}.
                    </p>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="max-w-4xl mx-auto mt-16"
        >
          <h2 className="text-3xl font-bold text-neutral-900 mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                q: 'What are your business hours?',
                a: 'We operate Monday through Friday, 9:00 AM to 6:00 PM PST. Support tickets are monitored 24/7 for urgent issues.',
              },
              {
                q: 'How quickly will I get a response?',
                a: 'Response times vary by department. Sales inquiries are typically answered within 2-4 hours, while technical support responds in 1-2 hours during business hours.',
              },
              {
                q: 'Can I schedule a demo?',
                a: 'Absolutely! Contact our sales team and they will arrange a personalized demo at your convenience.',
              },
              {
                q: 'Do you offer phone support?',
                a: 'Yes, phone support is available for Enterprise plan customers. Professional and Starter plans have access to email and chat support.',
              },
            ].map((faq, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <h3 className="font-semibold text-neutral-900 mb-2">{faq.q}</h3>
                  <p className="text-sm text-neutral-600">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>
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
