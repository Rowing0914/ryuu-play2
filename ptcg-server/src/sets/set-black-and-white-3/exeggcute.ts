import { PokemonCard } from '../../game/store/card/pokemon-card';
import { Stage, CardType } from '../../game/store/card/card-types';
import { StoreLike } from '../../game/store/store-like';
import { State } from '../../game/store/state/state';
import { Effect } from '../../game/store/effects/effect';
import { PowerEffect } from '../../game/store/effects/game-effects';
import { PowerType } from '../../game/store/card/pokemon-types';
import { GameMessage } from '../../game/game-message';
import { EndTurnEffect } from '../../game/store/effects/game-phase-effects';
import { GameError } from '../../game/game-error';

export class Exeggcute extends PokemonCard {

  public stage: Stage = Stage.BASIC;

  public cardType: CardType = CardType.GRASS;

  public hp: number = 30;

  public weakness = [{ type: CardType.FIRE }];

  public resistance = [{ type: CardType.WATER, value: -20 }];

  public retreat = [ CardType.COLORLESS ];

  public powers = [{
    name: 'Propagation',
    useFromDiscard: true,
    powerType: PowerType.ABILITY,
    text: 'Once during your turn (before your attack), if this Pokemon is in '
      + 'your discard pile, you may put this Pokemon into your hand.'
  }];

  public attacks = [{
    name: 'Seed Bomb',
    cost: [ CardType.GRASS, CardType.COLORLESS ],
    damage: 20,
    text: ''
  }];

  public set: string = 'BW3';

  public name: string = 'Exeggcute';

  public fullName: string = 'Exeggcute PLF';

  public readonly PROPAGATION_MAREKER = 'PROPAGATION_MAREKER';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {

    if (effect instanceof PowerEffect && effect.power === this.powers[0]) {
      const player = effect.player;

      // Check if card is in the discard
      if (player.discard.cards.includes(this) === false) {
        throw new GameError(GameMessage.CANNOT_USE_POWER);
      }

      // Power already used
      if (player.marker.hasMarker(this.PROPAGATION_MAREKER, this)) {
        throw new GameError(GameMessage.POWER_ALREADY_USED);
      }

      player.marker.addMarker(this.PROPAGATION_MAREKER, this);
      player.discard.moveCardTo(this, player.hand);
      return state;
    }

    if (effect instanceof EndTurnEffect) {
      effect.player.marker.removeMarker(this.PROPAGATION_MAREKER, this);
    }

    return state;
  }

}
