import { Injectable } from '@angular/core';
import { GameInfo, CoreInfo, ClientInfo, GameSettings, UserInfo } from 'ptcg-server';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { GameService } from './game.service';
import { ClientUserData } from '../interfaces/main.interface';
import { SessionService } from '../../shared/session/session.service';
import { SocketService } from '../socket.service';

@Injectable()
export class MainService {

  public loading = false;

  constructor(
    private gameService: GameService,
    private sessionService: SessionService,
    private socketService: SocketService
  ) { }

  public init(coreInfo: CoreInfo): void {
    const users = { ...this.sessionService.session.users };
    coreInfo.users.forEach(user => users[user.userId] = user);

    this.sessionService.set({
      users,
      clients: coreInfo.clients,
      games: coreInfo.games,
      clientId: coreInfo.clientId
    });
    this.socketService.on('core:join', (data: ClientUserData) => this.onJoin(data));
    this.socketService.on('core:leave', (clientId: number) => this.onLeave(clientId));
    this.socketService.on('core:gameInfo', (game: GameInfo) => this.onGameInfo(game));
    this.socketService.on('core:usersInfo', (infos: UserInfo[]) => this.onUsersInfo(infos));
    this.socketService.on('core:createGame', (game: GameInfo) => this.onCreateGame(game));
    this.socketService.on('core:deleteGame', (gameId: number) => this.onDeleteGame(gameId));
  }

  private autoJoinGame(game: GameInfo) {
    const games = this.sessionService.session.gameStates;
    const index = games.findIndex(g => g.gameId === game.gameId && g.deleted === false);
    if (index !== -1) { // already joined
      return;
    }
    const clientId = this.sessionService.session.clientId;
    if (game.players.some(p => p.clientId === clientId)) {
      // we are listed as players, but not connected.
      this.gameService.join(game.gameId).subscribe(() => {}, () => {});
    }
  }

  private onJoin(data: ClientUserData): void {
    const users = { ...this.sessionService.session.users };
    users[data.user.userId] = data.user;
    const client: ClientInfo = { clientId: data.clientId, userId: data.user.userId };
    const clients = [...this.sessionService.session.clients, client];
    this.sessionService.set({ clients, users });
  }

  private onLeave(clientId: number): void {
    const clients = this.sessionService.session.clients.filter(c => c.clientId !== clientId);
    this.sessionService.set({ clients });
  }

  private onGameInfo(game: GameInfo): void {
    const games = this.sessionService.session.games.slice();
    const index = this.sessionService.session.games.findIndex(g => g.gameId === game.gameId);
    if (index !== -1) {
      games[index] = game;
      this.sessionService.set({ games });
      this.autoJoinGame(game);
    }
  }

  private onUsersInfo(userInfos: UserInfo[]): void {
    const users = { ...this.sessionService.session.users };
    userInfos.forEach(u => { users[u.userId] = u; });
    this.sessionService.set({ users });
  }

  private onCreateGame(game: GameInfo): void {
    const index = this.sessionService.session.games.findIndex(g => g.gameId === game.gameId);
    if (index !== -1) {
      return;
    }
    const games = [...this.sessionService.session.games, game];
    this.sessionService.set({ games });
    this.autoJoinGame(game);
  }

  private onDeleteGame(gameId: number): void {
    const games = this.sessionService.session.games.filter(g => g.gameId !== gameId);
    this.gameService.markAsDeleted(gameId);
    this.sessionService.set({ games });
  }

  public getCoreInfo(): Observable<CoreInfo> {
    this.loading = true;
    return this.socketService.emit<void, CoreInfo>('core:getInfo')
      .pipe(finalize(() => { this.loading = false; }));
  }

  public createGame(deck: string[], gameSettings: GameSettings, clientId?: number) {
    this.loading = true;
    return this.socketService.emit('core:createGame', { deck, gameSettings, clientId })
      .pipe(finalize(() => { this.loading = false; }));
  }

}
