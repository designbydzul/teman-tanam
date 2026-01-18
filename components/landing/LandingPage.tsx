'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Plant, Drop, ChatCircleDots, CalendarCheck } from '@phosphor-icons/react';
import { colors, typography } from '@/styles/theme';

interface LandingPageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onLogin }) => {
  return (
    <div className="min-h-screen bg-white flex flex-col relative overflow-hidden font-sans mx-auto max-w-[480px] shadow-sm">
        {/* Navigation */}
        <nav className="flex justify-between items-center p-6 w-full z-10">
            <div className="flex items-center gap-2">
                <Plant size={32} weight="fill" color={colors.greenFresh} />
                <span className="text-xl font-bold" style={{ color: colors.greenForest, fontFamily: typography.fontFamilyAccent }}>
                    Teman Tanam
                </span>
            </div>
            <button
                onClick={onLogin}
                className="px-4 py-2 rounded-full text-sm font-medium transition-colors"
                style={{ color: colors.greenForest, backgroundColor: colors.greenLight }}
            >
                Masuk
            </button>
        </nav>

        {/* Hero Section */}
        <main className="flex-1 flex flex-col w-full px-6 pt-8 pb-20 z-10">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-center mb-12"
            >
                <h1 className="text-4xl font-bold mb-4 leading-tight" style={{ color: colors.greenForest }}>
                    Teman Setia <br />
                    <span style={{ color: colors.greenFresh }}>Perjalanan Berkebunmu</span>
                </h1>
                <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                    Rawat tanamanmu dengan mudah. Dapatkan pengingat harian dan konsultasi AI kapan saja.
                </p>
                <button
                    onClick={onGetStarted}
                    className="w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transform transition-transform active:scale-95"
                    style={{ backgroundColor: colors.greenFresh }}
                >
                    Mulai Sekarang
                </button>
            </motion.div>

            {/* Features */}
            <div className="grid gap-6">
                <FeatureCard
                    icon={<Drop size={32} color={colors.greenFresh} weight="duotone" />}
                    title="Jadwal Penyiraman"
                    description="Atur jadwal penyiraman dan pemupukan. Kami akan mengingatkanmu setiap hari."
                    delay={0.2}
                />
                <FeatureCard
                    icon={<ChatCircleDots size={32} color={colors.greenFresh} weight="duotone" />}
                    title="Tanya Tanam AI"
                    description="Punya masalah dengan tanaman? Foto atau tanya langsung ke AI kami."
                    delay={0.4}
                />
                <FeatureCard
                    icon={<CalendarCheck size={32} color={colors.greenFresh} weight="duotone" />}
                    title="Notifikasi WhatsApp"
                    description="Terima pengingat perawatan langsung di WhatsApp-mu. Tidak perlu buka aplikasi."
                    delay={0.6}
                />
            </div>
        </main>
        
        {/* Background Decor */}
         <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0 opacity-10">
            <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-green-500 blur-3xl" />
            <div className="absolute top-40 -left-20 w-72 h-72 rounded-full bg-yellow-500 blur-3xl" />
        </div>
    </div>
  );
};

const FeatureCard = ({ icon, title, description, delay }: { icon: React.ReactNode, title: string, description: string, delay: number }) => (
    <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay, duration: 0.5 }}
        className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4"
    >
        <div className="p-3 rounded-full bg-green-50">
            {icon}
        </div>
        <div>
            <h3 className="font-bold text-lg mb-1" style={{ color: colors.greenForest }}>{title}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">{description}</p>
        </div>
    </motion.div>
);

export default LandingPage;
