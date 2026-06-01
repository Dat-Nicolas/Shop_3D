export { fruits } from './fruits';
export { agriculture } from './agriculture';
export { seafood } from './seafood';
export { luxuryCars } from './luxury_cars';
export { electronics } from './electronics';
export { processedFood } from './processed_food';
export { agriTools } from './agri_tools';

import { fruits } from './fruits';
import { agriculture } from './agriculture';
import { seafood } from './seafood';
import { luxuryCars } from './luxury_cars';
import { electronics } from './electronics';
import { processedFood } from './processed_food';
import { agriTools } from './agri_tools';

export const products = [
  ...fruits,
  ...agriculture,
  ...seafood,
  ...luxuryCars,
  ...electronics,
  ...processedFood,
  ...agriTools,
];
