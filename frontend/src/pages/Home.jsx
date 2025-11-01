import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  HeartIcon, 
  ShieldCheckIcon, 
  LockClosedIcon, 
  CloudIcon,
  ChartBarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  StarIcon,
  PlayIcon
} from '@heroicons/react/24/outline';

const Home = () => {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

   const features = [
    {
      icon: ShieldCheckIcon,
      title: 'Blockchain Security',
      description: 'Your medical data is secured using advanced blockchain technology with end-to-end encryption.',
      // TODO: Integrate with actual blockchain security metrics
      // highlight: '99.9% Uptime'
    },
    {
      icon: LockClosedIcon,
      title: 'HIPAA Compliant',
      description: 'Fully compliant with healthcare regulations and privacy standards.',
      // TODO: Add compliance verification from blockchain
      // highlight: 'Fully Certified'
    },
    {
      icon: CloudIcon,
      title: 'IPFS Storage',
      description: 'Decentralized storage ensures your data is always accessible and never lost.',
      // TODO: Integrate with IPFS storage metrics
      // highlight: 'Decentralized'
    },
    {
      icon: ChartBarIcon,
      title: 'Real-time Analytics',
      description: 'Comprehensive analytics and insights for better healthcare decisions.',
      // TODO: Add real-time data from blockchain
      // highlight: 'Live Data'
    }
   ];

  const testimonials = [
    {
      name: 'Dr. Sarah Johnson',
      role: 'Cardiologist, City General Hospital',
      content: 'This platform has revolutionized how we manage patient records. The blockchain integration ensures data integrity like never before.',
      rating: 5,
      // TODO: Add verified blockchain signature
      verified: true
    },
    {
      name: 'John Doe',
      role: 'Patient',
      content: 'I finally have complete control over my medical data. The transparency and security give me peace of mind.',
      rating: 5,
      verified: true
    },
    {
      name: 'Dr. Michael Chen',
      role: 'Hospital Administrator',
      content: 'The efficiency gains are remarkable. Our staff can access patient records instantly while maintaining the highest security standards.',
      rating: 5,
      verified: true
    }
  ];

  const stats = [
    { label: 'Medical Records', value: '50K+', // TODO: Get from blockchain
      description: 'Securely stored' },
    { label: 'Healthcare Providers', value: '500+', // TODO: Get from blockchain
      description: 'Trusted partners' },
    { label: 'Patients Served', value: '10K+', // TODO: Get from blockchain
      description: 'Happy patients' },
    { label: 'Uptime', value: '99.9%', // TODO: Get from monitoring
      description: 'Reliable service' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [testimonials.length]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-grid-slate-100 dark:bg-grid-slate-800/25 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column */}
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-sm font-medium">
                  <ShieldCheckIcon className="w-4 h-4 mr-2" />
                  Blockchain-Powered Healthcare
                </div>
                <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  Secure Medical Records
                  <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-purple-600">
                    for Everyone
                  </span>
                </h1>
                <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed">
                  Revolutionizing healthcare with decentralized, secure, and transparent 
                  medical record management powered by blockchain technology.
                </p>
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/register"
                  className="group inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold rounded-xl hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  Get Started Free
                  <ArrowRightIcon className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button className="group inline-flex items-center justify-center px-8 py-4 border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-all duration-300">
                  <PlayIcon className="w-5 h-5 mr-2" />
                  Watch Demo
                </button>
              </div>

              {/* Trust Indicators */}
              {/* <div className="flex items-center space-x-8 pt-8">
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-slate-600 dark:text-slate-300">HIPAA Compliant</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-slate-600 dark:text-slate-300">End-to-End Encrypted</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-slate-600 dark:text-slate-300">Open Source</span>
                </div>
              </div> */}
            </div>

            {/* Right Column - Hero Visual */}
            <div className="relative">
              <div className="relative z-10 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 border border-slate-200 dark:border-slate-700">
                <div className="space-y-6">
                  {/* Mock Dashboard Preview */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center">
                        <HeartIcon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">Multimedia EHR</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Dashboard</p>
                      </div>
                    </div>
                    {/* <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div> */}
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {stats.map((stat, index) => (
                      <div key={index} className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                        <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stat.value}</div>
                        <div className="text-sm text-slate-600 dark:text-slate-400">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Recent Activity */}
                  <div className="space-y-3">
                    <h4 className="font-medium text-slate-900 dark:text-slate-100">Recent Activity</h4>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-slate-700 dark:text-slate-300">New record created</span>
                      </div>
                      <div className="flex items-center space-x-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-sm text-slate-700 dark:text-slate-300">Access granted to Dr. Ramesh</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-primary-400 to-purple-500 rounded-full opacity-20 animate-pulse"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-green-400 to-blue-500 rounded-full opacity-20 animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Why Choose Multimedia EHR?
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              Built with cutting-edge technology to provide the most secure, 
              efficient, and user-friendly healthcare data management solution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group relative bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-slate-200 dark:border-slate-700 hover:-translate-y-2"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 mb-4">
                    {feature.description}
                  </p>
                  <div className="inline-flex items-center px-3 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 text-sm font-medium rounded-full">
                    {feature.highlight}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
              Trusted by Healthcare Professionals
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300">
              See what our users are saying about their experience
            </p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center mb-6">
                <div className="flex space-x-1">
                  {[...Array(testimonials[currentTestimonial].rating)].map((_, i) => (
                    <StarIcon key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                {testimonials[currentTestimonial].verified && (
                  <div className="ml-3 flex items-center text-green-600 dark:text-green-400">
                    <CheckCircleIcon className="w-4 h-4 mr-1" />
                    <span className="text-sm font-medium">Verified</span>
                  </div>
                )}
              </div>
              <blockquote className="text-lg text-slate-700 dark:text-slate-300 mb-6">
                "{testimonials[currentTestimonial].content}"
              </blockquote>
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full flex items-center justify-center text-white font-semibold">
                  {testimonials[currentTestimonial].name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="ml-4">
                  <div className="font-semibold text-slate-900 dark:text-slate-100">
                    {testimonials[currentTestimonial].name}
                  </div>
                  <div className="text-slate-600 dark:text-slate-400">
                    {testimonials[currentTestimonial].role}
                  </div>
                </div>
              </div>
            </div>

            {/* Testimonial Navigation */}
            <div className="flex justify-center mt-8 space-x-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    index === currentTestimonial
                      ? 'bg-primary-600 w-8'
                      : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-600 to-purple-700">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
            Ready to Transform Healthcare?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join thousands of healthcare providers and patients who trust 
            Multimedia EHR for their medical data management.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary-600 font-semibold rounded-xl hover:bg-slate-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
            >
              Start Free Trial
              <ArrowRightIcon className="w-5 h-5 ml-2" />
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-8 py-4 border-2 border-white text-white font-semibold rounded-xl hover:bg-white hover:text-primary-600 transition-all duration-300"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;