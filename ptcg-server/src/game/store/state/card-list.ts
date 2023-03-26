import { Card } from '../card/card';
import { CardManager } from '../../cards/card-manager';
import { GameError } from '../../game-error';
import { GameMessage } from '../../game-message';

export class CardList {

  public cards: Card[] = [];

  public isPublic: boolean = false;

  public isSecret: boolean = false;

  public static fromList(names: string[]): CardList {
    const cardList = new CardList();
    const cardManager = CardManager.getInstance();
    cardList.cards = names.map(cardName => {
      const card = cardManager.getCardByName(cardName);
      if (card === undefined) {
        throw new GameError(GameMessage.UNKNOWN_CARD, cardName);
      }
      return card;
    });
    return cardList;
  }

  public applyOrder(order: number[]) {
    // Check if order is valid, same length
    if (this.cards.length !== order.length) {
      return;
    }
    // Contains all elements exacly one time
    const orderCopy = order.slice();
    orderCopy.sort((a, b) => a - b);
    for (let i = 0; i < orderCopy.length; i++) {
      if (i !== orderCopy[i]) {
        return;
      }
    }
    // Apply order
    const copy = this.cards.slice();
    for (let i = 0; i < order.length; i++) {
      this.cards[i] = copy[order[i]];
    }
  }

  public moveTo(destination: CardList, count?: number): void {
    if (count === undefined) {
      count = this.cards.length;
    }

    count = Math.min(count, this.cards.length);
    const cards = this.cards.splice(0, count);
    destination.cards.push(...cards);
  }

  public moveCardsTo(cards: Card[], destination: CardList): void {
    for (let i = 0; i < cards.length; i++) {
      const index = this.cards.indexOf(cards[i]);
      if (index !== -1) {
        const card = this.cards.splice(index, 1);
        destination.cards.push(card[0]);
      }
    }
  }

  public moveCardTo(card: Card, destination: CardList): void {
    this.moveCardsTo([card], destination);
  }

  public top(count: number = 1): Card[] {
    count = Math.min(count, this.cards.length);
    return this.cards.slice(0, count);
  }

  public filter(query: Partial<Card>): Card[] {
    return this.cards.filter(c => {
      for (const key in query) {
        if (Object.prototype.hasOwnProperty.call(query, key)) {
          const value: any = (c as any)[key];
          const expected: any = (query as any)[key];
          if (value !== expected) {
            return false;
          }
        }
      }
      return true;
    });
  }

  public count(query: Partial<Card>): number {
    return this.filter(query).length;
  }

}
