'use client';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import {
  Shield,
  CheckCircle,
  Globe,
  Lock,
  QrCode,
  Sparkles,
  GraduationCap,
  Building2,
  ArrowRight,
  Users,
  FileCheck,
  Zap,
  Eye,
  Database,
  Fingerprint,
  Network,
  Coins
} from 'lucide-react';

export default function Home() {
  const [showSolutions, setShowSolutions] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const router = useRouter();
  let closeTimeout: NodeJS.Timeout;

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsAuthenticated(!!session);
    if (session?.user) {
      setUserRole(session.user.user_metadata?.role || null);
    }
  };

  const handleDashboardClick = (e: React.MouseEvent, dashboardType: 'student' | 'institution') => {
    e.preventDefault();
    
    // Navigate to solution pages instead of dashboard
    if (dashboardType === 'student') {
      router.push('/solutions/students');
    } else {
      router.push('/solutions/institutions');
    }
  };

  const handleMouseEnter = () => {
    if (closeTimeout) clearTimeout(closeTimeout);
    setShowSolutions(true);
  };

  const handleMouseLeave = () => {
    closeTimeout = setTimeout(() => {
      setShowSolutions(false);
    }, 500); // Increased to 500ms delay before closing
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-teal-50 to-cyan-50">
      {/* Navigation */}
      <nav className="border-b border-gray-200 bg-white/90 backdrop-blur-lg sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-3">
                <Image
                  src="/logo.png"
                  alt="Acredia Logo"
                  width={40}
                  height={40}
                  className="rounded-lg"
                />
              <span className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                ACREDIA
              </span>
            </Link>
            <div className="flex items-center space-x-4">
              {/* Solutions Dropdown */}
              <div 
                className="relative"
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
              >
                <Button 
                  variant="ghost" 
                  className="text-gray-700 hover:text-teal-600 flex items-center gap-1"
                >
                  Solutions
                  <svg 
                    className={`w-4 h-4 transition-transform duration-200 ${showSolutions ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </Button>

                {/* Dropdown Menu */}
                {showSolutions && (
                  <div 
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-[95vw] sm:w-[500px] max-w-[500px] bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 sm:p-6 animate-in fade-in slide-in-from-top-5 duration-200"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                      {/* For Universities */}
                      <button 
                        onClick={(e) => handleDashboardClick(e, 'institution')}
                        className="group text-left w-full"
                      >
                        <div className="flex flex-col items-center space-y-2 sm:space-y-3 p-4 sm:p-6 rounded-xl hover:bg-teal-50 transition-all duration-300 border-2 border-transparent hover:border-teal-300 hover:shadow-lg">
                          <div className="bg-gradient-to-br from-teal-500 to-cyan-500 p-3 sm:p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <Building2 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                          </div>
                          <div className="text-center">
                            <h3 className="font-bold text-gray-900 mb-1 sm:mb-2 group-hover:text-teal-600 transition-colors text-base sm:text-lg">
                              For Institutions
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 px-2">
                              Issue and manage credentials for your students
                            </p>
                            <div className="inline-flex items-center gap-2 text-xs text-teal-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity bg-teal-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
                              Learn More
                              <ArrowRight className="w-3 h-3" />
                            </div>
                          </div>
                        </div>
                      </button>

                      {/* For Students */}
                      <button 
                        onClick={(e) => handleDashboardClick(e, 'student')}
                        className="group text-left w-full"
                      >
                        <div className="flex flex-col items-center space-y-2 sm:space-y-3 p-4 sm:p-6 rounded-xl hover:bg-cyan-50 transition-all duration-300 border-2 border-transparent hover:border-cyan-300 hover:shadow-lg">
                          <div className="bg-gradient-to-br from-cyan-500 to-blue-500 p-3 sm:p-4 rounded-2xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                            <GraduationCap className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                          </div>
                          <div className="text-center">
                            <h3 className="font-bold text-gray-900 mb-1 sm:mb-2 group-hover:text-cyan-600 transition-colors text-base sm:text-lg">
                              For Students
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3 px-2">
                              View and share your academic credentials
                            </p>
                            <div className="inline-flex items-center gap-2 text-xs text-cyan-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity bg-cyan-50 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
                              Learn More
                              <ArrowRight className="w-3 h-3" />
                            </div>
                          </div>
                        </div>
                      </button>
                    </div>

                    {/* Bottom CTA */}
                    <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
                        <div className="text-center sm:text-left">
                          <p className="text-sm font-semibold text-gray-900">
                            New to Acredia?
                          </p>
                          <p className="text-xs text-gray-600">
                            Join 500+ universities worldwide
                          </p>
                        </div>
                        <Link href="/auth/register">
                            <Button className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-xl transition-all text-sm sm:text-base w-full sm:w-auto">
                              Get Started
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                          </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Link href="/about">
                <Button variant="ghost" className="text-gray-700 hover:text-teal-600">
                  About
                </Button>
              </Link>
              <Link href="/auth/login">
                <Button variant="ghost" className="text-gray-700 hover:text-teal-600">
                  Sign In
                </Button>
              </Link>
              <Link href="/verify">
                <Button className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white">
                  <Shield className="w-4 h-4 mr-2" />
                  Verify
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-50/50 via-cyan-50/30 to-blue-50/50"></div>
        <div className="absolute top-20 right-0 w-96 h-96 bg-teal-200/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-200/20 rounded-full blur-3xl"></div>

        <div className="relative container mx-auto px-4 py-20 md:py-28">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left Content */}
            <div className="space-y-8 z-10">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-teal-200 text-teal-700 px-5 py-3 rounded-full text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></div>
                <Sparkles className="w-4 h-4" />
                <span>Blockchain-Powered Academic Credentials</span>
              </div>

              {/* Main Headline */}
              <div className="space-y-4">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight">
                  <span className="block text-gray-900">Transform</span>
                  <span className="block text-gray-900">Education</span>
                  <span className="block mt-2">
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-600 via-cyan-500 to-blue-600 animate-gradient">
                      Credentials
                    </span>
                  </span>
                </h1>

                <div className="flex items-center gap-3 flex-wrap">
                  <span className="inline-flex items-center gap-2 bg-teal-100 text-teal-700 px-3 py-1 rounded-full text-xs font-bold">
                    <Shield className="w-3 h-3" />
                    SECURE
                  </span>
                  <span className="inline-flex items-center gap-2 bg-cyan-100 text-cyan-700 px-3 py-1 rounded-full text-xs font-bold">
                    <Lock className="w-3 h-3" />
                    VERIFIED
                  </span>
                  <span className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">
                    <Globe className="w-3 h-3" />
                    GLOBAL
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xl text-gray-600 leading-relaxed max-w-xl">
                Issue, verify, and manage <span className="font-bold text-teal-600">tamper-proof</span> academic
                credentials on the blockchain with <span className="font-bold text-cyan-600">Soulbound NFTs</span>,
                <span className="font-bold text-blue-600"> Zero-Knowledge Proofs</span>, and AI verification.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/auth/register?role=institution" className="group">
                  <Button size="lg" className="w-full sm:w-auto bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white px-10 py-7 text-lg font-bold shadow-2xl hover:shadow-teal-500/50 transition-all duration-300 hover:scale-105">
                    <Building2 className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
                    Get Started Now
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/about" className="group">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto border-2 border-gray-300 hover:border-teal-600 text-gray-700 hover:text-teal-600 hover:bg-teal-50 px-10 py-7 text-lg font-bold transition-all duration-300">
                    Learn More
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>

              {/* Stats Bar */}
              <div className="flex items-center gap-8 pt-8 border-t-2 border-gray-200">
                <div className="flex-1">
                  <div className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-cyan-600">500+</div>
                  <div className="text-sm text-gray-500 font-semibold mt-1">Universities</div>
                </div>
                <div className="w-px h-12 bg-gray-300"></div>
                <div className="flex-1">
                  <div className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 to-blue-600">1M+</div>
                  <div className="text-sm text-gray-500 font-semibold mt-1">Credentials</div>
                </div>
                <div className="w-px h-12 bg-gray-300"></div>
                <div className="flex-1">
                  <div className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">150+</div>
                  <div className="text-sm text-gray-500 font-semibold mt-1">Countries</div>
                </div>
              </div>
            </div>

            {/* Right Visual - Professional Image Display */}
            <div className="relative lg:h-[600px] flex items-center justify-center">
              {/* Floating Elements Background */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-full h-full">
                  {/* Main Hero Image - Full width integration */}
                  <div className="relative w-full h-full flex items-center justify-center">
                    <Image
                      src="/hero image.webp"
                      alt="Acredia Platform Showcase"
                      width={800}
                      height={600}
                      className="w-full h-full object-contain drop-shadow-2xl"
                      priority
                    />
                  </div>

                  {/* Floating Feature Cards - Minimal and elegant */}
                  <div className="absolute top-8 left-4 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-4 border border-teal-200/50 hover:scale-105 transition-all duration-300 animate-float">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-teal-500 to-cyan-500 p-3 rounded-xl shadow-lg">
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">Blockchain</div>
                        <div className="text-xs text-gray-500">Secured</div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute top-1/4 right-0 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-4 border border-cyan-200/50 hover:scale-105 transition-all duration-300 animate-float-delayed">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-cyan-500 to-blue-500 p-3 rounded-xl shadow-lg">
                        <Fingerprint className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">NFT</div>
                        <div className="text-xs text-gray-500">Verified</div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-1/3 left-0 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-4 border border-purple-200/50 hover:scale-105 transition-all duration-300 animate-float">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-3 rounded-xl shadow-lg">
                        <Eye className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">Zero-Knowledge</div>
                        <div className="text-xs text-gray-500">Private</div>
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-8 right-8 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-4 border border-green-200/50 hover:scale-105 transition-all duration-300 animate-float-delayed">
                    <div className="flex items-center gap-3">
                      <div className="bg-gradient-to-br from-green-500 to-emerald-500 p-3 rounded-xl shadow-lg">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900">Instant</div>
                        <div className="text-xs text-gray-500">Verified</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Add custom animations in globals.css */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 6s ease-in-out infinite 1s;
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 6s ease infinite;
        }
        /* Marquee animation for trust badges */
        .trust-marquee {
          display: flex;
          gap: 1rem;
          align-items: center;
          animation: marquee 16s linear infinite;
          will-change: transform;
        }
        .trust-marquee:hover {
          animation-play-state: paused;
        }
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
      `}</style>

      {/* Trust Badges - Animated Horizontal Marquee */}
      <section className="bg-white py-12 border-y border-gray-200">
        <div className="container mx-auto px-4">
          <div className="text-center mb-6">
            <p className="text-sm text-gray-500 uppercase tracking-wide font-semibold">
              Trusted by Leading Universities Worldwide
            </p>
          </div>

          <div className="overflow-hidden">
            <div className="trust-marquee flex items-center gap-8 py-4">
              {/* Repeat the logo set twice so the animation loops seamlessly */}
              <div className="flex items-center gap-8">
                <div className="min-w-[200px] flex items-center justify-center">
                  <Image src="https://tse3.mm.bing.net/th/id/OIP.7bACtsXUKPDhBOuidawTTwHaGr?pid=Api&P=0&h=180" alt="MIT" width={160} height={140} className="object-contain h-20" unoptimized />
                </div>
                <div className="min-w-[200px] flex items-center justify-center">
                  <Image src="https://www.scholarshipregion.com/wp-content/uploads/2022/09/University-of-Oxford-UK.jpg" alt="Oxford" width={160} height={140} className="object-contain h-20" unoptimized />
                </div>
                <div className="min-w-[200px] flex items-center justify-center">
                  <Image src="https://tse1.mm.bing.net/th/id/OIP.xHMtPAL900IBFxWZBfM6gAHaEp?pid=Api&P=0&h=180" alt="Stanford" width={160} height={140} className="object-contain h-20" unoptimized />
                </div>
                <div className="min-w-[200px] flex items-center justify-center">
                  <Image src="https://tse4.mm.bing.net/th/id/OIP.7YBhBgFBg-bpAgV5kpJ0AwHaEL?pid=Api&P=0&h=180" alt="Harvard" width={160} height={140} className="object-contain h-20" unoptimized />
                </div>
                <div className="min-w-[200px] flex items-center justify-center">
                  <Image src="https://tse3.mm.bing.net/th/id/OIP.cJonBR8WAhleDoeIvPHtDQHaEK?pid=Api&P=0&h=180" alt="Cambridge" width={160} height={140} className="object-contain h-20" unoptimized />
                </div>
                <div className="min-w-[200px] flex items-center justify-center">
                  <Image src="https://tse3.mm.bing.net/th/id/OIP.6_BcDwnHtQHpmB0zsZW6JwHaDe?pid=Api&P=0&h=180" alt="IIT" width={160} height={140} className="object-contain h-20" unoptimized />
                </div>
              </div>

              {/* duplicate */}
              <div className="flex items-center gap-8">
                <div className="min-w-[200px] flex items-center justify-center">
                  <Image src="https://tse3.mm.bing.net/th/id/OIP.7bACtsXUKPDhBOuidawTTwHaGr?pid=Api&P=0&h=180" alt="MIT" width={160} height={140} className="object-contain h-20" unoptimized />
                </div>
                <div className="min-w-[200px] flex items-center justify-center">
                  <Image src="https://www.scholarshipregion.com/wp-content/uploads/2022/09/University-of-Oxford-UK.jpg" alt="Oxford" width={160} height={140} className="object-contain h-20" unoptimized />
                </div>
                <div className="min-w-[200px] flex items-center justify-center">
                  <Image src="https://tse1.mm.bing.net/th/id/OIP.xHMtPAL900IBFxWZBfM6gAHaEp?pid=Api&P=0&h=180" alt="Stanford" width={160} height={140} className="object-contain h-20" unoptimized />
                </div>
                <div className="min-w-[200px] flex items-center justify-center">
                  <Image src="https://tse4.mm.bing.net/th/id/OIP.7YBhBgFBg-bpAgV5kpJ0AwHaEL?pid=Api&P=0&h=180" alt="Harvard" width={160} height={140} className="object-contain h-20" unoptimized />
                </div>
                <div className="min-w-[200px] flex items-center justify-center">
                  <Image src="https://tse3.mm.bing.net/th/id/OIP.cJonBR8WAhleDoeIvPHtDQHaEK?pid=Api&P=0&h=180" alt="Cambridge" width={160} height={140} className="object-contain h-20" unoptimized />
                </div>
                <div className="min-w-[200px] flex items-center justify-center">
                  <Image src="https://tse3.mm.bing.net/th/id/OIP.6_BcDwnHtQHpmB0zsZW6JwHaDe?pid=Api&P=0&h=180" alt="IIT" width={160} height={140} className="object-contain h-20" unoptimized />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section id="features" className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Complete Blockchain Credential Ecosystem
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Four integrated modules powering secure, verifiable, and globally recognized academic credentials
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <Card className="bg-white border border-gray-200 p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="bg-gradient-to-br from-teal-500 to-cyan-500 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Institution Dashboard
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Upload credentials, mint NFTs to blockchain, and manage student records with
              IPFS storage integration
            </p>
          </Card>

          <Card className="bg-white border border-gray-200 p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="bg-gradient-to-br from-cyan-500 to-blue-500 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Student Web Wallet
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Personal credential wallet with QR code generation, selective disclosure,
              and lifetime ownership
            </p>
          </Card>

          <Card className="bg-white border border-gray-200 p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              Verification Portal
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Public verification interface for employers and agencies to instantly verify
              credentials via QR or wallet
            </p>
          </Card>

          <Card className="bg-white border border-gray-200 p-8 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="bg-gradient-to-br from-orange-500 to-red-500 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
              <Database className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">
              AI Credential Engine
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Intelligent OCR and NLP for credential processing, university matching,
              and fraud detection
            </p>
          </Card>
        </div>
      </section>

      {/* Advanced Features */}
      <section className="bg-white py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Advanced Technology Stack
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built on cutting-edge blockchain and AI technologies for unmatched security
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border border-gray-200 p-8 hover:shadow-xl transition-all">
              <div className="bg-gradient-to-br from-violet-500 to-purple-500 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                <Fingerprint className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Soulbound NFTs
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Non-transferable ERC-721 credentials permanently bound to students,
                ensuring true ownership and preventing fraud or resale.
              </p>
              <div className="text-sm text-teal-600 font-medium">ERC-721 Standard</div>
            </Card>

            <Card className="border border-gray-200 p-8 hover:shadow-xl transition-all">
              <div className="bg-gradient-to-br from-cyan-500 to-blue-500 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                <Eye className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Zero-Knowledge Proofs
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Verify credentials without revealing sensitive information using zkSNARKs
                cryptography for privacy-preserving verification.
              </p>
              <div className="text-sm text-teal-600 font-medium">zkSNARKs Powered</div>
            </Card>

            <Card className="border border-gray-200 p-8 hover:shadow-xl transition-all">
              <div className="bg-gradient-to-br from-pink-500 to-rose-500 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
                <Database className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                AI Matching Engine
              </h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                Machine learning OCR and NLP processing for automated credential validation
                and global university database matching.
              </p>
              <div className="text-sm text-teal-600 font-medium">ML-Powered</div>
            </Card>
          </div>
        </div>
      </section>

      {/* W3C Compliance */}
      <section className="relative py-24 overflow-hidden">
        {/* Transparent Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#0C8B8C]/20 via-[#0E9C9D]/20 to-[#00B8C0]/20 backdrop-blur-sm"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="max-w-2xl">
              <FileCheck className="w-16 h-16 mx-auto lg:mx-0 mb-6 text-gray-900" />
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 text-center lg:text-left">
                Fully Compliant & Standards-Based
              </h2>
              <p className="text-xl text-gray-700 mb-12 text-center lg:text-left">
                Acredia adheres to international standards ensuring global acceptance
                and regulatory compliance
              </p>

              <div className="grid grid-cols-2 gap-6">
                <div className="bg-white/60 backdrop-blur-md rounded-xl p-6 border border-gray-300/50 hover:bg-white/80 hover:shadow-xl transition-all">
                  <div className="text-3xl font-bold mb-2 text-gray-900">W3C</div>
                  <div className="text-sm text-gray-700 font-medium">Verifiable Credentials</div>
                </div>
                <div className="bg-white/60 backdrop-blur-md rounded-xl p-6 border border-gray-300/50 hover:bg-white/80 hover:shadow-xl transition-all">
                  <div className="text-3xl font-bold mb-2 text-gray-900">NAD</div>
                  <div className="text-sm text-gray-700 font-medium">Academic Bank</div>
                </div>
                <div className="bg-white/60 backdrop-blur-md rounded-xl p-6 border border-gray-300/50 hover:bg-white/80 hover:shadow-xl transition-all">
                  <div className="text-3xl font-bold mb-2 text-gray-900">ABC</div>
                  <div className="text-sm text-gray-700 font-medium">Credit Framework</div>
                </div>
                <div className="bg-white/60 backdrop-blur-md rounded-xl p-6 border border-gray-300/50 hover:bg-white/80 hover:shadow-xl transition-all">
                  <div className="text-3xl font-bold mb-2 text-gray-900">NEP 2020</div>
                  <div className="text-sm text-gray-700 font-medium">Education Policy</div>
                </div>
              </div>
            </div>

            {/* Right Video */}
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl border-4 border-white/40 hover:border-white/60 transition-all">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-auto"
                >
                  <source
                    src="https://res.cloudinary.com/dmys4qhqv/video/upload/v1763193319/Image_Recreation_To_Video_Generation_tovxfr.mp4"
                    type="video/mp4"
                  />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="bg-gradient-to-br from-gray-50 to-teal-50 rounded-3xl p-12 md:p-16 text-center border border-gray-200">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Ready to Transform Academic Credentials?
          </h2>
          <p className="text-xl text-gray-600 mb-10 max-w-2xl mx-auto">
            Join 500+ universities worldwide using Acredia for secure, blockchain-verified credentials
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register?role=institution">
              <Button size="lg" className="bg-linear-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white px-10 py-6 text-lg">
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link href="/verify">
              <Button size="lg" variant="outline" className="border-2 border-gray-300 hover:bg-gray-100 px-10 py-6 text-lg">
                <Shield className="w-5 h-5 mr-2" />
                Try Verification Demo
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <Image
                  src="/logo.png"
                  alt="Acredia Logo"
                  width={32}
                  height={32}
                  className="rounded-lg"
                />
                <span className="text-xl font-bold">ACREDIA</span>
              </div>
              <p className="text-gray-400 text-sm">
                Blockchain-powered academic credentials for the future of education
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link href="/verify" className="hover:text-white transition-colors">Verification</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">API Docs</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Pricing</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors">Privacy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Terms</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Security</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Compliance</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2025 Acredia. Innovate & Trust. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
