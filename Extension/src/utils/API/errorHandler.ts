import { config } from './config';

export const errorHandler = (error: any, requestData: any): void => {
  if ([401].includes(error?.response?.status)) {
    sessionStorage.clear();

    if (Object.prototype.hasOwnProperty.call(config, 'fallbackURL') && config.fallbackURL != null) {
      window.location.href = config.fallbackURL as string;
    }
  } else {
    throw new Error(error?.response?.data?.message ?? 'Произошла неизвестная ошибка');
  }
};
