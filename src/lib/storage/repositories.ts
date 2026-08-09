import { db } from './db';
import type { Club, Player, Team, Season, Match } from './types';

function database() {
  if (!db) throw new Error('Local database is only available in the browser.');
  return db;
}

export const clubRepository = {
  list: () => database().clubs.orderBy('name').toArray(),
  get: (id: string) => database().clubs.get(id),
  save: (club: Club) => database().clubs.put(club),
  remove: (id: string) => database().clubs.delete(id),
};

export const teamRepository = {
  list: () => database().teams.orderBy('name').toArray(),
  get: (id: string) => database().teams.get(id),
  save: (team: Team) => database().teams.put(team),
  remove: (id: string) => database().teams.delete(id),
};

export const playerRepository = {
  list: () => database().players.orderBy('lastName').toArray(),
  get: (id: string) => database().players.get(id),
  save: (player: Player) => database().players.put(player),
  remove: (id: string) => database().players.delete(id),
};

export const seasonRepository = {
  list: () => database().seasons.orderBy('name').reverse().toArray(),
  get: (id: string) => database().seasons.get(id),
  save: (season: Season) => database().seasons.put(season),
  remove: (id: string) => database().seasons.delete(id),
};

export const matchRepository = {
  list: () => database().matches.orderBy('date').reverse().toArray(),
  get: (id: string) => database().matches.get(id),
  save: (match: Match) => database().matches.put(match),
  remove: (id: string) => database().matches.delete(id),
};
