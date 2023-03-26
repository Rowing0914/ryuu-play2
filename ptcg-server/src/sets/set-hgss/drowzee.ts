import { PokemonCard } from '../../game/store/card/pokemon-card';
import { Stage, CardType, SpecialCondition } from '../../game/store/card/card-types';
import { StoreLike, State, StateUtils, ChoosePokemonPrompt, PlayerType, SlotType } from '../../game';
import { AttackEffect } from '../../game/store/effects/game-effects';
import { Effect } from '../../game/store/effects/effect';
import { GameMessage } from '../../game/game-message';
import { AddSpecialConditionsEffect } from '../../game/store/effects/attack-effects';

export class Drowzee extends PokemonCard {

  public stage: Stage = Stage.BASIC;

  public cardType: CardType = CardType.PSYCHIC;

  public hp: number = 60;

  public weakness = [{ type: CardType.PSYCHIC }];

  public retreat = [ CardType.COLORLESS, CardType.COLORLESS ];

  public attacks = [
    {
      name: 'Sleep Inducer',
      cost: [ CardType.PSYCHIC ],
      damage: 0,
      text: 'Switch the Defending Pokemon with 1 of your opponent\'s ' +
        'Benched Pokemon. The new Defending Pokemon is now Asleep.'
    },
    {
      name: 'Gentle Slap',
      cost: [ CardType.COLORLESS, CardType.COLORLESS ],
      damage: 20,
      text: ''
    },
  ];

  public set: string = 'HGSS';

  public name: string = 'Drowzee';

  public fullName: string = 'Drowzee HGSS';

  public reduceEffect(store: StoreLike, state: State, effect: Effect): State {
    if (effect instanceof AttackEffect && effect.attack === this.attacks[0]) {
      const player = effect.player;
      const opponent = StateUtils.getOpponent(state, player);

      const hasBenched = opponent.bench.some(b => b.cards.length > 0);
      if (!hasBenched) {
        return state;
      }

      store.prompt(state, new ChoosePokemonPrompt(
        player.id,
        GameMessage.CHOOSE_POKEMON_TO_SWITCH,
        PlayerType.TOP_PLAYER,
        [ SlotType.BENCH ],
        { allowCancel: false }
      ), targets => {
        if (!targets || targets.length === 0) {
          return;
        }
        opponent.switchPokemon(targets[0]);
        const specialCondition = new AddSpecialConditionsEffect(effect, [SpecialCondition.ASLEEP]);
        specialCondition.target = targets[0];
        store.reduceEffect(state, specialCondition);
      });
    }

    return state;
  }

}
