import { TrainerCard } from '../../game/store/card/trainer-card';
import { TrainerType } from '../../game/store/card/card-types';
import { StoreLike } from '../../game/store/store-like';
import { State } from '../../game/store/state/state';
import { Effect } from '../../game/store/effects/effect';
import { TrainerEffect } from '../../game/store/effects/play-card-effects';
import { GameError } from '../../game/game-error';
import { GameMessage } from '../../game/game-message';
import { Card} from '../../game/store/card/card';
import { ChooseCardsPrompt } from '../../game/store/prompts/choose-cards-prompt';
import { CardList } from '../../game/store/state/card-list';

function* playCard(next: Function, store: StoreLike, state: State, self: JunkArm, effect: TrainerEffect): IterableIterator<State> {
  const player = effect.player;
  const itemTypes = [TrainerType.ITEM, TrainerType.TOOL];
  let cards: Card[] = [];
  
  cards = player.hand.cards.filter(c => c !== self);
  if (cards.length < 2) {
    throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
  }

  let trainersInDiscard = 0;
  player.discard.cards.forEach(c => {
    if (c instanceof TrainerCard && itemTypes.includes(c.trainerType) && c.name !== self.name) {
      trainersInDiscard += 1;
    }
  });
  if (trainersInDiscard === 0) {
    throw new GameError(GameMessage.CANNOT_PLAY_THIS_CARD);
  }

  // We will discard this card after prompt confirmation
  effect.preventDefault = true;

  // prepare card list without Junk Arm
  const handTemp = new CardList();
  handTemp.cards = player.hand.cards.filter(c => c !== self);

  yield store.prompt(state, new ChooseCardsPrompt(
    player.id,
    GameMessage.CHOOSE_CARD_TO_DISCARD,
    handTemp,
    { },
    { min: 2, max: 2, allowCancel: true }
  ), selected => {
    cards = selected || [];
    next();
  });

  // Operation canceled by the user
  if (cards.length === 0) {
    return state;
  }

  const blocked: number[] = [];
  player.discard.cards.forEach((c, index) => {
    if (!(c instanceof TrainerCard)) {
      blocked.push(index);
      return;
    }
    if (!itemTypes.includes(c.trainerType) || c.name === self.name) {
      blocked.push(index);
      return;
    }
  });

  let recovered: Card[] = [];
  yield store.prompt(state, new ChooseCardsPrompt(
    player.id,
    GameMessage.CHOOSE_CARD_TO_HAND,
    player.discard,
    { },
    { min: 1, max: 1, allowCancel: true, blocked }
  ), selected => {
    recovered = selected || [];
    next();
  });

  // Operation canceled by the user
  if (recovered.length === 0) {
    return state;
  }

  player.hand.moveCardTo(self, player.discard);
  player.hand.moveCardsTo(cards, player.discard);
  player.discard.moveCardsTo(recovered, player.hand);
  return state;
}

export class JunkArm extends TrainerCard {

  public trainerType: TrainerType = TrainerType.ITEM;

  public set: string = 'HGSS';

  public name: string = 'Junk Arm';

  public fullName: string = 'Junk Arm TRM';

  public text: string =
    'Discard 2 cards from your hand. Search your discard pile for a Trainer ' +
    'card, show it to your opponent, and put it into your hand. You can\'t ' +
    'choose Junk Arm with the effect of this card.';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof TrainerEffect && effect.trainerCard === this) {
      const generator = playCard(() => generator.next(), store, state, this, effect);
      return generator.next().value;
    }
    return state;
  }

}
