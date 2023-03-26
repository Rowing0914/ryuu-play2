import { Response } from './response.interface';
import { ServerConfig } from 'ptcg-server';

export interface LoginResponse extends Response {
  token: string;
  config: ServerConfig;
}

export interface InfoResponse extends Response {
  config: ServerConfig;
}
