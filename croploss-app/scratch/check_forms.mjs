import { CROPS, DISCIPLINES, getColsByDiscipline } from '../frontend/src/utils/constants.js';

CROPS.forEach(crop => {
  DISCIPLINES.forEach(disc => {
    const cols = getColsByDiscipline(crop, disc);
    console.log(`Crop: ${crop}, Discipline: ${disc}, disease cols: ${cols.disease.length}, insect cols: ${cols.insect.length}`);
  });
});
