'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Movie, fetchApi } from '../lib/api';
import { Film, Clock, Star, Calendar, Ticket, ChevronRight } from 'lucide-react';

function MovieCatalog() {
  const searchParams = useSearchParams();
  const initialGenre = searchParams.get('genre') || '';

  const [movies, setMovies] = useState<Movie[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string>(initialGenre);
  const [isLoading, setIsLoading] = useState(true);

  const genres = ['All', 'Sci-Fi', 'Action', 'Drama', 'Thriller', 'Animation'];

  useEffect(() => {
    setIsLoading(true);
    const query = selectedGenre && selectedGenre !== 'All' ? `?genre=${selectedGenre}` : '';
    fetchApi<{ movies: Movie[] }>(`/movies${query}`)
      .then((data) => setMovies(data.movies))
      .catch((err) => console.error('Failed to load movies', err))
      .finally(() => setIsLoading(false));
  }, [selectedGenre]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Hero Marquee */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-red-950 via-slate-900 to-slate-950 border border-red-900/40 p-8 sm:p-12 shadow-2xl">
        <div className="max-w-2xl space-y-4">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-xs font-semibold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span>Now Showing • Dolby Atmos & IMAX 3D</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Reserve Your Exact Seats in Seconds.
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Interactive real-time 2D auditorium map with 8-minute guaranteed seat holds, verified contactless mobile passes, and live usher gate validation.
          </p>
        </div>
      </div>

      {/* Genre Filter Pills */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-4">
        {genres.map((g) => {
          const active = selectedGenre === g || (g === 'All' && !selectedGenre);
          return (
            <button
              key={g}
              onClick={() => setSelectedGenre(g === 'All' ? '' : g)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                active
                  ? 'bg-red-600 text-white shadow-lg shadow-red-900/40'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {g}
            </button>
          );
        })}
      </div>

      {/* Movies Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-96 rounded-2xl bg-slate-900 animate-pulse border border-slate-800"
            />
          ))}
        </div>
      ) : movies.length === 0 ? (
        <div className="text-center py-20 text-slate-500 space-y-3">
          <Film className="w-12 h-12 mx-auto text-slate-700" />
          <p className="text-lg">No movies found in this genre.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {movies.map((movie) => (
            <div
              key={movie.id}
              className="group bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 hover:border-red-900/50 transition-all flex flex-col justify-between shadow-xl"
            >
              <div>
                {/* Poster / Backdrop Image */}
                <div className="relative h-64 overflow-hidden bg-slate-950">
                  <img
                    src={movie.backdropUrl || movie.posterUrl}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/30 to-transparent" />
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-slate-950/80 backdrop-blur-md text-[11px] font-bold text-amber-400 border border-amber-500/30 flex items-center space-x-1">
                    <Star className="w-3 h-3 fill-amber-400" />
                    <span>{movie.rating}</span>
                  </div>
                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-xs text-slate-300 font-medium">
                    <span className="px-2 py-0.5 rounded bg-slate-800/80 backdrop-blur border border-slate-700 text-slate-300">
                      {movie.genre}
                    </span>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{movie.runtimeMinutes} min</span>
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-5 space-y-3">
                  <h3 className="text-lg font-bold text-white group-hover:text-red-400 transition-colors">
                    {movie.title}
                  </h3>
                  <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {movie.synopsis}
                  </p>
                </div>
              </div>

              {/* Showtimes preview */}
              <div className="p-5 pt-0 border-t border-slate-800/60 mt-3 space-y-3">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Available Showtimes</span>
                  <span className="text-red-400">Auditorium 1</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {movie.showtimes && movie.showtimes.length > 0 ? (
                    movie.showtimes.slice(0, 3).map((st) => {
                      const timeStr = new Date(st.startTime).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                      return (
                        <Link
                          key={st.id}
                          href={`/movies/${movie.id}?showtimeId=${st.id}`}
                          className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-red-600 text-slate-200 hover:text-white text-xs font-semibold text-center transition-all border border-slate-700/60"
                        >
                          <div>{timeStr}</div>
                          <div className="text-[10px] opacity-75 font-normal">
                            {st.format.replace('_', ' ')}
                          </div>
                        </Link>
                      );
                    })
                  ) : (
                    <div className="col-span-3 text-xs text-slate-500 py-1">
                      Check movie details for upcoming showtimes.
                    </div>
                  )}
                </div>

                <Link
                  href={`/movies/${movie.id}`}
                  className="w-full mt-2 inline-flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-semibold text-xs transition-colors"
                >
                  <Ticket className="w-4 h-4 text-red-400" />
                  <span>Select Seats & Book</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-slate-500">Loading cinema...</div>}>
      <MovieCatalog />
    </Suspense>
  );
}
