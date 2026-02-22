import { useState, useRef } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const WA_LINK = 'https://wa.me/628817743613';

export default function LandingPage() {
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const serviceCardsRef = useRef<HTMLDivElement>(null);

  const scrollToServices = () => {
    serviceCardsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const toggleCard = (cardId: string) => {
    setExpandedCard(expandedCard === cardId ? null : cardId);
  };

  return (
    <div className="min-h-screen bg-[#FAFBFD] relative overflow-hidden">
      {/* Subtle gradient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-cyan-50/30 via-transparent to-blue-50/30" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Navbar */}
        <nav className="w-full py-4 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center">
              <img src="/assets/asistenku-icon.png" alt="Asistenku" className="h-10 w-auto" />
            </div>
            <div className="flex items-center gap-6 text-sm">
              <a href="/partner-portal" className="text-[#475569] hover:text-[#0F172A] transition-colors">
                Partner Portal
              </a>
              <a href="/clientregister" className="text-[#475569] hover:text-[#0F172A] transition-colors">
                Masuk Client
              </a>
              <a href="/clientregister" className="text-[#475569] hover:text-[#0F172A] transition-colors">
                Daftar Client
              </a>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="w-full px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-center gap-12">
              {/* Left Column */}
              <div className="flex-1 space-y-6">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#0F172A] leading-tight">
                  Kerja tetap berjalan. Hidup tetap tenang.
                </h1>
                <div className="space-y-4">
                  <p className="text-lg text-[#475569]">
                    Asistenku adalah sistem pendampingan dalam pengaturan delegasi tugas.
                  </p>
                  <p className="text-lg text-[#475569]">
                    Kami menjaga setiap layanan agar tetap berjalan dengan kualitas terbaik.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <button
                    onClick={scrollToServices}
                    className="px-8 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-900 transition-colors"
                  >
                    Pilih Layanan
                  </button>
                  <a
                    href={WA_LINK}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-8 py-3 border-2 border-black text-black rounded-full font-medium hover:bg-black hover:text-white transition-colors text-center"
                  >
                    Ngobrol dulu
                  </a>
                </div>
              </div>

              {/* Right Column - Hero Image */}
              <div className="flex-1 w-full">
                <img
                  src="/assets/heroimagenew.png"
                  alt="Asistenku Hero"
                  className="w-full h-auto rounded-3xl shadow-lg"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section: Bagaimana Kami Mendampingi */}
        <section className="w-full px-4 sm:px-6 lg:px-8 py-16 bg-white/50">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0F172A]">Bagaimana Kami Mendampingi</h2>
            <div className="space-y-4 text-lg text-[#475569]">
              <p>Sampaikan kebutuhan Anda.</p>
              <p>Asistenmu menyusunnya menjadi brief yang jelas dan terstruktur.</p>
              <p>Partner yang tepat dipilih dan dikelola.</p>
              <p>Hasil diperiksa sebelum sampai ke Anda.</p>
            </div>
            <p className="text-xl font-medium text-[#0F172A] pt-4">
              Anda tidak lagi mengelola orang dan proses. Anda hanya mengelola keputusan.
            </p>
          </div>
        </section>

        {/* Section: Tepat Tanpa Kehilangan Waktu */}
        <section className="w-full px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold text-[#0F172A]">Tepat Tanpa Kehilangan Waktu</h2>
            <p className="text-lg text-[#475569]">
              Kami menjaga ketepatan. Dalam kebutuhan mendesak, struktur kami memungkinkan pekerjaan dijalankan
              secara paralel tanpa kehilangan kontrol
            </p>
          </div>
        </section>

        {/* Conversion Statement */}
        <section className="w-full px-4 sm:px-6 lg:px-8 py-16 bg-white/50">
          <div className="max-w-4xl mx-auto text-center space-y-4">
            <p className="text-xl font-medium text-[#0F172A]">
              Konversi unit layanan tidak ditentukan secara sembarangan.
            </p>
            <p className="text-lg text-[#475569]">
              Anda tidak perlu menghitung, menegosiasikan, atau memikirkan angka di level eksekusi.
            </p>
          </div>
        </section>

        {/* Service Cards */}
        <section ref={serviceCardsRef} className="w-full px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tenang Card */}
              <ServiceCard
                id="tenang"
                emoji="🧘"
                title="TENANG"
                subtitle="Untuk kebutuhan dasar yang tetap terkendali."
                isExpanded={expandedCard === 'tenang'}
                onToggle={() => toggleCard('tenang')}
              />

              {/* Rapi Card */}
              <ServiceCard
                id="rapi"
                emoji="🗂️"
                title="RAPI"
                subtitle="Struktur kerja dan personal lebih tertata dan stabil."
                isExpanded={expandedCard === 'rapi'}
                onToggle={() => toggleCard('rapi')}
              />

              {/* Fokus Card */}
              <ServiceCard
                id="fokus"
                emoji="🎯"
                title="FOKUS"
                subtitle="Eksekusi lebih dalam dengan prioritas jelas."
                isExpanded={expandedCard === 'fokus'}
                onToggle={() => toggleCard('fokus')}
              />

              {/* Jaga Card */}
              <ServiceCard
                id="jaga"
                emoji="🛡️"
                title="JAGA"
                subtitle="Kontrol menyeluruh untuk tanggung jawab besar."
                isExpanded={expandedCard === 'jaga'}
                onToggle={() => toggleCard('jaga')}
              />
            </div>
          </div>
        </section>

        {/* Join Team Section */}
        <section className="w-full px-4 sm:px-6 lg:px-8 py-16 bg-white/50">
          <div className="max-w-4xl mx-auto text-center space-y-6">
            <h2 className="text-2xl md:text-3xl font-bold text-[#0F172A]">
              Ingin jadi bagian dari Tim Asistenku?
            </h2>
            <a
              href="/partner-portal"
              className="inline-block px-8 py-3 border-2 border-black text-black rounded-full font-medium hover:bg-black hover:text-white transition-colors"
            >
              Pelajari
            </a>
          </div>
        </section>

        {/* Penutup */}
        <section className="w-full px-4 sm:px-6 lg:px-8 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-lg text-[#475569]">
              Kami menjaga setiap layanan agar tetap berjalan dengan kualitas terbaik.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full px-4 sm:px-6 lg:px-8 py-8 border-t border-gray-200">
          <div className="max-w-6xl mx-auto text-center space-y-3">
            <p className="text-sm text-[#475569]">Asistenku © {new Date().getFullYear()} PT Asistenku Digital Indonesia</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
              <a
                href={WA_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#475569] hover:text-[#0F172A] transition-colors"
              >
                Hubungi Concierge (WhatsApp)
              </a>
              <span className="hidden sm:inline text-gray-300">|</span>
              <a href="/internal" className="text-[#475569] hover:text-[#0F172A] transition-colors">
                Internal System
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

interface ServiceCardProps {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  isExpanded: boolean;
  onToggle: () => void;
}

function ServiceCard({ emoji, title, subtitle, isExpanded, onToggle }: ServiceCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-6 text-left flex items-start justify-between gap-4 hover:bg-gray-50/50 transition-colors"
      >
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{emoji}</span>
            <h3 className="text-xl font-bold text-[#0F172A]">{title}</h3>
          </div>
          <p className="text-[#475569]">{subtitle}</p>
        </div>
        <div className="flex-shrink-0 pt-2">
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-[#475569]" />
          ) : (
            <ChevronDown className="w-5 h-5 text-[#475569]" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="px-6 pb-6 space-y-4 border-t border-gray-100 pt-4">
          <p className="text-[#0F172A] font-medium">
            Rp 3.500.000 untuk alokasi 22 Unit Layanan
          </p>
          <p className="text-[#475569]">
            Paket ini cocok untuk kebutuhan operasional rutin yang perlu berjalan stabil tanpa Anda harus mengatur
            detail teknisnya. Struktur kerja disusun oleh Asistenmu dan dijalankan oleh Partner yang sesuai.
          </p>
          <p className="text-[#475569]">
            Untuk kebutuhan dengan skala yang lebih besar, struktur layanan dapat dikurasi bersama Concierge kami.
          </p>
          <a
            href={WA_LINK}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-2 bg-black text-white rounded-full text-sm font-medium hover:bg-gray-900 transition-colors"
          >
            Hubungi Concierge Kami
          </a>
        </div>
      )}
    </div>
  );
}
