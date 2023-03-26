import { PokemonCard } from '../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../game/store/card/card-types';
import { StoreLike } from '../../game/store/store-like';
import { State } from '../../game/store/state/state';
import { Effect } from '../../game/store/effects/effect';
import { AttackEffect } from '../../game/store/effects/game-effects';
import { GameMessage } from '../../game/game-message';
import { CoinFlipPrompt } from '../../game/store/prompts/coin-flip-prompt';

export class Archen extends PokemonCard {

  public stage: Stage = Stage.RESTORED;

  public cardType: CardType = CardType.FIGHTING;

  public hp: number = 80;

  public weakness = [{ type: CardType.GRASS }];

  public retreat = [ CardType.COLORLESS ];

  public attacks = [{
    name: 'Rock Throw',
    cost: [ CardType.FIGHTING ],
    damage: 20,
    text: ''
  }, {
    name: 'Acrobatics',
    cost: [ CardType.COLORLESS, CardType.COLORLESS ],
    damage: 20,
    text: 'Flip 2 coins. This attack does 20 more damage for each heads.'
  }];

  public set: string = 'BW3';

  public name: string = 'Archen';

  public fullName: string = 'Archen NVI';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    if (effect instanceof AttackEffect && effect.attack === this.attacks[1]) {
      const player = effect.player;
      return store.prompt(state, [
        new CoinFlipPrompt(player.id, GameMessage.COIN_FLIP),
        new CoinFlipPrompt(player.id, GameMessage.COIN_FLIP),
      ], results => {
        let heads: number = 0;
        results.forEach(r => { heads += r ? 1 : 0; });
        effect.damage += 20 * heads;
      });
    }

    return state;
  }

}
