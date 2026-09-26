// Corrected Figure 4 values for the Round 12 benchmark display.
(() => {
  const results = window.DRAMA_DATA?.evolution?.results;
  if (!results) return;

  const metrics = results.metrics || [];
  if (metrics[0]) {
    metrics[0].after = 93.2;
    metrics[0].gain = 24.8;
  }
  if (metrics[1]) {
    metrics[1].after = 88.6;
    metrics[1].gain = 30.4;
  }

  const round12 = (results.checkpoints || []).find((checkpoint) => checkpoint.round === 12);
  if (round12?.scores) {
    round12.scores[6] = 93.2;
    round12.scores[7] = 88.6;
  }
})();
