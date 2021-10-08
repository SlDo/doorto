import { AxiosResponse } from 'axios';
import { request } from '../../index';
import { SessionRequest, SessionResponse } from '../../../../types/session.type.js';

export const createSession = (data: SessionRequest): Promise<AxiosResponse<SessionResponse>> => request({
  url: '/api/session/create', method: 'POST', data, headers: { authorization: true },
});
