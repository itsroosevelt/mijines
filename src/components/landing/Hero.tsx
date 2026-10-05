"use client";

import YouTubeBackground from "@/components/landing/YouTubeBackground";

interface HeroProps {
  onStartQuote: () => void;
}

const youtubeVideoId = "e-djKnsg1AI";

export default function Hero({ onStartQuote }: HeroProps) {
  return (
    // 104vh como respaldo para navegadores sin dvh (iOS < 15.4).
    <section className="relative min-h-[calc(104vh+2cm)] supports-[height:100dvh]:min-h-[calc(104dvh+2cm)] flex items-end overflow-hidden bg-black">
      {/* El video está grabado en 4K: pedimos la máxima calidad (YouTube la ajusta según pantalla y conexión). */}
      <YouTubeBackground videoId={youtubeVideoId} title="Video de portada" quality="hd2160" />

      {/* Contenido adaptado a móviles y tablets con safe-area */}
      <div className="relative z-30 w-full pb-[calc(3rem+2cm)] sm:pb-[calc(4rem+2cm)] md:pb-[calc(6rem+2cm)] lg:pb-[5cm] px-5 sm:px-8 md:px-12 lg:px-[3cm] pt-24 sm:pt-28">
        <div className="flex flex-col items-center justify-center gap-6 md:gap-8 w-full">

          <div className="w-full md:max-w-[80%] lg:max-w-[70%] text-center space-y-2 sm:space-y-3 [text-shadow:0_2px_12px_rgba(0,0,0,0.7)]">
            {/* Texto superior (Eyebrow) */}
            <p className="text-gray-300 text-xs sm:text-sm md:text-base font-medium tracking-[0.2em] uppercase">
              MIJINES
            </p>

            {/* Título Principal */}
            <h1 className="text-[2.7rem] sm:text-[3.2rem] md:text-[4.2rem] font-medium leading-[1.02] text-white tracking-tighter">
              ECUATORIANOS <br />
              EN ACCIÓN
            </h1>

            <div className="pt-1">
              <p className="text-gray-300 text-xs sm:text-sm md:text-base font-medium tracking-tight max-w-2xl mx-auto">
                Somos una organización sin fines de lucro creada para apoyar a la comunidad ecuatoriana en los Estados Unidos. Te acompañamos a dar tus primeros pasos, a aprender a vivir de manera organizada y a conocer y respetar las leyes de este país. Compartimos información útil de todo tipo para que nadie camine solo: aquí nos apoyamos unos a otros.
              </p>
            </div>
          </div>


        </div>
      </div>
    </section>
  );
}
