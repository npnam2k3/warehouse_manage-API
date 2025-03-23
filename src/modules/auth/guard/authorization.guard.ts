import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ERROR_MESSAGE } from 'src/constants/exception.message';
import { PERMISSION_KEY } from 'src/decorator/permissions.decorator';
import { RolesService } from 'src/modules/roles/roles.service';
import { UsersService } from 'src/modules/users/users.service';

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly userService: UsersService,
    private readonly roleService: RolesService,
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    if (!request.user) {
      console.log('User not found');
      throw new ForbiddenException(ERROR_MESSAGE.FORBIDDEN);
    }
    // the user information is attached in request
    const { userId, username } = request.user;

    try {
      const user = await this.userService.findOne(userId);

      const requirePermission = this.reflector.getAllAndOverride(
        PERMISSION_KEY,
        [context.getHandler(), context.getClass()],
      );
      if (!requirePermission) return true;
      // console.log('check permission require:: ', requirePermission);

      const userPermissions = await this.roleService.findPermissionByRole(
        user.role.id,
      );
      console.log(`check role name:: `, user.role.name);
      if (user.role.name === 'ADMIN') return true;
      // console.log(`check the user's permissions:: `, userPermissions);
      if (userPermissions && userPermissions.length > 0) {
        // Lọc các quyền có subject khớp với yêu cầu
        const subjectValid = userPermissions.filter(
          (perm) => perm.subject === requirePermission.subject,
        );

        if (subjectValid.length === 0) {
          throw new ForbiddenException(ERROR_MESSAGE.FORBIDDEN);
        }

        // Danh sách các action của user trên subject đó
        const userActions = subjectValid.map((perm) => perm.action);

        // Kiểm tra xem user có đủ tất cả các action được yêu cầu không
        const hasAllActions = requirePermission.actions.every((action) =>
          userActions.includes(action),
        );
        // console.log('check userActions:: ', userActions);
        // console.log('check actions require:: ', requirePermission.actions);

        if (!hasAllActions) {
          throw new ForbiddenException(ERROR_MESSAGE.FORBIDDEN);
        }
      } else {
        throw new ForbiddenException(ERROR_MESSAGE.FORBIDDEN);
      }
    } catch (error) {
      // console.error(error);
      throw error;
    }

    return true;
  }
}
