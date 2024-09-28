export function rollAttribute(actor, attribute) {
    const diceType = actor.data.data.stats[attribute].value; // Fetch the dice type (e.g., d6, d8)
    const roll = new Roll(`${diceType}`).roll({ async: false }); // Roll the dice
    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }), // Display the roll in chat
      flavor: `Rolling ${attribute}!`
    });
  }
  