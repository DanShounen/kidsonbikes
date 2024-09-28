/**
 * Extend the base Actor document by defining a custom roll data structure for Kids on Bikes.
 * @extends {Actor}
 */
export class KidsOnBikesActor extends Actor {

  /**
   * Override getRollData() that's supplied to rolls for Player Characters (PC).
   */
  getRollDataPC() {
    let data = { ...this.system };
    
    // Return only the core actor data
    return data;
  }

  /**
   * Override getRollData() that's supplied to rolls for Non-Player Characters (NPC).
   */
  getRollDataNPC() {
    let data = { ...this.system };

    return data;
  }
}
