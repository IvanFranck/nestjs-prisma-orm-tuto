import { Injectable, NestMiddleware, ServiceUnavailableException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class MaintenanceMiddleware implements NestMiddleware {
  private readonly isMaintenanceMode: boolean = true;
  use(req: Request, res: Response, next: NextFunction) {

    if (this.isMaintenanceMode){
      const adminKey = req.headers['x-admin-key'];

      if(!adminKey || adminKey !== '21277a4356b4ff62'){
        throw new ServiceUnavailableException('Site en maintenance')
      }
    }

    next();
  }
}
