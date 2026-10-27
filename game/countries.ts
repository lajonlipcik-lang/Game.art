import type { Country } from './types';

export const COUNTRIES: Record<string, Country> = {
  nordia: {
    id: 'nordia',
    name: 'Нордия',
    flagColors: ['#1d4ed8', '#ffffff', '#1d4ed8'],
    relation: 20,
    armyStrength: 70,
    trait: 'Промышленная держава, ценит торговлю',
  },
  valdia: {
    id: 'valdia',
    name: 'Вальдия',
    flagColors: ['#15803d', '#facc15', '#15803d'],
    relation: -10,
    armyStrength: 55,
    trait: 'Аграрная монархия с территориальными претензиями',
  },
  sarama: {
    id: 'sarama',
    name: 'Сарама',
    flagColors: ['#b91c1c', '#000000', '#b91c1c'],
    relation: 0,
    armyStrength: 80,
    trait: 'Воинственная военная держава',
  },
  kovina: {
    id: 'kovina',
    name: 'Ковина',
    flagColors: ['#7c3aed', '#fbbf24', '#7c3aed'],
    relation: 35,
    armyStrength: 40,
    trait: 'Малая торговая республика, ищет союзников',
  },
};

export const COUNTRY_LIST = Object.values(COUNTRIES);
