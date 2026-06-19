const { CROPS, DISCIPLINES, getColsByDiscipline } = require('../frontend/src/utils/constants');

CROPS.forEach(crop => {
  DISCIPLINES.forEach(disc => {
    const cols = getColsByDiscipline(crop, disc);
    console.log(`Crop: ${crop}, Discipline: ${disc}, disease cols: ${cols.disease.length}, insect cols: ${cols.insect.length}`);
  });
});
