export function rollAttribute(actor, attribute) {
  const diceType = actor.data.data.stats[attribute]; // Fetches the dice type (e.g., d6)
  const roll = new Roll(`${diceType}`).roll({ async: false }); // Rolls the dice
  roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor }), // Displays result in chat
    flavor: `Rolling ${attribute}!`
  });
}
