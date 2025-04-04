'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FiArrowRight, FiBookOpen, FiUsers, FiAward } from 'react-icons/fi';
import ThemeToggle from '../components/ThemeToggle';

export default function HomePage() {
  const [scrollY, setScrollY] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header/Navigation */}
      <header className="fixed w-full z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-accent-500 bg-clip-text text-transparent">
                Gurukul
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Link href="/login" className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                Log in
              </Link>
              <Link href="/register" className="btn-gradient">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        {/* Parallax Background */}
        <div 
          className="absolute inset-0 z-0"
          style={{
            transform: `translateY(${scrollY * 0.5}px)`,
            transition: 'transform 0.1s ease-out',
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary-100/40 to-accent-100/40 dark:from-primary-900/20 dark:to-accent-900/20"></div>
          
          {/* Animated geometric shapes */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary-400/10 dark:bg-primary-400/5 animate-pulse-slow"></div>
          <div className="absolute bottom-1/3 right-1/3 w-48 h-48 rounded-full bg-accent-400/10 dark:bg-accent-400/5 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 right-1/4 w-32 h-32 rounded-full bg-primary-300/10 dark:bg-primary-300/5 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-8"
          >
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white">
              Learn Without Limits
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Discover a new way of learning with our interactive courses designed to help you master new skills at your own pace.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/courses" className="btn-gradient flex items-center justify-center gap-2 text-lg">
                Explore Courses <FiArrowRight />
              </Link>
              <Link href="/about" className="px-6 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 text-lg">
                Learn More
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl font-bold text-gray-900 dark:text-white"
            >
              Why Choose Gurukul?
            </motion.h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                icon: <FiBookOpen className="h-8 w-8 text-primary-500" />, 
                title: "Diverse Courses", 
                description: "Access a wide range of courses crafted by industry experts." 
              },
              { 
                icon: <FiUsers className="h-8 w-8 text-accent-500" />, 
                title: "Community Learning", 
                description: "Connect with peers and instructors in our vibrant learning community." 
              },
              { 
                icon: <FiAward className="h-8 w-8 text-primary-500" />, 
                title: "Recognized Certifications", 
                description: "Earn certificates that are recognized by top employers." 
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="card-minimal hover-lift flex flex-col items-center text-center p-8"
              >
                <div className="mb-4 p-3 rounded-full bg-primary-50 dark:bg-gray-800">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary-500 to-accent-500 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">Ready to start your learning journey?</h2>
          <p className="text-xl mb-8 opacity-90">Join thousands of students who are already transforming their careers</p>
          <Link href="/register" className="px-8 py-3 bg-white text-primary-600 rounded-lg font-medium hover:bg-gray-100 transition-colors inline-flex items-center gap-2">
            Get Started Today <FiArrowRight />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-gray-900 pt-16 pb-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Gurukul</h3>
              <p className="text-gray-600 dark:text-gray-400">Transforming education through technology and innovation.</p>
            </div>
            {[
              { 
                title: "Learn", 
                links: ["Courses", "Tutorials", "Workshops", "Webinars"] 
              },
              { 
                title: "Connect", 
                links: ["Community", "Events", "Forum", "Blog"] 
              },
              { 
                title: "About", 
                links: ["Our Story", "Careers", "Press", "Contact"] 
              }
            ].map((column, index) => (
              <div key={index}>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{column.title}</h3>
                <ul className="space-y-2">
                  {column.links.map((link, i) => (
                    <li key={i}>
                      <Link href="#" className="text-gray-600 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 transition-colors">
                        {link}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-200 dark:border-gray-800 pt-6">
            <p className="text-center text-gray-600 dark:text-gray-400 text-sm">
              © {new Date().getFullYear()} Gurukul. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
} 