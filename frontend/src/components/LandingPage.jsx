import React, { useState} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, UserPlus, LogIn, FileCheck, ArrowRight, Shield, Users,
  Award, Mail, Phone, MapPin, ChevronDown, CheckCircle, Activity,
  TrendingUp
} from 'lucide-react';
import emailjs from '@emailjs/browser';

export default function LandingPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const [activeAccordion, setActiveAccordion] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleNavigation = (path) => {
    navigate(path);
  };

  const scrollToSection = (sectionId) => {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await emailjs.send(
        process.env.REACT_APP_EMAILJS_SERVICE_ID,      
        process.env.REACT_APP_EMAILJS_TEMPLATE_ID, 
        {
          from_name: formData.name,
          from_email: formData.email,
          message: formData.message,
          to_email: 'bchakairu@gmail.com', 
        },
        process.env.REACT_APP_EMAILJS_PUBLIC_KEY       
      );

      alert('Message sent successfully. We will get back to you soon.');
      setFormData({ name: '', email: '', message: '' });
    } catch (error) {
      console.error('EmailJS Error:', error);
      alert('Failed to send message. Please try again or email us directly at bchakairu@gmail.com');
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = [
    { icon: CheckCircle, value: '90.67%', label: 'Accuracy Rate' },
    { icon: Activity, value: '92.50%', label: 'Sensitivity' },
    { icon: TrendingUp, value: '88.57%', label: 'Specificity' },
  ];

  const faqs = [
    {
      question: "How accurate is Tunzadent's AI detection?",
      answer: 'Our AI model achieves 90.67% accuracy with 92.50% sensitivity and 88.57% specificity, trained on thousands of dental X-rays.'
    },
    {
      question: 'What types of X-rays does Tunzadent support?',
      answer: 'We support bitewing X-rays in common formats (PNG, JPG, JPEG).'
    },
    {
      question: 'Is patient data secure?',
      answer: 'Yes, we use industry-standard encryption and comply with healthcare data protection regulations. All data is stored securely with 2FA authentication.'
    },
    {
      question: 'Do I need special training to use Tunzadent?',
      answer: 'No special training required. Our interface is intuitive and designed for dentists. Simply upload, and get instant results.'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => handleNavigation('/')}>
              <img 
                src="/tunzadent-logo.png" 
                alt="Tunzadent Logo" 
                className="h-24 w-auto"
              />    
            </div>

            <nav className="hidden md:flex items-center space-x-8">
              <button onClick={() => scrollToSection('about')} className="text-sm text-gray-700 hover:text-gray-900 font-medium">
                About
              </button>
              <button onClick={() => scrollToSection('features')} className="text-sm text-gray-700 hover:text-gray-900 font-medium">
                Features
              </button>
              <button onClick={() => scrollToSection('contact')} className="text-sm text-gray-700 hover:text-gray-900 font-medium">
                Contact
              </button>
            </nav>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => handleNavigation('/register')}
                className="px-5 py-2 text-sm font-medium border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Sign Up
              </button>
              <button
                onClick={() => handleNavigation('/login')}
                className="px-5 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h1 className="text-5xl font-bold text-gray-900 mb-4">
                Tunzadent
              </h1>
              <p className="text-2xl text-gray-700 font-semibold mb-6">
                AI-Powered Dental Caries Detection
              </p>
              <p className="text-lg text-gray-600 mb-8 max-w-xl">
                Clinical-grade AI analysis for bitewing dental radiographs. 
                Get instant results to support your diagnostic workflow.
              </p>
              <button
                onClick={() => scrollToSection('about')}
                className="inline-flex items-center px-6 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                Learn More
                <ArrowRight className="ml-2 w-4 h-4" />
              </button>
            </div>

            <div>
              <div className="bg-gray-100 border border-gray-200 p-8">
                <img 
                  src="/images/dentist1.webp" 
                  alt="Dental diagnostics"
                  className="w-full h-80 object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <img 
                src="/images/dentist2.webp" 
                alt="Dentist" 
                className="w-full border border-gray-200"
              />  
            </div>

            <div>
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                About Tunzadent
              </h2>
              <p className="text-base text-gray-600 mb-4 leading-relaxed">
                Tunzadent is an AI-powered platform designed for dental caries detection. 
                Our Vision Transformer and Masked Autoencoder technology provides 
                dentists with rapid, accurate analysis of bitewing dental X-rays.
              </p>
              <p className="text-base text-gray-600 mb-6 leading-relaxed">
                We are committed to improving patient diagnosis through technology. Our mission 
                is to make high-quality dental diagnostics accessible to practitioners everywhere.
              </p>
              <div className="space-y-3">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                  <span className="text-sm text-gray-700">AI-powered radiographic analysis</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Instant diagnostic support</span>
                </div>
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-blue-600 mr-3 flex-shrink-0" />
                  <span className="text-sm text-gray-700">Clinical-grade accuracy</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Clinical Performance Metrics
            </h2>
            <p className="text-base text-gray-600">
              Validated accuracy backed by rigorous testing
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="bg-white border border-gray-200 p-8 text-center"
                >
                  <div className="w-12 h-12 mx-auto mb-4 bg-blue-600 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 font-medium uppercase tracking-wide">
                    {stat.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="bg-gray-900 text-white border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">
              Easy Diagnosis  Workflow
            </h2>
            <p className="text-base text-gray-300 max-w-2xl mx-auto">
              Simple five-step process for AI-powered caries detection
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {[
              { icon: UserPlus, title: 'Sign Up', step: 1 },
              { icon: LogIn, title: 'Login', step: 2 },
              { icon: Users, title: 'Register Patient', step: 3 },
              { icon: Upload, title: 'Upload X-Ray', step: 4 },
              { icon: FileCheck, title: 'View Results', step: 5 }
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="bg-gray-800 border border-gray-700 p-6"
                >
                  <div className="w-12 h-12 mx-auto mb-4 bg-blue-600 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold mb-2">{item.step}</div>
                    <div className="text-sm font-medium">{item.title}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Features
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Award,
                title: 'Proven Expertise',
                description: 'Our AI model has been trained on thousands of dental X-rays to provide accurate caries detection.'
              },
              {
                icon: Shield,
                title: 'Data Security',
                description: 'Patient data security is our priority. We provide reliable analysis with industry-standard encryption and HIPAA compliance.'
              },
              {
                icon: Users,
                title: 'Advanced Technology',
                description: 'State-of-the-art Vision Transformers and Masked Autoencoders with 90.67% accuracy, 92.50% sensitivity, and 88.57% specificity.'
              }
            ].map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white border border-gray-200 p-8"
                >
                  <div className="w-12 h-12 mb-6 bg-blue-600 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-gray-50 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Frequently Asked Questions
            </h2>
            <p className="text-base text-gray-600">
              Common inquiries about Tunzadent
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200"
              >
                <button
                  onClick={() => setActiveAccordion(activeAccordion === index ? null : index)}
                  className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50"
                >
                  <span className="text-sm font-semibold text-gray-900 pr-4">{faq.question}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${
                      activeAccordion === index ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {activeAccordion === index && (
                  <div className="px-6 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-200 pt-4">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">
              Contact Information
            </h2>
            <p className="text-base text-gray-600">
              Get in touch with our team
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
              <div className="flex items-start">
                <div className="w-12 h-12 bg-blue-600 flex items-center justify-center flex-shrink-0 mr-4">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-1">Email</h3>
                  <p className="text-sm text-gray-600">bchakairu@gmail.com</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-12 h-12 bg-blue-600 flex items-center justify-center flex-shrink-0 mr-4">
                  <Phone className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-1">Phone</h3>
                  <p className="text-sm text-gray-600">+254 775 135 147</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="w-12 h-12 bg-blue-600 flex items-center justify-center flex-shrink-0 mr-4">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-1">Location</h3>
                  <p className="text-sm text-gray-600">Madaraka</p>
                  <p className="text-sm text-gray-600">Nairobi, Kenya</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Dr. Bethuel Mbui"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="bethuel.mbui@gmail.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="How can we help you?"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Sending Message...' : 'Send Message'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 border-b border-blue-700">
        <div className="max-w-7xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Professional Dental Diagnostics Platform
          </h2>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto mb-8">
            Join dental professionals using AI-powered caries detection
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => handleNavigation('/register')}
              className="px-8 py-3 text-sm font-medium text-blue-700 bg-white hover:bg-gray-50"
            >
              Create Account
            </button>
            <button
              onClick={() => handleNavigation('/login')}
              className="px-8 py-3 text-sm font-medium border border-white text-white hover:bg-blue-700"
            >
              Login
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 pb-8 border-b border-gray-800">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-xl font-bold mb-4">Tunzadent</h3>
              <p className="text-sm text-gray-400 max-w-md leading-relaxed">
                AI-powered caries detection system helping dentists provide better care 
                with instant, accurate X-ray analysis.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wide mb-4">Navigation</h4>
              <div className="space-y-2">
                <button onClick={() => scrollToSection('about')} className="block text-sm text-gray-400 hover:text-white">
                  About
                </button>
                <button onClick={() => scrollToSection('features')} className="block text-sm text-gray-400 hover:text-white">
                  Features
                </button>
                <button onClick={() => scrollToSection('contact')} className="block text-sm text-gray-400 hover:text-white">
                  Contact
                </button>
              </div>
            </div>

            {/*
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wide mb-4">Legal</h4>
              <div className="space-y-2">
                <button onClick={() => handleNavigation('/privacy')} className="block text-sm text-gray-400 hover:text-white text-left">
                  Privacy Policy
                </button>
                <button onClick={() => handleNavigation('/terms')} className="block text-sm text-gray-400 hover:text-white text-left">
                  Terms of Service
                </button>
                <button onClick={() => handleNavigation('/compliance')} className="block text-sm text-gray-400 hover:text-white text-left">
                  HIPAA Compliance
                </button>
              </div>
            </div>
            */}
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              © 2025 Tunzadent. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}