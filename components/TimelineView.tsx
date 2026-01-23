import React, { useRef, useEffect } from 'react';
import { TimelineEvent, EntityConfig } from '../types';
import { Calendar } from 'lucide-react';
import { Language, getTranslations } from '../i18n';

interface TimelineViewProps {
  events: TimelineEvent[];
  entityConfigs: EntityConfig[];
  wikiSources: string[];
  language: Language;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ events, entityConfigs, wikiSources, language }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const t = getTranslations(language);

  const visibleEvents = events.filter(e =>
    entityConfigs.find(c => c.name === e.entity)?.isVisible
  );

  const getEntityColor = (entityName: string) => {
    const config = entityConfigs.find(c => c.name === entityName);
    return config ? config.color : { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-200', pill: 'bg-slate-200' };
  };

  const isMultiEntity = entityConfigs.length > 1;

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) {
      const onWheel = (e: WheelEvent) => {
        if (window.innerWidth >= 768) {
          if (el.scrollWidth > el.clientWidth) {
            if (e.deltaY !== 0) {
              e.preventDefault();
              el.scrollLeft += e.deltaY;
            }
          }
        }
      };
      el.addEventListener('wheel', onWheel, { passive: false });
      return () => {
        el.removeEventListener('wheel', onWheel);
      };
    }
  }, [visibleEvents.length]);

  if (visibleEvents.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-slate-400">
        <p>No events visible. Try enabling some items in the filter.</p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col">

      {/* Desktop View */}
      <div className="hidden md:flex flex-col flex-1 overflow-hidden relative">
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-x-auto overflow-y-hidden timeline-scroll relative w-full h-full"
        >
          <div className="relative min-w-full w-max flex items-stretch pl-10 pr-10 h-full">
            <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-slate-200 z-0 -translate-y-1/2"></div>

            {visibleEvents.map((event, index) => {
              const colors = getEntityColor(event.entity);

              // If Multi-Entity: Assign Top/Bottom based on Entity Index (stable grouping)
              // If Single-Entity: Alternate Top/Bottom based on Event Index (compact layout)
              let isTopRow = index % 2 === 0;

              if (isMultiEntity) {
                const entityIndex = entityConfigs.findIndex(c => c.name === event.entity);
                // Ensure stable assignment based on entity order
                if (entityIndex !== -1) {
                  isTopRow = entityIndex % 2 === 0;
                }
              }

              return (
                <div
                  key={`${event.entity}-${event.year}-${index}`}
                  className="relative flex-shrink-0 w-80 px-4 z-10 group flex flex-col justify-center h-full"
                >
                  {/* Center Dot */}
                  <div className={`
                      absolute top-1/2 left-1/2 w-4 h-4 -ml-2 -mt-2 rounded-full border-4 border-slate-50 z-20 transition-all duration-300
                      ${colors.bg.replace('bg-', 'bg-')} ring-1 ring-slate-300 group-hover:scale-125 shadow-sm
                    `}></div>

                  {/* Top Half: Content for Top Row */}
                  <div className="flex-1 flex flex-col justify-end pb-10">
                    {isTopRow && (
                      <div className={`
                          bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-xl hover:border-slate-200 transition-all duration-300 relative
                          origin-bottom hover:-translate-y-1
                        `}>
                        {/* Arrow Pointing Down */}
                        <div className="absolute left-1/2 -bottom-[8px] w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white transform -translate-x-1/2 drop-shadow-sm"></div>

                        <EventContent event={event} colors={colors} />
                      </div>
                    )}
                  </div>

                  {/* Bottom Half: Content for Bottom Row */}
                  <div className="flex-1 flex flex-col justify-start pt-10">
                    {!isTopRow && (
                      <div className={`
                          bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-xl hover:border-slate-200 transition-all duration-300 relative
                          origin-top hover:translate-y-1
                        `}>
                        {/* Arrow Pointing Up */}
                        <div className="absolute left-1/2 -top-[8px] w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-white transform -translate-x-1/2 drop-shadow-sm"></div>

                        <EventContent event={event} colors={colors} />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Footer - Desktop (Fixed, not scrolling) */}
        <div className="flex-none bg-slate-50/95 backdrop-blur-sm border-t border-slate-200 px-4 py-3 text-center z-30">
          <p className="text-xs text-slate-500">
            {wikiSources.length > 0 && (
              <>
                {t.wikiAttribution}:{' '}
                {wikiSources.map((source, idx) => (
                  <span key={idx}>
                    <a
                      href={`https://en.wikipedia.org/wiki/${encodeURIComponent(source.replace(/ /g, '_'))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {source}
                    </a>
                    {idx < wikiSources.length - 1 && ', '}
                  </span>
                ))}
                {' • '}
              </>
            )}
            <span className="text-slate-400">{t.aiGeneratedDisclaimer}</span>
          </p>
        </div>
      </div>


      {/* Mobile View */}
      <div className="md:hidden flex flex-col relative h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto px-4">
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200 z-0"></div>
          <div className="py-8 pb-4">
            {visibleEvents.map((event, index) => {
              const colors = getEntityColor(event.entity);
              return (
                <div key={`${event.entity}-${event.year}-${index}`} className="relative pl-16 py-6 group">
                  <div className={`
                    absolute left-[29px] top-10 w-4 h-4 rounded-full border-4 border-slate-50 transform transition-all duration-300 z-10
                    ${colors.bg.replace('bg-', 'bg-')} ring-1 ring-slate-300 group-hover:scale-110
                  `}></div>

                  <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300">
                    <EventContent event={event} colors={colors} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Footer - Mobile */}
        <div className="flex-none bg-slate-50/95 backdrop-blur-sm border-t border-slate-200 px-4 py-3 text-center">
          <p className="text-xs text-slate-500">
            {wikiSources.length > 0 && (
              <>
                {t.wikiAttribution}:{' '}
                {wikiSources.map((source, idx) => (
                  <span key={idx}>
                    <a
                      href={`https://en.wikipedia.org/wiki/${encodeURIComponent(source.replace(/ /g, '_'))}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {source}
                    </a>
                    {idx < wikiSources.length - 1 && ', '}
                  </span>
                ))}
                {' • '}
              </>
            )}
            <span className="text-slate-400">{t.aiGeneratedDisclaimer}</span>
          </p>
        </div>
      </div>

    </div>
  );
};

const EventContent: React.FC<{ event: TimelineEvent, colors: any }> = ({ event, colors }) => (
  <>
    <div className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold mb-3 uppercase tracking-wide ${colors.pill} ${colors.text}`}>
      <Calendar size={12} />
      {event.displayDate}
    </div>
    <h3 className="text-lg font-bold text-slate-800 mb-1 leading-tight">{event.title}</h3>
    <p className="text-sm text-slate-500 leading-relaxed mb-3 line-clamp-4">{event.description}</p>
    <div className="mt-auto flex items-center justify-end">
      <span className={`text-xs font-medium px-2 py-1 rounded border ${colors.bg} ${colors.text} ${colors.border}`}>
        {event.entity}
      </span>
    </div>
  </>
);