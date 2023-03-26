import { Component, Input, ElementRef } from '@angular/core';
import { StateLog, StateLogParam } from 'ptcg-server';

import { GameService } from '../../../api/services/game.service';
import { LocalGameState } from '../../../shared/session/session.interface';
import { SessionService } from '../../../shared/session/session.service';

interface GameLog {
  id: number;
  name: string;
  className: string;
  message: string;
  params: StateLogParam;
}

@Component({
  selector: 'ptcg-game-logs',
  templateUrl: './game-logs.component.html',
  styleUrls: ['./game-logs.component.scss']
})
export class GameLogsComponent {

  private readonly LOG_COUNT_LIMIT = 50;

  public loading = true;
  public logs: GameLog[] = [];
  public message = '';
  public isDeleted: boolean;
  private state: LocalGameState;

  @Input() set gameState(gameState: LocalGameState) {
    if (!gameState || !gameState.state) {
      this.logs = [];
      return;
    }
    if (this.state && this.state.localId !== gameState.localId) {
      this.logs = [];
    }
    this.state = gameState;
    this.isDeleted = gameState.deleted;
    this.appendLogs(gameState.logs);
  }

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private gameService: GameService,
    private sessionService: SessionService
  ) { }

  public clearLogs() {
    this.state.logs = [];
    this.logs = [];
  }

  public sendMessage() {
    const message = (this.message || '').trim();
    if (!this.state || message.length === 0) {
      return;
    }
    this.gameService.appendLogAction(this.state.gameId, message);
    this.message = '';
  }

  public trackByFn(log: GameLog) {
    return log.id;
  }

  private appendLogs(logs: StateLog[]) {
    if (logs.length === 0 || !this.state) {
      return;
    }

    // delete future logs (when user rewind state in replays)
    let maxLogId = 0;
    logs.forEach(log => { maxLogId = Math.max(log.id, maxLogId); });
    this.logs = this.logs.filter(log => log.id <= maxLogId);

    let logsAdded = false;

    // Append logs, skip the existing one
    logs.forEach(log => {
      if (this.logs.find(log2 => log2.id === log.id) === undefined) {
        const gameLog = this.buildGameLog(log);
        if (gameLog !== undefined) {
          this.logs.push(gameLog);
          logsAdded = true;
        }
      }
    });

    if (!logsAdded) {
      return;
    }

    // Sort logs by their id
    this.logs.sort((a, b) => a.id - b.id);

    // Remove logs over the limit
    if (this.logs.length > this.LOG_COUNT_LIMIT) {
      const toDelete = this.logs.length - this.LOG_COUNT_LIMIT;
      this.logs.splice(0, toDelete);
    }

    this.scrollToBottom();
  }

  private buildGameLog(log: StateLog): GameLog | undefined {
    let name: string;
    let className: string;

    const client = this.sessionService.session.clients.find(c => c.clientId === log.client);
    const user = client ? this.sessionService.session.users[client.userId] : undefined;
    const playerIndex = this.state.state.players.findIndex(p => p.id === log.client);

    if (user !== undefined) {
      name = user.name;
      className = playerIndex >= 0
        ? `ptcg-player${playerIndex + 1}`
        : 'ptcg-spectator';
      return {
        id: log.id,
        name,
        className,
        message: log.message,
        params: log.params
      };
    } else if (log.client === 0) {
      return {
        id: log.id,
        name: 'System',
        className: 'ptcg-system',
        message: log.message,
        params: log.params
      };
    }
    return undefined;
  }

  private scrollToBottom(): void {
    try {
      const scollablePane = this.elementRef.nativeElement
        .getElementsByClassName('ptcg-game-logs-content')[0] as HTMLElement;
      setTimeout(() => {
        scollablePane.scrollTop = scollablePane.scrollHeight;
      });
    } catch (err) { }
  }

}
