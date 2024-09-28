// Import the custom character sheet class
export class KidsOnBikesActorSheet extends ActorSheet {
    get template() {
      return `systems/kidsonbikes/templates/actor/actor-character-sheet.hbs`; // Path to the template
    }
  
    getData() {
      const data = super.getData();
      return data; // Return data to the template
    }
  }
  
  // Register the custom sheet
  Actors.registerSheet("kidsonbikes", KidsOnBikesActorSheet, {
    types: ["character"],
    makeDefault: true
  });
  