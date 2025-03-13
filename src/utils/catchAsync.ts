import { Request, Response, NextFunction } from 'express';

const catchAsync = <T extends (...args: any[]) => Promise<any>>(fn: T) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
};

export default catchAsync;
