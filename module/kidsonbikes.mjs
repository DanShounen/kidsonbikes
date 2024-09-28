// Import document classes.
import { KidsOnBikesActor } from "./documents/actor.mjs";

// Import sheet classes.
import { KidsOnBikesActorSheet } from "./sheets/actor-sheet.mjs";

// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from "./helpers/templates.mjs";
import { KIDSONBIKES } from "./helpers/config.mjs";

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', async function() {

  // Register the helper
  Handlebars.registerHelper('capitalizeFirst', function(string) {
    if (typeof string === 'string') {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }
    return '';
  });

  // Add utility classes and functions to the global game object so that they're more easily
  // accessible in global contexts.
  game.kidsonbikes = {
    KidsOnBikesActor,
    _onTakeAdversityToken: _onTakeAdversityToken,
    _onSpendAdversityTokens: _onSpendAdversityTokens
  };

  // Add custom constants for configuration.
  CONFIG.KIDSONBIKES = KIDSONBIKES;

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "1d20",
    decimals: 2
  };

  // Define custom Document classes
  CONFIG.Actor.documentClass = KidsOnBikesActor;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("kidsonbikes", KidsOnBikesActorSheet, { makeDefault: true });

  // If there is a new chat message that is a roll we add the adversity token controls
  Hooks.on("renderChatMessage", (message, html, messageData) => {
    const adversityControls = html.find('.adversity-controls');
    if (adversityControls.length > 0) {
      const messageToEdit = adversityControls.data("roll-id");
      adversityControls.find(".take-adversity").off("click").click((event) => {
        const actorId = event.currentTarget.dataset.actorId;
        const actor = game.actors.get(actorId);
        if (!actor.testUserPermission(game.user, "owner")) {
          ui.notifications.warn("You don't own this character and cannot take adversity tokens.");
          return;
        }
        if (message.getFlag("kidsonbikes", "tokenClaimed")) {
          ui.notifications.warn("This adversity token has already been claimed.");
          return;
        }
        _onTakeAdversityToken(event, actor);
        if (game.user.isGM) {
          let tokenControls = game.messages.get(message.id);
          const updatedContent = tokenControls.content.replace(
            `<button class="take-adversity" data-actor-id="${actor.id}">Take Adversity Token</button>`,
            `<button class="take-adversity" data-actor-id="${actor.id}" disabled>Token claimed</button>`
          );
          tokenControls.update({ content: updatedContent });
          tokenControls.setFlag("kidsonbikes", "tokenClaimed", true);
        } else {
          game.socket.emit('system.kidsonbikes', {
            action: "takeToken",
            messageID: message.id,
            actorID: actor.id,
          });
        }
      });
      adversityControls.find(".spend-adversity").off("click").click((event) => {
        _onSpendAdversityTokens(event, messageToEdit);
      });
    }
  });

  // Preload Handlebars templates.
  return preloadHandlebarsTemplates();
});

/**
 * Handle incoming socket requests.
 */
Hooks.once('ready', function() {
  game.socket.on('system.kidsonbikes', async (data) => {
    if (data.action === "spendTokens") {
      if (!game.user.isGM) return;
      const rollActor = game.actors.get(data.rollActorId);  
      const spendingActor = game.actors.get(data.spendingActorId);  
      if (!rollActor || !spendingActor) return;
      new Dialog({
        title: "Approve Adversity Token Spending?",
        content: `<p>${spendingActor.name} wants to spend ${data.tokenCost} adversity tokens on ${rollActor.name}'s roll to increase it by ${data.tokensToSpend}. Approve?</p>`,
        buttons: {
          yes: {
            label: "Yes",
            callback: async () => {
              const currentTokens = spendingActor.system.adversityTokens || 0;
              await spendingActor.update({ "system.adversityTokens": currentTokens - data.tokenCost });
              await _updateRollMessage(data.rollMessageId, data.tokensToSpend, false);
              ui.notifications.info(`${spendingActor.name} successfully spent ${data.tokensToSpend} tokens.`);
            }
          },
          no: {
            label: "No",
            callback: () => {
              ui.notifications.info(`The GM denied ${spendingActor.name}'s request to spend tokens.`);
            }
          }
        },
        default: "yes"
      }).render(true);
    } else if (data.action === "takeToken") {
      if (!game.user.isGM) return;
      let tokenControls = game.messages.get(data.messageID);
      const updatedContent = tokenControls.content.replace(
        `<button class="take-adversity" data-actor-id="${data.actorID}">Take Adversity Token</button>`,
        `<button class="take-adversity" data-actor-id="${data.actorID}" disabled>Token claimed</button>`
      );
      tokenControls.update({ content: updatedContent });
      tokenControls.setFlag("kidsonbikes", "tokenClaimed", true);
    }
  });
});

// Token and spending logic remains the same
async function _onTakeAdversityToken(e, actor) {
  e.preventDefault();
  const messageId = e.currentTarget.closest('.message').dataset.messageId;
  const message = game.messages.get(messageId);
  const currentTokens = actor.system.adversityTokens || 0;
  await actor.update({ "system.adversityTokens": currentTokens + 1 });
  ui.notifications.info(`You gained 1 adversity token.`);
}

async function _onSpendAdversityTokens(e, rollMessageId) {
  e.preventDefault();
  const rollActorId = e.currentTarget.dataset.actorId;
  const rollActor = game.actors.get(rollActorId);
  const spendingPlayerActor = game.actors.get(game.user.character?.id || game.actors.filter(actor => actor.testUserPermission(game.user, "owner"))[0]?.id);
  const tokenInput = $(e.currentTarget).closest('.adversity-controls').find('.token-input').val();
  const tokensToSpend = parseInt(tokenInput, 10);
  const tokenCost = tokensToSpend;
  if (spendingPlayerActor.system.adversityTokens < tokenCost) {
    ui.notifications.warn(`You do not have enough adversity tokens.`);
    return;
  }
  if (spendingPlayerActor.id === rollActorId) {
    const currentTokens = spendingPlayerActor.system.adversityTokens || 0;
    await spendingPlayerActor.update({ "system.adversityTokens": currentTokens - tokenCost });
    await _updateRollMessage(rollMessageId, tokensToSpend, true);
  } else {
    game.socket.emit('system.kidsonbikes', {
      action: "spendTokens",
      rollActorId: rollActorId,
      spendingActorId: spendingPlayerActor.id,
      tokensToSpend: tokensToSpend,
      tokenCost: tokenCost,
      rollMessageId: rollMessageId
    });
  }
}

async function _updateRollMessage(rollMessageId, tokensToSpend) {
  const message = game.messages.get(rollMessageId);
  if (!message) return;
  let cumulativeTokensSpent = message.getFlag("kidsonbikes", "tokensSpent") || 0;
  let newTotal = message.getFlag("kidsonbikes", "newRollTotal") || message.rolls[0].total;
  cumulativeTokensSpent += tokensToSpend;
  newTotal += tokensToSpend;
  await message.setFlag("kidsonbikes", "newRollTotal", newTotal);
  await message.setFlag("kidsonbikes", "tokensSpent", cumulativeTokensSpent);
  let newContent = `You have now spent ${cumulativeTokensSpent} token(s). The new roll total is ${newTotal}.`;
  await ChatMessage.create({ speaker: ChatMessage.getSpeaker({ actor: message.speaker.actor }), content: newContent });
}
