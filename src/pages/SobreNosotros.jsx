import { Sparkles, Heart, ShieldCheck } from 'lucide-react';
import { GlassCard } from '../components/ui/GlassCard';

const VALORES = [
  {
    Icon: Sparkles,
    titulo: 'Calidad garantizada',
    descripcion:
      'Trabajamos con marcas de renombre internacional como Lattafa, Al Haramain y Armaf, seleccionando fragancias que combinan excelencia olfativa con materias primas de primer nivel.',
  },
  {
    Icon: Heart,
    titulo: 'Pasión por la perfumería',
    descripcion:
      'Fraganzia nació del amor genuino por las fragancias. Cada perfume de nuestro catálogo fue elegido con criterio y cuidado para ofrecerte una experiencia sensorial única.',
  },
  {
    Icon: ShieldCheck,
    titulo: 'Transparencia total',
    descripcion:
      'Nuestros precios se actualizan en tiempo real según la cotización del dólar. Sin sorpresas: lo que ves en pantalla es lo que pagás.',
  },
];

export default function SobreNosotros() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      {/* Hero */}
      <div className="mb-12 text-center">
        <h1 className="font-display text-4xl text-text mb-4">Sobre Nosotros</h1>
        <p className="font-body text-text-secondary text-lg leading-relaxed max-w-xl mx-auto">
          Somos Fraganzia — una tienda especializada en perfumería árabe y de autor, con una
          propuesta auténtica y accesible para quienes buscan diferenciarse con su fragancia.
        </p>
      </div>

      {/* Historia */}
      <GlassCard className="mb-10 p-6">
        <h2 className="font-display text-2xl text-text mb-3">Nuestra historia</h2>
        <p className="font-body text-text-secondary leading-relaxed">
          Fraganzia comenzó como un proyecto personal: la búsqueda de fragancias que contaran
          historias, que evocaran emociones y que fueran accesibles sin resignar calidad.
          Con el tiempo ese proyecto se convirtió en un catálogo cuidadosamente curado, pensado
          para quienes valoran el arte de oler bien.
        </p>
        <p className="font-body text-text-secondary leading-relaxed mt-3">
          Hoy ofrecemos una selección de perfumes de las mejores marcas orientales y nicho,
          con envíos a todo el país y atención personalizada vía WhatsApp.
        </p>
      </GlassCard>

      {/* Valores */}
      <h2 className="font-display text-2xl text-text mb-6 text-center">Nuestros valores</h2>
      <div className="grid gap-6 sm:grid-cols-3">
        {VALORES.map(({ Icon, titulo, descripcion }) => (
          <GlassCard key={titulo} className="flex flex-col items-center text-center p-6 gap-3">
            <Icon className="h-8 w-8 text-lila" />
            <h3 className="font-display text-lg text-text">{titulo}</h3>
            <p className="font-body text-text-secondary text-sm leading-relaxed">{descripcion}</p>
          </GlassCard>
        ))}
      </div>

      {/* Compromiso */}
      <GlassCard className="mt-10 p-6 border border-lila/30">
        <p className="font-body text-text-secondary leading-relaxed text-center italic">
          "En Fraganzia creemos que un buen perfume no es un lujo — es una forma de expresión.
          Por eso trabajamos cada día para acercarte las mejores fragancias al mejor precio posible."
        </p>
      </GlassCard>
    </div>
  );
}
