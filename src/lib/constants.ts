export const CATEGORIES = [
  'Сніданок',
  'Обід',
  'Вечеря',
  'Десерт',
  'Перекус',
  'Суп',
  'Салат',
  'Хліб і випічка',
  'Напої',
  'Інше',
] as const;

export const DIFFICULTIES = [
  { value: 'easy', label: 'Легко' },
  { value: 'medium', label: 'Середньо' },
  { value: 'hard', label: 'Складно' },
] as const;

export const FILTER_CATEGORIES = [
  { key: 'all', label: 'Усі' },
  { key: 'Сніданок', label: 'Сніданок' },
  { key: 'Обід', label: 'Обід' },
  { key: 'Вечеря', label: 'Вечеря' },
  { key: 'Десерт', label: 'Десерт' },
  { key: 'favorites', label: 'Улюблені' },
  { key: 'quick', label: 'Швидкі страви' },
  { key: 'vegetarian', label: 'Вегетаріанські' },
];

/** Значення `category` у БД (укр. або старі англ.) для кожної кнопки фільтра */
export const CATEGORY_FILTER_VALUES: Record<string, string[]> = {
  Сніданок: ['Сніданок', 'Breakfast'],
  Обід: ['Обід', 'Lunch'],
  Вечеря: ['Вечеря', 'Dinner'],
  Десерт: ['Десерт', 'Dessert'],
};

export const UNITS = [
  'г', 'g', 'кг', 'kg', 'мл', 'л', 'шт', 'pcs', 'ст. л.', 'ч. л.', 'склянка', 'tbsp', 'tsp', 'унцій', 'фунт', 'пучок', 'щіпка', 'скибка', 'зубчик',
] as const;

export const PLACEHOLDER_IMAGE = 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800';

export const CATEGORY_IMAGES: Record<string, string> = {
  Сніданок: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
  Обід: 'https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg?auto=compress&cs=tinysrgb&w=800',
  Вечеря: 'https://images.pexels.com/photos/1410235/pexels-photo-1410235.jpeg?auto=compress&cs=tinysrgb&w=800',
  Десерт: 'https://images.pexels.com/photos/1126359/pexels-photo-1126359.jpeg?auto=compress&cs=tinysrgb&w=800',
  Перекус: 'https://images.pexels.com/photos/1640774/pexels-photo-1640774.jpeg?auto=compress&cs=tinysrgb&w=800',
  Суп: 'https://images.pexels.com/photos/539451/pexels-photo-539451.jpeg?auto=compress&cs=tinysrgb&w=800',
  Салат: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
  'Хліб і випічка': 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
  Напої: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
  Інше: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=800',
};
