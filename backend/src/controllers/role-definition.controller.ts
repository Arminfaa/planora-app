import type { Response } from 'express';
import type { AuthenticatedRequest } from '../types';
import { ApiResponse } from '../utils/ApiResponse';
import { asyncHandler } from '../utils/asyncHandler';
import { getParam } from '../utils/params';
import { roleDefinitionService } from '../services/role-definition.service';

export const listRoleDefinitions = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const roles = await roleDefinitionService.list(
      req.user!.userId,
      getParam(req.params, 'id'),
    );
    ApiResponse.success(res, roles);
  },
);

export const createRoleDefinition = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const role = await roleDefinitionService.create(
      req.user!.userId,
      getParam(req.params, 'id'),
      req.body,
    );
    ApiResponse.success(res, role, 'Role created', 201);
  },
);

export const updateRoleDefinition = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const role = await roleDefinitionService.update(
      req.user!.userId,
      getParam(req.params, 'id'),
      getParam(req.params, 'roleId'),
      req.body,
    );
    ApiResponse.success(res, role, 'Role updated');
  },
);

export const deleteRoleDefinition = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    await roleDefinitionService.delete(
      req.user!.userId,
      getParam(req.params, 'id'),
      getParam(req.params, 'roleId'),
    );
    ApiResponse.success(res, null, 'Role deleted');
  },
);
