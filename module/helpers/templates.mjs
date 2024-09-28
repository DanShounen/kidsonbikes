/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function() {
  return loadTemplates([

    // Actor partials for Kids on Bikes.
    "systems/kidsonbikes/templates/actor/parts/actor-features.html",
    "systems/kidsonbikes/templates/actor/parts/actor-adversity.html",
    "systems/kidsonbikes/templates/actor/parts/actor-stats.html",
    "systems/kidsonbikes/templates/actor/parts/actor-npc-stats.html",
  ]);
};
