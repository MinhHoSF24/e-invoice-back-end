import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permissions } from '@common/decorators/permission.decorator';
import { PERMISSION } from '@common/constants/enum/role.enum';
import { MetaDataKeys } from '@common/constants/common.constants';
import { AuthorizerResponse } from '@common/interfaces/tcp/authorizer';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<PERMISSION[]>(Permissions, context.getHandler());

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const userData = request[MetaDataKeys.USER_DATA] as AuthorizerResponse;
    const userPermissions = userData.metaData.permissions as PERMISSION[];

    const isValid = requiredPermissions.every((permission) => userPermissions.includes(permission));

    if (!isValid) {
      throw new ForbiddenException('Permission denied');
    }

    return isValid;
  }
}
