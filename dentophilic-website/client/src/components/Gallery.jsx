import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Maximize2, X, CheckCircle2, ArrowRight } from 'lucide-react';
import { InstagramIcon } from './Icons';
import { siteData } from '../config/siteData';

export default function Gallery() {
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('All');

  const categories = ['All', 'Dentures', 'Dental Implants', 'Cosmetic', 'Endodontics', 'Pediatric Care', 'Clinic Facility'];

  const filteredItems = selectedFilter === 'All'
    ? siteData.gallery
    : siteData.gallery.filter(item => item.category === selectedFilter || item.tag.toLowerCase().includes(selectedFilter.toLowerCase()));

  return (
    <section id="gallery" className="py-20 md:py-28 bg-white relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-flex items-center px-3.5 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-purple-100 text-purple-900 mb-3 border border-purple-200">
            <Sparkles className="w-3.5 h-3.5 mr-1 text-purple-700" /> Real Transformations & Facility
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight">
            Smile Makeovers & Clinic Facility
          </h2>
          <p className="mt-4 text-slate-600 text-base leading-relaxed">
            Witness our state-of-the-art operatory suite and the restorative outcomes achieved for our patients at Dr. Arthi's Dentophilic
            Centre.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-12">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedFilter(cat)}
              className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                selectedFilter === cat
                  ? 'bg-purple-700 text-white shadow-md shadow-purple-950/20'
                  : 'bg-purple-50/80 text-purple-900 hover:bg-purple-100 hover:text-purple-950'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredItems.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="group bg-purple-50/20 rounded-3xl p-6 border border-purple-100 hover:border-purple-300 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between cursor-pointer"
              onClick={() => setSelectedItem(item)}
            >
              <div>
                {/* Visual Real Photo Card */}
                <div className="relative h-60 rounded-2xl overflow-hidden mb-5 shadow-md border border-purple-200/80 group-hover:border-purple-400 transition-all bg-slate-900">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-black/30" />
                  <div className="flex items-center justify-between p-4 relative z-10">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-purple-100 bg-purple-900/90 px-3 py-1 rounded-full border border-purple-400/50 shadow-sm backdrop-blur-xs">
                      {item.tag}
                    </span>
                    <span className="p-1.5 rounded-lg bg-black/50 backdrop-blur-md text-white">
                      <Maximize2 className="w-4 h-4" />
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-4 right-4 z-10">
                    <span className="text-xs font-semibold text-purple-200 drop-shadow flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                      {item.category === 'Clinic Facility' ? 'Verified Clinic Operatory' : 'Real Clinical Outcome'}
                    </span>
                  </div>
                </div>

                <span className="text-xs font-semibold text-purple-700 uppercase tracking-wider block mb-1">
                  {item.category}
                </span>

                <h3 className="font-serif text-lg font-bold text-slate-900 group-hover:text-purple-900 transition-colors mb-2">
                  {item.title}
                </h3>

                <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-purple-100 flex items-center justify-between text-xs font-semibold text-purple-700">
                <span>View Clinical Case</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Instagram Follow & Community Banner */}
        <div className="mt-16 rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-950 to-slate-950 p-6 sm:p-10 text-white relative overflow-hidden border border-purple-800/50 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 p-0.5 shadow-lg shrink-0">
              <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center">
                <InstagramIcon className="w-7 h-7 sm:w-8 sm:h-8 text-pink-400" />
              </div>
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-300 bg-purple-900/60 px-3 py-1 rounded-full border border-purple-700/50 inline-block mb-1.5">
                Official Clinic Instagram
              </span>
              <h4 className="font-serif text-xl sm:text-2xl font-bold">
                Follow @dr.arthis_dentalclinic_hosur
              </h4>
              <p className="text-xs sm:text-sm text-purple-200/80 mt-1 max-w-xl">
                Explore real patient smile makeovers, clinical before/after updates, and oral health tips directly from Dr. Arthi in Hosur.
              </p>
            </div>
          </div>
          <a
            href="https://www.instagram.com/dr.arthis_dentalclinic_hosur/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 hover:from-pink-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-purple-950/40 hover:scale-105 active:scale-95 transition-all shrink-0 flex items-center gap-2 cursor-pointer"
          >
            <InstagramIcon className="w-4 h-4" />
            <span>Visit Instagram Profile →</span>
          </a>
        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedItem(null)}
              className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-purple-200 z-10 my-8 max-h-[92vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-4 border-b border-purple-100">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-700">
                    {selectedItem.category === 'Clinic Facility' ? 'Clinic Facility Tour' : 'Documented Clinical Case'}
                  </span>
                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-slate-900">
                    {selectedItem.title}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedItem(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-6 space-y-6">
                {selectedItem.image && (
                  <div className="relative rounded-2xl overflow-hidden shadow-lg border border-purple-200 bg-slate-950 flex items-center justify-center max-h-[55vh]">
                    <img
                      src={selectedItem.image}
                      alt={selectedItem.title}
                      className="max-h-[55vh] w-auto max-w-full object-contain mx-auto"
                    />
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent p-3.5 text-white">
                      <p className="text-xs font-semibold text-purple-200 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-purple-300" />
                        {selectedItem.category === 'Clinic Facility'
                          ? "Dr. Arthi's Dentophilic Centre Operatory • Hosur, Tamil Nadu"
                          : "Dr. Arthi's Dentophilic Centre • Verified Case Outcome"}
                      </p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100">
                    <span className="text-xs font-bold uppercase tracking-wide text-rose-700 block mb-1">
                      {selectedItem.category === 'Clinic Facility' ? 'Operatory Feature' : 'Initial Condition'}
                    </span>
                    <p className="text-slate-800 text-sm font-medium">{selectedItem.beforeLabel}</p>
                  </div>
                  <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200">
                    <span className="text-xs font-bold uppercase tracking-wide text-purple-800 block mb-1">
                      {selectedItem.category === 'Clinic Facility' ? 'Clinical Standard' : 'Final Transformation'}
                    </span>
                    <p className="text-slate-800 text-sm font-medium">{selectedItem.afterLabel}</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                    Treatment Details
                  </h4>
                  <p className="text-slate-700 text-sm leading-relaxed">
                    {selectedItem.description}
                  </p>
                </div>

                <div className="flex items-center space-x-2 text-xs text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-purple-600" />
                  <span>Performed in-clinic adhering to Class-B sterilization protocols.</span>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-purple-100 text-right">
                <button
                  onClick={() => setSelectedItem(null)}
                  className="px-6 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-semibold text-sm transition-colors cursor-pointer"
                >
                  Close Case
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}
