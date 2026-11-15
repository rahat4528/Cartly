import { MovieStore } from '../database/store.js';

export class MoviesService {
  private store = MovieStore.getInstance();

  getMovies(genre?: string) {
    let list = this.store.movies;
    if (genre && genre.trim()) {
      const g = genre.toLowerCase().trim();
      list = list.filter(m => m.genre.toLowerCase().includes(g));
    }
    const today = new Date().toISOString().split('T')[0];
    return list.map(m => ({
      ...m,
      showtimes: this.store.showtimes.filter(s => s.movieId === m.id && s.showDate === today)
    }));
  }

  getMovieByIdOrSlug(idOrSlug: string, date?: string) {
    const movie = this.store.findMovie(idOrSlug);
    if (!movie) return null;

    const targetDate = date || new Date().toISOString().split('T')[0];

    const showtimes = this.store.showtimes
      .filter(s => s.movieId === movie.id && s.showDate === targetDate)
      .map(s => {
        const auditorium = this.store.findAuditorium(s.auditoriumId);
        return {
          ...s,
          auditoriumName: auditorium?.name || 'Screen 1',
          screenType: auditorium?.screenType || 'Standard'
        };
      });

    return {
      ...movie,
      showtimes
    };
  }
}
