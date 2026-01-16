'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Plant,
  Drop,
  Camera,
  ChartBar,
  ChatCircleDots,
  Bell,
  Check,
  CaretRight,
  GearSix,
  Sun,
  Users,
  Timer,
  Scan,
  CloudSun
} from '@phosphor-icons/react';
import { colors, radius, typography, shadows, transitions } from '@/styles/theme';

export default function LandingPage() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push('/?auth=true');
  };

  return (
    <div className="landing-page">
      {/* Navbar */}
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-logo">
            <span className="logo-text">Teman Tanam</span>
          </div>
          <button className="nav-auth-btn" onClick={handleGetStarted}>
            Masuk
          </button>
        </div>
      </nav>

      {/* Hero Section - Split Layout */}
      <section className="hero-section">
        <div className="hero-container">
          <motion.div
            className="hero-text-side"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >


            <h1 className="hero-title">
              Jaga Tanamanmu <br />
              Tetap <span className="highlight-text">Hidup & Subur</span>
            </h1>

            <p className="hero-subtitle">
              Tidak ada lagi tanaman layu. Dapatkan jadwal penyiraman,
              identifikasi penyakit, dan panduan perawatan dalam satu saku.
            </p>

            <div className="hero-cta-group">
              <motion.button
                className="btn-primary-lg"
                onClick={handleGetStarted}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Coba Sekarang
              </motion.button>
            </div>
          </motion.div>

          {/* Desktop: Phone Mockup / Mobile: Shown below */}
          <motion.div
            className="hero-visual-side"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          >
            <div className="phone-mockup-wrapper">
              <div className="floating-card water-card">
                <div className="fc-icon"><Drop weight="fill" /></div>
                <div className="fc-content">
                  <div className="fc-title">Waktunya Menyiram!</div>
                  <div className="fc-subtitle">Monstera Deliciosa</div>
                </div>
                <div className="fc-time">Sekarang</div>
              </div>

              <div className="phone-mockup">
                <div className="mockup-frame">
                  <div className="mockup-notch"></div>
                  <div className="mockup-screen">
                    {/* App Header */}
                    <div className="app-header">
                      <div className="app-greeting">Halo, Teman! 👋</div>
                      <div className="app-avatar">T</div>
                    </div>

                    {/* App Stats */}
                    <div className="app-stats">
                      <div className="stat-item active">
                        <div className="stat-label">Jadwal Hari Ini</div>
                        <div className="stat-value">2 Tanaman</div>
                      </div>
                    </div>

                    {/* App Content */}
                    <div className="app-content-area">
                      <div className="plant-reminder-card warning">
                        <div className="pr-icon"><Drop weight="fill" /></div>
                        <div className="pr-info">
                          <div className="pr-name">Monstera</div>
                          <div className="pr-action">Perlu disiram</div>
                        </div>
                        <div className="pr-check"><Check /></div>
                      </div>

                      <div className="plant-reminder-card">
                        <div className="pr-icon"><Sun weight="fill" /></div>
                        <div className="pr-info">
                          <div className="pr-name">Kaktus Mini</div>
                          <div className="pr-action">Cek sinar matahari</div>
                        </div>
                        <div className="pr-check"><Check /></div>
                      </div>

                      <div className="mini-chart">
                        <div className="chart-bar h-60"></div>
                        <div className="chart-bar h-80"></div>
                        <div className="chart-bar h-40"></div>
                        <div className="chart-bar h-90 active"></div>
                        <div className="chart-bar h-50"></div>
                      </div>
                    </div>

                    {/* App Nav */}
                    <div className="app-nav">
                      <div className="nav-item active"><Plant weight="fill" /></div>
                      <div className="nav-item"><Scan /></div>
                      <div className="nav-item"><ChatCircleDots /></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>



      {/* CSS Styles - Using hardcoded values for safety/reliability */}
      <style jsx>{`
        /* --- GLOBAL --- */
        .landing-page {
          width: 100%;
          background-color: #FAFAF9; /* Cream/Stone light */
          color: #2D5016; /* Forest Green */
          font-family: 'Inter', sans-serif;
          overflow-x: hidden;
        }
        
        /* Navbar */
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          padding: 1rem 0;
          background: rgba(250, 250, 249, 0.9);
          backdrop-filter: blur(10px);
          z-index: 50;
        }
        .nav-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .nav-logo {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          color: #2D5016;
        }
        .logo-text {
          font-family: var(--font-caveat), cursive;
          font-size: 1.75rem;
          font-weight: 700;
        }
        .logo-img { width: 32px; height: 32px; border-radius: 8px; }
        .nav-auth-btn {
          background: transparent;
          color: #2D5016;
          font-weight: 600;
          padding: 0.5rem 1rem;
          border: 1px solid #2D5016;
          border-radius: 8px;
          cursor: pointer;
          transition: 0.2s;
        }
        .nav-auth-btn:hover { background: #2D5016; color: white; }

        /* --- HERO --- */
        .hero-section {
          padding-top: 6rem; /* space for navbar */
          padding-bottom: 4rem;
          min-height: 90vh; /* Full viewport height mostly */
          display: flex;
          align-items: center;
          position: relative;
          background: linear-gradient(180deg, #FAFAF9 0%, #F1F8E9 100%);
        }
        
        .hero-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 1.5rem;
          display: grid;
          grid-template-columns: 1fr;
          gap: 3rem;
          width: 100%;
        }

        .hero-text-side {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center; /* Centered on mobile */
          text-align: center; /* Mobile default */
          z-index: 2;
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          background: #E8F5E9;
          color: #2D5016;
          padding: 0.5rem 1rem;
          border-radius: 20px;
          font-size: 0.875rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
          align-self: center; /* Mobile default */
        }
        .badge-dot { width: 8px; height: 8px; background: #7CB342; border-radius: 50%; }

        .hero-title {
          font-family: var(--font-caveat), cursive;
          font-size: 4rem; /* Larger for Caveat */
          line-height: 1;
          font-weight: 700;
          margin: 0 auto 1.5rem; /* Centered block */
          text-align: center; /* Centered text */
          letter-spacing: -0.01em;
        }
        .highlight-text { color: #7CB342; }

        .hero-subtitle {
          font-size: 1.125rem;
          color: #555;
          margin: 0 auto 2.5rem; /* Centered with auto margins */
          line-height: 1.6;
          max-width: 500px;
          align-self: center; /* Mobile default */
          text-align: center;
        }

        .hero-cta-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .btn-primary-lg {
          background: #2D5016;
          color: white;
          padding: 1rem 2rem;
          border-radius: 12px;
          font-size: 1.125rem;
          font-weight: 600;
          border: none;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(45, 80, 22, 0.3);
          width: 100%;
          max-width: 300px;
        }

        .cta-note {
          font-size: 0.875rem;
          color: #777;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .stars { color: #FBC02D; letter-spacing: 2px; }

        /* Hero Visual (Phone) */
        .hero-visual-side {
          display: flex;
          justify-content: center;
          position: relative;
        }
        
        .phone-mockup-wrapper {
          position: relative;
          z-index: 10;
        }

        .floating-card {
           position: absolute;
           background: white;
           padding: 0.75rem;
           border-radius: 12px;
           box-shadow: 0 10px 25px rgba(0,0,0,0.1);
           display: flex;
           align-items: center;
           gap: 0.75rem;
           z-index: 20;
           min-width: 200px;
           animation: float 4s ease-in-out infinite;
        }
        .water-card {
          top: 15%;
          left: -40px;
        }
        
        .fc-icon {
          width: 36px; height: 36px;
          background: #E3F2FD; color: #2196F3;
          border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
        }
        .fc-content { flex: 1; }
        .fc-title { font-size: 0.875rem; font-weight: 700; color: #333; }
        .fc-subtitle { font-size: 0.75rem; color: #777; }
        .fc-time { font-size: 0.75rem; font-weight: 600; color: #2196F3; }

        /* Mockup Styles Reused/Refined */
        .phone-mockup {
          width: 280px;
          margin: 0 auto;
        }
        .mockup-frame {
          background: #2D2D2D;
          border-radius: 40px;
          padding: 10px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
        }
        .mockup-screen {
          background: #F5F5F5;
          border-radius: 30px;
          overflow: hidden;
          height: 560px;
          display: flex;
          flex-direction: column;
        }
        
        .app-header {
           padding: 1.5rem 1rem 1rem;
           background: white;
           display: flex; justify-content: space-between; align-items: center;
        }
        .app-greeting { font-weight: 700; color: #2D5016; }
        .app-avatar { width: 32px; height: 32px; background: #7CB342; border-radius: 50%; color: white; display: flex; align-items: center; justify-content: center; font-size: 12px;}
        
        .app-stats { padding: 0 1rem; margin-bottom: 1rem; }
        .stat-item.active { background: #2D5016; color: white; padding: 0.75rem; border-radius: 12px; }
        .stat-label { font-size: 0.75rem; opacity: 0.8; margin-bottom: 0.25rem;}
        .stat-value { font-size: 1rem; font-weight: 700; }
        
        .app-content-area { flex: 1; padding: 1rem; display: flex; flex-direction: column; gap: 1rem; }
        
        .plant-reminder-card {
           background: white; padding: 0.75rem; border-radius: 12px;
           display: flex; align-items: center; gap: 0.75rem;
           box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }
        .plant-reminder-card.warning { border-left: 4px solid #FFA000; }
        
        .pr-icon { width: 32px; height: 32px; background: #E3F2FD; color:#2196F3; border-radius: 8px; display:flex; align-items: center; justify-content:Center; font-size: 1rem;}
        .warning .pr-icon { background: #FFF3E0; color: #FFA000; }
        
        .pr-info { flex: 1; }
        .pr-name { font-size: 0.875rem; font-weight: 600; color: #333; }
        .pr-action { font-size: 0.75rem; color: #777; }
        
        .mini-chart { display: flex; align-items: flex-end; gap: 6px; height: 40px; margin-top: auto; padding: 1rem;}
        .chart-bar { flex: 1; background: #E0E0E0; border-radius: 4px; }
        .chart-bar.active { background: #7CB342; }
        .h-60 { height: 60%; } .h-80 { height: 80%; } .h-40 { height: 40%; } .h-90 { height: 90%; } .h-50 { height: 50%; }

        .app-nav {
           background: white; padding: 1rem; display: flex; justify-content: space-around;
           border-top: 1px solid #eee;
        }
        .nav-item { color: #bbb; font-size: 1.5rem; }
        .nav-item.active { color: #2D5016; }


        /* --- FEATURES (BENTO) --- */
        .features-section {
          padding: 4rem 1.5rem;
          background: white;
        }
        .section-header-center {
          text-align: center;
          max-width: 600px;
          margin: 0 auto 3rem;
        }
        .section-title { font-size: 2rem; font-weight: 700; color: #2D5016; margin-bottom: 0.5rem; }
        .section-subtitle { font-size: 1rem; color: #666; }

        .bento-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1.5rem;
          max-width: 1000px;
          margin: 0 auto;
        }
        
        .bento-card {
          background: #FAFAF9;
          border-radius: 24px;
          padding: 2rem;
          border: 1px solid #EEE;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          overflow: hidden;
          position: relative;
        }
        
        .card-large { grid-column: auto; }

        .icon-box {
          width: 48px; height: 48px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 1.5rem; margin-bottom: 1rem;
        }
        .green { background: #E8F5E9; color: #2E7D32; }
        .yellow { background: #FFFDE7; color: #FBC02D; }
        .orange { background: #FFF3E0; color: #EF6C00; }
        .blue { background: #E3F2FD; color: #1565C0; }

        .card-text h3 { font-size: 1.25rem; font-weight: 700; margin-bottom: 0.5rem; color: #333; }
        .card-text p { font-size: 0.9rem; color: #666; line-height: 1.5; }

        .card-visual {
           background: white;
           border-radius: 16px;
           padding: 1rem;
           box-shadow: 0 4px 10px rgba(0,0,0,0.05);
           display: flex; justify-content: center; align-items: center;
           min-height: 120px;
        }
        
        /* Visual specific styles */
        .visual-notification {
           display: flex; gap: 0.75rem; align-items: center; width: 100%;
        }
        .vn-icon { width: 40px; height: 40px; background: #E8F5E9; border-radius: 50%; color: #2D5016; display: flex; align-items: center; justify-content: center; }
        .vn-text { flex: 1; }
        .vn-title { font-weight: 600; font-size: 0.9rem; }
        .vn-sub { font-size: 0.75rem; color: #888; }
        
        .scan-frame {
           border: 2px dashed #FBC02D;
           border-radius: 12px;
           padding: 1.5rem;
           position: relative;
        }
        .scan-target { font-size: 2rem; color: #2D5016; }
        .scan-line { position: absolute; top: 10px; left: 0; right: 0; height: 2px; background: #FBC02D; animation: scan 2s infinite; }

        /* --- STEPS --- */
        .steps-section {
          padding: 4rem 1.5rem;
          background: #2D5016;
          color: white;
        }
        .steps-section .section-title { color: white; margin-bottom: 3rem; }
        
        .steps-row {
          display: flex;
          flex-direction: column;
          gap: 2rem;
          align-items: center;
        }
        .step-item { text-align: center; flex: 1; }
        .step-number {
           width: 40px; height: 40px; border: 2px solid #7CB342; border-radius: 50%;
           display: flex; align-items: center; justify-content: center;
           margin: 0 auto 1rem; font-weight: 700; color: #7CB342;
        }
        .step-item h3 { font-size: 1.1rem; margin-bottom: 0.5rem; }
        .step-item p { font-size: 0.9rem; opacity: 0.8; }
        .step-arrow { display: none; color: #7CB342; font-size: 1.5rem; }

        /* --- CTA FOOTER --- */
        .cta-footer {
           padding: 5rem 1.5rem;
           text-align: center;
           background: #F1F8E9;
        }
        .cta-footer h2 { font-size: 2rem; font-weight: 800; color: #2D5016; margin-bottom: 1rem; }
        .cta-footer p { font-size: 1.1rem; color: #555; margin-bottom: 2rem; }
        .btn-white-lg {
           background: #2D5016; color: white;
           padding: 1rem 2.5rem;
           font-size: 1.1rem;
           font-weight: 600;
           border: none;
           border-radius: 12px;
           cursor: pointer;
           box-shadow: 0 4px 12px rgba(45, 80, 22, 0.2);
           transition: 0.2s;
        }
        .btn-white-lg:hover { background: #1B330C; }

        .simple-footer {
           padding: 2rem;
           text-align: center;
           background: #FAFAF9;
           border-top: 1px solid #EEE;
           font-size: 0.875rem;
           color: #888;
        }
        .footer-links { display: flex; justify-content: center; gap: 1.5rem; }
        .footer-links a { color: #888; text-decoration: none; }

        /* --- MEDIA QUERIES --- */
        @media (min-width: 768px) {
           .hero-section { min-height: 100vh; padding-top: 0; }
           .hero-container {
              grid-template-columns: 1fr 1fr;
              align-items: center;
           }
            .hero-text-side {
               text-align: left;
               align-items: flex-start;
            }
            .hero-title {
               text-align: left;
               margin: 0 0 1.5rem;
            }
            .hero-subtitle {
               text-align: left;
               margin: 0 0 2.5rem;
               align-self: flex-start;
            }
            .hero-badge { align-self: flex-start; }
            .hero-cta-group { align-items: flex-start; }
           
           .bento-grid {
              grid-template-columns: repeat(2, 1fr);
           }
           .card-large { grid-column: span 2; display: flex; flex-direction: row; align-items: center; }
           .card-large .card-text { flex: 1; }
           .card-large .card-visual { flex: 1; height: 100%; min-height: auto; }
           
           .steps-row { flex-direction: row; }
           .step-arrow { display: block; }
        }

        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        @keyframes scan {
          0% { top: 10px; opacity: 0.5; }
          50% { top: 80%; opacity: 1; }
          100% { top: 10px; opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
