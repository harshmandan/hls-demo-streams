import cellauto from './cellauto.mjs';
import gradients from './gradients.mjs';
import life from './life.mjs';
import mandelbrot from './mandelbrot.mjs';
import plasma from './plasma.mjs';
import testcard from './testcard.mjs';

// Add new patterns here. Clip ids are `<pattern name>-<number>`,
// so a new pattern never changes the clips of the others.
export const patterns = [gradients, plasma, testcard, mandelbrot, life, cellauto];
